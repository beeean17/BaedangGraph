"""Firebase Cloud Functions entry point and CLI for Korea Investment sync."""

import argparse
import datetime as dt
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import requests
from dotenv import load_dotenv
from firebase_functions import scheduler_fn
from firebase_functions.options import set_global_options
from firebase_admin import firestore, initialize_app
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger("baedang_sync")


# ---------------------------------------------------------------------------
# Global configuration
# ---------------------------------------------------------------------------

set_global_options(
	region="asia-northeast3",  # Seoul region keeps latency low
	max_instances=1,            # prevent duplicate writes when scheduler fires
	memory=512,
	timeout_sec=540,
)

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

initialize_app()
db = firestore.client()

KST = dt.timezone(dt.timedelta(hours=9))
BASE_URL = os.environ.get("HANKOOK_BASE_URL", "https://openapi.koreainvestment.com:9443")
APP_KEY_ENV = "HANKOOK_APP_KEY"
APP_SECRET_ENV = "HANKOOK_APP_SECRET"


@dataclass
class Candle:
	"""Simple container for daily OHLCV values."""

	date: dt.date
	open: float
	high: float
	low: float
	close: float
	volume: float


@dataclass
class SyncRunReport:
	"""Tracks per-symbol API status for observability."""

	target_date: dt.date
	run_id: str
	started_at: dt.datetime
	successes: Dict[str, Candle]
	failures: Dict[str, str]

	@classmethod
	def start(cls, target_date: dt.date):
		started = dt.datetime.now(tz=KST)
		run_id = started.strftime("%Y%m%d-%H%M%S")
		return cls(
			target_date=target_date,
			run_id=run_id,
			started_at=started,
			successes={},
			failures={},
		)

	def record_success(self, symbol: str, candle: Candle) -> None:
		self.successes[symbol] = candle

	def record_failure(self, symbol: str, message: str) -> None:
		self.failures[symbol] = message

	def summary_payload(self) -> Dict[str, object]:
		finished_at = dt.datetime.now(tz=KST)
		return {
			"run_id": self.run_id,
			"target_date": self.target_date.isoformat(),
			"started_at": self.started_at.isoformat(),
			"finished_at": finished_at.isoformat(),
			"success_count": len(self.successes),
			"failure_count": len(self.failures),
		}


def _get_credentials() -> tuple[str, str]:
	app_key = os.environ.get(APP_KEY_ENV)
	app_secret = os.environ.get(APP_SECRET_ENV)
	if not app_key or not app_secret:
		raise RuntimeError(
			"한국투자증권 API 자격증명이 없습니다. "
			f"firebase functions:secrets:set {APP_KEY_ENV} --data-file=... 명령으로 등록하세요."
		)
	return app_key, app_secret


def _request_access_token(session: requests.Session) -> str:
	app_key, app_secret = _get_credentials()
	url = f"{BASE_URL}/oauth2/tokenP"
	payload = {
		"grant_type": "client_credentials",
		"appkey": app_key,
		"appsecret": app_secret,
	}
	response = session.post(url, json=payload, timeout=15)
	response.raise_for_status()
	data = response.json()
	token = data.get("access_token")
	if not token:
		raise RuntimeError(f"토큰 응답이 올바르지 않습니다: {data}")
	return token


def _fetch_daily_candle(
	session: requests.Session,
	token: str,
	symbol: str,
	target_date: dt.date,
) -> Optional[Candle]:
	"""Call Korea Investment API and return the daily OHLCV for the symbol."""

	url = f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-price"
	params = {
		"FID_COND_MRKT_DIV_CODE": "J",  # J: 거래소
		"FID_INPUT_ISCD": symbol,
		"FID_PERIOD_DIV_CODE": "D",  # 일봉
		"FID_ORG_ADJ_PRC": "0",
	}
	headers = {
		"Content-Type": "application/json; charset=UTF-8",
		"authorization": f"Bearer {token}",
		"appkey": os.environ.get(APP_KEY_ENV, ""),
		"appsecret": os.environ.get(APP_SECRET_ENV, ""),
		"tr_id": "FHKST01010400",
	}
	response = session.get(url, headers=headers, params=params, timeout=20)
	if response.status_code == 404:
		LOG.warning("[%s] API에서 데이터를 찾을 수 없습니다.", symbol)
		return None
	response.raise_for_status()
	payload = response.json()
	items = payload.get("output") or payload.get("output1")
	if not items:
		LOG.warning("[%s] API 응답에 일봉 데이터가 없습니다: %s", symbol, payload)
		return None

	# API는 과거 여러 일봉을 반환하므로 target_date와 일치하는 첫 항목을 찾는다.
	target_str = target_date.strftime("%Y%m%d")
	for item in items if isinstance(items, list) else [items]:
		if item.get("stck_bsop_date") == target_str:
			return Candle(
				date=target_date,
				open=float(item["stck_oprc"]),
				high=float(item["stck_hgpr"]),
				low=float(item["stck_lwpr"]),
				close=float(item["stck_clpr"]),
				volume=float(item["acml_tr_pbmn"]),
			)

	LOG.warning("[%s] %s 데이터가 없어 latest 값을 사용합니다.", symbol, target_str)
	first = (items[0] if isinstance(items, list) else items)
	return Candle(
		date=target_date,
		open=float(first["stck_oprc"]),
		high=float(first["stck_hgpr"]),
		low=float(first["stck_lwpr"]),
		close=float(first["stck_clpr"]),
		volume=float(first["acml_tr_pbmn"]),
	)


def _iter_stock_symbols() -> Iterable[str]:
	docs = db.collection("stocks").select([]).stream()
	for doc in docs:
		yield doc.id


def _chunked(items: Iterable, size: int) -> Iterable[List]:
	chunk: List = []
	for item in items:
		chunk.append(item)
		if len(chunk) == size:
			yield chunk
			chunk = []
	if chunk:
		yield chunk


def _write_candles(changes: Dict[str, Candle]) -> None:
	"""Persist candle data into Firestore monthly documents."""

	if not changes:
		return

	for batch_symbols in _chunked(changes.items(), 400):
		batch = db.batch()
		for symbol, candle in batch_symbols:
			month_id = candle.date.strftime("%Y-%m")
			day_id = candle.date.strftime("%d")
			doc_ref = (
				db.collection("stocks")
				.document(symbol)
				.collection("monthly")
				.document(month_id)
			)
			batch.set(
				doc_ref,
				{
					"days": {
						day_id: {
							"open": candle.open,
							"high": candle.high,
							"low": candle.low,
							"close": candle.close,
							"volume": candle.volume,
						}
					},
					"updated_at": firestore.SERVER_TIMESTAMP,
				},
				merge=True,
			)
			batch.update(
				db.collection("stocks").document(symbol),
				{"updated_at": firestore.SERVER_TIMESTAMP},
			)
		batch.commit()


def _persist_run_report(report) -> None:
	summary_ref = db.collection("sync_runs").document(report.run_id)
	summary_ref.set(report.summary_payload())

	batch = db.batch()
	ops = []
	count = 0

	for symbol, candle in report.successes.items():
		doc_ref = summary_ref.collection("symbols").document(symbol)
		batch.set(
			doc_ref,
			{
				"status": "success",
				"close": candle.close,
				"open": candle.open,
				"high": candle.high,
				"low": candle.low,
				"volume": candle.volume,
				"recorded_at": dt.datetime.now(tz=KST).isoformat(),
			},
		)
		count += 1
		if count == 400:
			batch.commit()
			batch = db.batch()
			count = 0

	for symbol, message in report.failures.items():
		doc_ref = summary_ref.collection("symbols").document(symbol)
		batch.set(
			doc_ref,
			{
				"status": "failed",
				"message": message,
				"recorded_at": dt.datetime.now(tz=KST).isoformat(),
			},
		)
		count += 1
		if count == 400:
			batch.commit()
			batch = db.batch()
			count = 0

	if count:
		batch.commit()


def _sync_daily_prices(target_date: dt.date) -> None:
	session = requests.Session()
	token = _request_access_token(session)
	successes: Dict[str, Candle] = {}
	report = SyncRunReport.start(target_date)

	for symbol in _iter_stock_symbols():
		try:
			candle = _fetch_daily_candle(session, token, symbol, target_date)
			if candle:
				successes[symbol] = candle
				report.record_success(symbol, candle)
			else:
				report.record_failure(symbol, "데이터 없음")
		except Exception as exc:  # pylint: disable=broad-except
			LOG.error("[%s] 일봉 업데이트 실패: %s", symbol, exc)
			report.record_failure(symbol, str(exc))

	_write_candles(successes)
	_persist_run_report(report)
	LOG.info(
		"일봉 동기화 완료: %d건 저장, 기준일 %s", len(successes), target_date.isoformat(),
	)


def _run_once(target_date: Optional[dt.date] = None) -> None:
	"""Run a single daily sync for the given date (defaults to today KST)."""
	actual_date = target_date or dt.datetime.now(tz=KST).date()
	LOG.info("CLI 실행: %s 일봉 동기화 시작", actual_date)
	_sync_daily_prices(actual_date)


@scheduler_fn.on_schedule(schedule="40 15 * * *", timezone="Asia/Seoul")
def fetch_daily_ohlcv(event: scheduler_fn.ScheduledEvent) -> None:
	"""Fetch daily OHLCV for every stock symbol at 15:40 KST."""

	target_date = dt.datetime.now(tz=KST).date()
	LOG.info("스케줄 실행(%s): %s 일봉 동기화 시작", event.schedule_time, target_date)
	_sync_daily_prices(target_date)


def _parse_cli_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="Run the BaedangGraph OHLCV sync once.")
	parser.add_argument(
		"--date",
		help="타겟 거래일 (YYYY-MM-DD). 생략하면 오늘(KST)을 사용합니다.",
	)
	return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> None:
	"""CLI entry point so GitHub Actions or cron can call the sync directly."""
	args = _parse_cli_args(argv)
	manual_date: Optional[dt.date] = None
	if args.date:
		try:
			manual_date = dt.datetime.strptime(args.date, "%Y-%m-%d").date()
		except ValueError as exc:
			raise SystemExit(f"--date는 YYYY-MM-DD 형식이어야 합니다: {args.date}") from exc
	_run_once(manual_date)


if __name__ == "__main__":
	main()

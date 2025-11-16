# Firebase Firestore 데이터 구조

이 문서는 현재 프로젝트의 Cloud Firestore 데이터베이스 구조를 정의합니다.

---

## 📁 `metadata` 컬렉션

앱의 전반적인 상태 및 시스템 통계 정보를 저장합니다.

### 문서: `metadata/{system}`

* **설명:** 앱 전체의 마지막 업데이트 상태, 통계 등 단일 시스템 정보를 관리합니다.
* **필드:**
    * `lastSuccessfulUpdate`: (Timestamp) - 마지막 성공 업데이트 시간
    * `lastUpdate`: (Timestamp) - 마지막 업데이트 시도 시간
    * `updateStatus`: (String) - 현재 업데이트 상태 (예: "success")
    * `stats`: (Map) - 앱 전체 통계
        * `lastCalculated`: (Timestamp)
        * `totalStocks`: (Number) - 전체 주식 수
    * `stocks`: (Map) - 주식 종목별 마지막 업데이트 시간
        * `{stock_id}`: (Timestamp) (예: "475080": 2025-11-11...)
        * ...

---

## 📈 `stocks` 컬렉션

개별 주식(종목)의 상세 정보를 관리하는 핵심 컬렉션입니다.

### 문서: `stocks/{stock_id}`

* **설명:** 개별 종목의 기본 정보(이름, 기간)와 연간 배당금 내역을 저장합니다.
* **필드:**
    * `name`: (String) - 종목명
    * `period`: (String) - 배당 주기 등 (예: "월말")
    * `updated_at`: (Timestamp) - 이 종목의 마지막 업데이트 시간
    * `dividends`: (Map) - 배당금 정보
        * `{YYYY}`: (Map) (예: "2025")
            * `{MM-DD}`: (Number) (예: "01-24": 124)
            * ...

### └ 하위 컬렉션: `monthly`

* **문서:** `stocks/{stock_id}/monthly/{yyyy-mm}`
* **설명:** 해당 종목의 월별 일봉 데이터(시/고/저/종가, 거래량)를 저장합니다.
* **필드:**
    * `days`: (Map) - 일별 데이터
        * `{DD}`: (Map) (예: "10", "13")
            * `close`: (Number)
            * `high`: (Number)
            * `low`: (Number)
            * `open`: (Number)
            * `volume`: (Number)
        * ...

---

## 👤 `users` 컬렉션

사용자 정보를 관리하는 컬렉션입니다.

### 문서: `users/{user_id}`

* **설명:** 사용자 기본 정보를 저장합니다.
* **필드:**
    * *(확인된 필드 없음)*

### └ 하위 컬렉션: `lines`

* **문서:** `users/{user_id}/lines/{document_id}`
* **설명:** 사용자와 관련된 'lines' 데이터를 저장합니다.
* **필드:**
    * *(확인된 필드 없음)*
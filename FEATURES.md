# BaedangGraph 기능 목록

_업데이트: 2025-11-17_

## 1. 인증 & 사용자 온보딩
- Firebase Authentication 기반의 Google 로그인과 자동 사용자 문서 생성
- 이메일/비밀번호 로그인 중단 및 단일 Google 로그인 플로우 정리
- `AuthContext`를 통한 전역 인증 상태 구독과 Firestore 사용자 레코드 초기화

## 2. 데이터 연동
- Firestore `stocks` 컬렉션에서 종목 메타, 월별 OHLCV, 배당 데이터 실시간 fetch
- `useStockData`, `useUserData`, `useStockList` 등 전용 훅으로 데이터 접근 일원화
- 종목 드롭다운이 Firestore 레코드를 정렬(월중 우선)·표시(기간 + 종목명)하도록 개선

## 3. 차트 & 인터랙션
- `lightweight-charts` 기반 캔들스틱 + 거래량 오버레이 + 배당 마커 렌더링
- `ResizeObserver`와 커스텀 레이아웃 로직으로 반응형 차트 크기 유지
- 차트 크로스헤어 데이터를 `ChartInfo`로 전달해 날짜/OHLC/거래량/배당을 동기 표시
- 거래량 / 배당 오버레이 토글 버튼 및 로딩 오버레이 UX 구현
- `DividendRangeAnalysis`와 `StockChart`가 동일한 날짜 축을 공유하도록 교정하고, 배당 세로선이 캔들 중앙을 통과하며 모바일에서도 겹치지 않도록 스타일/opacity를 보정

## 4. 배당 & 통계 기능
- `DividendInfo`, `DividendRangeAnalysis` 컴포넌트로 연간/구간 배당 요약 제공
- 월중·월말 구분에 맞춘 종목 표시와 배당 스케줄 확인 편의 기능

## 5. 사용자 지정 라인 관리
- `PriceLineManager` UI를 통해 개인화된 가격 라인 추가/수정/삭제
- Firestore `users/{uid}/lines` 하위 컬렉션에 실시간 동기화 + 낙관적 업데이트
- 차트 상에서 사용자 라인 컬러·레이블·가격 반영

## 6. 레이아웃 & 스타일
- Vite + React 19 기반 SPA 구조, 전역 CSS 변수/Inter 폰트를 활용한 디자인 시스템
- 대시보드, 로그인, 차트 정보 패널 등 주요 뷰에 모바일 우선 반응형 구성 적용
- Date/OHLC 정보 패널 폭을 최소 화면 절반으로 고정해 가독성 확보

## 7. 인프라 & 품질 보조 기능
- Vite dev 서버 COOP 헤더 설정으로 Firebase popup 경고 해결
- `npm run build`가 `tsc -b` 후 `vite build`를 실행하도록 정비
- README / firebase_data_structure.md / PROJECT_STATUS.md 등 문서화 강화

## 작업중인 기능
- (현재 진행 중인 작업 없음)

## 앞으로 할 작업
1. Firebase Cloud Functions에서 한국투자증권 API를 호출해 데이터 적재 자동화.
2. 새로운 종목을 Firestore에 손쉽게 추가할 수 있는 데스크톱/CLI 편의 프로그램 제작.
3. 로그인 사용자별·종목 코드별 가로선(레퍼런스 라인)을 Firestore에 실시간 동기화해 저장/삭제하는 구조 확립.

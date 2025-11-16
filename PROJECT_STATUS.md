# BaedangGraph Project Status Report

## 1. 프로젝트 개요

BaedangGraph는 주식 차트 시각화 프로그램으로, 캔들스틱 차트, 배당 정보 표시, 사용자별 매수 가격 라인 관리 등의 기능을 제공합니다. 사용자는 로그인하여 개인화된 데이터를 Firebase에 저장하고 관리할 수 있습니다. 태블릿 및 스마트폰 환경의 웹뷰 지원을 목표로 반응형 웹 디자인이 적용되었습니다.

## 2. 현재 구현된 주요 기능

*   **사용자 인증:**
    *   이메일/비밀번호 기반 로그인 및 회원가입 (`Login.tsx`, `AuthContext.tsx`)
    *   **새로운 기능:** Google 계정을 이용한 소셜 로그인 기능 추가 (`AuthContext.tsx`, `Login.tsx`)
*   **주식 차트 시각화:**
    *   `lightweight-charts` 라이브러리를 활용한 캔들스틱 차트 표시 (`StockChart.tsx`)
    *   **개선 사항:** 차트 컨테이너 크기 변화에 따른 반응형 크기 조절 (`ResizeObserver` 적용) 및 테마 동기화
    *   **개선 사항:** 차트의 높이가 너비에 비례하도록 `aspect-ratio` 적용
*   **배당 정보 표시:**
    *   선택된 주식의 배당 날짜 및 금액 정보 표시 (`DividendInfo.tsx`)
*   **사용자 지정 가격 라인 관리:**
    *   사용자가 차트에 개인적인 가격 참조 라인(예: 매수 가격)을 추가, 수정, 삭제 가능 (`PriceLineManager.tsx`)
    *   **개선 사항:** 사용자별 가격 라인 데이터가 Firebase Firestore의 하위 컬렉션(`users/{user_id}/lines`)에 저장되도록 데이터 구조 변경 및 로직 업데이트
*   **데이터 연동:**
    *   **개선 사항:** 샘플 데이터 대신 Firebase Firestore에서 실제 주식(OHLCV) 및 배당 데이터를 가져오도록 연동 (`useStockData.ts` 훅 생성)
*   **반응형 웹 디자인:**
    *   **개선 사항:** 애플 공식 홈페이지와 유사한 클린하고 모던한 디자인 적용
    *   **개선 사항:** CSS 변수를 활용한 전역 디자인 시스템 구축 (`index.css`)
    *   **개선 사항:** 모바일, 태블릿, 데스크톱 등 다양한 화면 크기에 최적화된 레이아웃 (`Dashboard.css`, `Login.css` 등)

## 3. 아키텍처 개요

*   **프론트엔드:** React (TypeScript)
*   **빌드 도구:** Vite
*   **상태 관리:** React Context API (`AuthContext.tsx`) 및 사용자 정의 훅 (`useAuth.ts`, `useUserData.ts`, `useStockData.ts`)
*   **차트 라이브러리:** `lightweight-charts`
*   **백엔드:** Firebase (Authentication, Cloud Firestore)
    *   **인증:** Firebase Authentication을 통해 사용자 로그인/회원가입 및 Google 소셜 로그인 처리
    *   **데이터베이스:** Cloud Firestore를 사용하여 사용자별 설정 및 가격 라인, 주식 및 배당금 데이터 저장 및 관리

## 4. Firebase 데이터 구조 (최신)

### 📁 `metadata` 컬렉션
*   **문서:** `metadata/{system}`
    *   `lastSuccessfulUpdate`: (Timestamp)
    *   `lastUpdate`: (Timestamp)
    *   `updateStatus`: (String)
    *   `stats`: (Map)
        *   `lastCalculated`: (Timestamp)
        *   `totalStocks`: (Number)
    *   `stocks`: (Map)
        *   `{stock_id}`: (Timestamp)

### 📈 `stocks` 컬렉션
*   **문서:** `stocks/{stock_id}`
    *   `name`: (String) - 종목명
    *   `period`: (String) - 배당 주기 등
    *   `updated_at`: (Timestamp) - 이 종목의 마지막 업데이트 시간
    *   `dividends`: (Map) - 배당금 정보
        *   `{YYYY}`: (Map)
            *   `{MM-DD}`: (Number)
*   **하위 컬렉션:** `monthly`
    *   **문서:** `stocks/{stock_id}/monthly/{yyyy-mm}`
        *   `days`: (Map) - 일별 데이터
            *   `{DD}`: (Map)
                *   `close`: (Number)
                *   `high`: (Number)
                *   `low`: (Number)
                *   `open`: (Number)
                *   `volume`: (Number)

### 👤 `users` 컬렉션
*   **문서:** `users/{user_id}`
    *   `uid`: (String)
    *   `email`: (String)
*   **하위 컬렉션:** `lines`
    *   **문서:** `users/{user_id}/lines/{document_id}`
        *   `id`: (String) - Firestore 문서 ID
        *   `price`: (Number)
        *   `label`: (String)
        *   `color`: (String)

## 5. 최근 변경 사항 및 개선 사항 요약

*   **Firebase 데이터 구조 정렬:** 사용자별 가격 라인(`priceLines`)이 `users` 문서 내의 배열에서 `users/{user_id}/lines` 하위 컬렉션으로 이동하도록 코드를 수정했습니다.
*   **반응형 웹 디자인 적용:**
    *   `index.css`에 전역 CSS 변수, 웹폰트(`Inter`), CSS 리셋을 포함한 디자인 시스템을 구축했습니다.
    *   `Dashboard.css`를 모바일 우선(mobile-first) 반응형 레이아웃으로 재구성하고, 차트 영역이 항상 최대 너비를 차지하도록 수정했습니다.
    *   `Login.css`, `DividendInfo.css`, `PriceLineManager.css`, `StockChart.css` 등 모든 컴포넌트의 스타일을 새 디자인 시스템에 맞춰 업데이트했습니다.
*   **Google 로그인 통합:** Firebase Authentication을 통해 Google 소셜 로그인 기능을 추가했습니다.
*   **실시간 데이터 연동:** `useStockData.ts` 훅을 생성하여 Firebase Firestore에서 실제 주식 및 배당 데이터를 가져오도록 `Dashboard.tsx`를 업데이트했습니다.
*   **차트 크기 및 반응성 수정:**
    *   `StockChart.tsx`에서 `ResizeObserver`를 사용하여 차트 컨테이너 크기 변경에 동적으로 반응하도록 수정했습니다.
    *   `lightweight-charts`의 `autosize` 옵션과 `ResizeObserver` 간의 충돌을 방지하기 위해 `autosize: false`를 명시했습니다.
    *   차트가 처음 렌더링될 때 컨테이너의 실제 크기에 맞춰 초기화되도록 로직을 추가했습니다.

## 6. 다음 단계 / 보류 중인 작업

*   **차트 십자선 정보 표시:** `StockChart` 컴포넌트에서 크로스헤어(십자선) 이동 이벤트를 감지하여 OHLCV 및 날짜 정보를 `Dashboard`로 전달하고, 이를 `ChartInfo` 컴포넌트를 통해 표시하는 작업이 진행 중입니다.
    *   `StockChart.tsx`에서 크로스헤어 이벤트 리스너 구현 및 데이터 전달
    *   `Dashboard.tsx`에서 크로스헤어 데이터 상태 관리 및 `ChartInfo` 컴포넌트 통합
    *   `ChartInfo.css` 스타일링 마무리

---
이 문서는 프로젝트의 현재 상태를 요약하며, 추가적인 변경 사항이 발생하면 업데이트될 예정입니다.

# 버터떡맵

버터떡 가게를 지도에서 찾고, 직접 제보로 매장을 등록하고, 오정보 신고 이력까지 확인할 수 있는 Next.js 기반 지도 서비스입니다.

기본 화면은 지도 탐색에 집중되어 있고, 매장 상세 페이지에서는 주소, 운영시간, 연락처, 외부 지도 링크, 사진, 신고 이력을 함께 보여줍니다. 저장소가 준비되지 않은 로컬 환경에서도 바로 실행할 수 있도록 데모 데이터 모드가 기본 내장되어 있습니다.

## 주요 기능

- 지도 기반 매장 탐색
- 시/도, 시군구, 키워드 필터 검색
- 매장 상세 페이지와 구조화 데이터(SEO) 출력
- 신규 매장 등록
- 오정보 신고 접수와 신고 이력 확인
- 주소 검색과 좌표 변환
- Supabase 사용 시 실데이터 저장
- Supabase 미설정 시 데모 데이터 자동 폴백

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Leaflet + React Leaflet
- Supabase
- Vitest
- Playwright

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 준비

```bash
cp .env.example .env.local
```

`.env.local`을 비워 두면 앱은 데모 데이터 모드로 실행됩니다. 실제 저장이 필요할 때만 Supabase 값을 채우면 됩니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## 테스트

```bash
npm test
```

```bash
npm run test:e2e
```

```bash
npm run lint
```

## 프로젝트 구조

```text
src/
  app/
    api/          API routes
    stores/       매장 상세 페이지
    submit/       등록 페이지
  components/     지도, 등록 폼, 상세/목록 UI
  lib/
    repository/   demo/supabase 저장소 추상화
    validation.ts zod 입력 검증
    demo-data.ts  데모 데이터
supabase/
  migrations/     DB 스키마
tests/
  e2e/            Playwright 테스트
```

## 라이선스

[LICENSE](./LICENSE)

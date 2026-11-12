# DEVELOPMENT_GUIDE — Windows / Linux / Codex CLI

## 1. 작업 환경

개발 PC는 Windows 네이티브(PowerShell), Windows + WSL2, Linux 중 어느 환경이어도 된다. **같은 Git 저장소와 pnpm-lock.yaml을 사용하되 `node_modules`는 각 PC에서 따로 설치**한다. CI는 Linux 기반 GitHub Actions로 검증한다.

- Node.js는 **24.22.2**로 고정한다. `.nvmrc`와 루트 `package.json`의 `engines.node`를 함께 관리한다.
- pnpm은 **10.34.6**으로 고정한다. 루트 `package.json`의 `packageManager`와 `engines.pnpm`을 함께 관리한다.
- `pnpm-workspace.yaml`에서 `engineStrict`, `packageManagerStrict`, `packageManagerStrictVersion`을 활성화한다. pnpm의 자동 버전 전환은 비활성화하여 설치 시 버전 불일치를 오류로 처리한다. 버전 관리 도구에서 올바른 버전을 먼저 선택한다.
- `.gitattributes` 등으로 LF 줄바꿈과 파일 대소문자 일관성을 유지한다.
- Windows에서 동작하지 않는 `rm -rf`, `export KEY=...` 같은 셸 종속 package script를 피한다. Node.js 기반 스크립트를 우선하거나 필요한 경우 크로스 플랫폼 도구를 사용한다.
- WSL 사용 시 가능하면 리포지토리를 Linux 파일시스템(`~/projects/devflowops`)에 둔다.
- 낮은 사양의 노트북이라면 Windows 네이티브 개발로도 충분하며 Docker/브라우저를 항상 켜 둘 필요는 없다.

## 2. Codex CLI 프로젝트 컨텍스트

- 프로젝트 **루트**에서 Codex CLI를 실행한다. `AGENTS.md`를 읽고 `docs/`의 나머지 문서도 참고하도록 요청한다.
- 각 PC/서버의 Codex 설치 및 ChatGPT 계정 로그인은 별도로 관리한다. 사용자 홈의 인증 상태를 Git으로 동기화하지 않는다.
- ChatGPT 웹 대화 기록이 Codex CLI 세션에 그대로 이어지는 것은 아니다. 여기의 문서가 작업 컨텍스트다.
- 대화 중 실제로 합의한 설계가 바뀌면 `docs/DECISIONS.md`와 관련 문서를 업데이트한다.

## 3. 새 환경 설치 및 현재 명령

Linux/WSL에서 nvm을 사용한다면 저장소 루트에서 실행한다.

```bash
nvm install
nvm use
```

Windows 네이티브에서 nvm-windows를 사용한다면 PowerShell에서 버전을 명시한다. `.nvmrc` 자동 적용을 가정하지 않는다.

```powershell
nvm install 24.22.2
nvm use 24.22.2
```

다른 버전 관리 도구를 사용해도 동일한 Node 버전을 선택한다. 이후 아래 명령은 PowerShell과 Linux/WSL에서 공통으로 사용한다. Node 버전을 새로 설치하면 pnpm도 해당 환경에서 준비해야 할 수 있다.

```bash
npm install --global pnpm@10.34.6
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

버전 출력은 각각 `v24.22.2`, `10.34.6`이어야 한다. `node_modules`는 Windows와 WSL/Linux 사이에 공유하거나 복사하지 않는다. 같은 소스와 lockfile로 각 환경에서 설치하며, esbuild/Rollup/Turbo의 바이너리는 OS와 CPU에 맞게 설치된다.

`pnpm dev`는 Finance와 개발 포털의 프론트엔드, Finance 서버를 함께 실행한다. 포털은 `http://localhost:5174`로 접속하며 포트 사용 중에는 오류로 종료한다. 포털만 실행하려면 `pnpm dev-portal`을 사용한다. Finance 화면과 서버만 함께 실행하려면 `pnpm dev-finance`를 사용한다. 서버만 실행하려면 `pnpm dev-finance-server`, Finance 프론트엔드만 실행하려면 `pnpm --filter @devflowops/finance-web dev`를 사용한다.

서버 단독 실행·빌드·상태 확인과 개발 프록시, API·DB 설정은 [Finance 서버 안내](../apps/finance-server/README.md)를 따른다. 실행 가능한 패키지와 현재 구현 범위는 [개발 진행 현황](DEVELOPMENT_STATUS.md)에서 확인한다.

현재 구현된 검사·빌드 명령은 다음과 같다.

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Finance 브라우저 검증의 설치·실행과 격리 방식은 [Finance E2E 절차](#8-finance-브라우저-e2e)를 따른다.

문서에는 한글과 영문자만 사용한다. 숫자, 일반 문장부호, Markdown 문법과 도식용 기호는 허용하며 한자·일본어·그 밖의 언어 문자와 전각·일본어 문장부호는 금지한다. 인용도 필요한 경우 한국어로 번역한다. `pnpm lint:docs`로 Git이 추적하거나 아직 추가하지 않은 Markdown 파일(`.md`, `.mdx`, Git 제외 파일은 제외)을 검사한다. 루트 `pnpm lint`도 이 검사를 먼저 실행하며, 위반 시 파일·행·열과 문자 코드를 출력하고 실패한다.

명령의 기준은 루트와 앱별 `package.json`이다. 테스트·CI·배포 도입 여부는 [개발 진행 현황](DEVELOPMENT_STATUS.md)을 따른다. CI와 Docker에서도 동일한 Node/pnpm 버전과 frozen lockfile 설치를 사용한다.

## 4. Git / PR 습관

- Feature Branch → PR → 체크 통과 → main merge → 배포.
- 커밋 SHA를 이미지 태그 및 QA 보고서와 연결해 변경의 추적성을 확보한다.
- 개발자 로컬의 셸/OS 차이를 방지하기 위해 CI에서 반드시 install/test/build 검증한다.
- 테스트/빌드 성과 비교 시 첫 실행과 캐시 적중 실행을 섞어 비교하지 않는다.

## 5. 안전한 작업 방식

- 초기 실행에 필수적이지 않은 서비스와 유료 자원은 자동으로 생성하지 않는다.
- CI/CD 시크릿, OCI SSH 키, ChatGPT 로그인 토큰은 코드 저장소/문서/이미지에 포함하지 않는다.
- 테스트 시 실제 사용자 데이터를 사용하지 않는다.

## 6. 현재 검증 상태

실행 시점별 검사와 미확인 범위를 기록한다. 과거의 미확인 항목은 당시 범위이며 이후 결과와 구분한다. 설정 파일의 존재와 실제 확인 결과를 구분하고, 로컬 검사를 운영 배포 완료로 해석하지 않는다.

### 2026-11-10 Finance API·화면 연결 검증

| 실행한 명령 | 결과 |
|---|---|
| `pnpm --filter @devflowops/finance-server lint` | 통과 |
| `pnpm --filter @devflowops/finance-web lint` | 통과 |
| `pnpm --filter @devflowops/finance-server typecheck` | 통과 |
| `pnpm --filter @devflowops/finance-web exec tsc -p tsconfig.app.json --noEmit` | API 연결 화면과 프론트엔드 소스 타입 검사 통과 |
| `pnpm --filter @devflowops/finance-web exec tsc -p tsconfig.node.json --noEmit` | Vite 설정의 타입 검사 통과 |
| `pnpm lint:docs` | 프로젝트 Markdown 13개 파일 언어 검사 통과 |
| `git diff --check` | 변경 내용의 공백 오류 없음 |

- Finance 화면과 서버의 동시 실행, 서버 직접 요청과 Vite 프록시를 통한 `/api/health` 응답을 확인했다.
- 운영·기본 DB 대신 `/tmp`의 임시 SQLite 파일을 지정해 API 요청을 확인했다. 빈 목록 200, 등록 201, 수정·단건 조회 200, 삭제 204와 삭제 후 조회 404를 확인했다.
- 잘못된 금액·날짜·공백 내역, 빈 수정 요청과 잘못된 JSON 요청이 400을 반환하는 것을 확인했다.
- 같은 임시 DB로 서버를 재시작한 뒤 수정된 내역이 유지되는 것을 확인했다. 확인용 서버는 종료했다.
- `/api/openapi.json`과 `/api/docs`의 HTTP 200 응답, 생성 명세의 API 경로와 스키마를 확인했다. Swagger UI의 브라우저 렌더링은 확인하지 않았다.
- 화면 API 연결 후 별도 임시 DB로 Vite 프록시를 통한 등록 201, 목록·수정 200, 삭제 204와 삭제 후 빈 목록을 확인했다. 새 화면·폼·조회 훅·API 클라이언트 모듈도 Vite에서 HTTP 200으로 응답했다. 이는 브라우저에서 클릭·폼 입력을 실행한 검증은 아니다.
- 테스트·빌드 명령, 브라우저의 전체 사용자 흐름, Windows·ARM64 실행, 모바일 화면과 운영 배포는 확인하지 않았다. 마이그레이션 실패·롤백과 동시 요청도 아직 검증하지 않았다.

### i18next 적용 시 검증 기록

- 두 웹 앱의 lint와 프론트엔드 소스 TypeScript 검사를 통과했다.
- 브라우저의 언어 전환·새로고침·모바일 배치는 확인하지 않았으며 테스트·빌드 명령은 실행하지 않았다.
- 이 항목은 기존 기록을 모은 것이며 문서 정리 중 검사를 다시 실행한 결과가 아니다.

### 2026-11-12 문서 기준 분리 검증

- `pnpm lint:docs`: Markdown 13개 파일의 언어 검사 통과. 최초 실행은 샌드박스의 하위 git 실행 권한 오류로 중단되었고, 권한 승인 후 같은 명령을 다시 실행해 통과했다.
- 임시 Python 검사로 문서 13개의 내부 링크 93개에 대해 대상 파일과 제목 참조를 확인했다. 외부 사이트 접속과 브라우저 렌더링은 검사하지 않았다.
- `git diff --check`: 변경 내용의 공백 오류 없음.
- 문서만 변경했으며 애플리케이션 테스트·빌드 명령은 실행하지 않았다.

### 2026-11-12 Finance 브라우저 E2E 도입 검증

- Node.js `24.22.2`, pnpm `10.34.6`, Playwright `1.65.0`과 해당 Chromium을 사용했다. 패키지 설치는 pnpm으로 수행했다.
- `pnpm test:e2e`: 데스크톱 5개와 모바일 에뮬레이션 5개, 총 10개 시나리오 통과. 실제 임시 DB를 통한 CRUD·재조회·합계·필터, 입력 검증과 요청 실패 복구, 언어 선택 유지와 가로 넘침을 확인했다.
- `pnpm --filter @devflowops/finance-web lint`, `pnpm --filter @devflowops/finance-server lint`, `pnpm --filter @devflowops/finance-server typecheck` 통과.
- `pnpm --filter @devflowops/finance-web exec tsc -p tsconfig.app.json --noEmit`와 `pnpm --filter @devflowops/finance-web exec tsc -p tsconfig.node.json --noEmit` 통과. 후자는 Playwright 설정과 E2E 코드도 검사한다.
- 브라우저 설치 미완료와 Linux 라이브러리 누락으로 초기 실행이 실패했다. Chromium과 OS 의존성을 설치한 후 재실행했다. 언어 선택 메뉴를 찾지 못한 테스트는 접근성 역할·이름으로 탐색하도록 수정했다.
- HTML 보고서에 첨부한 영어 데스크톱·모바일 화면을 확인했다. 생성된 보고서와 Trace는 ESLint·Git 대상에서 제외하며 테스트 소스와 설정은 검사한다.
- 서버 종료 신호를 받으면 임시 DB를 즉시 정리하도록 보완한 뒤 전체 10개 시나리오를 다시 통과했고, 해당 실행의 임시 디렉터리가 남지 않는 것을 확인했다.
- `pnpm lint:docs`와 `git diff --check` 통과.
- 운영·기본 DB를 사용하지 않았다. 빌드 명령, Windows·ARM64, 실제 모바일 기기, Firefox·WebKit, 서버 재시작을 포함한 브라우저 흐름과 Swagger UI 브라우저 조작은 이번 범위에서 검증하지 않았다.

### 2026-11-12 전체 파이프라인 목표 문서 보완 검증

- `pnpm lint:docs`: Markdown 13개 파일의 언어 검사 통과.
- 임시 Python 검사로 문서 13개의 내부 참조 107개에 대해 대상 파일과 제목이 존재하는지 확인했다. `git diff --check`도 통과했다.
- 목표 유지 기준과 기존 파이프라인 도식·책임 설명·참조 규칙만 보완했다. 애플리케이션 테스트·빌드는 실행하지 않았으며 Mermaid 도식의 브라우저 렌더링과 파이프라인 실제 실행은 검증하지 않았다.

### 2026-11-12 Finance 1차 범위 잔여 확인

- `pnpm build`: Finance 서버·Finance 웹·포털 웹 3개 패키지 모두 성공. 이번 실행은 캐시 적중 없이 수행했다.
- `node /tmp/devflowops-verify-mvp.mjs`: 현재 환경의 임시 확인 스크립트에서 Playwright Chromium으로 빌드 결과를 검증했다. 저장소에 등록한 상시 실행 명령은 아니며 기존 `pnpm test:e2e` 10개 시나리오를 이번 작업에서 다시 실행한 것은 아니다.
- Finance 서버는 `dist/index.js`를 실행하고 Finance 웹과 포털 웹은 Vite preview로 각각 실행했다. Finance의 빌드된 화면에서 12,345원 내역을 등록하고, 같은 임시 DB로 서버 프로세스를 종료·재시작한 뒤 API와 브라우저 새로고침에서 동일 ID·금액이 유지되는 것을 확인했다.
- Finance preview의 `/api/docs`에서 Swagger UI와 OpenAPI 경로 6개가 표시되는 것을 확인했다. UI의 Try it out·Execute로 상태 확인 200, 등록 201, 목록·단건 조회 200, 수정 200, 삭제 204와 삭제 후 단건 조회 404를 확인했다. 수정 응답의 변경 금액과 삭제 후 Finance 화면의 목록도 확인했다.
- 빌드된 포털의 제목과 비활성 테스트 실행 버튼을 확인했다. Finance·Swagger UI·포털 페이지에서 처리되지 않은 JavaScript 오류는 발생하지 않았다.
- 초기 확인은 임시 스크립트가 Swagger 응답 표의 머리글과 결과 셀을 함께 선택해 중단됐다. 결과 셀만 확인하도록 스크립트를 수정한 뒤 전체 확인이 통과했으며 앱 소스 수정은 필요하지 않았다.
- 결과 JSON과 화면 캡처는 Git 제외 경로인 `apps/finance-web/test-results/mvp-verification/`에 남겼다. 확인용 서버를 모두 종료하고 이번 실행의 임시 DB 디렉터리가 남지 않는 것을 확인했다. 기본·운영 DB는 사용하지 않았다.
- 이번 확인은 현재 Linux의 로컬 빌드·preview 실행이다. Windows·ARM64, 실제 모바일 기기, Nginx·Docker·OCI 배포, 백업·복구, 마이그레이션 실패·동시 요청은 검증하지 않았다.

### 2026-11-12 포털 상단 다국어 배치 확인

- 포털 상단 제목·설명은 전체 너비의 한 행을 사용하고 상태 표시·언어 선택은 다음 행의 오른쪽에 배치하도록 CSS를 수정했다.
- 실행 중인 개발 서버에 Chromium으로 접속해 한국어·영어를 각각 1280·768·390px 너비에서 확인했다. 제목 영역 전체 너비, 제목 아래 제어 영역, 언어 선택 우측 정렬과 페이지 가로 넘침 없음을 확인했다. 영어 데스크톱·모바일 화면 캡처도 확인했다.
- `pnpm --filter @devflowops/platform-web lint`와 `git diff --check` 통과. 기존 E2E 테스트와 빌드 명령은 실행하지 않았다. 실제 모바일 기기와 다른 브라우저는 확인하지 않았다.

### 2026-11-12 포털 관리 앱 자동 발견 확인

- 실행 중인 포털에서 실제 워크스페이스 3개가 표시되고 package.json 없는 폴더는 제외되는 것을 Chromium으로 확인했다.
- 확인용 임시 폴더에 package.json을 추가·변경·삭제하며 새로고침 없이 목록이 갱신되는 것을 확인했다. 이름 변경, 빈 이름 제외와 정상 이름 복구도 확인했고 임시 폴더는 정리했다. 연속 저장 확인은 파일 감시 이벤트 처리 간격을 두고 수행했다.
- 초기에는 포털 밖의 새 폴더를 감지하지 못해 Vite 감시 범위를 apps로 보완했다. 포털 자신의 경로가 정규화되어 이름이 잘못 표시되는 문제는 워크스페이스 이름을 식별자로 사용해 수정했다.
- 1280·390px 너비의 한국어·영어 화면에서 앱 목록·유형과 가로 넘침 없음을 확인했다. 실제 모바일 기기와 다른 브라우저는 확인하지 않았다.
- `pnpm --filter @devflowops/platform-web lint`, `pnpm --filter @devflowops/platform-web exec tsc -p tsconfig.app.json --noEmit`, `pnpm --filter @devflowops/platform-web exec tsc -p tsconfig.node.json --noEmit` 모두 통과했다. 빌드와 기존 E2E 명령은 실행하지 않았다.

### 2026-11-12 포털 관리 앱 카드 배치 확인

- Chromium에서 한국어·영어 각각 1280px의 3열, 768px의 2열, 390px의 1열 배치와 카드 내부 커밋·배포 환경·배포 버전의 세로 정렬을 확인했다. 페이지 가로 넘침은 없었다.
- 브라우저 안에서만 임시 카드 4개를 복제해 총 7개 카드가 3열 3행으로 배치되는 것을 확인하고 복제한 카드는 제거했다. 저장소의 앱 목록이나 패키지는 추가하지 않았다.
- 이후 사용자 요청에 따라 카드 내부를 앱 이름 영역과 정보 영역의 좌우 배치로 수정했다. 같은 화면 너비·언어 조합에서 두 영역이 나란히 놓이고 오른쪽 정보 항목만 세로로 정렬되며 가로 넘침이 없는 것을 다시 확인했다.
- 오른쪽 정보 텍스트를 우측 정렬하고 글자 크기를 2px 줄였다. 한국어·영어의 1280·768·390px 화면에서 라벨 12.4px·값 14px, 우측 정렬과 기존 좌우 배치 유지, 가로 넘침 없음을 확인했다.
- `pnpm --filter @devflowops/platform-web lint`와 `git diff --check` 통과. 빌드·기존 E2E 명령, 실제 모바일 기기와 다른 브라우저는 이번 범위에서 확인하지 않았다.

### 2026-11-12 의미 기반 번역 키 전환 확인

- Finance의 기본 키 126개와 포털의 기본 키 44개를 의미 기반 영문 키로 전환했다. 영어의 복수형 키 4개도 함께 전환했다.
- 임시 대조 스크립트에서 기존 한국어·영어 문구, 보간 값과 복수형을 보존한 것을 확인했다. TypeScript 구문 분석으로 정적 번역 호출 165개의 참조와 동적 메시지·앱 유형에 사용하는 키가 두 언어에 존재하는지 확인했다.
- 두 웹 앱의 lint와 `tsconfig.app.json`의 TypeScript 검사가 통과했다.
- Chromium에서 Finance 조회·입력·저장 오류와 성공 안내의 언어 전환, 단수·복수형, 이름 보간, 사용자 입력과 기본 카테고리 보존을 확인했다. Finance는 가상 API 응답을 사용해 DB를 변경하지 않았다.
- 포털 앱 유형·선택한 앱 제목·미수집 상태·실행 이력·문서 제목과 언어 선택 저장을 한국어·영어로 확인했다. Finance 화면은 1280·390px에서 의미 기반 키가 그대로 노출되지 않는 것도 확인했다.
- 빌드와 기존 E2E 명령, 실제 모바일 기기와 다른 브라우저는 이번 작업에서 확인하지 않았다.

### 2026-11-12 번역 JSON 최대 3단계 분류 확인

- 두 앱의 한국어·영어 JSON을 기능별 중첩 객체로 변환하고 문자열 값까지의 최대 깊이가 3단계인지 확인했다. 기존 문구·보간·복수형과 번역 항목 수는 유지했다.
- 실제 i18next 인스턴스에서 중첩 경로 조회와 영어 단수·복수형, 앱 이름 보간을 확인했다. TypeScript 구문 분석으로 정적 번역 호출 165개의 참조와 이전 앱 접두사 키가 남지 않은 것을 확인했다.
- 두 웹 앱의 lint와 `tsconfig.app.json`의 TypeScript 검사가 통과했다.
- Chromium에서 한국어·영어 전환, Finance 오류·성공 안내·복수형·사용자 입력과 기본 카테고리 보존, 포털 앱 유형·선택·문서 제목·언어 선택 저장을 확인했다. Finance는 가상 API 응답을 사용해 DB를 변경하지 않았다.
- 빌드와 기존 E2E 명령, 실제 모바일 기기와 다른 브라우저는 이번 작업에서 확인하지 않았다.

## 7. 화면 다국어 작업

- Finance와 포털은 각각 `src/i18n/index.ts`에서 i18next를 초기화하고 `src/main.tsx`에서 화면 렌더링 전에 불러온다. 번역 JSON은 앱별 `src/i18n/locales/ko.json`, `en.json`에서 관리하며 네트워크 요청 없이 번들에 포함한다.
- 기본 언어와 누락 번역의 대체 언어는 한국어다. 지원 언어는 `ko`, `en`이며 상단 선택에서 전환한다. localStorage의 `devflowops.language`에 선택을 저장하고, 잘못된 저장값이나 저장소 접근 제한 시 한국어로 시작한다. 저장은 origin별이므로 개발 포트가 다른 두 앱의 선택은 서로 독립적이다.
- 번역 키는 `common.language`, `transactions.errors.connection`, `apps.selectLabel`처럼 영역·기능·의미를 나타내는 영문 식별자로 작성한다. 앱별 파일이 분리되어 있으므로 `finance`·`portal` 접두사는 붙이지 않는다. 화면 문구가 바뀌어도 의미가 같으면 키는 유지하며 한국어 문장 자체를 키로 사용하지 않는다.
- JSON은 기능별 중첩 객체로 분류하고 문자열 값까지의 깊이를 최대 3단계로 제한한다. 예를 들어 `transactions` 아래 `errors` 아래 `connection`을 둔다. 공통 문구는 `common`, 앱별 문구는 `transactions`·`pipeline` 등의 기능 아래 관리한다.
- `keySeparator: '.'`로 중첩 경로를 조회하고 `nsSeparator: false`는 유지한다. JSON 속성명에 점을 넣거나 중첩 경로와 평면 키를 섞지 않는다. 새 키는 두 언어에 같은 구조로 추가하고 컴포넌트에서 `useTranslation`의 `t`로 표시한다.
- 동적 값은 `{{name}}`, `{{amount}}`처럼 보간한다. 개수에 따른 영어 문구는 `_one`, `_other`로 구분한다. HTML 문자열을 삽입하지 않고 React의 텍스트 렌더링을 사용한다.
- 언어 전환 시 문서의 `lang`을 갱신한다. 포털 제목도 번역하며 Finance 제목은 고정 브랜드명을 유지한다. 날짜·금액은 Finance의 `src/i18n/format.ts`에서 Intl로 표시하고, 금액 통화는 KRW를 유지한다. 날짜 입력과 API의 `YYYY-MM-DD` 계약은 유지한다.
- API 클라이언트는 오류 코드를 의미 기반 안내 키로 매핑한다. 폼 오류와 성공 안내도 키를 저장하고 표시 시점에 번역하여 언어 전환을 반영한다. 사용자 입력과 저장된 거래 내역·카테고리는 번역하거나 변경하지 않는다. 기본 카테고리인 `미분류`의 저장 값도 유지하며 화면 입력 예시의 번역과 구분한다. 브라우저 기본 입력 검증 문구는 브라우저 설정을 따른다.

## 8. Finance 브라우저 E2E

저장소의 고정 Node.js와 pnpm으로 의존성을 설치한 뒤, 처음 실행하는 환경에서는 Chromium을 준비한다.

```bash
pnpm --filter @devflowops/finance-web exec playwright install chromium
pnpm test:e2e
```

- Playwright 설정과 시나리오는 `apps/finance-web/playwright.config.ts`와 `e2e/`에서 관리한다. Chromium의 데스크톱·모바일 에뮬레이션으로 실행하며 실제 모바일 기기 검증과는 구분한다.
- 실행기는 API를 `127.0.0.1:3101`, Vite를 `127.0.0.1:5180`에서 시작한다. 포트가 사용 중이면 실패하며 기존 개발 서버를 재사용하지 않는다.
- `apps/finance-server/scripts/serve-e2e.mjs`가 OS 임시 디렉터리 안에 실행별 DB를 만든다. 기존 `FINANCE_DB_PATH`와 기본 Finance DB는 사용하지 않으며 서버 정상 종료 시 임시 디렉터리를 정리한다.
- 테스트는 한 worker에서 순서대로 실행하고 각 사례를 시작하기 전 임시 DB의 거래를 삭제한다. 브라우저의 저장소와 언어 선택은 사례별 새 컨텍스트로 분리한다.
- Vite의 `e2e` 모드는 전용 API로 프록시한다. 일반 개발 실행은 기존 API 주소를 사용한다.
- 등록·재조회·수정·삭제, 삭제 취소와 실패 후 재시도, 월별 합계와 종류 필터, 잘못된 입력, 조회·저장 실패 복구, 언어 선택 저장과 화면 너비 넘침을 검증한다. 네트워크 실패는 브라우저 요청을 가로채 재현하고 정상 CRUD는 실제 임시 DB와 연결한다.
- HTML 보고서는 `apps/finance-web/playwright-report/`, 실패한 실행의 스크린샷·Trace는 `apps/finance-web/test-results/`에 생성되며 Git에서 제외한다. `pnpm --filter @devflowops/finance-web exec playwright show-report`로 보고서를 연다.
- 강제 종료로 남은 `devflowops-finance-e2e-` 임시 디렉터리는 실행 중인 E2E 서버가 없는지 확인한 뒤 정리한다. 브라우저 구동에 필요한 OS 라이브러리 설치는 환경별로 확인한다.

Linux에서 공유 라이브러리 누락으로 브라우저를 시작하지 못하면 다음 명령으로 OS 의존성을 설치한다. 관리자 권한과 네트워크 연결이 필요할 수 있다.

```bash
pnpm --filter @devflowops/finance-web exec playwright install-deps chromium
```

## 9. 포털 관리 앱 자동 발견

- `apps/<앱 폴더>/package.json`에 비어 있지 않은 이름이 있으면 포털이 목록에 자동으로 표시한다. 현재 `pnpm-workspace.yaml`의 `apps/*` 범위에 맞춘 탐색이며, 폴더만 있거나 이름이 없는 항목은 제외한다. 새 패키지는 기존 개발 규칙에 따라 설치·실행 구성을 갖춘다.
- 표시는 `src/app/applications.ts`에서 Vite의 import.meta.glob으로 구성한다. 앱 ID와 워크스페이스 표시는 package.json의 이름을 사용하고 카드 제목은 이름의 마지막 부분을 사용한다. 이름이 `-web`으로 끝나면 웹 앱, `-server`면 서버, 나머지는 앱으로 표시한다.
- 개발 서버는 apps 디렉터리도 감시해 package.json 추가·변경·삭제를 화면에 반영한다. 앱 이름은 번역하지 않으며 유형과 안내 문구만 한국어·영어로 전환한다.
- 빌드된 포털의 목록은 빌드 당시의 저장소 내용을 반영한다. 앱 변경을 배포 화면에 적용하려면 포털을 다시 빌드·배포한다. 루트 Turbo의 globalDependencies에 `apps/*/package.json`을 포함해 패키지 정보 변경 시 이전 빌드 캐시를 재사용하지 않도록 한다.
- 목록 발견은 실제 실행·배포 등록과 분리한다. 발견한 앱의 스크립트를 자동 실행하지 않고 CI·배포 결과나 권한이 연결된 것으로 표시하지 않는다. 실행 대상 등록은 별도 계약과 접근 제어를 마련한 뒤 도입한다.

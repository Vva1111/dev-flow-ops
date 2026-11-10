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

Finance 서버는 `apps/finance-server`의 실행 가능한 패키지다. 고정 Node.js의 TypeScript 실행 기능과 `node --watch`를 사용하며, `tsc`로 `dist/`에 JavaScript를 생성하도록 구성했다. `pnpm --filter @devflowops/finance-server build` 후 `pnpm --filter @devflowops/finance-server start`로 빌드된 서버를 실행한다. 로컬 주소는 `http://127.0.0.1:3001`이며 `GET /api/health`는 서버 프로세스의 응답 여부만 확인한다. DB 연결 상태는 확인하지 않는다. Finance의 Vite 개발 서버는 `/api` 요청을 이 서버로 전달한다. 이 프록시는 개발용이며 배포 프록시는 별도 구성한다. 서버 시작 시 SQLite DB를 열고 SQL 마이그레이션을 적용한다. 기본 파일은 `apps/finance-server/data/finance.db`이며 `FINANCE_DB_PATH` 환경변수로 분리할 수 있다. `/api/docs`에서 Swagger UI와 수입·지출 CRUD API를 확인할 수 있다. 플랫폼 서버는 폴더 구조만 있고 실행 코드와 `package.json`은 없다.

현재 구현된 검사·빌드 명령은 다음과 같다.

```bash
pnpm lint
pnpm typecheck
pnpm build
```

문서에는 한글과 영문자만 사용한다. 숫자, 일반 문장부호, Markdown 문법과 도식용 기호는 허용하며 한자·일본어·그 밖의 언어 문자와 전각·일본어 문장부호는 금지한다. 인용도 필요한 경우 한국어로 번역한다. `pnpm lint:docs`로 Git이 추적하거나 아직 추가하지 않은 Markdown 파일(`.md`, `.mdx`, Git 제외 파일은 제외)을 검사한다. 루트 `pnpm lint`도 이 검사를 먼저 실행하며, 위반 시 파일·행·열과 문자 코드를 출력하고 실패한다.

테스트 도구와 `pnpm test`는 아직 구현하지 않았다. GitHub Actions와 Docker 환경도 아직 미구현이며, 도입 시 동일한 Node/pnpm 버전과 frozen lockfile 설치를 사용한다.

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

2026-11-10 작업 중 실행한 검사와 수동 요청 결과다. 설정 파일의 존재와 실제 확인 결과를 구분하며, 아래 내용은 자동 테스트 구축이나 운영 배포 완료를 의미하지 않는다.

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

## 7. 화면 다국어 작업

- Finance와 포털은 각각 `src/i18n/index.ts`에서 i18next를 초기화하고 `src/main.tsx`에서 화면 렌더링 전에 불러온다. 번역 JSON은 앱별 `src/i18n/locales/ko.json`, `en.json`에서 관리하며 네트워크 요청 없이 번들에 포함한다.
- 기본 언어와 누락 번역의 대체 언어는 한국어다. 지원 언어는 `ko`, `en`이며 상단 선택에서 전환한다. localStorage의 `devflowops.language`에 선택을 저장하고, 잘못된 저장값이나 저장소 접근 제한 시 한국어로 시작한다. 저장은 origin별이므로 개발 포트가 다른 두 앱의 선택은 서로 독립적이다.
- 한국어 원문을 번역 키로 사용한다. 문장에 마침표와 콜론을 사용할 수 있도록 `keySeparator`, `nsSeparator`를 비활성화한다. 새 문구는 두 JSON에 함께 추가하고 컴포넌트에서 `useTranslation`의 `t`로 표시한다.
- 동적 값은 `{{name}}`, `{{amount}}`처럼 보간한다. 개수에 따른 영어 문구는 `_one`, `_other`로 구분한다. HTML 문자열을 삽입하지 않고 React의 텍스트 렌더링을 사용한다.
- 언어 전환 시 문서의 `lang`을 갱신한다. 포털 제목도 번역하며 Finance 제목은 고정 브랜드명을 유지한다. 날짜·금액은 Finance의 `src/i18n/format.ts`에서 Intl로 표시하고, 금액 통화는 KRW를 유지한다. 날짜 입력과 API의 `YYYY-MM-DD` 계약은 유지한다.
- API 클라이언트는 오류 코드를 화면 안내 키로 매핑한다. 폼 오류와 성공 안내는 표시 시점에 번역하여 언어 전환을 반영한다. 사용자 입력과 저장된 거래 내역·카테고리는 번역하거나 변경하지 않는다. 브라우저 기본 입력 검증 문구는 브라우저 설정을 따른다.
- 이번 i18next 적용에서 두 웹 앱의 lint와 프론트엔드 소스 TypeScript 검사를 통과했다. 브라우저의 언어 전환·새로고침·모바일 배치는 아직 확인하지 않았으며 테스트·빌드 명령은 실행하지 않았다.

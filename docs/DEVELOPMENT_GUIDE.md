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

`pnpm dev`는 Finance와 개발 포털의 프론트엔드를 함께 실행한다. 포털은 `http://localhost:5174`로 접속하며 포트 사용 중에는 오류로 종료한다. 포털만 실행하려면 `pnpm dev-portal`을 사용한다. Finance 프론트엔드만 실행하려면 `pnpm dev-finance`를 사용한다.

백엔드는 같은 모노레포의 `apps/finance-server`, `apps/platform-server`에서 별도 패키지로 관리하는 것으로 결정했다. 현재 두 서버는 README와 `.gitkeep`을 포함한 폴더 구조만 있으며 `package.json`과 실행 코드가 없다. 따라서 위 실행 명령으로 서버가 시작되지는 않는다. 서버 패키지를 구현할 때 같은 Node/pnpm 고정 버전을 사용한다.

현재 구현된 검사·빌드 명령은 다음과 같다.

```bash
pnpm lint
pnpm typecheck
pnpm build
```

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

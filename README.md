# DevFlowOps

> **AI-assisted Frontend Development & Delivery Platform**
>
> An AI-assisted frontend development platform that automates testing, CI/CD, deployment, and quality assurance.

## 프로젝트 목표

DevFlowOps는 **개발 → 검증 → 빌드 → 배포 → 배포 후 품질 검증 → 피드백**까지 이어지는 프론트엔드 개발 워크플로를 표준화하고 자동화하는 포트폴리오 프로젝트다. AI는 전체 플랫폼을 보조하는 분석 수단이며 프로젝트 자체가 AI 에이전트만을 개발하는 프로젝트는 아니다.

- 목표 직무: Frontend Platform Engineer / Developer Productivity Engineer.
- 플랫폼 관리 화면(기본 뼈대): 앱별 테스트 실행 요청과 CI/CD·배포 후 QA 결과를 커밋 기준으로 연결하는 개발자 포털. GitHub를 기반으로 동작하며 코드 저장·리뷰 기능은 GitHub가 담당한다.
- 검증용 대상 앱: 간단한 개인 금융 관리 앱(Finance App).
- 검증 지표: 변경 영향에 따른 작업 실행 효율, CI 검사 시간, 배포 소요 시간, 실패 진단 품질, 테스트 누락 탐지의 유효성.
- 이 저장소의 문서는 **설계/작업 컨텍스트**이며, 문서에 적힌 기능이 현재 구현되어 있다는 뜻이 아니다.

## Codex CLI: 이전 ChatGPT 대화 대신 이 문서 사용

Codex CLI는 이 ChatGPT 웹 대화 전체를 그대로 이어받는 것이 아니다. 따라서 **프로젝트 루트의 `AGENTS.md`와 아래 문서가 지속적인 기준**이다.

읽기 순서:

1. [`AGENTS.md`](AGENTS.md) — Codex 작업 규칙, 확인·검증 원칙.
2. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) — 목표, 확정 사항, 범위, 제약.
3. [`docs/DECISIONS.md`](docs/DECISIONS.md) — 결정 이력과 미결정 사항.
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 플랫폼 및 배포 구조.
5. [`docs/AI_QUALITY_AGENT.md`](docs/AI_QUALITY_AGENT.md) — AI 관련 작업의 구체적인 책임과 범위.
6. [`docs/ROADMAP.md`](docs/ROADMAP.md) — 순차 구현 계획과 완료 기준.
7. [`docs/DEVELOPMENT_GUIDE.md`](docs/DEVELOPMENT_GUIDE.md) — Windows/Linux 공용 개발 규칙.

### Codex 첫 요청 예시

```text
AGENTS.md와 docs/의 프로젝트 문서 전체를 읽어 DevFlowOps의 목표와 확정된 선택을 파악해 줘.
현재 저장소의 구현 상태를 먼저 확인하고, 문서상 목표와 실제 구현을 구분해 줘.
미확정 기술을 임의로 결정하지 말고, 지금 단계에 맞는 최소 구현 계획을 제시해 줘.
AI 자체가 목적이 아니라 개발·테스트·배포·품질 검증을 자동화하는 플랫폼이 목적임을 유지해 줘.
```

## 작업 시작

현재 구현은 `apps/finance-web`과 `apps/platform-web`의 React + TypeScript + Vite 기본 화면 및 pnpm Workspaces / Turborepo 설정이다. 포털은 관리 앱, 검증·배포 단계, 실행 이력의 빈 상태를 제공한다. Finance 기능, API, 실제 결과 조회·테스트 실행, 테스트 도구, CI/CD, 배포 및 AI 분석은 아직 구현하지 않았다.

### 환경 및 실행

- Node.js **24.22.2**: `.nvmrc` 및 루트 `package.json`의 `engines`에 고정.
- pnpm **10.34.6**: 루트 `package.json`의 `packageManager` 및 `engines`에 고정.
- Node 버전 관리 도구로 위 버전을 먼저 설치·선택한다. nvm 사용 환경에서는 `nvm install` 후 `nvm use`로 선택할 수 있다. Windows 네이티브에서는 사용하는 버전 관리 도구로 동일한 버전을 선택한다.
- pnpm이 없다면 `npm install --global pnpm@10.34.6`으로 준비한다.
- pnpm 설치 시 Node/pnpm 버전 불일치는 오류로 처리한다. Windows 및 Linux/WSL별 준비 절차는 [개발 가이드](docs/DEVELOPMENT_GUIDE.md#3-새-환경-설치-및-현재-명령)를 따른다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev`는 두 앱을 함께 실행한다. 포털은 `http://localhost:5174`(고정 포트), Finance 앱은 Vite가 출력하는 주소로 접속한다. 앱별 실행은 `pnpm dev:portal`, `pnpm dev:finance`를 사용한다. 루트에서 `pnpm lint`, `pnpm typecheck`, `pnpm build`를 사용할 수 있다. 테스트 명령은 테스트 도구를 도입하는 단계에 추가한다.

### 현재 구조

- `apps/finance-web/src/app`: 검증 대상 앱의 진입 화면과 전체 구성.
- `apps/platform-web/src/app`: 개발 포털의 관리 앱·검증 단계·실행 이력 기본 화면.
- `docs`: 설계, 결정 및 개발 규칙.
- 루트 설정: 워크스페이스, 작업 그래프, lint 및 개발 환경 표준화.

관리 화면 `apps/platform-web`의 기본 뼈대는 추가했으며, 후속 목표는 앱과 분리된 플랫폼 API 계층과 공통 QA 실행 도구다. 상세 책임과 도입 순서는 [아키텍처](docs/ARCHITECTURE.md#8-플랫폼-관리-화면과-앱별-실행-구조)를 따른다. 플랫폼 API와 QA 실행 도구 및 실제 연동 기능은 아직 없다.

공용 패키지는 실제 재사용이 발생할 때 추가한다. API, E2E, 인프라, Quality Agent는 해당 구현 단계에서 추가한다. 향후 CI와 Docker에서도 동일한 Node/pnpm 버전을 사용한다.

> 프로젝트명: **DevFlowOps**. 이전 문서의 **Frontend Platform Starter**는 폐기된 임시 명칭이다.

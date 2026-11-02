# ARCHITECTURE — DevFlowOps 목표 설계

> **설계 문서. 실제 구현과 일치하는지 작업 시작 시 반드시 확인할 것.**

## 1. 시스템 개요

```mermaid
flowchart TD
  DEV[Developer PC - Windows / Linux\nReact + pnpm + Turborepo] --> GH[GitHub - branch / PR / main]
  GH --> CI[GitHub Actions - lint / typecheck / Vitest / Playwright]
  CI --> GATE{검증 성공?}
  GATE -- no --> ART[실패 로그 및 test artifacts]
  ART --> ANALYSIS[AI Quality Agent - Codex CLI\nOCI 또는 검증된 실행 위치]
  GATE -- yes + main --> BUILD[Docker linux/arm64 build]
  BUILD --> REG[GHCR - SHA tagged images]
  REG --> DEPLOY[OCI A1 - Docker Compose]
  DEPLOY --> APP[Finance App: Nginx / Node API / SQLite]
  APP --> SMOKE[운영 안전 Smoke Test]
  DEPLOY --> ISOLATED[격리된 E2E 대상 + 테스트 SQLite]
  ISOLATED --> E2E[Playwright functional E2E]
  SMOKE --> EVIDENCE[Test evidence / logs / traces]
  E2E --> EVIDENCE
  EVIDENCE --> ANALYSIS
  ANALYSIS --> REPORT[AI advisory report + commit/deployment metadata]
  REPORT --> FEEDBACK[GitHub report / developer feedback]
  CI --> SYNC[플랫폼 API - 결과 수집 및 연결]
  DEPLOY --> SYNC
  EVIDENCE --> SYNC
  REPORT --> SYNC
  SYNC --> PORTAL[Platform Web - 앱별 실행 이력과 품질 상태]
  PORTAL --> REQUEST[플랫폼 API - 허용된 테스트 실행 요청]
  REQUEST --> CI
```

**주의:** CI 실패 이벤트와 배포 성공 이벤트는 서로 다르다. OCI에 배포되지 못한 CI 실패의 로그를 OCI Agent로 보내려면 **별도 연동·인증·트리거**가 필요하다. 다이어그램의 연결만으로 구현된 것이 아니다.

## 2. 권장 폴더 구조

```text
devflowops/
├── README.md
├── AGENTS.md
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── DECISIONS.md
│   ├── ARCHITECTURE.md
│   ├── AI_QUALITY_AGENT.md
│   ├── ROADMAP.md
│   └── DEVELOPMENT_GUIDE.md
├── apps/
│   ├── platform-web/         # 관리 UI: 결과 조회 → 테스트 실행 요청
│   ├── platform-api/         # 권장안: 앱 설정, 실행 요청, 결과 조회/수집
│   ├── finance-web/          # React + TypeScript + Vite
│   └── finance-api/          # Node API, framework TBD
├── packages/
│   ├── ui/                   # 공용 표현 컴포넌트
│   ├── domain/               # 공유할 가치가 있는 순수 계약/계산
│   ├── utils/                # 순수 함수
│   ├── config-eslint/
│   └── config-ts/
├── tools/
│   └── quality-agent/        # 공통 수집·실행·보고 및 선택적 AI 분석
├── tests/
│   └── e2e/                 # 앱 간 통합 시나리오가 실제로 필요할 때
├── infra/
│   ├── docker/
│   └── compose/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
└── package.json
```

이 폴더 구조는 **목표 예시**다. 실제 사용하는 패키지만 생성한다. 특히 두 번째 데모 앱은 불필요하다. `platform-web`은 플랫폼 자체 기능이며 추가 데모 앱이 아니다. `platform-api`의 별도 앱 구성은 미확정이다. 앱별 테스트는 각 앱에서 관리하고 루트 `tests/e2e`는 필요한 앱 간 시나리오에만 사용한다. `packages/*`나 실행 가능한 `tools/*`를 워크스페이스 패키지로 도입할 때 pnpm workspace glob도 함께 추가한다.

## 3. 개발/빌드 플랫폼

- pnpm은 workspace 의존성과 lockfile을 관리한다.
- Turborepo는 앱·패키지의 작업 그래프, 캐시, 변경 영향 기반 실행을 담당한다.
- 기본 CI는 정확성이 우선이다. 변경 영향 기반 최적화를 하더라도 공통 패키지 변경이 소비 앱에 미치는 영향은 보존해야 한다.
- AI가 테스트 실행 범위의 유일한 판단자가 되지 않는다. 먼저 정적 의존성/명시적 규칙을 적용하고 AI는 누락 위험을 제안한다.
- 변경 전후 CI 소요 시간 비교는 동일한 조건/시나리오로 측정한다.

## 4. GitHub Actions 경계

### PR 검증(`ci.yml`)

- Checkout → Node/pnpm 설정 → frozen lockfile install.
- Lint, typecheck, Vitest, 필요 E2E, Build validation.
- PR 검사 결과 및 실패 로그·테스트 artifacts 생성.
- 신뢰하지 않는 PR 코드를 OCI의 Codex 구독 인증 정보가 있는 환경에서 실행하지 않는다.

### 릴리스 및 배포(`deploy.yml`)

- `main`의 검증된 커밋에만 배포 실행.
- Docker Buildx 등으로 `linux/arm64` 이미지를 빌드하고 GHCR에 commit SHA 태그로 보관.
- OCI에서 Compose pull/up, 서비스 health/version 확인.
- 배포 성공 이후 운영 Smoke Test 실행 및 후속 분석 트리거.
- 재배포/복구 절차, SQLite 영속 볼륨, 백업/복원을 별도 정의한다.

AI 호출 성공 여부는 기본 PR 검사·빌드 성공의 조건과 분리한다. AI 분석 실패는 별도 상태로 기록한다. 결정론적 테스트 실패는 실패 상태를 유지한다.

## 5. OCI 런타임의 분리

- 상시 실행: Nginx(React 정적 배포/프록시), Node API, SQLite(호스트 볼륨).
- 필요 시 실행: Playwright test runner / Quality Agent / Codex CLI.
- 운영 앱의 DB를 변경하는 E2E는 금지. 변경/삭제 테스트는 별도 데이터베이스 및 격리된 환경에서만 실행한다.
- Agent의 Docker socket, SSH 키, OCI 관리자 자격증명, 운영 데이터 접근은 기본적으로 제공하지 않는다.
- 테스트를 실행한 다음 브라우저를 종료하고 AI 분석을 수행하는 방식으로 제한된 CPU/메모리를 활용한다.
- 프로덕션 서비스는 Vite dev server가 아니라 빌드된 정적 번들을 제공한다.

## 6. 결과 추적 및 보고

모든 분석 결과에 가능한 범위 내에서 아래 메타데이터를 포함한다.

- Git commit SHA, 브랜치/PR(해당 시), GitHub Actions run ID.
- 배포된 이미지 태그 및 서비스 버전, 환경, 실행 시각.
- 테스트 종류/실행 수/성공/실패/건너뜀, 증거 파일 링크.
- Codex CLI 모델/버전(확인 가능한 경우), 분석 성공/실패, 근거 로그.
- AI의 원인 후보와 신뢰 근거, 사람이 수행할 확인 단계.

보고서는 JSON(기계 판독) + Markdown(사람이 읽기 쉬움) 형태를 우선 검토한다. GitHub에 게시하는 구현 방식은 미정.

## 7. 보안·운영 경계

GitHub 저장소의 공개 여부 자체는 OCI 인스턴스에 비밀 정보가 공개된다는 뜻이 아니다. 진짜 통제 대상은 SSH, 파일 권한, 토큰, Agent가 실행하는 코드, 의존성 공급망 및 네트워크 노출이다. 외부 PR/로그/웹 콘텐츠의 프롬프트 인젝션도 고려한다.

- 원격 Codex 인증 파일은 깃·이미지·CI artifact에 넣지 않는다.
- 구독 기반 자동 실행이 정상 동작하는지 검증한 후 사용한다. 실패 시 AI 단계를 건너뛰되 자동 테스트와 배포는 유지한다.
- Finance App에 실제 자산/거래 데이터를 넣는다면 외부 노출을 제한하고 백업을 준비한다.

## 8. 플랫폼 관리 화면과 앱별 실행 구조

**관리 화면의 정적 기본 뼈대만 구현했으며 아래 연동 구조는 목표 설계다.** 같은 모노레포에서 플랫폼 UI·실행 도구·대상 앱을 관리한다. GitHub는 코드·리뷰와 CI/CD 실행 기반을, 관리 화면은 앱별 실행 및 품질 추적을 담당한다.

### 책임과 데이터 흐름

| 구성 요소 | 책임 |
|---|---|
| `apps/platform-web` | 앱 현황, 실행 이력·상세, CI/CD·배포 후 QA 결과, 허용된 테스트 실행 요청 |
| 플랫폼 API 계층 (`apps/platform-api` 권장) | 앱 설정 검증, 실행 요청 접수, 실행 상태·결과 조회, GitHub 연동 |
| GitHub Actions / QA 실행기 | 허용된 작업 실행, 결정론적 결과와 증거 생성 |
| `tools/quality-agent` | CLI/CI/관리 화면에서 재사용하는 수집·실행·보고, 선택적 AI 분석 |
| 대상 앱 (`apps/finance-web` 등) | 기능 코드, 테스트 시나리오, 앱별 실행 설정 |

1. 결과 조회: Actions 및 QA 실행 결과 → 플랫폼 API의 수집·연결 → 관리 화면. 원본 로그·Artifact는 링크로 제공한다.
2. 테스트 실행: 관리 화면 → 플랫폼 API에서 요청 검증 → 허용된 Actions 워크플로/격리 실행기 → 결과 수집 → 화면 상태 갱신.
3. 브라우저는 셸 명령을 직접 실행하지 않는다. UI·API·CLI는 같은 실행/결과 계약을 사용하고 테스트 실행 로직을 각각 복제하지 않는다.

### 앱 추가와 모듈 경계

- 앱 ID, workspace, 지원 검사 종류, 검증 명령 또는 workflow 식별자, 허용 환경, 배포/health check 대상과 결과 위치를 등록하는 설정을 설계한다. 정확한 파일명·스키마는 구현 시 확정한다.
- 공통 파이프라인은 실행·수집·보고를 담당하고, 앱은 도메인별 테스트를 제공한다. 공통 UI나 결과 계약은 실제 공유가 발생할 때 `packages/`로 추출한다.
- pnpm/Turbo 그래프와 정적 규칙으로 영향 앱을 결정한다. 같은 저장소에서도 앱별 검사·배포가 가능하도록 설계한다.
- 외부 저장소 지원은 후속 확장이다. 현재 목표를 위해 앱을 분리하거나 데모 앱을 늘리지 않는다.

### 결과와 실행 상태

- 앱 ID, 커밋 SHA, 브랜치, 환경, 실행 종류, 실행 ID/재시도 회차, Actions run ID, 시작·종료 시각과 원본 증거 링크를 연결한다.
- 배포된 이미지 SHA 및 QA 대상 버전을 별도로 기록한다. 같은 브랜치의 최신 CI 결과를 다른 배포 버전의 QA 결과와 섞지 않는다.
- 요청/대기/실행 중/완료 상태와 성공/실패/취소/미실행 결과를 구분한다. 결과 수집 실패·정보 없음·오래된 결과를 성공으로 표시하지 않는다.
- AI 분석 상태는 테스트·CI/CD 결과와 독립적으로 표시한다. AI가 실패해도 결정론적 결과와 증거는 조회할 수 있어야 한다.

### 단계와 운영 경계

- 먼저 Finance App의 결과 조회를 완성하고, 이후 제한된 수동 테스트 실행을 지원한다. 관리 UI 장애가 기본 CI/CD나 CLI 실행을 막지 않도록 한다.
- 실행 API는 등록된 앱·작업·환경만 허용한다. 임의 명령·경로·URL 입력을 실행하지 않고, GitHub 인증 정보는 서버에서만 보관한다.
- 실행 기능 도입 전 접근 제어, 실행 가능한 커밋의 신뢰 범위, 중복 요청·동시 실행 제한, 시간 제한과 이력 기록을 설계한다. 인증 방식은 아직 선택하지 않았다.
- 운영은 읽기 전용 Smoke Test만 실행한다. 데이터 변경 테스트는 격리된 앱/DB를 사용한다. 운영 배포·롤백 실행 버튼은 초기 범위에서 제외한다.
- 결과 저장·보존, GitHub 이벤트 수신/폴링, 재수집 방식, API 배포 단위 및 OCI 자원 적합성은 상세 설계와 검증이 필요하다. Finance DB와 플랫폼 실행 메타데이터의 책임을 분리하며 실사용 금융 데이터를 결과 저장에 사용하지 않는다.

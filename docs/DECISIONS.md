# DECISIONS — 확정 사항과 변경 가능한 선택

이 문서는 Codex가 과거의 제안/가정을 확정 사항으로 잘못 받아들이지 않도록 돕는 결정 로그다. **구현 상태가 아닌 설계 의사결정의 상태**를 나타낸다.

## 확정된 선택

| ID | 결정 | 근거/의도 |
|---|---|---|
| D-01 | 프로젝트명 **DevFlowOps** | 전체 개발 워크플로 + 운영 자동화 |
| D-02 | 플랫폼 목적이 우선이고 AI Agent는 구성 요소 | 개발·배포·품질 검증 전 과정 생산성 개선 |
| D-03 | React + TS + Vite | 기존 Vue 경험을 React 생태계로 확장 |
| D-04 | pnpm Workspaces + Turborepo | 모노레포 및 변경 영향 기반 작업 실행 |
| D-05 | GitHub + GitHub Actions | 프로젝트 중심 저장소와 CI/CD 일원화 (기존 실무 GitLab과 구분) |
| D-06 | Vitest + Playwright | 결정론적 단위/E2E 테스트 기반 |
| D-07 | Docker/Compose + GHCR | 재현 가능한 컨테이너 빌드/배포 |
| D-08 | SQLite | 소규모 Finance App용 경량 저장소 |
| D-09 | Finance App은 플랫폼의 시험 대상 | 핵심은 플랫폼, 앱은 최소한의 의미 있는 도메인 제공 |
| D-10 | AI는 CLI 기반 분석을 우선 검토 | 별도 API 종량제 비용 회피 |
| D-11 | 대표 AI 사례: CI 실패 분석 + 변경 영향·테스트 누락 검토 + 배포 후 품질 분석 | 기존 테스트 자동화를 넘어서 개발 생산성에 직접 기여 |
| D-12 | Windows와 Linux에서 같은 저장소를 개발 | OS/셸 차이를 최소화하고 Linux CI를 최종 검증 기준으로 사용 |

## 선택한 목표지만 현실 검증이 필요한 것

| ID | 설계 목표 | 확인해야 할 점 |
|---|---|---|
| P-01 | OCI Always Free Ampere A1에서 운영 | 인스턴스 용량/리전, 서비스 제약, ARM64 빌드 |
| P-02 | OCI 서버에서 Codex CLI + ChatGPT 구독 로그인 | 무인 실행, 토큰 만료/갱신, 권한/운영 정책, 구독 한도 |
| P-03 | OCI에서 배포 후 Test Orchestrator 가동 | 트리거/격리/리포트 전달 및 리소스 측정 |
| P-04 | CI 실패 시 OCI Agent가 분석 | 실패 시 아직 배포되지 않았으므로 로그를 안전하게 전달할 별도 경로 필요 |

## 미확정 / 추천

| 항목 | 현재 추천 | 확정 전에 확인할 조건 |
|---|---|---|
| API 프레임워크 | Fastify | 요구 기능, 익숙함, 배포 복잡성 |
| ORM | Drizzle ORM | SQLite 스키마/마이그레이션 전략 |
| 웹/API 워크스페이스 분리 | `apps/finance-web`, `apps/finance-api` | 실제 단일/분리 배포 필요 |
| Agent 디렉터리 | `tools/quality-agent` | 구현 구조와 실행 계약 |
| CI 실패 보고 | GitHub Actions artifact / GitHub API | 인증, 전달 형식, 실행 트리거 |
| AI 분석 결과 게시 | GitHub Actions summary / PR comment / artifact | 구현 비용과 권한 위험 |
| 배포 실패 대응 | 검증 실패 시 차단, 롤백은 후순위 | 배포 정책/데이터 보호 |
| Finance App 접근 제한 | 데모 데이터 + 적절한 접근 통제 | 공개 운영 방식과 보안 |

## 변경 관리 원칙

- 상위 목표(D-02)와 비용 제약(D-10)을 유지한 채 세부 기술은 바꿀 수 있다.
- 기술 변경 시 이유, 검증한 대안, 영향, 결정 날짜를 여기에 추가한다.
- AI가 제안하는 개선/실행 결과는 결정된 기술 선택을 자동으로 뒤집지 않는다.
- 프로젝트의 최우선 엔지니어링 결과는 재현 가능한 개발·빌드·테스트·배포 프로세스다.

## 2026-11-02 — 초기 개발 구조

- Node.js 24.22.2 LTS와 pnpm 10.34.6을 고정한다. 설치된 Node 24.21.0을 그대로 채택하지 않고 지원 중인 LTS의 패치 버전을 선택했다.
- 근거: [Node 24.22.2 공식 릴리스](https://nodejs.org/en/blog/release/v24.22.2), [pnpm Node 호환표](https://pnpm.io/installation), [Vite Node 요구사항](https://vite.dev/guide/).
- 우선 `apps/finance-web`만 생성한다. API 분리 및 프레임워크/ORM 결정은 보류한다.
- 공통 패키지는 실제 재사용 시점에 생성한다. ESLint 설정은 초기에는 루트에서 관리한다.
- CI 및 Docker 구현 시 동일한 Node/pnpm 버전을 사용한다. 현재 해당 실행 환경은 미구현이다.
- pnpm 10 설정은 `pnpm-workspace.yaml`에서 관리한다. `engineStrict`, `packageManagerStrict`, `packageManagerStrictVersion`으로 설치 시 버전을 검사하고, `managePackageManagerVersions: false`로 pnpm 자동 전환을 끈다. 환경별로 지정 버전을 먼저 설치·선택한다.

## 2026-11-02 — 플랫폼 관리 화면과 단일 모노레포 확장

- 플랫폼 도구와 Finance App은 단일 모노레포에서 함께 개발한다. 저장소 공유가 앱들의 동시 배포를 뜻하지는 않는다.
- 앱별 테스트 실행 요청과 CI/CD·배포 후 QA 결과를 커밋 기준으로 연결하는 별도 관리 화면을 목표 범위에 추가한다. GitHub의 코드 저장·리뷰 및 Actions 실행 기반을 활용한다.
- `apps/platform-web`을 관리 UI의 목표 경로로 둔다. Finance App은 첫 검증 대상이고, 관리 UI는 플랫폼 자체 기능이다.
- 공통 실행·수집·보고를 재사용하되 테스트 시나리오와 앱별 실행 설정은 각 앱이 소유한다. 조회 기능을 먼저 완성한 뒤 제한된 테스트 실행 요청을 추가한다.
- 플랫폼 API의 별도 앱 경로(`apps/platform-api`)는 권장안이다. 프레임워크, 배포 구성, 인증·권한, 저장소, 동기화 및 앱 등록 계약은 미확정이다. 실제 구현 전에 상세 설계한다.
- 운영 배포·롤백 버튼과 범용 CI 엔진은 초기 범위에 포함하지 않는다. 현재 변경은 문서상 목표이며 구현 완료를 의미하지 않는다.

## 2026-11-02 — 개발 포털 기본 뼈대

- `apps/platform-web`에 React + TypeScript + Vite 기반 포털 워크스페이스를 추가한다. 기존 Finance 앱과 동일한 의존성 및 검사 명령을 사용한다.
- 관리 앱, 검증·배포 단계, 실행 이력의 빈 상태를 먼저 제공한다. 표시된 상태는 미연결/미실행이며 실제 실행 결과나 샘플 성공 수치가 아니다.
- 포털 개발 포트는 5174, 미리보기 포트는 4174로 고정하여 두 앱을 구분한다.
- 플랫폼 API, 인증, 저장 방식과 GitHub 연동은 보류한다. 테스트 실행 요청은 비활성 상태로 두며 CI/CD 워크플로는 이 단계에서 추가하지 않는다.

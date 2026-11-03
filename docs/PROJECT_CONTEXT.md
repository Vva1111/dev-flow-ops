# PROJECT_CONTEXT — DevFlowOps

## A. 왜 만드는가

목표 역할은 **Frontend Platform Engineer** 및 **Developer Productivity Engineer**. 사용자에게는 Vue/TypeScript 기반 모노레포 구조 개선, 공통 모듈 관심사 분리, GitLab CI/CD, Docker/Registry 배포 자동화 경험이 있다. 이번 프로젝트는 기존 역량을 React 생태계에 확장하고, CI/CD 품질 분석을 체계화하는 공개 포트폴리오다.

**DevFlowOps = 개발환경 표준화 + CI/CD/배포 자동화 + 결정론적 테스트 + AI 보조 분석의 통합 흐름.** AI Agent만을 만드는 프로젝트가 아니다.

- 공식 프로젝트명: **DevFlowOps** (`DevFlow`, `Frontend Platform Starter`는 이전 후보/임시명).
- GitHub 저장소 이름: 예시 `devflowops` / `devflowops-platform`. 실제 원격 저장소명은 현재 파일로 확인해야 하며 문서가 보장하지 않는다.
- GitHub Description (선택된 한 문장): **An AI-assisted frontend development platform that automates testing, CI/CD, deployment, and quality assurance.**
- 플랫폼과 검증 대상 앱은 단일 모노레포에서 함께 개발한다. 앱별 검증·배포 단위는 분리할 수 있다.
- 백엔드도 같은 모노레포에서 별도 `package.json`을 가진 워크스페이스 패키지로 관리한다. Finance 서버는 `apps/finance-server`에 폴더 구조만 생성했으며 `package.json`과 실행 코드는 없다. HTTP API·비즈니스 로직·DB 접근·마이그레이션은 Finance 서버가 소유한다.
- 관리 포털의 백엔드는 `apps/platform-server`로 분리하고 폴더 구조만 생성했다. 실행 이력 저장 방식과 인증·GitHub 연동은 아직 구현·확정하지 않았다.
- 플랫폼 관리 화면: 앱별 테스트 실행 요청과 CI/CD·배포 후 QA 결과를 연결하는 개발자 포털을 제공한다. 코드 저장·리뷰와 CI/CD 실행 기반은 GitHub/GitHub Actions가 담당한다.
- 앱: 소규모 개인 Finance App. 이 앱 자체의 시장성이나 소비자용 AI 기능이 목적이 아니다.

## B. 확정 사항 / 기술 선택

| 계층 | 결정 |
|---|---|
| 웹 앱 | React + TypeScript + Vite |
| 백엔드 API 프레임워크 | Hono (선택 확정, 구현 전; 근거: [TECH_STACK.md](TECH_STACK.md)) |
| 백엔드 런타임 | Node.js (저장소 고정 버전 사용, API 실행 구성은 구현 전) |
| 패키지·모노레포 | pnpm + pnpm Workspaces |
| 실행·캐시 | Turborepo |
| DB | SQLite |
| ORM | Drizzle ORM (선택 확정, DB 연동 구현 전; 근거: [TECH_STACK.md](TECH_STACK.md)) |
| SQLite 드라이버 | Node.js 내장 `node:sqlite` (선택 확정, RC 상태 및 Drizzle 연동 검증 필요) |
| 단위/통합 테스트 | Vitest |
| E2E | Playwright |
| 형상관리 | GitHub |
| CI/CD | GitHub Actions (GitLab CI 사용하지 않음) |
| 컨테이너 | Docker + Docker Compose |
| 웹 배포 방향 | Finance와 포털을 각각의 Nginx 컨테이너로 별도 배포 (구현 전) |
| Registry | GitHub Container Registry / GHCR (Harbor 사용하지 않음) |
| 운영 목표 | OCI Always Free Ampere A1 (linux/arm64) |
| AI 분석 인터페이스 | Codex CLI |
| AI 비용 선호 | ChatGPT 구독 인증을 사용해 **별도 API 과금 없이** 시도. 실제 무인 운영 적합성 검증 필요 |

위 기술의 **선택**과 **구현 완료**는 다르다. 아직 테스트·배포·에이전트가 모두 구축되었다고 가정하지 말 것.

## C. 추천이지만 미확정

- Drizzle 패키지 버전, 스키마와 마이그레이션 도구·실행 절차는 미확정이다. SQLite 드라이버는 `node:sqlite`로 확정했으며 고정 Node.js 버전과 Drizzle의 연동은 검증 전이다.
- 웹/서버의 워크스페이스 분리와 두 프론트엔드의 Nginx 별도 배포 방향은 확정했다. 컨테이너 간 API 통신은 Docker 네트워크를 활용하되, 서버 컨테이너 구성과 네트워크 범위·포트·도메인·HTTPS는 미확정이다.
- API 입력 검증 방식과 라이브러리, Finance 테이블·제약조건·금액 및 날짜 저장 형식, DB 영속 볼륨의 상세 구성과 백업·복원 절차는 미확정이다.
- GitHub Actions 배포 트리거, OCI Agent 트리거, 보고서 게시 방식 및 운영 접근 통제: 구현 전 상세 설계 필요.
- 플랫폼 API의 배포 단위, GitHub 연동 인증, 접근 제어, 실행 이력 저장·동기화 방식, 앱 등록 설정 형식: 구현 전 결정한다.
- AI Quality Agent의 세부 구현 언어, 결과 JSON 스키마, 프롬프트/인증 운영: 미확정.

## D. Finance App 최소 기능(MVP)

1. **Dashboard**: 월별 수입, 지출, 잔액; 월별 지출 추세; 카테고리별 비중.
2. **Transaction**: 수입/지출 등록·조회·수정·삭제, 날짜·카테고리 필터, 정렬/페이지네이션.
3. **Category**: 수입/지출 카테고리 등록·수정, 거래와 연결.

특별히 테스트해야 할 규칙: 월말/연말 경계, 기간 필터, 집계 정확성, 거래 변경 후 통계 갱신, 유효성 검사, 복합 필터와 페이지네이션의 결합.

초기 제외: 은행/카드 연동, 자동 수입·지출 가져오기, 예산/반복 거래, 복잡한 인증/역할, 소비자용 AI 금융 분석, 정당성 없는 두 번째 앱.

**개인 금융 데이터를 공개 서버에 무방비로 노출시키지 말 것.** 초기에는 시드/데모 데이터 중심으로 검증하고 공개 운영 접근 제한 방식을 결정해야 한다.

## E. 구현 목표 / 성공 기준

- React 모노레포 패키지를 단일 명령 체계로 실행/빌드/검증할 수 있다.
- 관리 화면에서 앱·커밋·환경별 테스트, CI/CD, 배포 버전과 QA 결과 및 원본 증거 링크를 추적한다.
- 결과 조회부터 구현하고, 이후 허용된 앱·테스트 종류에 한해 실행 요청을 지원한다. AI 분석이 없어도 조회·테스트 실행은 동작한다.
- 새 앱은 앱별 테스트와 실행 설정을 제공하여 공통 자동화를 재사용한다. 이를 위해 불필요한 데모 앱을 추가하지 않는다.
- PR 검증과 main 배포 파이프라인이 분리되어 있고, 통과한 변경만 배포한다.
- 소스/공통 패키지 변경 영향에 따라 검증 작업을 효율적으로 수행한다.
- immutable 이미지 태그(커밋 SHA 등)로 빌드부터 OCI 배포까지 추적한다.
- 배포 후 운영 안전 Smoke Test와 격리된 변경 테스트를 수행한다.
- CI 실패 분석 / 테스트 누락 제안 / 배포 후 오류 분석을 동일한 에이전트 도구의 독립 기능으로 제공한다.
- AI 결과의 신뢰도를 알려진 실패 케이스와 비교·측정하고 허위 성공 판정을 허용하지 않는다.

## F. 운영/비용 제약

- OCI Always Free를 목표로 하나 **실제 할당 가능 여부·요금·회수 정책·ARM64 호환성은 별도 확인**.
- 별도 유료 LLM API 사용 금지(사용자의 명시적 승인 없는 한). CLI를 설치했다고 로컬 GPU/CPU에서 LLM 추론이 수행되는 것은 아니다.
- OCI에 Codex CLI를 배치할 경우 ChatGPT 계정 인증/토큰 갱신/사용량 제한/자동 실행 적합성을 PoC로 검증한다.
- GitHub 저장소가 공개라는 이유만으로 OCI 서버 인증 정보가 공개되는 것은 아니며, 위험은 실제 토큰 보관·권한·외부 코드 실행 경로에 좌우된다.
- Windows PC와 Linux PC를 번갈아 사용하는 개발 환경을 지원한다. CI의 Linux 검증이 공통 기준이다.

## G. 아직 하지 않았다고 간주할 것

현재 파일 기준으로 pnpm/Turborepo 설정과 두 프론트엔드의 기본 화면, 두 서버의 폴더 구조가 있다. 서버에는 `package.json`과 실행 코드가 없고, 폴더는 `.gitkeep`으로 추적한다. 서버 패키지 등록·실행, Finance 기능, 테스트 도구, CI/CD, Docker 배포, 실제 결과 연동과 AI 분석은 미구현이다.

OCI 인스턴스 확보, Drizzle과 `node:sqlite`의 버전 호환성, Windows 및 Linux/ARM64 실행, Codex 원격 무인 실행과 성과 측정은 실제 증거를 확인하기 전까지 검증 완료로 표시하지 않는다. 의존성 폴더나 설정 파일의 존재만으로 실행·빌드 성공을 보장하지 않는다.

## H. 플랫폼 관리 화면의 범위

관리 화면은 GitHub Actions 결과 목록을 복제하는 대신, 동일 앱·커밋의 CI → 배포 버전 → 배포 후 QA → 분석 근거를 연결한다. 첫 관리 대상은 Finance App이다.

- 1차: 앱 목록/상세, 실행 이력, 검사·배포·QA 상태와 원본 로그/Artifact 링크 조회.
- 2차: 앱·환경·테스트 종류를 선택하는 수동 테스트 실행 요청과 진행 상태 조회.
- 이후: 공통 실행 계약에 맞춘 앱 추가, 선택적인 AI 분석 표시.
- 초기 제외: 코드 저장·PR 관리 구현, 범용 CI 실행 엔진, 임의 셸 명령 입력, 화면에서 운영 배포·롤백 실행, 외부 저장소의 범용 온보딩.

세부 구조와 실행 경계는 `ARCHITECTURE.md` 8절을 따른다. 관리 화면은 `apps/platform-web`에 정적 기본 뼈대만 구현했다. 실제 결과 조회·실행 요청과 API는 아직 구현하지 않았다.

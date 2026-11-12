# DevFlowOps

> **AI-assisted Frontend Development & Delivery Platform**
>
> An AI-assisted frontend development platform that automates testing, CI/CD, deployment, and quality assurance.

## 프로젝트 소개

DevFlowOps는 개발 → 검증 → 빌드 → 배포 → 배포 후 품질 검증 → 피드백을 표준화하고 자동화하는 프론트엔드 개발 플랫폼이다. AI는 품질 분석을 보조하는 구성 요소이며, Finance App을 첫 검증 대상으로 사용한다.

목표 직무는 Frontend Platform Engineer / Developer Productivity Engineer다. 프로젝트의 배경과 범위는 [프로젝트 컨텍스트](docs/PROJECT_CONTEXT.md), 현재 구현과 미구현 사항은 [개발 진행 현황](docs/DEVELOPMENT_STATUS.md)에서 확인한다. 설계 문서의 내용이 구현 완료를 의미하지는 않는다.

## 작업 시작

Node.js와 pnpm은 루트 [package.json](package.json)과 [.nvmrc](.nvmrc)의 고정 버전으로 준비한다. OS별 설치 절차와 앱별 실행 명령은 [개발 가이드](docs/DEVELOPMENT_GUIDE.md#3-새-환경-설치-및-현재-명령)를 따른다.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

포털은 `http://localhost:5174`, Finance는 Vite가 출력하는 주소로 접속한다. 서버의 실행·API·DB 설정은 [Finance 서버 안내](apps/finance-server/README.md)를 참고한다.

## 문서 안내

문서별 기준 정보와 갱신 규칙은 [AGENTS.md](AGENTS.md#문서별-기준과-갱신-규칙)를 따른다. README는 프로젝트 소개와 시작 경로를 제공하며, 결정 목록과 구현 상태를 별도로 복제하지 않는다.

- [프로젝트 컨텍스트](docs/PROJECT_CONTEXT.md): 배경, 목표, 도메인과 범위.
- [결정 기록](docs/DECISIONS.md): 확정·추천·미확정·검증 필요 항목과 결정 이력.
- [기술 선택 이유](docs/TECH_STACK.md): 선택 근거와 감수할 제약.
- [아키텍처](docs/ARCHITECTURE.md): 구성 요소의 책임, 데이터 흐름과 실행 경계.
- [AI 분석 계약](docs/AI_QUALITY_AGENT.md): 분석 입력·출력, 실행 단계와 평가 기준.
- [로드맵](docs/ROADMAP.md): 구현 순서와 단계별 완료 기준.
- [개발 가이드](docs/DEVELOPMENT_GUIDE.md): 환경 준비, 작업 절차, 다국어 작업과 검증 기록.
- [개발 진행 현황](docs/DEVELOPMENT_STATUS.md): Finance와 포털의 현재 단계·구현·미구현 사항.
- [React 학습 가이드](docs/REACT_FOR_VUE_DEVELOPERS.md): Vue 경험을 React에 연결하는 학습 예제.

## AI와 작업 시작

저장소 루트의 `AGENTS.md`를 먼저 읽고, 위 문서 중 작업에 필요한 기준 문서와 실제 파일을 확인한다. 이전 대화의 맥락은 저장소 문서로 전달한다.

```text
AGENTS.md와 관련 기준 문서를 읽고 DevFlowOps의 목표와 작업 제약을 파악해 줘.
DEVELOPMENT_STATUS.md와 실제 파일을 비교해 현재 구현과 목표 설계를 구분해 줘.
미확정 기술을 임의로 결정하지 말고 요청 범위에 맞는 최소 변경을 진행해 줘.
```

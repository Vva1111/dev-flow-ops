# ROADMAP — DevFlowOps 단계별 구현 계획

> 약 6~8주 이상을 가정한 **우선순위 제안**. 일정은 확약이 아니다. 핵심은 실행 가능한 수직 슬라이스와 측정 가능한 결과다.

## Milestone 0 (1주차부터 병행): 위험 요소 사전 검증

- [ ] OCI Always Free A1 생성 가능/요금/가용 리전 확인.
- [ ] GitHub Actions → GHCR → ARM64 이미지 배포 가능성 검토.
- [ ] 원격 Linux에서 Codex CLI ChatGPT 구독 로그인 및 `codex exec` 비대화형 실행 테스트.
- [ ] OCI 계정 인증 정보 보호/토큰 만료/재시작·재로그인 영향 검증.
- [ ] 인증이나 OCI 가용성이 막혀도 개발·CI·테스트를 진행할 대안 수립.

**완료 기준:** PoC 결과가 성공/실패/제약으로 명시되어 있고 가정이 아닌 사실로 기록됨.

## Week 1 — 저장소와 개발 기반

- [ ] `DevFlowOps` 명칭으로 GitHub 프로젝트 정리.
- [ ] pnpm workspace, Turborepo, React TS Vite 앱 초기화.
- [ ] Node/pnpm 버전 및 공통 lint/typecheck/build 명령어 정리.
- [ ] README, AGENTS.md와 아키텍처 결정 문서 정리.

**완료 기준:** 새 PC에서 의존성을 설치하고 앱을 로컬에서 실행·빌드할 수 있다.

## Week 2 — Finance App API 및 도메인

- [ ] API 프레임워크와 ORM 최종 결정(현재 추천: Fastify/Drizzle).
- [ ] SQLite 스키마 및 마이그레이션 정의.
- [ ] Transaction/Category API와 집계 함수.
- [ ] 월말/연말/CRUD 통계 로직에 대한 테스트.

**완료 기준:** API와 도메인 테스트가 재현 가능하게 실행된다.

## Week 3 — Finance App UI

- [ ] Dashboard: 수입/지출/잔액, 기간별 지출, 카테고리 통계.
- [ ] Transaction: 등록/수정/삭제, 필터/정렬/페이지네이션.
- [ ] Category: 생성/수정/거래 연결.
- [ ] 필요한 공용 UI 또는 도메인 유틸만 패키지로 분리.

**완료 기준:** 핵심 사용자 흐름이 로컬 환경에서 작동한다. 이때부터 구현 증거를 공개하고 구직 활동을 병행할 수 있다.

## Week 4 — 결정론적 테스트와 PR CI

- [ ] Vitest, Playwright 시나리오 작성.
- [ ] 테스트용 SQLite DB/시드 데이터 분리.
- [ ] GitHub Actions에서 PR lint/typecheck/unit/E2E/build 검증.
- [ ] Turborepo 의존성/변경 영향 실행 및 캐시 효과를 측정할 기초 수치 기록.

**완료 기준:** 의도적으로 버그를 넣으면 PR CI가 실패한다.

## Week 5 — GHCR / OCI 배포 자동화

- [ ] production Dockerfile 및 ARM64 빌드.
- [ ] GHCR 이미지 발행과 SHA 태깅.
- [ ] OCI 호스트 Docker Compose, SQLite 영속 볼륨, HTTPS, 접근 통제 및 백업.
- [ ] main 배포 자동화, health check 및 읽기 전용 Smoke Test.

**완료 기준:** 검증된 main 변경이 버전 추적 가능한 배포로 연결된다.

## Week 6 — QA 오케스트레이터 (AI 없이 먼저)

- [ ] 독립 실행 CLI(Collector/Runner/Reporter) 작성.
- [ ] 배포 이벤트로 안전하게 실행되는 일회성 QA 작업 구축.
- [ ] Playwright/Smoke 테스트 결과, 트레이스 및 메타데이터 수집.
- [ ] JSON + Markdown 결과 보고서 생성.

**완료 기준:** Codex가 중단되어도 QA 리포트를 생성할 수 있다.

## Week 7 — AI 분석 기능

- [ ] CI 실패 로그를 모아 원인 후보를 제안하는 Analyzer 구현(최우선 AI 기능).
- [ ] Git Diff / 영향도 기반 테스트 누락 시나리오 제안.
- [ ] 배포 후 테스트 실패에 대한 추가 AI 분석 연결.
- [ ] Codex CLI 인증 실패와 사용량 제한 시 정상적인 fallback 구현.

**완료 기준:** 알려진 실패 사례를 AI로 진단하고 보고서에 근거와 실패/미실행 상태를 기록한다.

## Week 8 — 검증·정량화·포트폴리오

- [ ] PR 검증/배포 소요시간 측정.
- [ ] 공통 패키지 변경에 대한 의존성 기반 테스트 실행 동작 및 시간 비교.
- [ ] AI 원인 진단 유효성/허위 제안/시간 절감 측정.
- [ ] 아키텍처, 기술 선택, 보안, 운영 Runbook, 장애 대응 정리.
- [ ] 전체 흐름을 재현하는 데모/스크린샷/README 제공.

**완료 기준:** 다른 개발자가 이 저장소의 설계 근거와 동작·한계를 확인할 수 있다.

## 첫 구현에서 하지 않을 것

- 단지 모노레포 시연을 위한 두 번째 앱.
- 무인 AI 코드 수정/PR merge/운영 자동 롤백.
- 실제 금융 계정 자동 연동이나 복잡한 인증 체계.
- 사용자의 승인 없는 별도 유료 AI API.
- 검증되지 않은 성능/비용/개선 수치의 성과 주장.

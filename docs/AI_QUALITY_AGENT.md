# AI_QUALITY_AGENT — 분석 도구의 역할과 구현 계약

## 1. 역할 정의

Quality Agent는 DevFlowOps 전체 중 **AI 보조 품질 분석 모듈**이다. 프로젝트의 핵심은 개발 → 검증 → 배포 → 품질 피드백의 전체 자동화다.

**실행 파이프라인의 신뢰 원천:** GitHub Actions, Vitest, Playwright, 배포 Health Check. **AI 역할:** 근거 기반 진단, 테스트 보완 시나리오 제안, 반복 분석 작업의 단축.

## 2. 단계별 기능

### Feature A: CI Failure Analyzer — 1순위 AI 기능

**트리거:** GitHub Actions CI 실패. 배포가 성공했을 것을 전제로 하지 않는다.

- 입력: commit SHA, 실패 job/step, 제한된 로그, 관련 Git Diff, 테스트 아티팩트/환경 정보.
- 출력: 오류 범주, 가능한 원인 순위, 확인할 사실, 수정 권고, 근거 로그의 위치.
- 방어: 로그에 포함된 토큰/개인정보 제거, 로그 길이 제한, 신뢰하지 않는 PR의 권한 분리.
- 구현 난점: 실패 로그를 OCI Agent로 전달하거나 Agent가 GitHub에서 가져오는 방법(권한/인증/비용/트리거)을 설계해야 한다.

### Feature B: Change Impact & Test Gap Analyzer — 2순위 AI 기능

**트리거:** 변경된 코드/PR 분석 또는 수동 실행.

- 정적: Git Diff + pnpm/Turbo 의존성으로 영향 패키지/실행해야 할 테스트를 결정.
- AI: 기존 테스트가 놓친 위험/경계 조건을 제안한다.
- 출력: 관련 기능, 기존 테스트, 빠진 시나리오, 추가할 테스트 아이디어, 근거.
- 예시: 월별 지출 집계 변경 시 월말·연말 경계, 카테고리 이동, 거래 삭제 후 합계 반영 등.
- 안전: AI가 필수 테스트를 임의로 생략하거나 테스트 실패를 무시하도록 하지 않는다.

### Feature C: Post-deployment Quality Analyzer — 3순위 AI 기능

**트리거:** OCI 배포 성공(배포된 커밋 버전 전달 필수).

- 운영 앱: 데이터 변경 없는 최소 Smoke Test.
- 격리된 테스트 앱/DB: 등록·수정·삭제 등 전체 E2E.
- 증거: Playwright JSON/JUnit, Trace, 콘솔 오류, 스크린샷(필요 시), 환경/버전 정보.
- AI: 실패 원인 후보와 추가 검증 제안. 정상 여부는 실제 테스트 결과를 따른다.

## 3. 실행 단계(권장)

```text
Collect (GitHub/Deploy metadata, diff, log)
  -> Select (deterministic baseline tests)
  -> Run (Vitest/Playwright / production-safe smoke)
  -> Capture (structured status, bounded evidence)
  -> Analyze (Codex CLI via subscription sign-in if validated)
  -> Report (JSON + Markdown linked to commit)
  -> Human feedback / next change
```

**분석 결과 형식 예시(미구현 계약 초안)**

```json
{
  "schemaVersion": "0.1-draft",
  "commitSha": "<sha>",
  "source": "ci_failure | change_analysis | post_deploy",
  "testStatus": "pass | fail | not_run",
  "aiStatus": "success | unavailable | failed",
  "findings": [
    {
      "category": "possible_root_cause",
      "summary": "...",
      "evidence": ["test-artifacts/logs.txt:line 22"],
      "suggestedChecks": ["..."]
    }
  ]
}
```

위 JSON은 **구현 규약 초안**이며 실제 결과가 아니다. `testStatus`와 `aiStatus`는 서로 독립적이다.

## 4. CLI 사용 형태(인터페이스 아이디어, 아직 미구현)

```bash
pnpm ai:quality --mode=ci-failure --run-id=<github-actions-run-id>
pnpm ai:quality --mode=change-impact --base=origin/main
pnpm ai:quality --mode=post-deploy --url=https://example.invalid
```

CLI가 독립 실행 가능하도록 만들고, 로컬 및 OCI에서 같은 로직을 재사용한다. 위 스크립트는 아직 존재하지 않을 수 있으므로 동작을 가정하지 않는다.

## 5. Codex CLI 인증과 비용

- 별도의 OpenAI API 키를 사용하지 않고 ChatGPT 구독 로그인 경로를 먼저 검증하는 것이 사용자 선택이다.
- Codex CLI는 OCI CPU에서 언어 모델을 자체 추론하는 방식이 아니다. 외부 모델 서비스를 이용한다.
- Codex CLI 비대화형 실행(`codex exec`)의 인증 지속성, 재로그인, 토큰 갱신, ARM64/운영 OS 호환성, 사용량·서비스 약관은 PoC 대상으로 남겨 둔다.
- 무인 실행이 불가능하거나 제약이 크면 AI 없는 테스트 자동화를 유지하고 제약을 문서화한다. 별도 유료 API는 사용자가 승인하기 전까지 구현하지 않는다.

## 6. 품질 검증과 성공 기준

- 적어도 몇 가지 알려진 오류 사례(집계 버그, 월경계, 필터/페이지네이션, CI dependency 오류, Docker 빌드 실패 등)를 별도 시험 케이스로 준비한다.
- AI 분석이 실제로 원인 발견에 도움 되었는지, 근거 없는 제안을 했는지, 평균 분석 소요가 얼마나 걸렸는지 평가한다.
- AI만으로 프로덕션 코드를 수정·병합·재배포하거나 DB를 변경하지 않는다.
- 분석 실패 시에도 결정론적 결과와 로그/아티팩트가 보존된다.

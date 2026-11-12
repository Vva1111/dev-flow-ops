# Platform Server

관리 포털의 HTTP API, GitHub 연동과 실행 결과 수집·연결을 담당하는 백엔드 서버의 폴더 구조다. Hono와 Node.js를 사용하며 Finance의 금융 데이터 처리와 책임을 분리한다.

이 경로의 현재 단계와 구현·미구현 사항은 [개발 진행 현황](../../docs/DEVELOPMENT_STATUS.md#포털)을 따른다. 아래는 서버가 맡을 코드의 배치 기준이며 실행 가능한 패키지 목록이 아니다.

```text
platform-server/
└── src/
    ├── routes/                # 앱 현황·실행 이력 조회 등 HTTP API
    ├── integrations/
    │   └── github/            # GitHub API·Actions 연동 코드
    └── results/               # CI·배포·QA 결과 수집과 메타데이터 연결 코드
```

`results/`는 처리 코드를 둘 위치이며 실제 로그·Artifact·DB 파일의 저장 디렉터리가 아니다. Finance 금융 데이터와 플랫폼 실행 메타데이터의 책임을 구분한다.

상세 책임과 공통 QA 도구와의 경계는 [아키텍처](../../docs/ARCHITECTURE.md#8-플랫폼-관리-화면과-앱별-실행-구조), 도입 순서는 [로드맵](../../docs/ROADMAP.md#추가-단계-a--플랫폼-관리-화면-결과-조회), 인증·저장·배포의 결정 상태는 [결정 기록](../../docs/DECISIONS.md#미확정--추천)을 따른다.

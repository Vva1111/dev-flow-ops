# Platform Server

관리 포털의 HTTP API, GitHub 연동과 실행 결과 수집·연결을 담당하는 백엔드 서버의 폴더 구조다. Hono와 Node.js를 사용하며 Finance의 금융 데이터 처리와 책임을 분리한다.

현재는 폴더와 빈 디렉터리 추적용 `.gitkeep`만 준비했다. `package.json`, 실행 코드와 의존성 설치는 없으며 아직 pnpm/Turborepo에서 실행 가능한 워크스페이스 패키지가 아니다.

```text
platform-server/
└── src/
    ├── routes/                # 앱 현황·실행 이력 조회 등 HTTP API
    ├── integrations/
    │   └── github/            # GitHub API·Actions 연동 코드
    └── results/               # CI·배포·QA 결과 수집과 메타데이터 연결 코드
```

- 결과 조회를 먼저 구현하고, 제한된 테스트 실행 요청은 인증·권한과 실행 경계를 설계한 뒤 추가한다.
- `results/`는 처리 코드를 둘 위치이며 실제 로그·Artifact·DB 파일의 저장 디렉터리가 아니다.
- 실행 이력 저장 방식과 인증, GitHub 동기화, 앱 등록 계약은 미확정이다. DB·마이그레이션·데이터 폴더는 저장 방식을 정한 뒤 추가한다.
- Finance의 운영 DB를 실행 결과 저장소로 사용하지 않는다. 금융 데이터는 `finance-server`가 소유한다.
- QA 실행·수집·보고의 공통 로직은 구현 시 공통 도구와 재사용하며 플랫폼 서버에 중복 구현하지 않는다.
- 서버 컨테이너와 배포 구성은 미확정이다. Finance와 포털 프론트엔드는 각각의 Nginx로 별도 배포하는 방향을 선택했으며, 서버 컨테이너의 상세 구성은 별도 설계한다.

상세 책임은 [아키텍처](../../docs/ARCHITECTURE.md)를 따른다.

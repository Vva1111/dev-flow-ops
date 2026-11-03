# Finance Server

Finance 앱의 HTTP API, 비즈니스 로직, DB 접근과 마이그레이션을 관리하는 백엔드 서버의 폴더 구조다. 선택한 기술은 Hono, Node.js, Drizzle ORM, Node.js 내장 `node:sqlite`, SQLite다.

현재는 폴더와 빈 디렉터리 추적용 `.gitkeep`만 준비했다. `package.json`, 실행 코드, 스키마와 마이그레이션 파일은 작성하지 않았으며 의존성도 설치하지 않았다. 따라서 아직 pnpm/Turborepo에서 실행할 수 있는 워크스페이스 패키지가 아니다.

```text
finance-server/
├── src/
│   ├── routes/      # 거래·카테고리 등 HTTP API
│   └── db/          # Drizzle 스키마와 node:sqlite 연결 코드
├── migrations/     # DB 구조 변경 기록을 둘 위치
└── data/           # 로컬 개발용 DB 위치, DB 파일은 Git 제외
```

- 운영 DB는 소스 코드나 이미지에 포함하지 않고 별도 영속 볼륨에 보관한다.
- 테스트는 운영 DB와 분리된 DB·환경을 사용한다. 테스트 DB의 구체적인 경로는 구현 시 정한다.
- 마이그레이션 도구·실행 절차와 서버 컨테이너·배포 구성은 미확정이다. Finance와 포털 프론트엔드는 각각의 Nginx로 별도 배포하는 방향을 선택했다.
- Finance의 API·DB 구현은 이 앱이 소유한다. 프론트엔드는 HTTP로 API를 호출하며 DB에 직접 접근하지 않는다.

선택 이유는 [기술 선택 문서](../../docs/TECH_STACK.md), 관리 구조는 [아키텍처](../../docs/ARCHITECTURE.md)를 따른다.

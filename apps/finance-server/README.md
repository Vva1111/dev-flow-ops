# Finance Server

Finance 앱의 HTTP API, 비즈니스 로직, DB 접근과 마이그레이션을 관리하는 백엔드 서버다. Hono, Zod와 Drizzle ORM, Node.js 내장 `node:sqlite`, SQLite로 수입·지출 API를 구성했다. 버전 선택은 [결정 기록](../../docs/DECISIONS.md), 실제 의존성은 이 패키지의 `package.json`과 루트 lockfile을 따른다.

## 실행

저장소 루트에서 실행한다. Node.js와 pnpm 버전은 루트의 고정 설정을 따른다.

```bash
pnpm install --frozen-lockfile
pnpm dev-finance
```

`pnpm dev-finance`는 Finance 화면과 서버를 함께 실행한다. 서버만 실행하려면 `pnpm dev-finance-server`를 사용한다. 서버는 로컬 `http://127.0.0.1:3001`에서 실행되며, 포트가 사용 중이면 다른 포트로 전환하지 않고 오류를 출력한다. 개발 중 소스 변경은 `node --watch`가 감지해 서버를 재시작한다.

`GET /api/health`는 `{"status":"ok","service":"finance-server"}`를 반환한다. 이 경로는 서버 프로세스의 응답 여부를 확인하며 DB 연결 상태를 의미하지 않는다. Finance Vite 개발 서버의 `/api` 요청은 이 서버로 전달한다. 배포용 프록시는 별도 구성한다.

빌드와 빌드 결과 실행 명령은 다음과 같다.

```bash
pnpm --filter @devflowops/finance-server build
pnpm --filter @devflowops/finance-server start
```

개발 중에는 Node.js 내장 TypeScript 실행 기능을 사용하고, 빌드는 `tsc`가 JavaScript를 `dist/`에 생성한다. 소스의 상대 import에는 `.ts` 확장자를 쓰며 빌드 시 `.js`로 바꾼다. Node.js가 직접 제거할 수 있는 타입 문법만 사용한다. 개발 실행 자체는 타입 검사를 수행하지 않는다.

```bash
pnpm --filter @devflowops/finance-server lint
pnpm --filter @devflowops/finance-server typecheck
```

## API와 Swagger UI

서버 실행 후 `http://127.0.0.1:3001/api/docs`에서 API 명세를 확인하고 요청을 보낼 수 있다. Finance 개발 서버 주소의 `/api/docs`도 같은 경로로 전달된다. `/api/openapi.json`은 Zod 요청·응답 스키마와 라우트 정의에서 생성한 OpenAPI 명세다. Swagger UI의 CSS와 JavaScript는 미들웨어 기본 CDN에서 불러오므로 브라우저의 인터넷 연결이 필요하다. 외부 명세 검증 서비스 호출은 비활성화했다.

| 메서드 | 경로 | 동작 |
|---|---|---|
| GET | `/api/health` | 서버 응답 확인 |
| GET | `/api/transactions` | 날짜·ID 내림차순 전체 목록 조회 |
| GET | `/api/transactions/{id}` | 단건 조회 |
| POST | `/api/transactions` | 등록, 성공 시 201 |
| PATCH | `/api/transactions/{id}` | 전달한 항목만 수정 |
| DELETE | `/api/transactions/{id}` | 삭제, 성공 시 본문 없이 204 |

등록 요청 예시:

```json
{
  "type": "expense",
  "amount": 12000,
  "date": "2026-11-10",
  "description": "점심 식사",
  "category": "식비"
}
```

- `type`은 `income` 또는 `expense`다. 이체는 아직 지원하지 않는다.
- `amount`는 1부터 `Number.MAX_SAFE_INTEGER`까지의 원 단위 정수다.
- `date`는 실제로 존재하는 `YYYY-MM-DD` 날짜이며 시간대 변환 없이 저장한다.
- `description`은 앞뒤 공백을 제거한 1~200자, `category`는 1~50자다. 등록할 때 카테고리를 생략하면 `미분류`로 저장한다.
- 목록 응답은 `{ "data": [...] }`, 등록·단건 조회·수정 응답은 거래 객체다.
- 잘못된 입력은 400, 존재하지 않는 거래는 404, 내부 처리 실패는 500이다. 오류는 `error.code`, `error.message`와 필요한 경우 `error.details`로 반환한다.
- 빈 수정 요청과 정의하지 않은 입력 항목은 거절한다. 카테고리 관리, 필터·페이지네이션과 집계 API는 구현 전이다.

## DB와 마이그레이션

기본 DB는 `apps/finance-server/data/finance.db`다. 현재 작업 디렉터리와 관계없이 서버 패키지를 기준으로 경로를 정한다. `FINANCE_DB_PATH` 환경변수로 별도 경로를 지정할 수 있으며, 상대 경로는 서버 패키지 기준이다. `:memory:`도 지원한다. DB 파일은 Git에서 제외한다. 잠금 대기는 5초이며 저널 모드는 별도로 변경하지 않는다. 초기 DB에 샘플 내역을 자동으로 넣지 않으며 빈 DB의 목록은 비어 있다.

서버 시작 시 버전별 SQL 마이그레이션을 트랜잭션 안에서 적용하고 SQLite의 `user_version`으로 적용 상태를 관리한다. 현재 버전은 1이며 재시작 시 이미 적용한 SQL은 건너뛴다. 실패하면 롤백하고 서버 시작을 중단한다. DB 버전이 서버의 지원 버전보다 높으면 서버 시작을 중단한다. Drizzle Kit은 도입하지 않았으며 SQL 파일과 Drizzle 테이블 정의를 함께 관리한다.

화면 연결과 후속 기능의 구현 상태는 [개발 진행 현황](../../docs/DEVELOPMENT_STATUS.md)을 따른다. 공개 운영의 접근 제한과 배포 구성은 [결정 기록](../../docs/DECISIONS.md#미확정--추천)을 확인한다.

## 내부 구조

```text
finance-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── app.ts                     # 앱 구성, 오류 처리와 API 문서
│   ├── index.ts                   # DB 연결과 HTTP 서버 실행·종료
│   ├── routes/
│   │   ├── transactions.contract.ts  # 요청·응답 스키마와 라우트 명세
│   │   └── transactions.ts           # 수입·지출 CRUD 처리
│   └── db/
│       ├── client.ts              # SQLite 연결, Drizzle 구성과 DB 경로
│       ├── schema.ts              # 거래 테이블과 제약조건
│       └── migrations.ts          # SQL 적용과 버전 관리
├── migrations/
│   └── 0001_transactions.sql      # 거래 테이블 생성
└── data/                         # 로컬 DB 위치, 실제 DB는 Git 제외
```

`createApp(db)`는 전달받은 DB로 라우트를 구성하며, 모듈을 가져오는 것만으로 DB 파일을 만들거나 포트를 열지 않는다. `index.ts`가 DB를 열고 앱을 생성한 뒤 HTTP 서버를 시작하며, 종료 시 DB도 닫는다. 빌드 결과를 별도 위치에 배치할 때에는 `dist/`뿐 아니라 서버 패키지의 `migrations/` SQL 파일도 함께 제공해야 한다.

API 응답 스키마는 명세 생성과 타입 계약에 사용하며 실제 응답의 런타임 검증은 별도로 구현하지 않았다. 현재 실행한 검사와 남은 검증은 [개발 가이드](../../docs/DEVELOPMENT_GUIDE.md#6-현재-검증-상태)를 따른다.

- 운영 DB는 소스 코드나 이미지에 포함하지 않고 별도 영속 볼륨에 보관한다.
- 테스트는 운영 DB와 분리된 DB·환경을 사용한다. 테스트 DB의 구체적인 경로는 구현 시 정한다.
- 서버 컨테이너와 네트워크의 책임 경계는 [아키텍처](../../docs/ARCHITECTURE.md#5-oci-런타임의-분리)를 따른다.
- Finance의 API·DB 구현은 이 앱이 소유한다. 프론트엔드는 HTTP로 API를 호출하며 DB에 직접 접근하지 않는다.

선택 이유는 [기술 선택 문서](../../docs/TECH_STACK.md), 관리 구조는 [아키텍처](../../docs/ARCHITECTURE.md)를 따른다.

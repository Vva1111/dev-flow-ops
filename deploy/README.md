# Compose 배포 초안

`compose.yaml`은 Finance 웹·서버와 포털 웹의 배포 골격이다. 이미지 빌드·공개 운영·자동 배포는 아직 연결하지 않았다.

- `FINANCE_WEB_IMAGE`, `FINANCE_SERVER_IMAGE`, `PLATFORM_WEB_IMAGE`에 실제 이미지의 커밋 태그 또는 digest를 환경변수로 지정한다. 이미지가 준비되지 않은 상태에서 예시 값을 넣고 기동하지 않는다.
- 웹 이미지에는 빌드된 정적 파일과 Nginx가 필요하다. Finance 웹의 `/api`는 `finance-server:3001`로 전달하도록 이미지에 설정해야 한다. SPA 경로 처리도 이미지 구성 단계에서 추가한다.
- 현재 Finance API는 `127.0.0.1:3001`로만 수신한다. 컨테이너 간 통신을 위해 서버 수신 주소를 구성 가능하게 변경하고 이미지에 반영해야 한다. Compose의 expose만으로 수신 주소가 바뀌지는 않는다.
- 웹 포트는 호스트의 `127.0.0.1:8080`과 `127.0.0.1:8081`에만 연결한다. 공개 접근은 HTTPS와 접근 제한을 정한 뒤 별도 연결한다. API 포트는 호스트에 공개하지 않는다.
- SQLite는 `finance-data` 볼륨의 `/data/finance.db`에 저장한다. 초기에는 데모 데이터만 사용하며 볼륨을 지우는 `down --volumes`는 데이터를 삭제하므로 사용하지 않는다. 백업·복원과 배포 시 마이그레이션 절차는 후속 작업이다.
- Finance와 포털은 별도 네트워크를 사용한다. platform-server는 실행 코드가 없어 포함하지 않았다. depends_on은 시작 순서만 정하며 API 준비 완료를 보장하지 않는다.

저장소 루트에서 실제 이미지 환경변수를 준비한 뒤 구성을 확인한다.

```bash
docker compose -f deploy/compose.yaml config --quiet
```

실제 기동은 이미지와 위 실행 조건을 준비한 뒤 진행한다. [Docker Compose 서비스 정의](https://docs.docker.com/reference/compose-file/services/)를 기준으로 작성했다.

SSH 접속 정보 등록과 배포 준비 순서는 [개발 가이드](../docs/DEVELOPMENT_GUIDE.md#12-oci-ssh-배포-준비), DB 저장 방향은 [결정 기록](../docs/DECISIONS.md#2026-11-14--compose와-db-저장-방향)을 따른다.

import './App.css'

const stages = [
  { name: '테스트 검증', detail: 'Vitest 단위 테스트 · Playwright E2E', status: '미실행' },
  { name: 'CI', detail: 'GitHub Actions 검사 · 빌드', status: '미연결' },
  { name: '배포', detail: 'GHCR 이미지 · OCI 배포 버전', status: '미연결' },
  { name: '배포 후 QA', detail: '읽기 전용 Smoke · 격리 환경 E2E', status: '미실행' },
]

export default function App() {
  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="app-label">DevFlowOps · Developer Portal</p>
          <h1>개발 · 검증 · 배포 포털</h1>
          <p>앱별 테스트부터 CI/CD, 배포 후 품질 검증까지 한곳에서 추적합니다.</p>
        </div>
        <span className="badge">초기 구성 · 데이터 미연결</span>
      </header>

      <nav aria-label="포털 메뉴">
        <a href="#applications">관리 앱</a>
        <a href="#pipeline">검증 및 배포</a>
        <a href="#runs">실행 이력</a>
      </nav>

      <section id="applications" aria-labelledby="applications-title">
        <h2 id="applications-title">관리 앱</h2>
        <article className="panel app-card">
          <div>
            <p className="app-label">첫 번째 검증 대상</p>
            <h3>Finance App</h3>
            <p>개인 금융 관리 앱 · React + TypeScript + Vite</p>
            <code>@devflowops/finance-web</code>
          </div>
          <dl>
            <div><dt>커밋</dt><dd>수집 전</dd></div>
            <div><dt>배포 환경</dt><dd>미연결</dd></div>
            <div><dt>배포 버전</dt><dd>수집 전</dd></div>
          </dl>
        </article>
      </section>

      <section id="pipeline" aria-labelledby="pipeline-title">
        <h2 id="pipeline-title">검증 및 배포</h2>
        <p>동일 앱·커밋·환경의 결과를 연결할 영역입니다. 실제 실행 결과는 아직 수집하지 않습니다.</p>
        <div className="stage-grid">
          {stages.map((stage) => (
            <article className="panel" key={stage.name}>
              <span className="badge">{stage.status}</span>
              <h3>{stage.name}</h3>
              <p>{stage.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="runs" aria-labelledby="runs-title">
        <div className="section-header">
          <h2 id="runs-title">실행 이력</h2>
          <button type="button" disabled aria-describedby="run-help">테스트 실행 요청</button>
        </div>
        <p id="run-help">실행 요청은 결과 조회 연동과 인증·권한 설계 후 제공할 예정입니다.</p>
        <div className="panel empty-state">
          <h3>수집된 실행 이력이 없습니다</h3>
          <p>GitHub Actions와 QA 결과를 연결하면 커밋, 환경, 검사 결과와 원본 로그·Artifact 링크를 표시합니다.</p>
        </div>
      </section>

      <footer>
        <p>AI 분석: 미연결 · 테스트 및 CI/CD 결과와 별도로 표시할 예정입니다.</p>
      </footer>
    </main>
  )
}

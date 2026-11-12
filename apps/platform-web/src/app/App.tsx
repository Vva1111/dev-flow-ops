import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher'
import { applications } from './applications'
import './App.css'

export default function App() {
  const { t } = useTranslation()
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const selectedApp = applications.find((application) => application.id === selectedAppId)

  const stages = [
    { name: t('pipeline.test.title'), detail: t('pipeline.test.description') },
    { name: 'CI', detail: t('pipeline.ci.description') },
    { name: t('pipeline.deployment.title'), detail: t('pipeline.deployment.description') },
    { name: t('pipeline.qa.title'), detail: t('pipeline.qa.description') },
  ]

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="app-label">DevFlowOps · Developer Portal</p>
          <h1>{t('header.title')}</h1>
          <p>{t('header.description')}</p>
        </div>
        <div className="header-controls"><span className="badge">{t('header.status')}</span><LanguageSwitcher /></div>
      </header>

      <nav aria-label={t('navigation.label')}>
        <a href="#applications">{t('apps.title')}</a>
        <a href="#pipeline">{t('pipeline.title')}</a>
        <a href="#runs">{t('runs.title')}</a>
      </nav>

      <section id="applications" aria-labelledby="applications-title">
        <h2 id="applications-title">{t('apps.title')}</h2>
        <p>{t('apps.description')}</p>
        <div className="application-list">
          {applications.map((application) => (
            <article className={`panel app-card${selectedApp?.id === application.id ? ' is-selected' : ''}`} key={application.id}>
              <div>
                <p className="app-label">{t(application.kind)}{selectedApp?.id === application.id && <> · {t('apps.selected')}</>}</p>
                <h3>
                  <button className="app-select" type="button"
                    aria-label={t('apps.selectLabel', { name: application.name })}
                    aria-pressed={selectedApp?.id === application.id}
                    aria-controls="pipeline runs"
                    onClick={() => setSelectedAppId(application.id)}>
                    {application.name}
                  </button>
                </h3>
                <code>{application.workspace}</code>
              </div>
              <dl>
                <div><dt>{t('metadata.commit')}</dt><dd>{t('status.notCollected')}</dd></div>
                <div><dt>{t('metadata.environment')}</dt><dd>{t('status.notConnected')}</dd></div>
                <div><dt>{t('metadata.version')}</dt><dd>{t('status.notCollected')}</dd></div>
              </dl>
            </article>
          ))}
          {applications.length === 0 && (
            <div className="panel empty-state"><p>{t('apps.empty')}</p></div>
          )}
        </div>
      </section>

      <section id="pipeline" aria-labelledby="pipeline-title">
        <h2 id="pipeline-title">{selectedApp ? t('pipeline.appTitle', { name: selectedApp.name }) : t('pipeline.title')}</h2>
        {selectedApp ? (
          <>
            <div className="panel pipeline-context">
              <div>
                <p className="app-label" role="status">{t('apps.selectedLabel', { name: selectedApp.name })}</p>
                <code>{selectedApp.workspace}</code>
                <p>{t('pipeline.unavailable')}</p>
              </div>
              <dl>
                <div><dt>{t('metadata.commit')}</dt><dd>{t('status.notCollected')}</dd></div>
                <div><dt>{t('metadata.environment')}</dt><dd>{t('status.notConnected')}</dd></div>
                <div><dt>{t('metadata.version')}</dt><dd>{t('status.notCollected')}</dd></div>
              </dl>
            </div>
            <div className="stage-grid">
              {stages.map((stage) => (
                <article className="panel" key={stage.name}>
                  <span className="badge">{t('status.resultsNotCollected')}</span>
                  <h3>{stage.name}</h3>
                  <p>{stage.detail}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="panel empty-state"><p>{t('pipeline.selectAppHint')}</p></div>
        )}
      </section>

      <section id="runs" aria-labelledby="runs-title">
        <div className="section-header">
          <h2 id="runs-title">{selectedApp ? t('runs.appTitle', { name: selectedApp.name }) : t('runs.title')}</h2>
          <button type="button" disabled aria-describedby="run-help">{t('runs.request')}</button>
        </div>
        <p id="run-help">{t('runs.requestHelp')}</p>
        <div className="panel empty-state">
          {selectedApp ? (
            <>
              <h3>{t('runs.emptyForApp', { name: selectedApp.name })}</h3>
              <p>{t('runs.integrationHint')}</p>
            </>
          ) : <p>{t('apps.selectFirst')}</p>}
        </div>
      </section>

      <footer>
        <p>{t('analysis.unavailable')}</p>
      </footer>
    </main>
  )
}

import { StatusPill } from '@components/StatusPill';
import { useCurrentYear } from '@hooks/useCurrentYear';
import { useBackendHealth } from './useBackendHealth';

export function HomePage() {
  const currentYear = useCurrentYear();
  const backendHealth = useBackendHealth();

  return (
    <main className="page">
      <section className="shell">
        <div className="hero">
          <StatusPill label="Raise Summit Frontend" />
          <h1 className="title">A clean React base for the summit experience.</h1>
          <p className="subtitle">
            This frontend is wired with Vite, React, TypeScript, and path aliases that match the existing folder
            structure so features, shared components, and hooks stay organized from day one. It also checks the
            FastAPI backend directly from the browser.
          </p>
          <div className="grid">
            <article className="card">
              <h2>Features</h2>
              <p>Keep screens and flows inside <strong>src/features</strong>.</p>
            </article>
            <article className="card">
              <h2>Shared UI</h2>
              <p>Place reusable pieces in the root <strong>components</strong> folder.</p>
            </article>
            <article className="card">
              <h2>Hooks</h2>
              <p>Store reusable logic in the root <strong>hooks</strong> folder.</p>
            </article>
            <article className="card">
              <h2>Backend status</h2>
              <p>{backendHealth.message}</p>
            </article>
          </div>
        </div>
        <div className="footer">
          <span>Ready to connect to the backend API.</span>
          <span>© {currentYear} Raise Summit</span>
        </div>
      </section>
    </main>
  );
}
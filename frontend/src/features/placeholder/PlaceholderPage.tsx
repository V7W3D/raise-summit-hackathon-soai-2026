import { Hammer } from 'lucide-react';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">This section is coming soon.</p>
      <div
        className="card"
        style={{
          marginTop: 28,
          padding: '64px 32px',
          display: 'grid',
          placeItems: 'center',
          gap: 12,
          textAlign: 'center',
        }}
      >
        <span className="icon-tile blue">
          <Hammer />
        </span>
        <h3 className="section-title">Under construction</h3>
        <p style={{ color: 'var(--muted)', maxWidth: 380 }}>
          The {title.toLowerCase()} workspace is on the roadmap. In the meantime, manage your work from Missions and
          Discover.
        </p>
      </div>
    </div>
  );
}

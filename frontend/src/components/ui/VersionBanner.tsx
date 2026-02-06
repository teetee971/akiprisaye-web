import React from 'react';

export type VersionBannerProps = {
  className?: string;
};

export default function VersionBanner({ className }: VersionBannerProps) {
  return (
    <div
      className={className}
      style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '12px 16px',
        margin: '16px auto',
        maxWidth: '520px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#e5e7eb',
      }}
    >
      <strong>Version Client Officielle — Référence publique</strong><br />
      Plateforme publique stable – données ouvertes – transparence garantie<br />
      <a
        href="https://github.com/teetee971/akiprisaye-web/releases/latest"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#60a5fa', textDecoration: 'underline' }}
      >
        Voir la version de référence
      </a>
    </div>
  );
}

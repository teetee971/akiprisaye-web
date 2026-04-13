import React from 'react';

export type VersionBannerProps = {
  className?: string;
};

export default function VersionBanner({ className }: VersionBannerProps) {
  return (
    <div
      className={[
        'mx-auto my-4 max-w-[520px] rounded-xl',
        'border border-slate-700 bg-slate-900',
        'px-4 py-3 text-center text-sm text-gray-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <strong>Version Client Officielle — Référence publique</strong>
      <br />
      Plateforme publique stable – données ouvertes – transparence garantie
      <br />
      <a
        href="https://github.com/teetee971/akiprisaye-web/releases/latest"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 underline"
      >
        Voir la version de référence
      </a>
    </div>
  );
}

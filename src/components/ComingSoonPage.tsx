import React from 'react';
import { Helmet } from 'react-helmet-async';

type ComingSoonPageProps = {
  title: string;
  description: string;
  status?: string;
};

export default function ComingSoonPage({
  title,
  description,
  status = 'En préparation',
}: ComingSoonPageProps) {
  return (
    <>
      <Helmet>
        <title>{`${title} | A KI PRI SA YÉ`}</title>
        <meta name="description" content={description} />
      </Helmet>
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="max-w-xl w-full mx-auto px-6 py-16 text-center">
          <div className="text-4xl mb-4">🛠️</div>
          <h1 className="text-3xl font-bold mb-3">{title}</h1>
          <p className="text-white/70 mb-4">{description}</p>
          <span className="inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-sm text-white/70">
            {status}
          </span>
        </div>
      </div>
    </>
  );
}

import { Helmet } from 'react-helmet-async';
import StorePicker from '../../components/stores/StorePicker';

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-10 pt-24 text-slate-100">
      <Helmet>
        <title>Choisir un magasin | A KI PRI SA YÉ</title>
      </Helmet>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold">Sélectionner mon magasin</h1>
        <p className="mt-1 text-sm text-slate-400">
          Recherchez par ville, code postal ou utilisez votre position.
        </p>
        <div className="mt-6">
          <StorePicker />
        </div>
      </div>
    </div>
  );
}

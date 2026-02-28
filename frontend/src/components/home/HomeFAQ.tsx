import { Link } from 'react-router-dom';

const items = [
  'C’est vraiment gratuit ?',
  'Que faites-vous de mes données ?',
  'Comment garantir la fiabilité ?',
];

export default function HomeFAQ() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">FAQ express</h2>
      <ul className="space-y-2 text-sm text-slate-200">
        {items.map((item) => (
          <li key={item} className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
      <Link to="/faq" className="inline-block text-sm text-emerald-400 hover:text-emerald-300">
        Toutes les questions
      </Link>
    </section>
  );
}

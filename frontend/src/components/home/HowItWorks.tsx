const steps = ['Recherchez ou scannez', 'On compare localement', 'Vous achetez au meilleur prix'];

export default function HowItWorks() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">Comment ça marche</h2>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li
            key={step}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
          >
            <span className="mr-2 text-emerald-400 font-semibold">{index + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}

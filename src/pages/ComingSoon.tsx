type ComingSoonProps = {
  title?: string;
  description?: string;
};

export default function ComingSoon({
  title = 'Bientôt disponible',
  description = 'Cette page arrive bientôt. Revenez très vite.',
}: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto px-6 py-16 text-center">
        <div className="text-4xl mb-4">🛠️</div>
        <h1 className="text-3xl font-bold mb-3">{title}</h1>
        <p className="text-white/70">{description}</p>
      </div>
    </div>
  );
}

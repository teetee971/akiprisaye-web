export default function EmptyState({ icon = "📭", message = "Aucun résultat" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-lg text-slate-400">{message}</p>
    </div>
  );
}

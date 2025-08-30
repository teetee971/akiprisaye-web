export default function FeatureCard({ icon, title, description, href }) {
  return (
    <a href={href} className="card p-6 hover:scale-[1.01] transition block focus:outline-none focus:ring-2 focus:ring-brand-500/50">
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-white/70 mt-1 text-sm">{description}</p>
        </div>
      </div>
    </a>
  )
}
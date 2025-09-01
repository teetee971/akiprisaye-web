export default function Card({title, children, footer}) {
  return (
    <div className="card">
      {title && <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>}
      <div>{children}</div>
      {footer && <div className="mt-4 pt-4 border-t border-white/10">{footer}</div>}
    </div>
  );
}

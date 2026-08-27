export default function SectionTitle({ title, detail, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
        {detail && <p className="mt-1.5 text-sm leading-5 text-slate-500">{detail}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

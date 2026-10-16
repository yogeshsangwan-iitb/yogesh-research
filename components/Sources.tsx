type Source = {
  label: string;
  url: string;
};

export default function Sources({ sources }: { sources?: Source[] }) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="not-prose mt-16 border-t border-ink pt-10">
      <p className="text-lg font-semibold text-ink">
        Sources
      </p>
      <ol className="mt-6 space-y-4">
        {sources.map((source, index) => (
          <li key={source.url} className="flex items-baseline gap-4">
            <span className="text-sm text-stone tabular">
              {String(index + 1).padStart(2, "0")}
            </span>
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-4 hover:text-rust">
              {source.label}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
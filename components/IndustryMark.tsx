export default function IndustryMark({ size = 48 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-sm border border-neutral-200"
    >
      <svg
        width={size * 0.4}
        height={size * 0.4}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-neutral-400"
      >
        <path d="M3 21h18M6 21V9l6-4 6 4v12M10 21v-6h4v6" />
      </svg>
    </div>
  );
}
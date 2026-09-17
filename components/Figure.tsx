type FigureProps = {
  src: string;
  alt: string;
  caption: string;
  source?: string;
};

export default function Figure({ src, alt, caption, source }: FigureProps) {
  return (
    <figure className="my-10 not-prose">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full rounded-sm" />
      <figcaption className="mt-3 text-sm text-neutral-500">
        {caption}
        {source && (
          <span className="block text-neutral-400">Source: {source}</span>
        )}
      </figcaption>
    </figure>
  );
}
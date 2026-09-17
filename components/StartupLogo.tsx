type StartupLogoProps = {
  logo?: string;
  name: string;
  size?: number;
};

export default function StartupLogo({ logo, name, size = 48 }: StartupLogoProps) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={`${name} logo`}
        width={size}
        height={size}
        className="rounded-sm object-contain"
      />
    );
  }

  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-sm bg-neutral-100 text-sm font-semibold text-neutral-500"
    >
      {initial}
    </div>
  );
}
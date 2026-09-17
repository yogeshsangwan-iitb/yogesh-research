import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <nav className="flex gap-6 text-sm">
          <Link href="/">Home</Link>
          <Link href="/research">Research</Link>
          <Link href="/about">About</Link>
        </nav>
        <Link href="/about">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/avatar.png"
            alt="Yogesh"
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        </Link>
      </div>
    </header>
  );
}
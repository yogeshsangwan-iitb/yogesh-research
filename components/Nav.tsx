import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-sm font-semibold tracking-wide">
          YOGESH
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/research">Research</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
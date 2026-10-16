"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/research", label: "Research" },
  { href: "/news", label: "Daily brief" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3" aria-label="Yogesh Sangwan, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/avatar.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover grayscale transition duration-500 group-hover:grayscale-0"
          />
          <span className="nav-caps hidden text-ink sm:inline">Yogesh Sangwan</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-4 sm:gap-8">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`nav-caps relative whitespace-nowrap py-1 transition-colors hover:text-rust ${
                  active ? "text-ink" : "text-stone"
                }`}
              >
                {link.label}
                <span
                  aria-hidden
                  className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-rust transition-transform duration-500 ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
          <Link href="/news" className="btn btn-rust hidden min-h-0 py-2 lg:inline-flex">
            Read today&rsquo;s brief
          </Link>
        </nav>
      </div>
    </header>
  );
}

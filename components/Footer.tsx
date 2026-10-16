import Link from "next/link";
import { OWNER_NAME, SITE_NAME, profileLinks } from "@/lib/profile";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-xl font-semibold tracking-tight">{SITE_NAME}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone">
            Independent research on startups, industries and markets by {OWNER_NAME}, written from IIT Bombay.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Read</p>
          <ul className="mt-3 space-y-2 text-sm text-stone">
            <li>
              <Link className="hover:text-rust" href="/research">Research</Link>
            </li>
            <li>
              <Link className="hover:text-rust" href="/news">Daily brief</Link>
            </li>
            <li>
              <Link className="hover:text-rust" href="/about">About</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Elsewhere</p>
          <ul className="mt-3 space-y-2 text-sm text-stone">
            {profileLinks.map((l) => (
              <li key={l.label}>
                <a
                  className="hover:text-rust"
                  href={l.href}
                  {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-rule">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-stone sm:px-6">
          The daily brief is summarised automatically from public news feeds each morning. Always check the original
          article before relying on a figure.
        </p>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { profileLinks } from "@/lib/profile";

export const metadata: Metadata = {
  title: "About",
};

const facts = [
  { label: "Studying", value: "B.Tech, Electrical Engineering" },
  { label: "At", value: "Indian Institute of Technology Bombay" },
  { label: "Based in", value: "Mumbai, India" },
  { label: "Interested in", value: "Venture capital, startups, industries and markets" },
];

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <div className="intro-rule h-px w-full bg-ink" />

      <div className="intro-photo relative mt-10 h-44 w-full overflow-hidden rounded-[10px] bg-paper-deep sm:h-60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/banner.jpg" alt="" className="h-full w-full object-cover" />
      </div>

      <div className="relative isolate grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        {/* IIT Bombay crest as a faint watermark behind the section */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/iitb-logo.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-0 top-24 -z-10 w-[min(440px,78%)] select-none opacity-[0.07] sm:top-10 lg:right-[4%]"
        />
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/avatar.png"
            alt="Yogesh Sangwan"
            width={136}
            height={136}
            className="intro-fade relative -mt-16 ml-4 h-32 w-32 rounded-full border-4 border-paper object-cover sm:h-[136px] sm:w-[136px]"
          />
          <h1 className="intro-line mt-6 text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
            Yogesh Sangwan
          </h1>
          <p className="intro-fade mt-5 max-w-md text-lg leading-relaxed text-stone">
            Third-year Electrical Engineering student at IIT Bombay, working towards a career in venture capital.
          </p>
          {profileLinks.length > 0 && (
            <div className="intro-fade mt-8 flex flex-wrap gap-3">
              {profileLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="btn btn-line"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="lg:pt-16">
          <Reveal>
            <p className="text-xl leading-relaxed">
              I&rsquo;m interested in how startups are built and funded, and in the industries they try to change.
              This site is where I publish independent research on companies and sectors I find interesting, and a
              daily brief that keeps me, and anyone else learning, up to date with the venture capital world.
            </p>
          </Reveal>
          <Reveal as="section" className="mt-12">
            <dl className="border-t border-ink">
              {facts.map((f) => (
                <div key={f.label} className="grid grid-cols-[8.5rem_1fr] gap-4 border-b border-rule py-4">
                  <dt className="text-sm text-stone">{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </main>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden rounded-md bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/banner.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      {/* Avatar overlapping the banner */}
      <div className="relative -mt-16 ml-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/avatar.png"
          alt="Yogesh"
          width={128}
          height={128}
          className="rounded-full border-4 border-[var(--background)] object-cover"
        />
      </div>

      {/* Name and bio */}
      <div className="mt-6">
        <h1 className="text-3xl font-bold">Yogesh Sangwan</h1>
        <p className="mt-2 text-neutral-600">
          IIT Bombay · Electrical Engineering · Researching startups,
          industries and markets
        </p>
        <p className="mt-1 text-sm text-neutral-400">Mumbai, India</p>
      </div>

      {/* IIT Bombay badge */}
      <div className="mt-6 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/iitb-logo.png"
          alt="IIT Bombay logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <p className="text-sm text-neutral-700">
          Indian Institute of Technology,
          <br />
          Bombay
        </p>
      </div>

      <p className="mt-8 text-lg text-neutral-600">
        Third-year Electrical Engineering student at IIT Bombay, interested
        in startups, venture capital, businesses, industries and markets.
        This site is where I publish independent research on companies and
        industries I find interesting.
      </p>

      <div className="mt-10 flex flex-wrap gap-6 text-sm">
        <a href="https://linkedin.com/in/your-handle" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-neutral-600">
          LinkedIn
        </a>
        <a href="https://github.com/your-handle" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-neutral-600">
          GitHub
        </a>
        <a href="mailto:you@example.com" className="underline underline-offset-4 hover:text-neutral-600">
          Email
        </a>
        <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-neutral-600">
          Resume
        </a>
      </div>
    </main>
  );
}
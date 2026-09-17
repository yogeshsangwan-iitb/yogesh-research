export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-sm uppercase tracking-wide text-neutral-500">
        About
      </p>
      <h1 className="mt-2 text-4xl font-bold">Yogesh</h1>

      <p className="mt-6 text-lg text-neutral-600">
        Third-year Electrical Engineering student at IIT Bombay, interested
        in startups, venture capital, businesses, industries and markets.
        This site is where I publish independent research on companies and
        industries I find interesting.
      </p>

      <div className="mt-10 flex flex-wrap gap-6 text-sm">
        <a
          href="https://linkedin.com/in/your-handle"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-neutral-600"
        >
          LinkedIn
        </a>
        <a
          href="https://github.com/your-handle"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-neutral-600"
        >
          GitHub
        </a>
        <a
          href="mailto:you@example.com"
          className="underline underline-offset-4 hover:text-neutral-600"
        >
          Email
        </a>
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-neutral-600"
        >
          Resume
        </a>
      </div>
    </main>
  );
}
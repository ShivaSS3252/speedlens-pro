import UrlForm from '@/components/UrlForm';

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">

      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-900/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-[350px] w-[500px] rounded-full bg-orange-900/10 blur-3xl" />

      <div className="relative w-full max-w-xl">

        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
            <span className="text-xs font-semibold tracking-wide text-orange-400">
              Powered by Lighthouse 12 + Groq AI
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="mb-3 text-center">
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
            Speed
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Lens
            </span>
            {' '}Pro
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Paste any URL and get a full Lighthouse audit with AI&#8209;generated code fixes<br />
            tailored to your tech stack — in under 60 seconds.
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 flex justify-center gap-6 text-center">
          {[
            { value: '2×', label: 'Audits per run' },
            { value: 'AI', label: 'Code fixes' },
            { value: '0', label: 'External APIs' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col">
              <span className="text-lg font-black text-orange-400">{value}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{label}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <UrlForm />

        {/* Try examples */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-600">Try:</span>
          {['github.com', 'vercel.com', 'nextjs.org'].map((site) => (
            <span
              key={site}
              className="rounded-full border border-zinc-700/60 bg-zinc-800/50 px-3 py-1 font-mono text-xs text-slate-400"
            >
              {site}
            </span>
          ))}
        </div>

      </div>
    </main>
  );
}

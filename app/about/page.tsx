import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-800"
        >
          Back to dashboard
        </Link>

        <header className="mt-4 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Transcript Lite
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Offline student transcript PDF generator
          </h1>
          <p className="mt-3 text-sm text-zinc-600 sm:text-base">
            Transcript Lite helps students, tutors, and small institutions turn
            raw result data into clean, professional PDFs in minutes. Everything
            works offline after the first load, and all data stays on your
            device.
          </p>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">
              Dashboard overview
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Create students, manage result sheets, and export PDFs.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
              <Image
                src="/screenshots/dashboard.png"
                alt="Transcript Lite dashboard preview"
                width={900}
                height={560}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">
              Professional PDF output
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Export polished results that look official and consistent.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
              <Image
                src="/screenshots/pdf-preview.png"
                alt="Transcript Lite PDF preview"
                width={900}
                height={560}
              />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-900">Offline-ready</h3>
            <p className="mt-2 text-xs text-zinc-500">
              Load once, then keep working without internet access.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-900">
              Local-first privacy
            </h3>
            <p className="mt-2 text-xs text-zinc-500">
              Data is stored only in your browser on your device.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-900">
              Simple exports
            </h3>
            <p className="mt-2 text-xs text-zinc-500">
              Generate statements of results in seconds.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

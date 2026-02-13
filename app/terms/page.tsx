import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-800"
        >
          Back to dashboard
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          Terms of Use
        </h1>
        <p className="mt-3 text-xs text-zinc-600 sm:text-sm">
          Transcript Lite is a personal productivity tool for drafting statement
          of results PDFs. It does not issue official academic records.
        </p>

        <div className="mt-6 space-y-5 text-xs text-zinc-700 sm:mt-8 sm:space-y-6 sm:text-sm">
          <section>
            <h2 className="text-base font-semibold text-zinc-900">
              Educational use only
            </h2>
            <p className="mt-2">
              You are responsible for verifying the accuracy of any data entered
              or exported. Always confirm requirements from your institution
              before submitting a document.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900">
              No official endorsement
            </h2>
            <p className="mt-2">
              Transcript Lite is not affiliated with any school or university
              unless explicitly stated.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900">
              Availability
            </h2>
            <p className="mt-2">
              The app is provided on an as-is basis without warranties. We may
              update features or templates to improve the experience.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-800"
        >
          Back to dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          Transcript Lite is built to keep your data private and local. We do
          not require accounts and we do not send your transcript data to any
          server.
        </p>

        <div className="mt-8 space-y-6 text-sm text-zinc-700">
          <section>
            <h2 className="text-base font-semibold text-zinc-900">
              What we store
            </h2>
            <p className="mt-2">
              Student names, programs, sheets, and result rows are stored in
              your browser using IndexedDB. This data stays on your device until
              you delete it or clear your browser storage.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900">
              Backups
            </h2>
            <p className="mt-2">
              When you export a backup, a JSON file is downloaded to your
              device. Importing a backup replaces your local data. We do not
              access or upload these files.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900">Advertising</h2>
            <p className="mt-2">
              Ads are shown only when you are online. We do not attach ads to
              your PDFs or store transcript content on ad servers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900">
              Contact
            </h2>
            <p className="mt-2">
              If you have questions, contact Evans Munsha at{" "}
              <a
                className="font-semibold text-zinc-900"
                href="mailto:evansmunsha@gmail.com"
              >
                evansmunsha@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

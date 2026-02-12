"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AdSlot from "@/components/ads/AdSlot";
import {
  createStudent,
  deleteStudent,
  exportBackup,
  importBackup,
  listStudents,
  Student,
} from "@/lib/db";

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [program, setProgram] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dashboardAdSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD ?? "";

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStudents();
      setStudents(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !program.trim()) {
      setError("Name and program are required.");
      return;
    }

    try {
      await createStudent(name, program);
      setName("");
      setProgram("");
      await loadStudents();
    } catch (err) {
      console.error(err);
      setError("Failed to create student.");
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!window.confirm("Delete this student and all their sheets?")) {
      return;
    }

    setError(null);
    try {
      await deleteStudent(studentId);
      setStudents((prev) => prev.filter((student) => student.id !== studentId));
    } catch (err) {
      console.error(err);
      setError("Failed to delete student.");
    }
  };

  const handleExportBackup = async () => {
    setBackupBusy(true);
    setBackupError(null);
    setBackupMessage(null);

    try {
      const payload = await exportBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transcript-lite-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setBackupMessage("Backup exported successfully.");
    } catch (err) {
      console.error(err);
      setBackupError("Failed to export backup.");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImportClick = () => {
    setBackupError(null);
    setBackupMessage(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    event.target.value = "";

    if (
      !window.confirm(
        "Importing a backup will replace all existing data. Continue?"
      )
    ) {
      return;
    }

    setBackupBusy(true);
    setBackupError(null);
    setBackupMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importBackup(data);
      await loadStudents();
      setBackupMessage("Backup imported successfully.");
    } catch (err) {
      console.error(err);
      setBackupError("Failed to import backup. Check the file format.");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleShare = async () => {
    setShareError(null);
    setShareMessage(null);
    const url = window.location.origin;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied to clipboard.");
      } else {
        window.prompt("Copy this link", url);
      }
    } catch (err) {
      console.error(err);
      setShareError("Unable to copy the link. Please copy it manually.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Transcript Lite
            </span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Students
            </h1>
            <p className="mt-2 text-sm text-zinc-600 sm:text-base">
              Create students, track result sheets, and export PDFs without ever
              leaving offline mode.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            <Link href="/about" className="hover:text-zinc-900">
              About
            </Link>
            <Link href="/privacy" className="hover:text-zinc-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-900">
              Terms
            </Link>
          </nav>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold">Add a student</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Name and program are required.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-zinc-700">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  placeholder="Ada Lovelace"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700">
                Program
                <input
                  value={program}
                  onChange={(event) => setProgram(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  placeholder="Computer Science"
                  required
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Create student
            </button>
            {error ? (
              <p className="mt-3 text-sm text-rose-600">{error}</p>
            ) : null}
          </form>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Student roster</h2>
              <button
                type="button"
                onClick={loadStudents}
                className="text-xs font-semibold uppercase tracking-wide text-zinc-500 transition hover:text-zinc-800"
              >
                Refresh
              </button>
            </div>

            <div className="mt-5">
              {loading ? (
                <p className="text-sm text-zinc-500">Loading students...</p>
              ) : students.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-zinc-700">
                    No students yet.
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Create your first student to start building result sheets.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {students.map((student) => (
                    <li
                      key={student.id}
                      className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {student.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {student.program}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/student/${student.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(student.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 border-t border-zinc-100 pt-5">
              <h3 className="text-sm font-semibold text-zinc-900">
                Backup & restore
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Export a JSON backup or restore data from a previous export.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={backupBusy}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Export Backup
                </button>
                <button
                  type="button"
                  onClick={handleImportClick}
                  disabled={backupBusy}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Import Backup
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>
              {backupMessage ? (
                <p className="mt-3 text-xs text-emerald-600">
                  {backupMessage}
                </p>
              ) : null}
              {backupError ? (
                <p className="mt-3 text-xs text-rose-600">{backupError}</p>
              ) : null}
            </div>

            <AdSlot slot={dashboardAdSlot} className="mt-6" />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">
              Share Transcript Lite
            </h3>
            <p className="mt-2 text-xs text-zinc-500">
              Invite classmates or colleagues to use the offline transcript
              generator.
            </p>
            <button
              type="button"
              onClick={handleShare}
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              Copy app link
            </button>
            {shareMessage ? (
              <p className="mt-3 text-xs text-emerald-600">{shareMessage}</p>
            ) : null}
            {shareError ? (
              <p className="mt-3 text-xs text-rose-600">{shareError}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">
              Download sample PDF
            </h3>
            <p className="mt-2 text-xs text-zinc-500">
              See the professional layout shared with employers and schools.
            </p>
            <a
              href="/sample/transcript-lite-sample.pdf"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
            >
              Download sample
            </a>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">Send feedback</h3>
            <p className="mt-2 text-xs text-zinc-500">
              Share ideas, bugs, or feature requests to shape the next release.
            </p>
            <a
              href="mailto:evansmunsha@gmail.com"
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              Email feedback
            </a>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Built by Evans Munsha.
        </p>
      </div>
    </div>
  );
}

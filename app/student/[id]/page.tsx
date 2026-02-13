"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdSlot from "@/components/ads/AdSlot";
import {
  createSheet,
  deleteSheet,
  getStudent,
  listSheetsByStudent,
  renameSheet,
  ResultSheet,
  Student,
} from "@/lib/db";

export default function StudentPage() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id;
  const studentAdSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_STUDENT ?? "";
  const [student, setStudent] = useState<Student | null>(null);
  const [sheets, setSheets] = useState<ResultSheet[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const loadStudent = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const studentData = await getStudent(id);
      if (!studentData) {
        setStudent(null);
        setSheets([]);
        return;
      }

      const sheetData = await listSheetsByStudent(id);
      setStudent(studentData);
      setSheets(sheetData);
    } catch (err) {
      console.error(err);
      setError("Failed to load student.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!studentId) {
      return;
    }
    loadStudent(studentId);
  }, [studentId]);

  const handleCreateSheet = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Sheet title is required.");
      return;
    }

    try {
      if (!studentId) {
        return;
      }
      const newSheet = await createSheet(studentId, title);
      setTitle("");
      setSheets((prev) => [newSheet, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Failed to create sheet.");
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    if (!window.confirm("Delete this sheet and all its rows?")) {
      return;
    }

    setError(null);
    try {
      await deleteSheet(sheetId);
      setSheets((prev) => prev.filter((sheet) => sheet.id !== sheetId));
    } catch (err) {
      console.error(err);
      setError("Failed to delete sheet.");
    }
  };

  const startRename = (sheet: ResultSheet) => {
    setEditingId(sheet.id);
    setEditingTitle(sheet.title);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveRename = async (sheetId: string) => {
    if (!editingTitle.trim()) {
      setError("Sheet title is required.");
      return;
    }

    setError(null);
    try {
      const updated = await renameSheet(sheetId, editingTitle);
      if (updated) {
        setSheets((prev) =>
          prev.map((sheet) => (sheet.id === sheetId ? updated : sheet))
        );
      }
      cancelRename();
    } catch (err) {
      console.error(err);
      setError("Failed to rename sheet.");
    }
  };

  if (!loading && !student) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-20">
          <h1 className="text-xl font-semibold sm:text-2xl">
            Student not found
          </h1>
          <p className="mt-2 text-xs text-zinc-600 sm:text-sm">
            The student ID in the URL doesn&apos;t match any local records.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-full px-4 py-6 sm:max-w-5xl sm:px-6 sm:py-10">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-800"
        >
          Back to dashboard
        </Link>

        <header className="mt-3 flex flex-col gap-2 sm:mt-4">
          <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
            {student?.name ?? "Loading..."}
          </h1>
          <p className="break-words text-xs text-zinc-500 sm:text-sm">
            {student?.program}
          </p>
        </header>

        <section className="mt-6 grid max-w-full gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-[1.1fr_1fr]">
          <form
            onSubmit={handleCreateSheet}
            className="max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-semibold">Create a sheet</h2>
            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              Each sheet can hold full rows and course-only notes.
            </p>
            <label className="mt-5 block text-sm font-medium text-zinc-700 sm:mt-6">
              Sheet title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                placeholder="Semester 1 Results"
                required
              />
            </label>
            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:mt-6"
            >
              Create sheet
            </button>
            {error ? (
              <p className="mt-3 text-sm text-rose-600">{error}</p>
            ) : null}
          </form>

          <div className="max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Result sheets</h2>
              <button
                type="button"
                onClick={() => {
                  if (studentId) {
                    loadStudent(studentId);
                  }
                }}
                className="text-xs font-semibold uppercase tracking-wide text-zinc-500 transition hover:text-zinc-800"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 sm:mt-5">
              {loading ? (
                <p className="text-xs text-zinc-500 sm:text-sm">
                  Loading sheets...
                </p>
              ) : sheets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-zinc-700">
                    No sheets yet.
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Create a sheet to start recording results.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {sheets.map((sheet) => (
                    <li
                      key={sheet.id}
                      className="min-w-0 max-w-full rounded-xl border border-zinc-200 px-4 py-3"
                    >
                      {editingId === sheet.id ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <input
                            value={editingTitle}
                            onChange={(event) =>
                              setEditingTitle(event.target.value)
                            }
                            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => saveRename(sheet.id)}
                              className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelRename}
                              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-zinc-900">
                              {sheet.title}
                            </p>
                            <p className="break-words text-xs text-zinc-500">
                              Updated{" "}
                              {new Date(sheet.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/sheet/${sheet.id}`}
                              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
                            >
                              Open
                            </Link>
                            <button
                              type="button"
                              onClick={() => startRename(sheet)}
                              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSheet(sheet.id)}
                              className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <AdSlot slot={studentAdSlot} className="mt-6" />
          </div>
        </section>
      </div>
    </div>
  );
}

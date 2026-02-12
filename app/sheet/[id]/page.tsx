"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import {
  deleteRow,
  getSheet,
  getStudent,
  listRowsBySheet,
  ResultRow,
  ResultSheet,
  Student,
  upsertRows,
} from "@/lib/db";
import TranscriptPdf, { PdfTemplate } from "@/components/pdf/ResultPdf";

const EMPTY_FULL_ROW = {
  course: "",
  code: "",
  year: "",
  semester: "",
  grade: "",
};

export default function SheetPage() {
  const params = useParams<{ id: string }>();
  const sheetId = params?.id;
  const [sheet, setSheet] = useState<ResultSheet | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [fullRows, setFullRows] = useState<ResultRow[]>([]);
  const [courseRows, setCourseRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [courseInput, setCourseInput] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [template, setTemplate] = useState<PdfTemplate>("compact");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedFullRows = useMemo(
    () => fullRows.slice().sort((a, b) => a.order - b.order),
    [fullRows]
  );
  const sortedCourseRows = useMemo(
    () => courseRows.slice().sort((a, b) => a.order - b.order),
    [courseRows]
  );

  const safeName = (value: string) => {
    const cleaned = value
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    return cleaned || "transcript";
  };

  const handleExport = async () => {
    if (!sheet || !student) {
      return;
    }

    setExporting(true);
    setExportError(null);

    try {
      const blob = await pdf(
        <TranscriptPdf
          student={student}
          sheet={sheet}
          fullRows={sortedFullRows}
          courseRows={sortedCourseRows}
          template={template}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const filename = `statement-of-results-${safeName(
        student.name
      )}-${safeName(sheet.title)}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } catch (err) {
      console.error(err);
      setExportError("Failed to generate PDF.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!sheetId) {
      return;
    }
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const sheetData = await getSheet(sheetId);
        if (!sheetData) {
          if (active) {
            setSheet(null);
            setStudent(null);
            setFullRows([]);
            setCourseRows([]);
          }
          return;
        }

        const [studentData, rows] = await Promise.all([
          getStudent(sheetData.studentId),
          listRowsBySheet(sheetData.id),
        ]);

        if (!active) {
          return;
        }

        setSheet(sheetData);
        setStudent(studentData);
        setFullRows(
          rows
            .filter((row) => row.type === "FULL")
            .sort((a, b) => a.order - b.order)
        );
        setCourseRows(
          rows
            .filter((row) => row.type === "COURSE_ONLY")
            .sort((a, b) => a.order - b.order)
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [sheetId]);

  useEffect(() => {
    if (!loading) {
      hasLoadedRef.current = true;
    }
  }, [loading]);

  useEffect(() => {
    if (!sheet || !hasLoadedRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      setSaveError(null);
      try {
        await upsertRows([...fullRows, ...courseRows]);
      } catch (err) {
        console.error(err);
        setSaveError("Failed to save changes.");
      } finally {
        setSaving(false);
      }
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [sheet, fullRows, courseRows]);

  const addFullRow = () => {
    if (!sheet) {
      return;
    }
    setFullRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sheetId: sheet.id,
        type: "FULL",
        order: prev.length,
        ...EMPTY_FULL_ROW,
      },
    ]);
  };

  const updateFullRow = (
    id: string,
    field: keyof typeof EMPTY_FULL_ROW,
    value: string
  ) => {
    setFullRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const moveFullRow = (index: number, direction: number) => {
    setFullRows((prev) => {
      const next = prev.slice().sort((a, b) => a.order - b.order);
      const target = index + direction;
      if (target < 0 || target >= next.length) {
        return prev;
      }
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((row, idx) => ({ ...row, order: idx }));
    });
  };

  const removeFullRow = async (rowId: string) => {
    if (!window.confirm("Delete this row?")) {
      return;
    }

    setFullRows((prev) => {
      const next = prev.filter((row) => row.id !== rowId);
      return next.map((row, idx) => ({ ...row, order: idx }));
    });
    await deleteRow(rowId);
  };

  const addCourseOnly = () => {
    if (!sheet || !courseInput.trim()) {
      return;
    }
    setCourseRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sheetId: sheet.id,
        type: "COURSE_ONLY",
        order: prev.length,
        course: courseInput.trim(),
      },
    ]);
    setCourseInput("");
  };

  const updateCourseOnly = (id: string, value: string) => {
    setCourseRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, course: value } : row))
    );
  };

  const removeCourseOnly = async (rowId: string) => {
    if (!window.confirm("Delete this course-only entry?")) {
      return;
    }

    setCourseRows((prev) => {
      const next = prev.filter((row) => row.id !== rowId);
      return next.map((row, idx) => ({ ...row, order: idx }));
    });
    await deleteRow(rowId);
  };

  if (!loading && !sheet) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold">Sheet not found</h1>
          <p className="mt-2 text-sm text-zinc-600">
            The sheet ID in the URL doesn&apos;t match any local records.
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
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <Link
          href={sheet ? `/student/${sheet.studentId}` : "/"}
          className="text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-800"
        >
          Back to student
        </Link>

        <header className="mt-4 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {sheet?.title ?? "Loading..."}
          </h1>
          <p className="text-sm text-zinc-500">
            {student?.name ?? "Loading student"}{" "}
            {student?.program ? ` - ${student.program}` : ""}
          </p>
        </header>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            {saving ? (
              <span className="font-medium text-zinc-700">Saving...</span>
            ) : (
              <span className="font-medium text-zinc-600">
                All changes saved
              </span>
            )}
            {saveError ? (
              <span className="text-rose-600">{saveError}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            disabled={!sheet || !student}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export PDF
          </button>
        </div>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Full rows</h2>
              <p className="text-sm text-zinc-500">
                Add complete results with codes, years, and grades.
              </p>
            </div>
            <button
              type="button"
              onClick={addFullRow}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
            >
              Add row
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Course</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">Semester</th>
                  <th className="px-3 py-2">Grade</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {sortedFullRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-sm text-zinc-500"
                    >
                      No rows yet. Add a row to begin.
                    </td>
                  </tr>
                ) : (
                  sortedFullRows.map((row, index) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">
                        <input
                          value={row.course}
                          onChange={(event) =>
                            updateFullRow(row.id, "course", event.target.value)
                          }
                          className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-zinc-400"
                          placeholder="Course name"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={row.code ?? ""}
                          onChange={(event) =>
                            updateFullRow(row.id, "code", event.target.value)
                          }
                          className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-zinc-400"
                          placeholder="CSC101"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={row.year ?? ""}
                          onChange={(event) =>
                            updateFullRow(row.id, "year", event.target.value)
                          }
                          className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-zinc-400"
                          placeholder="2025"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={row.semester ?? ""}
                          onChange={(event) =>
                            updateFullRow(
                              row.id,
                              "semester",
                              event.target.value
                            )
                          }
                          className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-zinc-400"
                          placeholder="Fall"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={row.grade ?? ""}
                          onChange={(event) =>
                            updateFullRow(row.id, "grade", event.target.value)
                          }
                          className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-zinc-400"
                          placeholder="A"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => moveFullRow(index, -1)}
                            disabled={index === 0}
                            className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFullRow(index, 1)}
                            disabled={index === sortedFullRows.length - 1}
                            className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFullRow(row.id)}
                            className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">Course-only entries</h2>
            <p className="text-sm text-zinc-500">
              Add quick course references without metadata.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={courseInput}
              onChange={(event) => setCourseInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCourseOnly();
                }
              }}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              placeholder="Course name"
            />
            <button
              type="button"
              onClick={addCourseOnly}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
            >
              Add course
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {sortedCourseRows.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No course-only entries yet.
              </p>
            ) : (
              sortedCourseRows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 px-3 py-3 sm:flex-row sm:items-center"
                >
                  <input
                    value={row.course}
                    onChange={(event) =>
                      updateCourseOnly(row.id, event.target.value)
                    }
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeCourseOnly(row.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {exportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Export PDF</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Choose a layout and download the statement of results.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportOpen(false)}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setTemplate("compact")}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  template === "compact"
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <span className="block text-sm font-semibold">
                  One-page compact
                </span>
                <span className="mt-1 block text-xs opacity-80">
                  Best for shorter sheets that should fit on a single page.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTemplate("readable")}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  template === "readable"
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <span className="block text-sm font-semibold">
                  Multi-page readable
                </span>
                <span className="mt-1 block text-xs opacity-80">
                  More spacing and legibility for longer result lists.
                </span>
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-zinc-500">
                {exportError ? (
                  <span className="text-rose-600">{exportError}</span>
                ) : (
                  <span>PDF will be generated offline.</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? "Preparing..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

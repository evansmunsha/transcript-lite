import { DBSchema, IDBPDatabase, openDB } from "idb";

export type Student = {
  id: string;
  name: string;
  program: string;
  createdAt: string;
};

export type ResultSheet = {
  id: string;
  studentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ResultRowType = "FULL" | "COURSE_ONLY";

export type ResultRow = {
  id: string;
  sheetId: string;
  course: string;
  code?: string;
  year?: string;
  semester?: string;
  grade?: string;
  type: ResultRowType;
  order: number;
};

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  students: Student[];
  sheets: ResultSheet[];
  rows: ResultRow[];
};

type TranscriptDb = DBSchema & {
  students: {
    key: string;
    value: Student;
  };
  sheets: {
    key: string;
    value: ResultSheet;
    indexes: { by_student: string };
  };
  rows: {
    key: string;
    value: ResultRow;
    indexes: { by_sheet: string };
  };
};

const DB_NAME = "transcript-lite";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TranscriptDb>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<TranscriptDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("students")) {
          db.createObjectStore("students", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("sheets")) {
          const sheetStore = db.createObjectStore("sheets", { keyPath: "id" });
          sheetStore.createIndex("by_student", "studentId", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("rows")) {
          const rowStore = db.createObjectStore("rows", { keyPath: "id" });
          rowStore.createIndex("by_sheet", "sheetId", { unique: false });
        }
      },
    });
  }

  return dbPromise;
}

export async function createStudent(
  name: string,
  program: string
): Promise<Student> {
  const now = new Date().toISOString();
  const student: Student = {
    id: crypto.randomUUID(),
    name: name.trim(),
    program: program.trim(),
    createdAt: now,
  };

  const db = await getDb();
  await db.add("students", student);
  return student;
}

export async function listStudents(): Promise<Student[]> {
  const db = await getDb();
  const students = await db.getAll("students");
  return students.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getStudent(id: string): Promise<Student | null> {
  const db = await getDb();
  return (await db.get("students", id)) ?? null;
}

export async function deleteStudent(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["students", "sheets", "rows"], "readwrite");
  const sheetIndex = tx.objectStore("sheets").index("by_student");
  const rowIndex = tx.objectStore("rows").index("by_sheet");

  const sheets = await sheetIndex.getAll(id);
  for (const sheet of sheets) {
    const rows = await rowIndex.getAll(sheet.id);
    for (const row of rows) {
      await tx.objectStore("rows").delete(row.id);
    }
    await tx.objectStore("sheets").delete(sheet.id);
  }

  await tx.objectStore("students").delete(id);
  await tx.done;
}

export async function createSheet(
  studentId: string,
  title: string
): Promise<ResultSheet> {
  const now = new Date().toISOString();
  const sheet: ResultSheet = {
    id: crypto.randomUUID(),
    studentId,
    title: title.trim(),
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  await db.add("sheets", sheet);
  return sheet;
}

export async function listSheetsByStudent(
  studentId: string
): Promise<ResultSheet[]> {
  const db = await getDb();
  const sheets = await db.getAllFromIndex("sheets", "by_student", studentId);
  return sheets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSheet(id: string): Promise<ResultSheet | null> {
  const db = await getDb();
  return (await db.get("sheets", id)) ?? null;
}

export async function renameSheet(
  id: string,
  title: string
): Promise<ResultSheet | null> {
  const db = await getDb();
  const sheet = await db.get("sheets", id);
  if (!sheet) {
    return null;
  }

  const updated: ResultSheet = {
    ...sheet,
    title: title.trim(),
    updatedAt: new Date().toISOString(),
  };

  await db.put("sheets", updated);
  return updated;
}

export async function deleteSheet(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["sheets", "rows"], "readwrite");
  const rowIndex = tx.objectStore("rows").index("by_sheet");
  const rows = await rowIndex.getAll(id);

  for (const row of rows) {
    await tx.objectStore("rows").delete(row.id);
  }

  await tx.objectStore("sheets").delete(id);
  await tx.done;
}

export async function upsertRows(rows: ResultRow[]): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const db = await getDb();
  const tx = db.transaction("rows", "readwrite");
  for (const row of rows) {
    await tx.store.put(row);
  }
  await tx.done;
}

export async function listRowsBySheet(sheetId: string): Promise<ResultRow[]> {
  const db = await getDb();
  const rows = await db.getAllFromIndex("rows", "by_sheet", sheetId);
  return rows.sort((a, b) => a.order - b.order);
}

export async function deleteRow(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("rows", id);
}

export async function reorderRows(
  sheetId: string,
  orderedIds: string[]
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("rows", "readwrite");

  for (let index = 0; index < orderedIds.length; index += 1) {
    const row = await tx.store.get(orderedIds[index]);
    if (!row || row.sheetId !== sheetId) {
      continue;
    }
    await tx.store.put({ ...row, order: index });
  }

  await tx.done;
}

export async function exportBackup(): Promise<BackupPayload> {
  const db = await getDb();
  const [students, sheets, rows] = await Promise.all([
    db.getAll("students"),
    db.getAll("sheets"),
    db.getAll("rows"),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    students,
    sheets,
    rows,
  };
}

export async function importBackup(payload: BackupPayload): Promise<void> {
  if (
    !payload ||
    payload.version !== 1 ||
    !Array.isArray(payload.students) ||
    !Array.isArray(payload.sheets) ||
    !Array.isArray(payload.rows)
  ) {
    throw new Error("Invalid backup format.");
  }

  const db = await getDb();
  const tx = db.transaction(["students", "sheets", "rows"], "readwrite");

  await Promise.all([
    tx.objectStore("students").clear(),
    tx.objectStore("sheets").clear(),
    tx.objectStore("rows").clear(),
  ]);

  for (const student of payload.students) {
    await tx.objectStore("students").put(student);
  }
  for (const sheet of payload.sheets) {
    await tx.objectStore("sheets").put(sheet);
  }
  for (const row of payload.rows) {
    await tx.objectStore("rows").put(row);
  }

  await tx.done;
}

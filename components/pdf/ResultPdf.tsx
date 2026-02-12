"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { ResultRow, ResultSheet, Student } from "@/lib/db";

export type PdfTemplate = "compact" | "readable";

type TranscriptPdfProps = {
  student: Student;
  sheet: ResultSheet;
  fullRows: ResultRow[];
  courseRows: ResultRow[];
  template: PdfTemplate;
};

const compactStyles = StyleSheet.create({
  page: {
    padding: 18,
    fontSize: 8.6,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 10,
    alignItems: "flex-start",
    textAlign: "left",
  },
  documentTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  },
  metaLine: {
    marginTop: 4,
    fontSize: 8,
    color: "#475569",
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 9,
    fontWeight: 600,
    color: "#0f172a",
  },
  table: {
    borderWidth: 1,
    borderColor: "#d7dde8",
    borderRadius: 6,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d7dde8",
  },
  rowStriped: {
    backgroundColor: "#f8fafc",
  },
  headerRow: {
    backgroundColor: "#e8efff",
  },
  cell: {
    paddingVertical: 4,
    paddingHorizontal: 5,
    flexGrow: 1,
    flexBasis: 0,
    borderRightWidth: 1,
    borderRightColor: "#d7dde8",
  },
  cellLast: {
    borderRightWidth: 0,
  },
  courseCell: {
    flexGrow: 2.4,
  },
  codeCell: {
    flexGrow: 1,
  },
  yearCell: {
    flexGrow: 0.9,
  },
  semesterCell: {
    flexGrow: 1,
  },
  gradeCell: {
    flexGrow: 0.8,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  courseList: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  courseItem: {
    width: "50%",
    marginBottom: 2,
  },
  footerNote: {
    marginTop: 10,
    fontSize: 8,
    color: "#94a3b8",
  },
  pageNumber: {
    position: "absolute",
    bottom: 12,
    right: 18,
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

const readableStyles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 18,
    alignItems: "flex-start",
    textAlign: "left",
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  },
  metaLine: {
    marginTop: 6,
    fontSize: 10,
    color: "#475569",
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a",
  },
  table: {
    borderWidth: 1,
    borderColor: "#d7dde8",
    borderRadius: 6,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d7dde8",
  },
  rowStriped: {
    backgroundColor: "#f8fafc",
  },
  headerRow: {
    backgroundColor: "#e8efff",
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexGrow: 1,
    flexBasis: 0,
    borderRightWidth: 1,
    borderRightColor: "#d7dde8",
  },
  cellLast: {
    borderRightWidth: 0,
  },
  courseCell: {
    flexGrow: 2.6,
  },
  codeCell: {
    flexGrow: 1,
  },
  yearCell: {
    flexGrow: 1,
  },
  semesterCell: {
    flexGrow: 1,
  },
  gradeCell: {
    flexGrow: 0.8,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  courseList: {
    marginTop: 6,
  },
  courseItem: {
    marginBottom: 6,
  },
  footerNote: {
    marginTop: 20,
    fontSize: 9,
    color: "#94a3b8",
  },
  pageNumber: {
    position: "absolute",
    bottom: 16,
    right: 32,
    fontSize: 8.5,
    color: "#94a3b8",
  },
});

function formatName(value: string) {
  return value.trim() || "Unnamed";
}

function buildStatementTitle(rawTitle: string) {
  const trimmed = rawTitle.trim();
  if (!trimmed) {
    return "Statement of Results";
  }
  if (trimmed.toLowerCase().includes("statement of results")) {
    return trimmed;
  }
  return `${trimmed} - Statement of Results`;
}

export default function TranscriptPdf({
  student,
  sheet,
  fullRows,
  courseRows,
  template,
}: TranscriptPdfProps) {
  const styles = template === "compact" ? compactStyles : readableStyles;
  const sortedFull = fullRows.slice().sort((a, b) => a.order - b.order);
  const sortedCourse = courseRows.slice().sort((a, b) => a.order - b.order);
  const statementTitle = buildStatementTitle(sheet.title);

  return (
    <Document title={`${statementTitle} - ${formatName(student.name)}`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.documentTitle}>{statementTitle}</Text>
          {student.name || student.program ? (
            <Text style={styles.metaLine}>
              {[formatName(student.name), student.program].filter(Boolean).join(" - ")}
            </Text>
          ) : null}
        </View>

        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.courseCell]}>Course</Text>
            <Text style={[styles.cell, styles.codeCell]}>Code</Text>
            <Text style={[styles.cell, styles.yearCell]}>Year</Text>
            <Text style={[styles.cell, styles.semesterCell]}>Semester</Text>
            <Text style={[styles.cell, styles.gradeCell, styles.cellLast]}>
              Grade
            </Text>
          </View>
          {sortedFull.length === 0 ? (
            <View style={[styles.row, styles.rowLast]}>
              <Text style={[styles.cell, styles.courseCell]}>
                No full results recorded.
              </Text>
              <Text style={[styles.cell, styles.codeCell]}> </Text>
              <Text style={[styles.cell, styles.yearCell]}> </Text>
              <Text style={[styles.cell, styles.semesterCell]}> </Text>
              <Text style={[styles.cell, styles.gradeCell, styles.cellLast]}>
                {" "}
              </Text>
            </View>
          ) : (
            sortedFull.map((row, index) => (
              <View
                key={row.id}
                style={
                  index === sortedFull.length - 1
                    ? index % 2 === 1
                      ? [styles.row, styles.rowStriped, styles.rowLast]
                      : [styles.row, styles.rowLast]
                    : index % 2 === 1
                      ? [styles.row, styles.rowStriped]
                      : styles.row
                }
              >
                <Text style={[styles.cell, styles.courseCell]}>
                  {row.course || "-"}
                </Text>
                <Text style={[styles.cell, styles.codeCell]}>
                  {row.code || "-"}
                </Text>
                <Text style={[styles.cell, styles.yearCell]}>
                  {row.year || "-"}
                </Text>
                <Text style={[styles.cell, styles.semesterCell]}>
                  {row.semester || "-"}
                </Text>
                <Text style={[styles.cell, styles.gradeCell, styles.cellLast]}>
                  {row.grade || "-"}
                </Text>
              </View>
            ))
          )}
        </View>

        {sortedCourse.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Course-Only Entries</Text>
            <View style={styles.courseList}>
              {sortedCourse.map((row) => (
                <Text key={row.id} style={styles.courseItem}>
                  - {row.course || "-"}
                </Text>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.footerNote}>
          Generated offline with Transcript Lite. built by Evans Munsha
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

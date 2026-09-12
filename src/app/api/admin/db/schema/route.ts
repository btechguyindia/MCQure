import { jsonOk, isNextResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { listTables } from "@/lib/admin-sql";

export async function GET() {
  const admin = await requireAdmin();
  if (isNextResponse(admin)) return admin;

  const tables = await listTables();

  // Provide the JOIN path for tables that reference users, so the UI can
  // surface the email column everywhere.
  const emailTables = new Set(["Subscription", "PracticeSession", "Attempt", "QuestionReport", "Goal", "StudyVisit", "StudyTimetable", "MockRun", "ConceptMastery", "IngestionJob"]);

  return jsonOk({
    tables,
    userJoinTables: [...emailTables].filter((t) =>
      tables.some((table) => table.name === t)
    ),
  });
}
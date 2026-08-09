import "dotenv/config";
import { describe, expect, it } from "vitest";
import { prisma } from "../lib/db";

// Phase 3 content integrity: every syllabus topic must carry at least one
// study note so the Study module never shows an empty topic.
describe("Study content integrity", () => {
  it("every topic has at least one study note", async () => {
    const empty = await prisma.topic.findMany({
      where: { studyNotes: { none: {} } },
      select: { name: true },
    });
    expect(empty).toEqual([]);
  });

  it("every topic's notes have a title and non-empty body", async () => {
    const notes = await prisma.studyNote.findMany({
      select: { title: true, body: true },
    });
    expect(notes.length).toBeGreaterThan(0);
    for (const n of notes) {
      expect(n.title.trim().length).toBeGreaterThan(0);
      expect(n.body.trim().length).toBeGreaterThan(0);
    }
  });
});

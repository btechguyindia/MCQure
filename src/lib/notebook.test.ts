import { describe, expect, it } from "vitest";
import { buildNotebookPrompt } from "./notebook";

describe("buildNotebookPrompt", () => {
  const notes = [
    { title: "Intro", body: "TCP is connection-oriented.\nUDP is not." },
    { title: "", body: "Port 443 is HTTPS." },
  ];

  it("embeds the topic, study material and student question", () => {
    const prompt = buildNotebookPrompt("Networking", notes, "Compare TCP and UDP?");
    expect(prompt).toContain("Topic: Networking");
    expect(prompt).toContain("TCP is connection-oriented.");
    expect(prompt).toContain("Port 443 is HTTPS.");
    expect(prompt).toContain("Compare TCP and UDP?");
  });

  it("forces grounded answers (only the material)", () => {
    const prompt = buildNotebookPrompt("Networking", notes, "x");
    expect(prompt).toMatch(/ONLY the study material/);
    expect(prompt).toContain("do not invent content");
  });

  it("uses a placeholder when there is no material", () => {
    const prompt = buildNotebookPrompt("Networking", [], "hello");
    expect(prompt).toContain("(no study material available for this topic)");
  });
});

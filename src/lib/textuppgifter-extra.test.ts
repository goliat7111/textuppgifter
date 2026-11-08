import { describe, expect, it } from "vitest";
import { paginateTaskItems, textTaskInstructions } from "./textuppgifter-extra";

describe("utökade textuppgifter", () => {
  it("only requests irrelevant numbers when the option is enabled", () => {
    expect(textTaskInstructions(false)).not.toContain("extra tal");
    const instructions = textTaskInstructions(true);
    expect(instructions).toContain("inte behövs för att besvara frågan");
    expect(instructions).toContain("får inte ändra svaret");
    expect(instructions).toContain("inte det extra talet i facit");
    expect(instructions).toContain("300 tecken");
  });

  it("paginates tasks by measured height rather than a fixed task count", () => {
    const tasks = Array.from({ length: 10 }, (_, i) => i + 1);
    const pages = paginateTaskItems(tasks, Array(10).fill(150), 620, 16);
    expect(pages.map((page) => page.length)).toEqual([3, 3, 3, 1]);
    expect(pages.flat()).toEqual(tasks);
    expect(paginateTaskItems([1, 2, 3, 4], [100, 100, 100, 100], 500, 16)).toEqual([[1, 2, 3, 4]]);
    expect(paginateTaskItems([], [], 500, 16)).toEqual([]);
  });
});

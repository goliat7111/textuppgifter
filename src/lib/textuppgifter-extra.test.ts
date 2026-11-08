import { describe, expect, it } from "vitest";
import { paginateTaskItems, textTaskInstructions } from "./textuppgifter-extra";

describe("utökade textuppgifter", () => {
  it("requests contextual extra details only when the option is enabled", () => {
    expect(textTaskInstructions(false)).not.toContain("extra tal");
    const instructions = textTaskInstructions(true);
    expect(instructions).toContain("sammanhängande berättelse");
    expect(instructions).toContain("lägg inte till lösryckta fakta eller slumpmässiga tal");
    expect(instructions).toContain("inte behövs för svaret");
    expect(instructions).toContain("välja ut informationen som faktiskt behövs");
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

  it("uses the available space including gaps and keeps every task in order", () => {
    const tasks = [1, 2, 3, 4, 5, 6];
    expect(paginateTaskItems(tasks, [40, 40, 40, 40, 40, 40], 290, 10)).toEqual([tasks]);
    expect(paginateTaskItems(tasks, [40, 40, 40, 40, 40, 41], 290, 10)).toEqual([
      [1, 2, 3, 4, 5],
      [6],
    ]);
    expect(paginateTaskItems(tasks, [100, 30, 200, 30, 30, 30], 250, 10)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });
});

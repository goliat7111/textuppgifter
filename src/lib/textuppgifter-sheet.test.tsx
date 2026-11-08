import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Sheet } from "@/routes/index";

describe("textuppgiftsblad", () => {
  it("keeps numbering and total consistent on later student and answer pages", () => {
    const task = {
      question: "Det finns 4 äpplen och 7 päron.",
      answer: "11 frukter (4 + 7 = 11)",
    };
    const props = {
      tasks: [task],
      grade: 3,
      theme: "Frukt",
      opLabel: "Addition",
      startIndex: 3,
      total: 10,
    };
    const student = renderToStaticMarkup(<Sheet {...props} answers={false} />);
    const key = renderToStaticMarkup(<Sheet {...props} answers />);

    for (const html of [student, key]) {
      expect(html).toContain("4)");
      expect(html).toContain("av 10");
      expect(html).toContain(task.question);
    }
    expect(student).not.toContain(task.answer);
    expect(key).toContain(task.answer);
  });

  it("renders manually entered tasks with the worksheet title and an empty answer line", () => {
    const html = renderToStaticMarkup(
      <Sheet
        tasks={[{ question: "Skriv en egen fråga.", answer: "" }]}
        answers
        grade={5}
        theme="Bråk"
        opLabel="Egna uppgifter"
        startIndex={0}
        total={1}
        titlePrefix="Egna uppgifter"
      />,
    );

    expect(html).toContain("Egna uppgifter – Facit");
    expect(html).toContain("Skriv en egen fråga.");
    expect(html).toContain("Svar: ____________________");
  });
});

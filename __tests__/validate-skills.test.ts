import { describe, expect, it } from "vitest";
import { validateSkills, type SkillsFormValues } from "@/lib/validate-skills";

function makeValues(
  overrides: Partial<SkillsFormValues> = {}
): SkillsFormValues {
  return {
    skills: ["Frontend"],
    primaryRole: "Developer",
    ...overrides,
  };
}

describe("validateSkills", () => {
  it("accepts a valid selection", () => {
    expect(validateSkills(makeValues())).toEqual({ errors: {} });
  });

  it("requires at least one skill", () => {
    const res = validateSkills(makeValues({ skills: [] }));
    expect(res.errors.skills).toBeTruthy();
  });

  it("rejects more than five skills", () => {
    const res = validateSkills(
      makeValues({
        skills: [
          "Frontend",
          "Backend",
          "AI/ML",
          "DevOps",
          "Research",
          "Pitching/Presentation",
        ],
      })
    );
    expect(res.errors.skills).toBeTruthy();
  });

  it("accepts exactly five skills", () => {
    const res = validateSkills(
      makeValues({
        skills: ["Frontend", "Backend", "AI/ML", "DevOps", "Research"],
      })
    );
    expect(res.errors.skills).toBeUndefined();
  });

  it("rejects skills outside the registry", () => {
    const res = validateSkills(
      makeValues({ skills: ["Not A Real Skill"] as never })
    );
    expect(res.errors.skills).toBeTruthy();
  });

  it("requires a primary role", () => {
    const res = validateSkills(makeValues({ primaryRole: null as never }));
    expect(res.errors.primaryRole).toBeTruthy();
  });

  it("rejects a role outside the registry", () => {
    const res = validateSkills(makeValues({ primaryRole: "Manager" as never }));
    expect(res.errors.primaryRole).toBeTruthy();
  });
});

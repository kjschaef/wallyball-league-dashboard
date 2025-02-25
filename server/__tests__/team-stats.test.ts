
import { formatTeam } from "../utils";

describe("Team Stats", () => {
  test("formatTeam should handle different player orders", () => {
    const team1 = formatTeam(["Chris", "Keith"]);
    const team2 = formatTeam(["Keith", "Chris"]);
    
    expect(team1).toBe(team2);
    expect(team1).toBe("Chris, Keith");
  });

  test("formatTeam should handle empty or null values", () => {
    expect(formatTeam([])).toBe("");
    expect(formatTeam([null as any, "Chris"])).toBe("Chris");
    expect(formatTeam(["Chris", undefined as any])).toBe("Chris");
  });
});

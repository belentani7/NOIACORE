import { describe, expect, it } from "vitest";
import { canTransition, commandRiskSummary, nextState } from "./simulator";

describe("simulated machine safety states", () => {
  it("allows only protected transitions", () => {
    expect(canTransition("stopped", "start")).toBe(true);
    expect(canTransition("stopped", "resume")).toBe(false);
    expect(nextState("operating", "pause")).toBe("paused");
  });

  it("rejects a command from an unsafe state", () => {
    const decision = commandRiskSummary("maintenance", "start", 31);
    expect(decision).toMatchObject({ safe: false });
  });

  it("blocks non-emergency actions beyond the simulated temperature threshold", () => {
    expect(commandRiskSummary("operating", "stop", 86)).toMatchObject({ safe: false });
    expect(commandRiskSummary("operating", "emergency_stop_simulation", 86)).toMatchObject({ safe: true });
  });
});

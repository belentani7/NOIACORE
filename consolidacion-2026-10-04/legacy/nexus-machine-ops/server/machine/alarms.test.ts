import { describe, expect, it } from "vitest";
import { expectedSimulatedAlarm } from "./alarms";

describe("simulated alarm lifecycle", () => {
  it("raises a critical simulated alarm for emergency state", () => {
    expect(expectedSimulatedAlarm("emergency", 28)).toMatchObject({ code: "SIM_ESTOP_ACTIVE", severity: "critical" });
  });

  it("raises an over-temperature alarm and clears it when the signal normalizes", () => {
    expect(expectedSimulatedAlarm("operating", 82)).toMatchObject({ code: "SIM_OVER_TEMPERATURE" });
    expect(expectedSimulatedAlarm("operating", 62)).toBeNull();
  });
});

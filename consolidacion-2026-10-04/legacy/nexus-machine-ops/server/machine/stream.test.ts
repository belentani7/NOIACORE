import { describe, expect, it } from "vitest";
import { publishOperationsUpdate, subscribeOperationsUpdates } from "./stream";

describe("operations stream", () => {
  it("notifies subscribers when the simulator or audit trail changes", () => {
    const reasons: string[] = [];
    const unsubscribe = subscribeOperationsUpdates(event => reasons.push(event.reason));
    publishOperationsUpdate("command_executed");
    unsubscribe();
    expect(reasons).toEqual(["command_executed"]);
  });
});

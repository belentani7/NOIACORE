import { describe, expect, it } from "vitest";
import { SimulationGateway } from "./gateway";

describe("simulation gateway", () => {
  it("dispatches only through the simulation adapter", async () => {
    const gateway = new SimulationGateway();
    const result = await gateway.dispatch({ state: "stopped", cycleCount: 0, operationStartedAt: null }, "start");
    expect(result).toEqual({ targetState: "operating", gatewayMode: "simulation", adapter: "simulation" });
  });
});

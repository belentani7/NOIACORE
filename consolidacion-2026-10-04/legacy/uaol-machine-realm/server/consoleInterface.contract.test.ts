import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("contrato de interfaz de la consola", () => {
  it("declara los controles de los flujos críticos y las fronteras de simulación", async () => {
    const source = await readFile(path.join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

    [
      "trpc.simulation.task.create.useMutation",
      "trpc.simulation.task.advance.useMutation",
      "trpc.simulation.task.simulateComputerAction.useMutation",
      "trpc.simulation.machine.transition.useMutation",
      "trpc.simulation.machine.setMode.useMutation",
      "trpc.simulation.protocol.emulate.useMutation",
      "TaskTimeline",
      "MachineIOTPanel",
      "overview.isError",
      "machines.length === 0",
      "Sin equipo, navegador ni hardware real",
    ].forEach(control => expect(source).toContain(control));
  });
});

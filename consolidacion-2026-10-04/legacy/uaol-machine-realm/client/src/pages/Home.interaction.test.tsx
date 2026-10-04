import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";

const queryState: { current: Record<string, unknown> } = { current: {} };
const mutations = {
  create: vi.fn(),
  advance: vi.fn(),
  computer: vi.fn(),
  transition: vi.fn(),
  mode: vi.fn(),
  protocol: vi.fn(),
  tick: vi.fn(),
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ simulation: { overview: { invalidate: vi.fn() } } }),
    simulation: {
      overview: { useQuery: () => queryState.current },
      task: {
        create: { useMutation: () => ({ mutate: mutations.create, isPending: false }) },
        advance: { useMutation: () => ({ mutate: mutations.advance, isPending: false }) },
        simulateComputerAction: { useMutation: () => ({ mutate: mutations.computer, isPending: false }) },
      },
      machine: {
        transition: { useMutation: () => ({ mutate: mutations.transition, isPending: false }) },
        setMode: { useMutation: () => ({ mutate: mutations.mode, isPending: false }) },
      },
      protocol: { emulate: { useMutation: () => ({ mutate: mutations.protocol, isPending: false }) }, },
      tick: { useMutation: () => ({ mutate: mutations.tick, isPending: false }) },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

const now = new Date("2026-08-26T10:00:00.000Z");

function overviewData(overrides: Record<string, unknown> = {}) {
  return {
    simulationBoundary: { mode: "SIMULATION_ONLY" },
    tasks: [{ id: 41, title: "Inspección simulada", intent: "Revisar una orden sintética.", status: "draft", riskLevel: "medium", executionMode: "manual", simulationOnly: true, updatedAt: now }],
    machines: [{ id: 5, machineKey: "RM-CELL-01", name: "Celda de mezcla A", area: "Proceso húmedo", state: "idle", operationMode: "manual", sensorsJson: { temperature: "24.2 °C", pressure: "1.8 bar", vibration: "0.4 mm/s" }, actuatorsJson: { pump: "ready", valve: "closed", conveyor: "standby" }, telemetry: null, history: [] }],
    alerts: [],
    protocols: [],
    ledger: [],
    permissions: [],
    events: [{ id: 91, taskId: 41, stage: "intent", outcome: "success", message: "Intención registrada.", evidenceJson: { summary: "Evidencia sintética" }, createdAt: now }],
    ...overrides,
  };
}

function renderConsole(data = overviewData()) {
  queryState.current = { data, isLoading: false, isError: false, refetch: vi.fn() };
  return render(<Home />);
}

beforeEach(() => {
  Object.values(mutations).forEach(mutation => mutation.mockReset());
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("flujos de interfaz de UAOL–Máquina Realm", () => {
  it("crea una tarea y permite avanzar el ciclo visible", async () => {
    const user = userEvent.setup();
    renderConsole();
    await user.click(screen.getByRole("button", { name: /tareas uaol/i }));
    await user.clear(screen.getByDisplayValue("Inspección de órdenes pendientes"));
    await user.type(screen.getByDisplayValue(""), "Nueva tarea sintética");
    await user.click(screen.getByRole("button", { name: /registrar tarea simulada/i }));
    expect(mutations.create).toHaveBeenCalledWith(expect.objectContaining({ title: "Nueva tarea sintética", executionMode: "manual" }));

    await user.click(screen.getByRole("button", { name: /avanzar ciclo/i }));
    expect(mutations.advance).toHaveBeenCalledWith({ taskId: 41 });
    await user.click(screen.getByRole("button", { name: /ciclo y evidencia/i }));
    expect(screen.getByText("Intención")).toBeTruthy();
    expect(screen.getByText(/evidencia sintética/i)).toBeTruthy();
  });

  it("conmuta modo, confirma transición sensible y emula protocolos", async () => {
    const user = userEvent.setup();
    renderConsole();
    await user.click(screen.getByRole("button", { name: /cambiar a autónomo/i }));
    expect(mutations.mode).toHaveBeenCalledWith({ machineId: 5, mode: "autonomous", confirmed: true });
    await user.click(screen.getByRole("button", { name: "emergency" }));
    expect(mutations.transition).toHaveBeenCalledWith({ machineId: 5, targetState: "emergency", confirmed: true });

    await user.click(screen.getByRole("button", { name: /^protocolos$/i }));
    await user.click(screen.getByRole("button", { name: "mqtt" }));
    expect(mutations.protocol).toHaveBeenCalledWith({ machineId: 5, protocol: "mqtt", direction: "event" });
    await user.click(screen.getByRole("button", { name: /emular comando sensible/i }));
    expect(mutations.protocol).toHaveBeenCalledWith({ machineId: 5, protocol: "mqtt", direction: "command", confirmed: true });
  });

  it("expone el circuito virtual local y su frontera de simulación", async () => {
    const user = userEvent.setup();
    renderConsole();
    await user.click(screen.getByRole("button", { name: /circuito virtual/i }));
    expect(screen.getByTestId("virtual-circuit-panel")).toBeTruthy();
    expect(screen.getByText(/entradas virtuales/i)).toBeTruthy();
    expect(screen.getByText(/salidas derivadas/i)).toBeTruthy();
    expect(screen.getByText(/enclavamiento prioritario/i)).toBeTruthy();
    expect(screen.getByText(/no es una interfaz de control físico/i)).toBeTruthy();
  });

  it("renderiza los estados de error y de escenario vacío", () => {
    queryState.current = { data: undefined, isLoading: false, isError: true, refetch: vi.fn() };
    const { unmount } = render(<Home />);
    expect(screen.getByText(/no se pudo cargar el perímetro/i)).toBeTruthy();
    unmount();

    renderConsole(overviewData({ machines: [] }));
    expect(screen.getByText(/el perímetro sintético está vacío/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /crear escenario sintético/i })).toBeTruthy();
  });
});

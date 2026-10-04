import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OperationsCenter from "./OperationsCenter";

const state: { current: Record<string, unknown> } = { current: {} };
const mutations = { cycle: vi.fn(), provision: vi.fn(), report: vi.fn(), command: vi.fn(), condition: vi.fn(), invalidate: vi.fn() };

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ operations: { overview: { invalidate: mutations.invalidate } } }),
    operations: {
      overview: { useQuery: () => state.current },
      gateway: {
        runCycle: { useMutation: () => ({ mutate: mutations.cycle, isPending: false }) },
        provisionCredentials: { useMutation: () => ({ mutate: mutations.provision, isPending: false }) },
      },
      reports: { generate: { useMutation: () => ({ mutate: mutations.report, isPending: false }) } },
      commands: { request: { useMutation: () => ({ mutate: mutations.command, isPending: false }) } },
      machine: { simulateCondition: { useMutation: () => ({ mutate: mutations.condition, isPending: false }) } },
    },
  },
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />, XAxis: () => <div />, YAxis: () => <div />, Tooltip: () => <div />,
}));

const now = new Date("2026-08-26T10:00:00.000Z");
const overview = () => ({
  gateway: { id: 1, name: "Gateway local — simulador determinista", status: "online", operatingMode: "simulator" },
  machines: [{ id: 5, machineKey: "RM-CELL-01", name: "Celda de mezcla A", area: "Proceso húmedo", state: "idle", connectionStatus: "connected", cycleCount: 4, runtimeSeconds: 32, currentLoad: 42, currentSpeed: 68, simulatedLatencyMs: 120 }],
  commands: [], events: [{ id: 1, eventType: "GATEWAY_CONNECTED", payloadJson: { simulationOnly: true }, createdAt: now }], heartbeats: [], health: [], adapters: [], maintenance: [], notifications: [], alerts: [], reports: [],
  telemetry: [{ id: 1, machineId: 5, temperature: 260, load: 42, energy: 38, speed: 68, createdAt: now }], simulationMode: true, hardwareMode: "HARDWARE_NOT_CONFIGURED",
});

beforeEach(() => {
  Object.values(mutations).forEach(mutation => mutation.mockReset());
  state.current = { data: overview(), isLoading: false, isError: false, refetch: vi.fn() };
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.stubGlobal("EventSource", class { addEventListener() {} removeEventListener() {} close() {} });
  Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn() }, configurable: true });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("centro operativo", () => {
  it("solicita un comando confirmado y permite ejecutar el ciclo del gateway", async () => {
    const user = userEvent.setup();
    render(<OperationsCenter />);
    await user.click(screen.getByRole("button", { name: /^start$/i }));
    expect(mutations.command).toHaveBeenCalledWith(expect.objectContaining({ machineId: 5, commandType: "start", confirmed: true }));
    await user.click(screen.getByRole("button", { name: /ejecutar ciclo/i }));
    expect(mutations.cycle).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /generar informe/i }));
    expect(mutations.report).toHaveBeenCalled();
  });

  it("expone los diagnósticos seguros del gemelo digital", async () => {
    const user = userEvent.setup();
    render(<OperationsCenter />);
    await user.click(screen.getByRole("button", { name: /desconectar/i }));
    expect(mutations.condition).toHaveBeenCalledWith({ machineId: 5, condition: "disconnect" });
    await user.click(screen.getByRole("button", { name: /inducir fallo/i }));
    expect(mutations.condition).toHaveBeenCalledWith({ machineId: 5, condition: "fault", confirmed: true });
  });

  it("muestra un estado de recuperación cuando falla la consulta operacional", () => {
    state.current = { data: undefined, isLoading: false, isError: true, refetch: vi.fn() };
    render(<OperationsCenter />);
    expect(screen.getByText(/no se pudo recuperar el estado operacional/i)).toBeTruthy();
  });
});

import { createServer, type Server, type Socket } from "node:net";

export const LOCAL_PROTOCOL_VERSION = "ULSP/1" as const;
export const LOCAL_PROTOCOL_DEFAULT_PORT = 45123;
export const LOCAL_PROTOCOL_MAX_FRAME_BYTES = 65_536;

export type LocalMachineState = "idle" | "running" | "paused" | "stopped" | "maintenance" | "emergency_stop";
export type LocalCommand = "start" | "pause" | "resume" | "stop" | "reset" | "maintenance" | "acknowledge" | "emergency_stop";

type RequestType = "hello" | "snapshot" | "command" | "input";

type ProtocolErrorCode = "INVALID_FRAME" | "INVALID_REQUEST" | "UNSUPPORTED_PROTOCOL" | "UNKNOWN_MESSAGE" | "INVALID_TRANSITION" | "FRAME_TOO_LARGE";

export type LocalProtocolResponse = {
  protocol: typeof LOCAL_PROTOCOL_VERSION;
  type: "response";
  requestId: string;
  ok: boolean;
  simulationOnly: true;
  timestamp: string;
  payload?: Record<string, unknown>;
  error?: { code: ProtocolErrorCode; message: string };
};

type ValidRequest = {
  requestId: string;
  type: RequestType;
  payload: Record<string, unknown>;
};

type SimulationEvent = {
  id: string;
  at: string;
  type: "SIMULATION_COMMAND" | "SIMULATION_INPUT";
  command?: LocalCommand;
  signal?: "guardClosed" | "thermalTrip";
  previousValue?: boolean;
  newValue?: boolean;
  previousState: LocalMachineState;
  newState: LocalMachineState;
};

const transitions: Record<LocalMachineState, Partial<Record<LocalCommand, LocalMachineState>>> = {
  idle: { start: "running", maintenance: "maintenance", emergency_stop: "emergency_stop" },
  running: { pause: "paused", stop: "stopped", emergency_stop: "emergency_stop" },
  paused: { resume: "running", stop: "stopped", emergency_stop: "emergency_stop" },
  stopped: { start: "running", reset: "idle", maintenance: "maintenance", emergency_stop: "emergency_stop" },
  maintenance: { reset: "idle", emergency_stop: "emergency_stop" },
  emergency_stop: { acknowledge: "stopped" },
};

const allowedTypes = new Set<RequestType>(["hello", "snapshot", "command", "input"]);
const allowedCommands = new Set<LocalCommand>(["start", "pause", "resume", "stop", "reset", "maintenance", "acknowledge", "emergency_stop"]);
const allowedInputSignals = new Set(["guardClosed", "thermalTrip"] as const);

function response(requestId: string, payload: Record<string, unknown>): LocalProtocolResponse {
  return {
    protocol: LOCAL_PROTOCOL_VERSION,
    type: "response",
    requestId,
    ok: true,
    simulationOnly: true,
    timestamp: new Date().toISOString(),
    payload,
  };
}

function failure(requestId: string, code: ProtocolErrorCode, message: string): LocalProtocolResponse {
  return {
    protocol: LOCAL_PROTOCOL_VERSION,
    type: "response",
    requestId,
    ok: false,
    simulationOnly: true,
    timestamp: new Date().toISOString(),
    error: { code, message },
  };
}

function requestIdFrom(value: unknown) {
  if (typeof value === "object" && value !== null && "requestId" in value) {
    const requestId = (value as { requestId?: unknown }).requestId;
    if (typeof requestId === "string" && requestId.length > 0 && requestId.length <= 96) return requestId;
  }
  return "invalid-request";
}

function validateRequest(value: unknown): ValidRequest | LocalProtocolResponse {
  const requestId = requestIdFrom(value);
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return failure(requestId, "INVALID_REQUEST", "La solicitud debe ser un objeto JSON.");
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.protocol !== LOCAL_PROTOCOL_VERSION) {
    return failure(requestId, "UNSUPPORTED_PROTOCOL", `Se requiere ${LOCAL_PROTOCOL_VERSION}.`);
  }
  if (typeof candidate.requestId !== "string" || candidate.requestId.length === 0 || candidate.requestId.length > 96) {
    return failure(requestId, "INVALID_REQUEST", "requestId debe ser una cadena no vacía de hasta 96 caracteres.");
  }
  if (typeof candidate.type !== "string" || !allowedTypes.has(candidate.type as RequestType)) {
    return failure(candidate.requestId, "UNKNOWN_MESSAGE", "El tipo de mensaje no es compatible con ULSP/1.");
  }
  if (candidate.payload !== undefined && (typeof candidate.payload !== "object" || candidate.payload === null || Array.isArray(candidate.payload))) {
    return failure(candidate.requestId, "INVALID_REQUEST", "payload debe ser un objeto JSON.");
  }
  return { requestId: candidate.requestId, type: candidate.type as RequestType, payload: (candidate.payload as Record<string, unknown> | undefined) ?? {} };
}

export class LocalSimulationEngine {
  private state: LocalMachineState = "idle";
  private cycleCount = 0;
  private eventSequence = 0;
  private events: SimulationEvent[] = [];
  private inputs = {
    guardClosed: true,
    thermalTrip: false,
    emergencyLatched: false,
  };

  private isInterlockHealthy() {
    return this.inputs.guardClosed && !this.inputs.thermalTrip && !this.inputs.emergencyLatched;
  }

  private circuit() {
    const interlockHealthy = this.isInterlockHealthy();
    const motorContactor = this.state === "running" && interlockHealthy;
    return {
      inputs: { ...this.inputs },
      outputs: {
        motorContactor,
        runLamp: motorContactor,
        faultLamp: !interlockHealthy,
        alarmSiren: this.inputs.thermalTrip || this.inputs.emergencyLatched,
      },
      interlockHealthy,
    };
  }

  private appendEvent(event: Omit<SimulationEvent, "id" | "at">) {
    const saved: SimulationEvent = {
      id: `local-sim-${++this.eventSequence}`,
      at: new Date().toISOString(),
      ...event,
    };
    this.events.push(saved);
    return saved;
  }

  private snapshot() {
    const active = this.state === "running";
    const paused = this.state === "paused";
    return {
      state: this.state,
      cycleCount: this.cycleCount,
      telemetry: {
        temperatureC: active ? 26 + (this.cycleCount % 4) : paused ? 25 : 23,
        pressureKpa: active ? 410 + (this.cycleCount % 7) : 100,
        speedRpm: active ? 1200 : 0,
        powerPercent: active ? 64 : 0,
      },
      circuit: this.circuit(),
      recentEvents: this.events.slice(-20),
    };
  }

  handle(input: unknown): LocalProtocolResponse {
    const validated = validateRequest(input);
    if ("ok" in validated) return validated;

    if (validated.type === "hello") {
      const clientName = validated.payload.clientName;
      if (typeof clientName !== "string" || clientName.trim().length === 0 || clientName.length > 120) {
        return failure(validated.requestId, "INVALID_REQUEST", "hello requiere payload.clientName como cadena no vacía de hasta 120 caracteres.");
      }
      return response(validated.requestId, {
        serverName: "UAOL Local Simulation Protocol",
        clientName: clientName.trim(),
        transport: "tcp-loopback",
        state: this.state,
      });
    }

    if (validated.type === "snapshot") return response(validated.requestId, this.snapshot());

    if (validated.type === "input") {
      const signal = validated.payload.signal;
      const value = validated.payload.value;
      if (typeof signal !== "string" || !allowedInputSignals.has(signal as "guardClosed" | "thermalTrip") || typeof value !== "boolean") {
        return failure(validated.requestId, "INVALID_REQUEST", "input requiere signal=guardClosed|thermalTrip y value booleano.");
      }
      const typedSignal = signal as "guardClosed" | "thermalTrip";
      const previousValue = this.inputs[typedSignal];
      const previousState = this.state;
      this.inputs[typedSignal] = value;
      if ((!this.inputs.guardClosed || this.inputs.thermalTrip) && this.state !== "emergency_stop") {
        this.state = "stopped";
      }
      const event = this.appendEvent({
        type: "SIMULATION_INPUT",
        signal: typedSignal,
        previousValue,
        newValue: value,
        previousState,
        newState: this.state,
      });
      return response(validated.requestId, { event, ...this.snapshot() });
    }

    const command = validated.payload.command;
    if (typeof command !== "string" || !allowedCommands.has(command as LocalCommand)) {
      return failure(validated.requestId, "INVALID_REQUEST", "command debe ser una transición compatible de ULSP/1.");
    }
    const nextState = transitions[this.state][command as LocalCommand];
    if (!nextState) {
      return failure(validated.requestId, "INVALID_TRANSITION", `El comando ${command} no está permitido desde el estado ${this.state}.`);
    }

    const needsHealthyInterlock = command === "start" || command === "reset" || command === "acknowledge";
    const inputsHealthyForReset = this.inputs.guardClosed && !this.inputs.thermalTrip;
    if ((command === "start" && !this.isInterlockHealthy()) || (needsHealthyInterlock && command !== "start" && !inputsHealthyForReset)) {
      return failure(validated.requestId, "INVALID_TRANSITION", `El comando ${command} requiere guarda cerrada y ausencia de disparo térmico${command === "start" ? " y emergencia enclavada" : ""}.`);
    }

    const previousState = this.state;
    if (command === "emergency_stop") this.inputs.emergencyLatched = true;
    if (command === "acknowledge") this.inputs.emergencyLatched = false;
    this.state = nextState;
    if (command === "start" || command === "resume") this.cycleCount += 1;
    const event = this.appendEvent({
      type: "SIMULATION_COMMAND",
      command: command as LocalCommand,
      previousState,
      newState: nextState,
    });
    return response(validated.requestId, { event, ...this.snapshot() });
  }
}

function send(socket: Socket, payload: LocalProtocolResponse) {
  socket.write(`${JSON.stringify(payload)}\n`);
}

export function createLocalProtocolServer(engine = new LocalSimulationEngine()): Server {
  return createServer(socket => {
    let buffered = "";
    socket.setEncoding("utf8");
    socket.on("data", chunk => {
      buffered += chunk;
      if (Buffer.byteLength(buffered, "utf8") > LOCAL_PROTOCOL_MAX_FRAME_BYTES) {
        send(socket, failure("invalid-request", "FRAME_TOO_LARGE", `La trama supera el límite de ${LOCAL_PROTOCOL_MAX_FRAME_BYTES} bytes.`));
        socket.end();
        return;
      }
      let newlineIndex = buffered.indexOf("\n");
      while (newlineIndex >= 0) {
        const frame = buffered.slice(0, newlineIndex).trim();
        buffered = buffered.slice(newlineIndex + 1);
        if (frame.length > 0) {
          try {
            send(socket, engine.handle(JSON.parse(frame)));
          } catch {
            send(socket, failure("invalid-request", "INVALID_FRAME", "La trama debe ser JSON válido."));
          }
        }
        newlineIndex = buffered.indexOf("\n");
      }
    });
  });
}

export function validateLoopbackPort(port: number) {
  if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
    throw new Error("LOCAL_PROTOCOL_PORT debe ser un puerto TCP entre 1024 y 65535.");
  }
  return port;
}

import { connect } from "node:net";
import { randomUUID } from "node:crypto";
import { LOCAL_PROTOCOL_DEFAULT_PORT, LOCAL_PROTOCOL_VERSION, validateLoopbackPort, type LocalCommand, type LocalProtocolResponse } from "./core.ts";

const commands = new Set<LocalCommand>(["start", "pause", "resume", "stop", "reset", "maintenance", "acknowledge", "emergency_stop"]);
const inputActions = {
  "guard-open": { signal: "guardClosed", value: false },
  "guard-close": { signal: "guardClosed", value: true },
  "thermal-trip": { signal: "thermalTrip", value: true },
  "thermal-clear": { signal: "thermalTrip", value: false },
} as const;

function usage() {
  return "Uso: pnpm local-protocol:client -- <hello|snapshot|comando|guard-open|guard-close|thermal-trip|thermal-clear> [--port 45123]";
}

function parseArguments(argv: string[]) {
  const normalized = argv[0] === "--" ? argv.slice(1) : argv;
  const [action, ...rest] = normalized;
  const portIndex = rest.indexOf("--port");
  const portValue = portIndex >= 0 ? rest[portIndex + 1] : process.env.LOCAL_PROTOCOL_PORT ?? String(LOCAL_PROTOCOL_DEFAULT_PORT);
  if (!action || !portValue) throw new Error(usage());
  return { action, port: validateLoopbackPort(Number(portValue)) };
}

function makeRequest(action: string) {
  const requestId = `local-${randomUUID()}`;
  if (action === "hello") return { protocol: LOCAL_PROTOCOL_VERSION, requestId, type: "hello", payload: { clientName: "uaol-local-cli" } };
  if (action === "snapshot") return { protocol: LOCAL_PROTOCOL_VERSION, requestId, type: "snapshot", payload: {} };
  if (action in inputActions) return { protocol: LOCAL_PROTOCOL_VERSION, requestId, type: "input", payload: inputActions[action as keyof typeof inputActions] };
  if (commands.has(action as LocalCommand)) return { protocol: LOCAL_PROTOCOL_VERSION, requestId, type: "command", payload: { command: action } };
  throw new Error(`${usage()} Comando no reconocido: ${action}`);
}

async function execute() {
  const { action, port } = parseArguments(process.argv.slice(2));
  const request = makeRequest(action);
  const response = await new Promise<LocalProtocolResponse>((resolve, reject) => {
    const socket = connect({ host: "127.0.0.1", port });
    let buffered = "";
    socket.setEncoding("utf8");
    socket.once("connect", () => socket.write(`${JSON.stringify(request)}\n`));
    socket.on("data", chunk => {
      buffered += chunk;
      const newlineIndex = buffered.indexOf("\n");
      if (newlineIndex < 0) return;
      try {
        resolve(JSON.parse(buffered.slice(0, newlineIndex)) as LocalProtocolResponse);
      } catch {
        reject(new Error("El servidor local devolvió una respuesta no válida."));
      } finally {
        socket.end();
      }
    });
    socket.once("error", error => reject(new Error(`No se pudo conectar al protocolo local en 127.0.0.1:${port}: ${error.message}`)));
  });
  console.log(JSON.stringify(response, null, 2));
  process.exitCode = response.ok ? 0 : 1;
}

execute().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

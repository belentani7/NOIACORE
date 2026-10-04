import { createLocalProtocolServer, LOCAL_PROTOCOL_DEFAULT_PORT, LOCAL_PROTOCOL_VERSION, validateLoopbackPort } from "./core.ts";

const configuredPort = Number(process.env.LOCAL_PROTOCOL_PORT ?? LOCAL_PROTOCOL_DEFAULT_PORT);
const port = validateLoopbackPort(configuredPort);
const server = createLocalProtocolServer();

server.listen({ host: "127.0.0.1", port }, () => {
  console.log(JSON.stringify({
    event: "LOCAL_PROTOCOL_READY",
    protocol: LOCAL_PROTOCOL_VERSION,
    host: "127.0.0.1",
    port,
    simulationOnly: true,
  }));
});

function shutdown(signal: string) {
  server.close(() => {
    console.log(JSON.stringify({ event: "LOCAL_PROTOCOL_STOPPED", signal, simulationOnly: true }));
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

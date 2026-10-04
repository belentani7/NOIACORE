import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Computer,
  CircuitBoard,
  Database,
  Eye,
  Gauge,
  LockKeyhole,
  Network,
  PauseCircle,
  Play,
  Radio,
  RefreshCw,
  ShieldCheck,
  TerminalSquare,
  Waves,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

type OperationTab = "operacion" | "circuito" | "tareas" | "ciclo" | "protocolos" | "ledger";

const stageLabels: Record<string, string> = {
  draft: "Borrador",
  planning: "Planificación",
  simulating: "Ejecución simulada",
  observing: "Observación",
  verifying: "Verificación",
  closed: "Cerrada",
  blocked: "Bloqueada",
};

const stateStyles: Record<string, string> = {
  idle: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  calibrating: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  operating: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  maintenance: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  stopped: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  emergency: "border-rose-400/35 bg-rose-400/10 text-rose-200",
};

function formatTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}

function StateDot({ state }: { state: string }) {
  const tone = state === "operating" ? "bg-emerald-400" : state === "emergency" ? "bg-rose-400" : state === "maintenance" ? "bg-amber-300" : "bg-sky-300";
  return <span className={`inline-block h-2 w-2 rounded-full ${tone} ${state === "operating" || state === "emergency" ? "signal-pulse" : ""}`} />;
}

export default function Home() {
  const [tab, setTab] = useState<OperationTab>("operacion");
  const [title, setTitle] = useState("Inspección de órdenes pendientes");
  const [intent, setIntent] = useState("Abrir el entorno simulado, inspeccionar órdenes pendientes y conservar evidencia del resultado.");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [mode, setMode] = useState<"manual" | "autonomous">("manual");
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const overview = trpc.simulation.overview.useQuery(undefined, { refetchInterval: 15_000 });
  const createTask = trpc.simulation.task.create.useMutation({
    onSuccess: () => {
      toast.success("Tarea simulada creada y registrada.");
      utils.simulation.overview.invalidate();
      setTab("tareas");
    },
    onError: error => toast.error(error.message),
  });
  const advanceTask = trpc.simulation.task.advance.useMutation({
    onSuccess: result => {
      toast.success(result.message);
      utils.simulation.overview.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const computerAction = trpc.simulation.task.simulateComputerAction.useMutation({
    onSuccess: result => {
      toast[result.executed ? "success" : "warning"](result.reason);
      utils.simulation.overview.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const transitionMachine = trpc.simulation.machine.transition.useMutation({
    onSuccess: async result => {
      if (result.requiresConfirmation && selectedMachineId) {
        const accepted = window.confirm(`${result.reason}\n\n¿Confirmar esta transición solo en la simulación?`);
        if (accepted) transitionMachine.mutate({ machineId: selectedMachineId, targetState: pendingMachineState, confirmed: true });
        return;
      }
      toast[result.changed ? "success" : "warning"](result.reason);
      utils.simulation.overview.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const setMachineMode = trpc.simulation.machine.setMode.useMutation({
    onSuccess: result => {
      toast[result.changed ? "success" : "warning"](result.reason);
      utils.simulation.overview.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const protocol = trpc.simulation.protocol.emulate.useMutation({
    onSuccess: result => {
      toast[result.emitted ? "success" : "warning"](result.reason);
      utils.simulation.overview.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const tick = trpc.simulation.tick.useMutation({
    onSuccess: () => {
      toast.success("Telemetría sintética actualizada.");
      utils.simulation.overview.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const [pendingMachineState, setPendingMachineState] = useState<"idle" | "calibrating" | "operating" | "maintenance" | "stopped" | "emergency">("operating");

  const data = overview.data;
  const machines = data?.machines ?? [];
  const activeMachine = useMemo(() => machines.find(machine => machine.id === (selectedMachineId ?? machines[0]?.id)) ?? machines[0], [machines, selectedMachineId]);
  const openTasks = data?.tasks.filter(task => task.status !== "closed").length ?? 0;
  const activeAlerts = data?.alerts.filter(alert => alert.status === "active").length ?? 0;
  const chartData = activeMachine?.history.map(point => ({
    time: formatTime(point.createdAt),
    temperature: point.temperature / 10,
    pressure: point.pressure / 10,
    energy: point.energy,
  })) ?? [];

  if (overview.isLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-sm text-muted-foreground"><RefreshCw className="mr-3 h-4 w-4 animate-spin" />Inicializando consola persistente…</div>;
  }

  if (overview.isError) {
    return <div className="control-grid grid min-h-[70vh] place-items-center"><Card className="w-full max-w-lg border-rose-400/25 bg-slate-950/80"><CardContent className="p-7 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-rose-300" /><h1 className="mt-3 text-lg font-semibold text-slate-100">No se pudo cargar el perímetro de simulación</h1><p className="mt-2 text-sm leading-6 text-slate-400">La consola no pudo recuperar el estado persistente. No se ejecutó ninguna operación fuera de la simulación.</p><Button className="mt-5 bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={() => overview.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Reintentar conexión</Button></CardContent></Card></div>;
  }

  if (!data || machines.length === 0) {
    return <div className="control-grid grid min-h-[70vh] place-items-center"><Card className="w-full max-w-lg border-cyan-300/20 bg-slate-950/80"><CardContent className="p-7 text-center"><Database className="mx-auto h-7 w-7 text-cyan-200" /><h1 className="mt-3 text-lg font-semibold text-slate-100">El perímetro sintético está vacío</h1><p className="mt-2 text-sm leading-6 text-slate-400">No existen máquinas ni una configuración disponibles para esta sesión. Puedes recrear el escenario seguro predeterminado; no se conectará a equipos, redes o herramientas reales.</p><Button className="mt-5 bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={() => tick.mutate()} disabled={tick.isPending}><RefreshCw className={`mr-2 h-4 w-4 ${tick.isPending ? "animate-spin" : ""}`} />Crear escenario sintético</Button></CardContent></Card></div>;
  }

  return (
    <div className="control-grid min-h-screen -m-4 p-4 md:p-6">
      <section className="mx-auto max-w-[1600px] space-y-5">
        <header className="scanline rounded-2xl border border-cyan-300/15 bg-slate-950/70 px-5 py-4 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-inner shadow-cyan-200/10"><Waves className="h-5 w-5" /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h1 className="font-mono text-lg font-semibold tracking-[0.08em] text-slate-100">UAOL—MR</h1><span className="text-[10px] font-medium tracking-[0.2em] text-cyan-200/80">PLANTA SINTÉTICA</span><Badge className="border border-cyan-300/25 bg-cyan-300/10 text-[10px] tracking-[0.16em] text-cyan-100 hover:bg-cyan-300/10">SIMULATION ONLY</Badge></div>
                <p className="mt-1 text-xs text-slate-400">Plano de control sintético · Orquestación, supervisión y auditoría persistentes.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-100"><span className="signal-pulse h-1.5 w-1.5 rounded-full bg-emerald-300" />Perímetro protegido</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-500/30 bg-slate-900/60 px-3 py-1.5 text-slate-300"><LockKeyhole className="h-3.5 w-3.5" />Sin equipo, navegador ni hardware real</span>
              <Button variant="outline" size="sm" onClick={() => tick.mutate()} disabled={tick.isPending} className="border-cyan-300/20 bg-slate-900/70 text-slate-100 hover:bg-cyan-300/10"><RefreshCw className={`mr-2 h-3.5 w-3.5 ${tick.isPending ? "animate-spin" : ""}`} />Actualizar señales</Button>
            </div>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2" aria-label="Navegación de consola">
          {([
            ["operacion", "Operación", Gauge],
            ["circuito", "Circuito virtual", CircuitBoard],
            ["tareas", "Tareas UAOL", Bot],
            ["ciclo", "Ciclo y evidencia", Eye],
            ["protocolos", "Protocolos", Radio],
            ["ledger", "Validation Ledger", ClipboardCheck],
          ] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${tab === id ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-50 shadow-sm shadow-cyan-950/30" : "border-slate-700 bg-slate-950/55 text-slate-400 hover:border-slate-500 hover:text-slate-100"}`}><Icon className="h-3.5 w-3.5" />{label}</button>
          ))}
        </nav>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Tareas en curso" value={openTasks.toString().padStart(2, "0")} note="Ciclo UAOL visible" icon={Bot} tone="cyan" />
          <Metric label="Máquinas activas" value={`${machines.filter(machine => machine.state === "operating").length}/${machines.length}`} note="Mundo físico emulado" icon={Activity} tone="emerald" />
          <Metric label="Alertas activas" value={activeAlerts.toString().padStart(2, "0")} note="Sin alarmas reales" icon={AlertTriangle} tone={activeAlerts > 0 ? "rose" : "amber"} />
          <Metric label="Decisiones auditadas" value={(data?.ledger.length ?? 0).toString().padStart(2, "0")} note="Validation Ledger persistente" icon={ShieldCheck} tone="violet" />
        </div>

        {tab === "operacion" && <>
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-slate-700/75 bg-slate-950/65 shadow-xl shadow-black/20"><CardHeader className="border-b border-slate-800 pb-4"><div className="flex items-center justify-between"><div><CardTitle className="text-base text-slate-100">Mapa de proceso / Máquina Realm</CardTitle><CardDescription className="mt-1 text-slate-400">Estados, modos de operación y guardas simuladas.</CardDescription></div><Badge variant="outline" className="border-slate-600 text-slate-300">HMI · SCADA</Badge></div></CardHeader><CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-3">
                {machines.map(machine => <button key={machine.id} onClick={() => setSelectedMachineId(machine.id)} className={`rounded-xl border p-4 text-left transition-all ${activeMachine?.id === machine.id ? "border-cyan-300/45 bg-cyan-300/10 shadow-lg shadow-cyan-950/20" : "border-slate-700 bg-slate-900/50 hover:border-slate-500"}`}><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium text-slate-100">{machine.name}</p><p className="mt-1 text-[11px] text-slate-500">{machine.machineKey} · {machine.area}</p></div><StateDot state={machine.state} /></div><Badge className={`mt-5 border text-[10px] uppercase tracking-wider ${stateStyles[machine.state]}`}>{stageLabels[machine.state] ?? machine.state}</Badge><div className="mt-4 grid grid-cols-2 gap-2 text-[11px]"><TelemetryMini label="Temp." value={machine.telemetry ? `${(machine.telemetry.temperature / 10).toFixed(1)} °C` : "—"} /><TelemetryMini label="Energía" value={machine.telemetry ? `${machine.telemetry.energy}%` : "—"} /></div></button>)}
              </div>
              {activeMachine && <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/65 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm font-medium text-slate-100">{activeMachine.name}</p><p className="mt-1 text-xs text-slate-400">Control de estado estrictamente simulado. Las transiciones sensibles escriben en el Ledger.</p></div><div className="flex items-center gap-2"><Badge className={`border ${stateStyles[activeMachine.state]}`}><StateDot state={activeMachine.state} /><span className="ml-2">{activeMachine.state}</span></Badge><Button size="sm" variant="outline" onClick={() => { const next = activeMachine.operationMode === "manual" ? "autonomous" : "manual"; if (next === "autonomous" && !window.confirm("¿Habilitar modo autónomo solo para esta máquina simulada?")) return; setMachineMode.mutate({ machineId: activeMachine.id, mode: next, confirmed: next === "autonomous" }); }} className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700">{activeMachine.operationMode === "manual" ? "Cambiar a autónomo" : "Cambiar a manual"}</Button></div></div><div className="mt-4 flex flex-wrap gap-2">{(["calibrating", "operating", "maintenance", "stopped", "emergency"] as const).map(next => <Button key={next} size="sm" onClick={() => { if (next === "emergency" && !window.confirm("¿Registrar una parada de emergencia exclusivamente en la simulación?")) return; setPendingMachineState(next); setSelectedMachineId(activeMachine.id); transitionMachine.mutate({ machineId: activeMachine.id, targetState: next, confirmed: next === "emergency" }); }} disabled={transitionMachine.isPending} variant={next === "emergency" ? "destructive" : "outline"} className={next === "emergency" ? "bg-rose-500/85 text-white hover:bg-rose-500" : "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"}>{next === "emergency" ? <PauseCircle className="mr-1.5 h-3.5 w-3.5" /> : <ChevronRight className="mr-1.5 h-3.5 w-3.5" />}{next}</Button>)}</div></div>}
              {activeMachine && <MachineIOTPanel machine={activeMachine} />}
            </CardContent></Card>
            <Card className="border-slate-700/75 bg-slate-950/65 shadow-xl shadow-black/20"><CardHeader className="border-b border-slate-800 pb-4"><div className="flex items-center justify-between"><div><CardTitle className="text-base text-slate-100">Tendencia de telemetría</CardTitle><CardDescription className="mt-1 text-slate-400">Muestras sintéticas persistidas por máquina.</CardDescription></div><Gauge className="h-5 w-5 text-cyan-200" /></div></CardHeader><CardContent className="p-4"><div className="h-[252px]">{chartData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}><XAxis dataKey="time" tick={{ fill: "#718096", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#718096", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#101826", border: "1px solid #314155", borderRadius: 10, color: "#dce8f6" }} /><Line type="monotone" dataKey="temperature" name="Temperatura °C" stroke="#67e8f9" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="energy" name="Energía %" stroke="#a78bfa" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer> : <EmptyChart />}</div><div className="mt-3 flex items-center gap-4 border-t border-slate-800 pt-3 text-[11px] text-slate-400"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-300" />Temperatura</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" />Energía</span><span className="ml-auto">{activeMachine?.machineKey ?? "Sin selección"}</span></div></CardContent></Card>
          </div>
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-slate-700/75 bg-slate-950/65"><CardHeader className="border-b border-slate-800 pb-4"><CardTitle className="flex items-center gap-2 text-base text-slate-100"><AlertTriangle className="h-4 w-4 text-amber-200" />Centro de alertas</CardTitle></CardHeader><CardContent className="space-y-2 p-4">{(data?.alerts ?? []).length ? data?.alerts.slice(0, 5).map(alert => <div key={alert.id} className="rounded-lg border border-rose-400/20 bg-rose-400/5 p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-rose-100">{alert.title}</p><Badge className="border border-rose-400/25 bg-rose-400/10 text-[10px] text-rose-100">{alert.severity}</Badge></div><p className="mt-1 text-[11px] leading-5 text-slate-400">{alert.description}</p><p className="mt-2 text-[10px] text-slate-500">{formatTime(alert.createdAt)} · SIMULADA</p></div>) : <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-5 text-center"><CheckCircle2 className="mx-auto h-5 w-5 text-emerald-300" /><p className="mt-2 text-xs text-emerald-100">No hay alertas activas en la planta sintética.</p></div>}</CardContent></Card>
            <Card className="border-slate-700/75 bg-slate-950/65"><CardHeader className="border-b border-slate-800 pb-4"><CardTitle className="flex items-center gap-2 text-base text-slate-100"><Network className="h-4 w-4 text-cyan-200" />Actividad de protocolo</CardTitle></CardHeader><CardContent className="p-0"><ProtocolRows messages={data?.protocols ?? []} compact /></CardContent></Card>
          </div>
        </>}

        {tab === "circuito" && <VirtualCircuitPanel />}

        {tab === "tareas" && <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
          <Card className="border-cyan-300/15 bg-slate-950/70"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-slate-100"><Bot className="h-4 w-4 text-cyan-200" />Crear tarea simulada</CardTitle><CardDescription className="text-slate-400">La consola registra intención y genera únicamente pasos, evidencias y acciones sintéticas.</CardDescription></CardHeader><CardContent className="space-y-3"><Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Título de tarea" className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-600" /><Textarea value={intent} onChange={event => setIntent(event.target.value)} rows={5} className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-600" /><div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-400">Riesgo<select value={riskLevel} onChange={event => setRiskLevel(event.target.value as typeof riskLevel)} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300"><option value="low">Bajo</option><option value="medium">Medio</option><option value="high">Alto</option><option value="critical">Crítico</option></select></label><label className="text-xs text-slate-400">Modo<select value={mode} onChange={event => setMode(event.target.value as typeof mode)} className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300"><option value="manual">Manual</option><option value="autonomous">Autónomo simulado</option></select></label></div><Button className="w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" onClick={() => createTask.mutate({ title, intent, riskLevel, executionMode: mode })} disabled={createTask.isPending || title.trim().length < 3 || intent.trim().length < 8}><Play className="mr-2 h-4 w-4" />Registrar tarea simulada</Button><p className="rounded-lg border border-slate-700 bg-slate-900/55 p-3 text-[11px] leading-5 text-slate-400"><LockKeyhole className="mr-1 inline h-3.5 w-3.5 text-cyan-200" />La tarea no puede controlar tu navegador, equipo, herramientas personales, red ni hardware. Esta restricción se audita en cada decisión.</p></CardContent></Card>
          <div className="space-y-4">{(data?.tasks ?? []).length ? data?.tasks.map(task => <Card key={task.id} className="border-slate-700/75 bg-slate-950/65"><CardContent className="p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-slate-100">{task.title}</p><Badge className="border border-cyan-300/20 bg-cyan-300/10 text-[10px] text-cyan-100">{stageLabels[task.status]}</Badge><Badge variant="outline" className="border-slate-600 text-[10px] text-slate-300">riesgo {task.riskLevel}</Badge></div><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">{task.intent}</p></div><Button size="sm" onClick={() => advanceTask.mutate({ taskId: task.id })} disabled={task.status === "closed" || advanceTask.isPending} className="bg-slate-800 text-slate-100 hover:bg-slate-700"><ArrowRight className="mr-1.5 h-3.5 w-3.5" />Avanzar ciclo</Button></div><div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-3">{(["open_console", "inspect_page", "complete_form", "capture_evidence"] as const).map(action => <Button key={action} size="sm" variant="outline" onClick={() => computerAction.mutate({ taskId: task.id, action })} className="border-slate-700 bg-slate-900 text-[11px] text-slate-200 hover:bg-cyan-300/10"><Computer className="mr-1.5 h-3.5 w-3.5 text-cyan-200" />{action.replaceAll("_", " ")}</Button>)}</div><p className="mt-3 text-[10px] text-slate-500">Última actualización: {formatTime(task.updatedAt)} · Persistencia activa</p></CardContent></Card>) : <EmptyState icon={Bot} title="Aún no hay tareas" text="Registra una intención para recorrer el ciclo UAOL completamente simulado." />}</div>
        </div>}

        {tab === "ciclo" && <TaskTimeline tasks={data?.tasks ?? []} events={data?.events ?? []} />}

        {tab === "protocolos" && <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]"><Card className="border-slate-700/75 bg-slate-950/65"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-slate-100"><Radio className="h-4 w-4 text-cyan-200" />Emulador protocolario</CardTitle><CardDescription className="text-slate-400">MQTT, OPC UA y Modbus generan mensajes persistentes sin conexiones de red ni dispositivos.</CardDescription></CardHeader><CardContent className="space-y-3">{activeMachine ? <><div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3"><p className="text-xs font-medium text-slate-100">Destino simulado</p><p className="mt-1 text-[11px] text-slate-400">{activeMachine.name} · {activeMachine.machineKey}</p></div><div className="grid grid-cols-3 gap-2">{(["mqtt", "opcua", "modbus"] as const).map(protocolName => <Button key={protocolName} variant="outline" onClick={() => protocol.mutate({ machineId: activeMachine.id, protocol: protocolName, direction: "event" })} className="border-slate-700 bg-slate-900 text-xs uppercase text-slate-100 hover:bg-cyan-300/10">{protocolName}</Button>)}</div><Button variant="outline" onClick={() => { if (window.confirm("¿Registrar un comando de protocolo solo en la simulación?")) protocol.mutate({ machineId: activeMachine.id, protocol: "mqtt", direction: "command", confirmed: true }); }} className="w-full border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15"><TerminalSquare className="mr-2 h-4 w-4" />Emular comando sensible</Button></> : <p className="text-sm text-slate-400">Selecciona una máquina desde Operación.</p>}<p className="rounded-lg border border-slate-700 bg-slate-900/55 p-3 text-[11px] leading-5 text-slate-400">Los canales y payloads llevan el indicador <strong className="text-slate-200">simulationOnly: true</strong>. La plataforma no abre sockets, puertos ni conexiones industriales.</p></CardContent></Card><Card className="border-slate-700/75 bg-slate-950/65"><CardHeader className="border-b border-slate-800 pb-4"><CardTitle className="text-base text-slate-100">Bus de mensajes emulados</CardTitle></CardHeader><CardContent className="p-0"><ProtocolRows messages={data?.protocols ?? []} /></CardContent></Card></div>}

        {tab === "ledger" && <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]"><Card className="border-slate-700/75 bg-slate-950/65"><CardHeader className="border-b border-slate-800 pb-4"><div className="flex items-center justify-between"><div><CardTitle className="flex items-center gap-2 text-base text-slate-100"><ClipboardCheck className="h-4 w-4 text-violet-200" />Validation Ledger</CardTitle><CardDescription className="mt-1 text-slate-400">Decisión, política, evidencia y resultado de cada operación.</CardDescription></div><Badge className="border border-violet-300/20 bg-violet-300/10 text-violet-100">{data?.ledger.length ?? 0} registros</Badge></div></CardHeader><CardContent className="p-0"><div className="max-h-[620px] overflow-auto">{(data?.ledger ?? []).map(entry => <div key={entry.id} className="border-b border-slate-800 p-4 last:border-0"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className={`border text-[10px] ${entry.permissionDecision === "blocked" ? "border-rose-400/25 bg-rose-400/10 text-rose-100" : entry.permissionDecision === "confirmation_required" ? "border-amber-300/25 bg-amber-300/10 text-amber-100" : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"}`}>{entry.permissionDecision}</Badge><span className="font-mono text-xs text-slate-200">{entry.action}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{entry.reason}</p></div><div className="text-left text-[10px] text-slate-500 sm:text-right"><p>{formatTime(entry.createdAt)}</p><p className="mt-1 uppercase">{entry.category} · {entry.riskLevel}</p></div></div>{entry.permissionSnapshotJson ? <p className="mt-3 rounded-md border border-slate-700 bg-slate-900/60 px-2.5 py-2 font-mono text-[10px] text-cyan-100">Política aplicada: {JSON.stringify(entry.permissionSnapshotJson)}</p> : null}</div>)}</div></CardContent></Card><div className="space-y-5"><Card className="border-cyan-300/15 bg-cyan-300/5"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-cyan-50"><ShieldCheck className="h-4 w-4" />Matriz de permisos</CardTitle><CardDescription className="text-cyan-100/65">Políticas persistentes por usuario.</CardDescription></CardHeader><CardContent className="space-y-2">{(data?.permissions ?? []).map(permission => <div key={permission.id} className="rounded-lg border border-cyan-300/15 bg-slate-950/60 p-3"><div className="flex items-center justify-between gap-3"><p className="font-mono text-[11px] text-cyan-100">{permission.actionPattern}</p><Badge className="border border-slate-600 bg-slate-800 text-[10px] text-slate-200">{permission.decision}</Badge></div><p className="mt-1 text-[11px] text-slate-400">{permission.description}</p></div>)}</CardContent></Card><Card className="border-slate-700/75 bg-slate-950/65"><CardContent className="p-5"><CircleDot className="h-5 w-5 text-cyan-200" /><h3 className="mt-3 text-sm font-medium text-slate-100">Evidencia verificable</h3><p className="mt-2 text-xs leading-5 text-slate-400">Cada entrada registra una instantánea de la regla aplicada, el resultado de permiso, una evidencia sintética y una marca temporal. No representa ni afirma actividad en sistemas reales.</p></CardContent></Card></div></div>}
      </section>
    </div>
  );
}

function Metric({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: typeof Activity; tone: "cyan" | "emerald" | "rose" | "amber" | "violet" }) {
  const colors = { cyan: "text-cyan-200 bg-cyan-300/10 border-cyan-300/20", emerald: "text-emerald-200 bg-emerald-300/10 border-emerald-300/20", rose: "text-rose-200 bg-rose-300/10 border-rose-300/20", amber: "text-amber-100 bg-amber-300/10 border-amber-300/20", violet: "text-violet-200 bg-violet-300/10 border-violet-300/20" };
  return <Card className="border-slate-700/75 bg-slate-950/65"><CardContent className="flex items-center justify-between p-4"><div><p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-100">{value}</p><p className="mt-1 text-[11px] text-slate-400">{note}</p></div><div className={`grid h-10 w-10 place-items-center rounded-xl border ${colors[tone]}`}><Icon className="h-4 w-4" /></div></CardContent></Card>;
}

function TelemetryMini({ label, value }: { label: string; value: string }) { return <div className="rounded-md bg-slate-950/60 px-2 py-1.5"><p className="text-[9px] uppercase tracking-wider text-slate-600">{label}</p><p className="mt-0.5 font-mono text-[11px] text-slate-300">{value}</p></div>; }
function EmptyChart() { return <div className="grid h-full place-items-center rounded-lg border border-dashed border-slate-700 text-center"><div><Database className="mx-auto h-5 w-5 text-slate-500" /><p className="mt-2 text-xs text-slate-500">Pulsa “Actualizar señales” para generar telemetría.</p></div></div>; }
function EmptyState({ icon: Icon, title, text }: { icon: typeof Bot; title: string; text: string }) { return <Card className="border-dashed border-slate-700 bg-slate-950/50"><CardContent className="py-14 text-center"><Icon className="mx-auto h-6 w-6 text-slate-500" /><p className="mt-3 text-sm font-medium text-slate-200">{title}</p><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">{text}</p></CardContent></Card>; }
function VirtualCircuitPanel() { const inputs = [["Guard closed", "guardClosed", "Protege la orden de marcha"], ["Thermal trip", "thermalTrip", "Detiene la salida y genera alarma"], ["Emergency latch", "emergencyLatched", "Memoria de parada virtual"]]; const outputs = [["Motor contactor", "motorContactor"], ["Run lamp", "runLamp"], ["Fault lamp", "faultLamp"], ["Alarm siren", "alarmSiren"]]; return <div data-testid="virtual-circuit-panel" className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]"><Card className="overflow-hidden border-cyan-300/20 bg-slate-950/70 shadow-xl shadow-cyan-950/10"><CardHeader className="border-b border-slate-800 pb-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base text-slate-100"><CircuitBoard className="h-4 w-4 text-cyan-200" />Circuito virtual local</CardTitle><CardDescription className="mt-1 text-slate-400">ULSP/1 · Lógica determinista dentro del proyecto.</CardDescription></div><Badge className="border border-cyan-300/25 bg-cyan-300/10 text-[10px] text-cyan-100">SIMULATION ONLY</Badge></div></CardHeader><CardContent className="p-4 md:p-5"><div className="grid gap-4 lg:grid-cols-[1fr_88px_1fr]"><div className="rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-4"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200">Entradas virtuales</p><div className="mt-3 space-y-2">{inputs.map(([label, key, description]) => <div key={key} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-slate-100">{label}</p><span className="font-mono text-[10px] text-cyan-200">{key}</span></div><p className="mt-1 text-[11px] leading-4 text-slate-400">{description}</p></div>)}</div></div><div className="flex min-h-32 items-center justify-center" aria-hidden="true"><div className="w-full border-t border-dashed border-cyan-300/45" /><ChevronRight className="-ml-1 h-5 w-5 shrink-0 text-cyan-200" /></div><div className="rounded-xl border border-violet-300/15 bg-violet-300/5 p-4"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-violet-200">Salidas derivadas</p><div className="mt-3 space-y-2">{outputs.map(([label, key]) => <div key={key} className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5"><p className="text-xs font-medium text-slate-100">{label}</p><p className="mt-1 font-mono text-[10px] text-violet-200">{key}</p></div>)}</div></div></div><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-lg border border-emerald-300/20 bg-emerald-300/5 p-3"><p className="flex items-center gap-2 text-xs font-medium text-emerald-100"><ShieldCheck className="h-3.5 w-3.5" />Enclavamiento prioritario</p><p className="mt-1.5 text-[11px] leading-5 text-slate-400">La marcha sólo se acepta con guarda cerrada, sin disparo térmico y sin emergencia enclavada. Una entrada insegura corta el contactor virtual antes de la siguiente orden.</p></div><div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3"><p className="flex items-center gap-2 text-xs font-medium text-slate-100"><TerminalSquare className="h-3.5 w-3.5 text-cyan-200" />Ejecución local</p><code className="mt-2 block overflow-x-auto rounded bg-slate-950 px-2 py-1.5 text-[10px] text-cyan-100">pnpm local-protocol:client -- guard-open</code><p className="mt-1.5 text-[11px] leading-5 text-slate-400">El CLI altera sólo esta simulación local; no puede escribir salidas ni contactar hardware.</p></div></div></CardContent></Card><Card className="border-slate-700/75 bg-slate-950/65"><CardHeader className="border-b border-slate-800 pb-4"><CardTitle className="text-base text-slate-100">Secuencia del circuito</CardTitle><CardDescription className="mt-1 text-slate-400">La UI ilustra la lógica; los estados vivos se ejercitan por ULSP/1 en el PC local.</CardDescription></CardHeader><CardContent className="space-y-3 p-4">{[["1", "Inicio seguro", "El estado inicial mantiene el contactor y las alarmas virtuales apagados."], ["2", "Solicitud de marcha", "start valida el enclavamiento y energiza únicamente motorContactor virtual."], ["3", "Interrupción prioritaria", "guard-open o thermal-trip lleva el estado a stopped y desactiva el motor."], ["4", "Emergencia y rearme", "emergency_stop queda enclavado; acknowledge sólo llega a stopped y nunca arranca por sí mismo."]].map(([step, title, description]) => <div key={step} className="flex gap-3 rounded-lg border border-slate-700 bg-slate-900/45 p-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan-300/15 font-mono text-[10px] text-cyan-100">{step}</span><div><p className="text-xs font-medium text-slate-100">{title}</p><p className="mt-1 text-[11px] leading-5 text-slate-400">{description}</p></div></div>)}<p className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-[11px] leading-5 text-amber-100"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" />No es una interfaz de control físico ni un diseño certificado de seguridad funcional. Es una lógica virtual validada por pruebas locales.</p></CardContent></Card></div>; }
function MachineIOTPanel({ machine }: { machine: any }) { const sensors = Object.entries((machine.sensorsJson ?? {}) as Record<string, string>); const actuators = Object.entries((machine.actuatorsJson ?? {}) as Record<string, string>); return <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4 md:grid-cols-2"><IOTGroup title="Sensores sintéticos" icon={Eye} items={sensors} tone="cyan" /><IOTGroup title="Actuadores simulados" icon={Activity} items={actuators} tone="violet" /></div>; }
function IOTGroup({ title, icon: Icon, items, tone }: { title: string; icon: typeof Eye; items: [string, string][]; tone: "cyan" | "violet" }) { const color = tone === "cyan" ? "text-cyan-100 border-cyan-300/15 bg-cyan-300/5" : "text-violet-100 border-violet-300/15 bg-violet-300/5"; return <div className={`rounded-lg border p-3 ${color}`}><p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.13em]"><Icon className="h-3.5 w-3.5" />{title}</p><div className="mt-3 grid grid-cols-3 gap-2">{items.map(([key, value]) => <div key={key} className="rounded-md border border-slate-700/60 bg-slate-950/55 px-2 py-1.5"><p className="text-[9px] uppercase text-slate-500">{key}</p><p className="mt-1 font-mono text-[10px] text-slate-200">{value}</p></div>)}</div></div>; }
function TaskTimeline({ tasks, events }: { tasks: any[]; events: any[] }) { const stages = ["intent", "planning", "execution", "observation", "verification", "closure"]; const labels: Record<string, string> = { intent: "Intención", planning: "Plan", execution: "Ejecución", observation: "Observación", verification: "Verificación", closure: "Cierre" }; if (!tasks.length) return <EmptyState icon={ClipboardCheck} title="No existe un ciclo que auditar" text="Crea una tarea para ver la cadena completa de intención, plan, evidencia y cierre." />; return <div className="space-y-4">{tasks.map(task => { const taskEvents = events.filter(event => event.taskId === task.id); return <Card key={task.id} className="border-slate-700/75 bg-slate-950/65"><CardHeader className="border-b border-slate-800 pb-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-base text-slate-100">{task.title}</CardTitle><CardDescription className="mt-1 text-slate-400">Evidencia y fases persistidas para la tarea simulada.</CardDescription></div><Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">{stageLabels[task.status]}</Badge></div></CardHeader><CardContent className="p-4"><div className="grid gap-2 md:grid-cols-6">{stages.map((stage, index) => { const event = taskEvents.find(item => item.stage === stage); return <div key={stage} className={`relative rounded-lg border p-3 ${event ? "border-cyan-300/25 bg-cyan-300/8" : "border-slate-700 bg-slate-900/40"}`}><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${event ? "bg-cyan-300 text-slate-950" : "bg-slate-800 text-slate-500"}`}>{event ? "✓" : index + 1}</span><p className="mt-3 text-[11px] font-medium text-slate-200">{labels[stage]}</p><p className="mt-1 text-[10px] text-slate-500">{event ? formatTime(event.createdAt) : "Pendiente"}</p></div>; })}</div><div className="mt-4 grid gap-2 md:grid-cols-2">{taskEvents.slice(0, 6).map(event => <div key={event.id} className="rounded-lg border border-slate-700 bg-slate-900/55 p-3"><p className="text-[10px] uppercase tracking-wider text-cyan-200">{labels[event.stage]} · {event.outcome}</p><p className="mt-1 text-xs text-slate-300">{event.message}</p><p className="mt-2 text-[10px] text-slate-500">Evidencia: {event.evidenceJson?.summary ?? "sin evidencia adicional"}</p></div>)}</div></CardContent></Card>; })}</div>; }
function ProtocolRows({ messages, compact = false }: { messages: any[]; compact?: boolean }) { if (!messages.length) return <div className="p-8 text-center text-xs text-slate-500">Aún no hay mensajes persistidos.</div>; return <div className={compact ? "max-h-[230px] overflow-auto" : "max-h-[580px] overflow-auto"}>{messages.map(message => <div key={message.id} className="border-b border-slate-800 px-4 py-3 last:border-0"><div className="flex flex-wrap items-center gap-2"><Badge className="border border-cyan-300/20 bg-cyan-300/10 text-[10px] uppercase text-cyan-100">{message.protocol}</Badge><Badge variant="outline" className="border-slate-600 text-[10px] text-slate-300">{message.direction}</Badge><span className="font-mono text-[11px] text-slate-300">{message.channel}</span><span className="ml-auto text-[10px] text-slate-500">{formatTime(message.createdAt)}</span></div><p className="mt-2 truncate font-mono text-[10px] text-slate-500">{JSON.stringify(message.payloadJson)}</p></div>)}</div>; }

import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { CommandType } from "@shared/machine";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Cpu,
  Gauge,
  HeartPulse,
  Loader2,
  LockKeyhole,
  Play,
  Power,
  Radar,
  RefreshCw,
  ShieldCheck,
  Square,
  Thermometer,
  UserCheck,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const stateLabel: Record<string, string> = {
  stopped: "Detenida",
  calibrating: "Calibrando",
  operating: "Operando",
  paused: "En pausa",
  maintenance: "Mantenimiento",
  emergency: "Emergencia simulada",
};

const commandLabel: Record<CommandType, string> = {
  start: "Iniciar ciclo",
  stop: "Detener",
  pause: "Pausar",
  resume: "Reanudar",
  reset: "Restablecer",
  enter_maintenance: "Mantenimiento",
  exit_maintenance: "Salir de mantenimiento",
  acknowledge_alarm: "Reconocer alarma",
  emergency_stop_simulation: "Parada de emergencia",
};

function time(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
}

function statusTone(status: string) {
  if (["executed", "authorized", "allow", "approved"].includes(status)) return "border-emerald-300/25 bg-emerald-400/10 text-emerald-200";
  if (["awaiting_human", "requested", "executing"].includes(status)) return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  if (["policy_rejected", "risk_rejected", "human_rejected", "expired", "failed", "block", "rejected"].includes(status)) return "border-rose-300/25 bg-rose-400/10 text-rose-100";
  return "border-white/15 bg-white/5 text-slate-200";
}

function Metric({ label, value, unit, icon: Icon, accent = "text-cyan-200" }: { label: string; value: string; unit: string; icon: typeof Gauge; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-slate-950/20 p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400">
        <span>{label}</span><Icon className={cn("h-3.5 w-3.5", accent)} />
      </div>
      <div className="mt-2 flex items-end gap-1"><span className="text-2xl font-medium tracking-tight text-slate-100">{value}</span><span className="mb-1 text-xs text-slate-400">{unit}</span></div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const snapshot = trpc.machine.snapshot.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: false });
  const request = trpc.machine.requestCommand.useMutation({
    onSuccess: command => { toast.success(`Orden ${command.status === "awaiting_human" ? "preparada para aprobación" : "bloqueada por un nodo"}.`); utils.machine.snapshot.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const approve = trpc.machine.approveCommand.useMutation({
    onSuccess: () => { toast.success("Decisión humana registrada."); utils.machine.snapshot.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const reject = trpc.machine.rejectCommand.useMutation({
    onSuccess: () => { toast.message("Orden rechazada y auditada."); utils.machine.snapshot.invalidate(); },
    onError: error => toast.error(error.message),
  });

  const data = snapshot.data;
  const activeCommand = data?.commands.find(item => item.status === "awaiting_human") ?? data?.commands[0];
  const validations = useMemo(() => {
    const byNode = new Map<string, (typeof data extends undefined ? never : NonNullable<typeof data>["validations"][number])>();
    if (!activeCommand || !data) return byNode;
    data.validations.filter(item => item.commandId === activeCommand.commandId).forEach(item => {
      if (!byNode.has(item.node)) byNode.set(item.node, item);
    });
    return byNode;
  }, [activeCommand, data]);
  const telemetryHistory = useMemo(() => data ? [
    { point: "-4", temperature: Math.max(20, data.telemetry.temperature - 2.2), power: Math.max(0, data.telemetry.power - 1) },
    { point: "-3", temperature: Math.max(20, data.telemetry.temperature - 1), power: Math.max(0, data.telemetry.power - .4) },
    { point: "-2", temperature: data.telemetry.temperature - .5, power: data.telemetry.power + .2 },
    { point: "-1", temperature: data.telemetry.temperature - .9, power: Math.max(0, data.telemetry.power - .3) },
    { point: "now", temperature: data.telemetry.temperature, power: data.telemetry.power },
  ] : [], [data]);

  const requestCommand = (type: CommandType) => {
    if (!data) return;
    request.mutate({ machineId: data.machine.id, type, testMode: true, idempotencyKey: crypto.randomUUID() });
  };

  const canApprove = Boolean(user && (user.role === "admin" || user.operationRole === "approver" || user.operationRole === "policy_admin"));
  const isRequester = activeCommand?.requestedByUserId === user?.id;

  useEffect(() => {
    if (!isAuthenticated) return;
    const stream = new EventSource("/api/machine/stream");
    const refresh = () => utils.machine.snapshot.invalidate();
    stream.addEventListener("ready", refresh);
    stream.addEventListener("operations-update", refresh);
    return () => stream.close();
  }, [isAuthenticated, utils.machine.snapshot]);

  return (
    <DashboardLayout>
      <div className="ops-grid min-h-[calc(100vh-2rem)] rounded-2xl p-1 sm:p-3">
        <div className="mx-auto max-w-[1500px] space-y-4">
          <header className="ops-glass flex flex-col gap-4 rounded-2xl px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-200/20 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,.15)]"><Cpu className="h-5 w-5 text-cyan-100" /></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">NEXUS / Machine Operations</p><h1 className="mt-1 text-xl font-semibold tracking-tight text-white">Centro de control seguro</h1></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1.5 border-cyan-200/20 bg-cyan-200/10 py-1.5 text-cyan-100 hover:bg-cyan-200/10"><Radar className="h-3.5 w-3.5" /> SOLO SIMULACIÓN</Badge>
              <Badge className="gap-1.5 border-emerald-200/20 bg-emerald-300/10 py-1.5 text-emerald-100 hover:bg-emerald-300/10"><Wifi className="h-3.5 w-3.5" /> Gateway conectado</Badge>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">Rol: <strong className="text-slate-100">{user?.role === "admin" ? "policy_admin" : user?.operationRole ?? "observer"}</strong></span>
            </div>
          </header>

          {!isAuthenticated ? <Card className="ops-glass border-0"><CardContent className="p-10 text-center text-slate-300">Autentícate para cargar el simulador y la bitácora operativa.</CardContent></Card> : snapshot.isError ? <Card className="ops-glass border-0"><CardContent className="p-10 text-center"><XCircle className="mx-auto h-7 w-7 text-rose-200" /><h2 className="mt-4 text-lg font-semibold text-white">No se pudo leer el entorno de simulación</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{snapshot.error.message}</p><Button className="mt-5" onClick={() => snapshot.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Reintentar conexión</Button></CardContent></Card> : snapshot.isLoading || !data ? <Card className="ops-glass border-0"><CardContent className="flex items-center justify-center gap-3 p-12 text-slate-300"><Loader2 className="h-5 w-5 animate-spin text-cyan-200" /> Inicializando el entorno de simulación…</CardContent></Card> : <>
            <section className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
              <Card className="ops-glass overflow-hidden border-0"><CardContent className="p-0">
                <div className="flex flex-col justify-between gap-5 border-b border-white/10 p-5 sm:flex-row sm:items-start">
                  <div><p className="text-xs uppercase tracking-[.18em] text-slate-400">Máquina / {data.machine.machineKey}</p><h2 className="mt-2 text-2xl font-semibold text-white">{data.machine.name}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Representación digital conectada a un gateway de simulación. No hay adaptador ni ruta disponible hacia hardware físico.</p></div>
                  <Badge className={cn("border px-3 py-1.5 text-sm capitalize", data.machine.state === "operating" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : data.machine.state === "emergency" ? "border-rose-300/30 bg-rose-400/10 text-rose-100" : "border-slate-200/15 bg-slate-100/5 text-slate-100")}>{stateLabel[data.machine.state]}</Badge>
                </div>
                <div className="grid gap-4 p-5 lg:grid-cols-[.9fr_1.1fr]">
                  <div className="relative min-h-[245px] overflow-hidden rounded-2xl border border-cyan-100/10 bg-slate-950/35">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,.16),transparent_30%),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px)] bg-[length:auto,22px_22px,22px_22px]" />
                    <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/25 bg-cyan-400/10 shadow-[0_0_55px_rgba(34,211,238,.24)]"><div className={cn("absolute inset-5 rounded-full border-2", data.machine.state === "operating" ? "animate-pulse border-emerald-300 bg-emerald-300/15" : data.machine.state === "emergency" ? "border-rose-300 bg-rose-300/15" : "border-cyan-200/55 bg-cyan-200/10")} /><div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_15px_white]" /></div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-cyan-100/80"><CircleDot className="h-3.5 w-3.5" /> Digital twin / señal viva</div><div className="absolute right-4 top-4 rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1 text-[10px] uppercase tracking-[.16em] text-slate-300">SIM-ONLY</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 content-start"><Metric label="Temperatura" value={data.telemetry.temperature.toFixed(1)} unit="°C" icon={Thermometer} accent="text-amber-200" /><Metric label="Carga" value={data.telemetry.load.toFixed(0)} unit="%" icon={Gauge} /><Metric label="Velocidad" value={data.telemetry.speed.toFixed(0)} unit="rpm" icon={Zap} accent="text-violet-200" /><Metric label="Potencia" value={data.telemetry.power.toFixed(1)} unit="kW" icon={Activity} accent="text-emerald-200" /><Metric label="Presión" value={data.telemetry.pressure.toFixed(1)} unit="bar" icon={HeartPulse} /><Metric label="Latencia" value={String(data.telemetry.latencyMs)} unit="ms" icon={ArrowDownToLine} accent="text-slate-300" /></div>
                </div>
              </CardContent></Card>
              <Card className="ops-glass border-0"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-slate-400">Gateway</p><h2 className="mt-1 font-semibold text-white">Límite de ejecución</h2></div><ShieldCheck className="h-6 w-6 text-emerald-200" /></div><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between border-b border-white/8 pb-3"><span className="text-slate-400">Adaptador activo</span><strong className="text-slate-100">SimulationMachineAdapter</strong></div><div className="flex justify-between border-b border-white/8 pb-3"><span className="text-slate-400">Conexión física</span><strong className="text-rose-200">BLOQUEADA</strong></div><div className="flex justify-between border-b border-white/8 pb-3"><span className="text-slate-400">Último heartbeat</span><strong className="text-slate-100">{time(data.machine.lastHeartbeatAt)}</strong></div><div className="flex justify-between"><span className="text-slate-400">Política activa</span><strong className="text-cyan-100">SIM-1.0</strong></div></div><div className="mt-6 rounded-xl border border-amber-200/15 bg-amber-200/5 p-3 text-xs leading-5 text-amber-100/90"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" /> Las órdenes irreversibles, despliegues, secretos, gastos, permisos y control físico real permanecen rechazados por contrato.</div></CardContent></Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-[.78fr_1.22fr]">
              <Card className="ops-glass border-0"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-slate-400">Command center</p><h2 className="mt-1 text-lg font-semibold text-white">Operaciones preparadas</h2></div><Badge className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/5">A0–A3</Badge></div><div className="mt-5 grid grid-cols-2 gap-2"><Button onClick={() => requestCommand("start")} disabled={request.isPending} className="bg-emerald-300 text-emerald-950 hover:bg-emerald-200"><Play className="mr-2 h-4 w-4" />Iniciar</Button><Button onClick={() => requestCommand("stop")} disabled={request.isPending} variant="secondary"><Square className="mr-2 h-4 w-4" />Detener</Button><Button onClick={() => requestCommand("pause")} disabled={request.isPending} variant="secondary"><Power className="mr-2 h-4 w-4" />Pausar</Button><Button onClick={() => requestCommand("resume")} disabled={request.isPending} variant="secondary"><RefreshCw className="mr-2 h-4 w-4" />Reanudar</Button><Button onClick={() => requestCommand("enter_maintenance")} disabled={request.isPending} variant="secondary"><ClipboardCheck className="mr-2 h-4 w-4" />Mantener</Button><Button onClick={() => requestCommand("reset")} disabled={request.isPending} variant="secondary"><RefreshCw className="mr-2 h-4 w-4" />Restablecer</Button><Button onClick={() => requestCommand("emergency_stop_simulation")} disabled={request.isPending} variant="destructive" className="col-span-2"><AlertTriangle className="mr-2 h-4 w-4" />Parada de emergencia simulada</Button></div><p className="mt-4 text-xs leading-5 text-slate-400">Cada acción queda preparada y bloqueada hasta que los nodos de política, riesgo y aprobación humana independiente coincidan.</p></CardContent></Card>
              <Card className="ops-glass border-0"><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[.18em] text-slate-400">Triple confirmación</p><h2 className="mt-1 text-lg font-semibold text-white">{activeCommand ? commandLabel[activeCommand.type as CommandType] : "Sin orden activa"}</h2></div>{activeCommand && <Badge className={cn("border capitalize", statusTone(activeCommand.status))}>{activeCommand.status.replaceAll("_", " ")}</Badge>}</div><div className="mt-5 grid gap-3 md:grid-cols-3">{[
                { key: "policy", icon: ShieldCheck, title: "01 · Política y rol", detail: "Permiso, alcance y modo", defaultText: "Pendiente" },
                { key: "risk", icon: HeartPulse, title: "02 · Estado y riesgo", detail: "Transición y telemetría", defaultText: "Pendiente" },
                { key: "human", icon: UserCheck, title: "03 · Aprobación humana", detail: "Revisión independiente", defaultText: "Pendiente" },
              ].map(node => { const validation = validations.get(node.key); const Icon = node.icon; return <div key={node.key} className={cn("rounded-xl border p-3", validation ? statusTone(validation.decision) : "border-white/10 bg-slate-950/20 text-slate-300")}><div className="flex items-center justify-between"><Icon className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-[.15em]">{validation?.decision ?? node.defaultText}</span></div><p className="mt-3 text-sm font-medium">{node.title}</p><p className="mt-1 text-xs leading-5 opacity-75">{validation?.reason ?? node.detail}</p></div>; })}</div>{activeCommand?.status === "awaiting_human" && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/15 bg-amber-200/5 p-3"><div className="text-sm text-amber-50"><strong>Aprobación requerida.</strong> {isRequester ? "La regla de independencia exige un aprobador distinto." : "Un aprobador autorizado puede decidir ahora."}</div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={reject.isPending} onClick={() => reject.mutate({ commandId: activeCommand.commandId, reason: "Rechazada por revisión humana explícita." })}>Rechazar</Button><Button size="sm" disabled={!canApprove || isRequester || approve.isPending} onClick={() => approve.mutate({ commandId: activeCommand.commandId })}><CheckCircle2 className="mr-1.5 h-4 w-4" />Aprobar</Button></div></div>}</CardContent></Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
              <Card className="ops-glass border-0"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-slate-400">Live telemetry</p><h2 className="mt-1 text-lg font-semibold text-white">Temperatura y potencia</h2></div><span className="text-xs text-slate-400">Actualización 2,5 s</span></div><div className="mt-5 h-48"><ResponsiveContainer width="100%" height="100%"><AreaChart data={telemetryHistory}><defs><linearGradient id="telemetryFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#67e8f9" stopOpacity={.35} /><stop offset="100%" stopColor="#67e8f9" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="point" hide /><YAxis hide domain={[0, "dataMax + 8"]} /><Tooltip contentStyle={{ background: "#102334", border: "1px solid rgba(207,250,254,.2)", borderRadius: 12 }} /><Area type="monotone" dataKey="temperature" stroke="#a5f3fc" strokeWidth={2} fill="url(#telemetryFill)" /><Area type="monotone" dataKey="power" stroke="#a7f3d0" strokeWidth={1.5} fill="transparent" /></AreaChart></ResponsiveContainer></div></CardContent></Card>
              <Card className="ops-glass border-0"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-slate-400">Audit stream</p><h2 className="mt-1 text-lg font-semibold text-white">Trazabilidad append-only</h2></div><span className="text-xs text-slate-400">Hash encadenado</span></div><div className="mt-4 max-h-52 space-y-2 overflow-auto pr-1">{data.audit.slice(0, 7).map(item => <div key={item.sequence} className="flex gap-3 rounded-lg border border-white/7 bg-slate-950/20 px-3 py-2"><div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,.8)]" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-slate-100">{item.reason}</span><span className="shrink-0 text-[10px] text-slate-500">{time(item.createdAt)}</span></div><p className="mt-1 text-[10px] uppercase tracking-[.13em] text-slate-500">{item.node} · {item.decision} · #{item.sequence}</p></div></div>)}</div></CardContent></Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2"><Card className="ops-glass border-0"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-slate-400">Cola de órdenes</p><h2 className="mt-1 text-lg font-semibold text-white">Últimas decisiones</h2></div><ChevronRight className="h-5 w-5 text-slate-500" /></div><div className="mt-4 space-y-2">{data.commands.slice(0, 5).map(command => <div key={command.commandId} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-slate-950/20 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm text-slate-100">{commandLabel[command.type as CommandType]}</p><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-slate-500">{time(command.createdAt)} · {command.commandId.slice(0, 8)}</p></div><Badge className={cn("shrink-0 border text-[10px]", statusTone(command.status))}>{command.status.replaceAll("_", " ")}</Badge></div>)}</div></CardContent></Card><Card className="ops-glass border-0"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-slate-400">Alarmas</p><h2 className="mt-1 text-lg font-semibold text-white">Estado del simulador</h2></div>{data.alarms.some(alarm => alarm.status === "active") ? <AlertTriangle className="h-5 w-5 text-amber-200" /> : <CheckCircle2 className="h-5 w-5 text-emerald-200" />}</div><div className="mt-4 space-y-2">{data.alarms.length ? data.alarms.map(alarm => <div key={alarm.id} className={cn("rounded-xl border px-3 py-3", alarm.severity === "critical" ? "border-rose-300/20 bg-rose-300/7" : "border-amber-300/15 bg-amber-300/5")}><div className="flex justify-between gap-3"><p className="text-sm text-slate-100">{alarm.message}</p><Badge className="border-white/10 bg-white/5 text-[10px] text-slate-200">{alarm.status}</Badge></div><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-slate-500">{alarm.code} · {time(alarm.raisedAt)}</p></div>) : <div className="rounded-xl border border-emerald-300/12 bg-emerald-300/5 px-3 py-4 text-sm text-emerald-100"><CheckCircle2 className="mr-2 inline h-4 w-4" />No hay alarmas activas en el entorno de simulación.</div>}</div></CardContent></Card></section>
          </>}
        </div>
      </div>
    </DashboardLayout>
  );
}

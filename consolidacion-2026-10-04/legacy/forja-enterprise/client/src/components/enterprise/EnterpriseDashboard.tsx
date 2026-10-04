import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Code2,
  Copy,
  Database,
  Download,
  Eye,
  FileCode2,
  Fingerprint,
  GitBranch,
  KeyRound,
  Layers3,
  LockKeyhole,
  LogOut,
  Menu,
  Mail,
  MoreHorizontal,
  Network,
  PackageCheck,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  ServerCog,
  Settings2,
  ShieldCheck,
  ShieldX,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  Timer,
  Trash2,
  UserRound,
  UsersRound,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "audit", label: "Merkle Audit Logs", icon: Fingerprint },
  { id: "policies", label: "RBAC Policies", icon: SlidersHorizontal },
  { id: "organizations", label: "Organizations", icon: UsersRound },
  { id: "plugins", label: "Wasm Plugins", icon: PackageCheck },
  { id: "refactor", label: "Refactor Pipeline", icon: Workflow },
  { id: "security", label: "Security Events", icon: ShieldCheck },
  { id: "graph", label: "Semantic Graph", icon: Network },
  { id: "analytics", label: "Analytics", icon: BarChart },
  { id: "keys", label: "TrustedKeys", icon: KeyRound },
] as const;

type ViewId = (typeof navItems)[number]["id"];

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const formatDate = (value: string) => new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

function downloadText(filename: string, content: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportRecords(filename: string, records: unknown[]) {
  downloadText(filename, JSON.stringify(records, null, 2));
  toast.success(`${filename} downloaded`);
}

function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) {
    toast.info("There are no records to export yet.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","))].join("\\n");
  downloadText(filename, csv, "text/csv");
  toast.success(`${filename} downloaded`);
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "amber" | "red" | "blue" | "purple" }) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button aria-label={label} title={label} className="icon-button" onClick={onClick}>{children}</button>;
}

function Panel({ title, eyebrow, action, children, className = "" }: { title: string; eyebrow?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`data-panel ${className}`}>
    <div className="panel-heading">
      <div>
        {eyebrow && <span className="panel-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </section>;
}

function MetricCard({ label, value, delta, detail, icon: Icon, tone }: { label: string; value: string; delta: string; detail: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; tone: string }) {
  const positive = !delta.startsWith("-");
  const live = delta === "LIVE";
  return <div className="metric-card">
    <div className="metric-top"><span className={`metric-icon ${tone}`}><Icon size={17} strokeWidth={1.8} /></span><span className="metric-label">{label}</span><MoreHorizontal size={17} className="muted-icon" /></div>
    <div className="metric-value-row"><strong>{value}</strong>{live ? <span className="delta-positive">LIVE</span> : <span className={positive ? "delta-positive" : "delta-negative"}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{delta}</span>}</div>
    <div className="metric-detail">{detail}</div>
  </div>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="empty-state"><div className="empty-icon"><Database size={18} /></div><strong>{title}</strong><span>{body}</span></div>;
}

function Overview({ snapshot, onNavigate }: { snapshot: any; onNavigate: (view: ViewId) => void }) {
  const chartData = snapshot.analytics.timeline;
  const pendingJobs = snapshot.jobs.filter((job: any) => job.status === "PENDING").length;
  const unresolvedCritical = snapshot.securityEvents.filter((event: any) => !event.resolved && event.severity === "CRITICAL").length;
  const unresolvedHigh = snapshot.securityEvents.filter((event: any) => !event.resolved && event.severity === "HIGH").length;
  const securityScore = Math.max(0, 100 - unresolvedCritical * 20 - unresolvedHigh * 8);
  const fsmSequence = ["PLAN_GENERATED", "AWAITING_APPROVAL", "EXECUTING_TOOL", "VALIDATING"];
  const fsmStepByState: Record<string, number> = { PLANNING: 0, AWAITING_APPROVAL: 1, EXECUTING_TOOL: 2, WAITING_FOR_IO: 2, VALIDATING: 3, ROLLING_BACK: 3, HALTED: 3, IDLE: -1 };
  const fsmActiveIndex = fsmStepByState[snapshot.metrics.fsmState] ?? -1;
  const latestBlock = snapshot.auditLogs[0]?.createdAt ? formatTime(snapshot.auditLogs[0].createdAt) : "—";
  const criticalCount = snapshot.securityEvents.filter((event: any) => event.severity === "CRITICAL").length;
  const highCount = snapshot.securityEvents.filter((event: any) => event.severity === "HIGH").length;
  const mediumCount = snapshot.securityEvents.filter((event: any) => event.severity === "MEDIUM").length;
  return <div className="view-stack">
    <div className="hero-row">
      <div>
        <span className="kicker"><span className="live-dot" /> LIVE CONTROL PLANE</span>
        <h1>Engineering governance at machine speed.</h1>
        <p>Cryptographic traceability, policy enforcement and zero-trust execution across every AI-assisted change.</p>
      </div>
      <div className="hero-actions"><Button className="btn-dark" onClick={() => exportRecords("forja-evidence.json", snapshot.auditLogs)}><Download size={15} /> Export evidence</Button><Button className="btn-primary" onClick={() => onNavigate("refactor")}><Play size={15} /> Launch pipeline</Button></div>
    </div>
    <div className="metric-grid">
      <MetricCard label="Active ACID transactions" value={String(snapshot.metrics.activeTransactions).padStart(2, "0")} delta="LIVE" detail={`WAL queue · ${pendingJobs} awaiting approval`} icon={Database} tone="cyan" />
      <MetricCard label="Audit events / second" value={String(snapshot.metrics.auditEventsPerSecond)} delta="LIVE" detail={`Merkle chain · ${snapshot.metrics.merkleIntegrity.toFixed(2)}% integrity`} icon={Fingerprint} tone="violet" />
      <MetricCard label="Plugins in sandbox" value={String(snapshot.metrics.sandboxedPlugins).padStart(2, "0")} delta="LIVE" detail="Sigstore verified · Wasmtime" icon={Box} tone="orange" />
      <MetricCard label="Protected source files" value={formatNumber(snapshot.metrics.protectedFiles)} delta="LIVE" detail={`Across ${snapshot.workspaces.length} active workspaces`} icon={FileCode2} tone="green" />
    </div>
    <div className="grid-two-one">
      <Panel title="Execution telemetry" eyebrow="LAST 3 HOURS" action={<Button variant="ghost" className="panel-link" onClick={() => onNavigate("analytics")}>View analytics <ChevronRight size={14} /></Button>}>
        <div className="chart-wrap large-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><defs><linearGradient id="eventsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55d6c2" stopOpacity={0.28} /><stop offset="100%" stopColor="#55d6c2" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#273443" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#728298", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#728298", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#111a25", border: "1px solid #2c3b4d", borderRadius: 10, fontSize: 12 }} /><Area type="monotone" dataKey="events" stroke="#55d6c2" strokeWidth={2} fill="url(#eventsFill)" /><Line type="monotone" dataKey="tokens" stroke="#a88bff" strokeWidth={2} dot={false} yAxisId={0} /></AreaChart></ResponsiveContainer></div>
        <div className="chart-legend"><span><i className="legend-line teal" />Audit events</span><span><i className="legend-line violet" />Token volume</span><span className="chart-note">Latest block <b>{latestBlock}</b></span></div>
      </Panel>
      <Panel title="Agent FSM" eyebrow="CURRENT STATE">
        <div className="fsm-orbit"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="fsm-core"><Sparkles size={20} /><strong>{snapshot.metrics.fsmState}</strong><span>agent-forja</span></div></div>
        <div className="fsm-steps">{fsmSequence.map((step, index) => { const isDone = fsmActiveIndex >= 0 && index < fsmActiveIndex; const isActive = index === fsmActiveIndex; return <span className={isActive ? "active" : isDone ? "done" : ""} key={step}>{isDone ? <Check size={11} /> : <CircleDot size={11} />} {step}</span>; })}</div>
        <div className="fsm-foot"><span>State transition latency</span><b>{snapshot.auditLogs.length ? "Derived from signed events" : "—"}</b></div>
      </Panel>
    </div>
    <div className="grid-two-one">
      <Panel title="Live audit stream" eyebrow="APPROVAL CHAIN" action={<Button variant="ghost" className="panel-link" onClick={() => onNavigate("audit")}>Open ledger <ChevronRight size={14} /></Button>}>
        <div className="audit-feed">{snapshot.auditLogs.length ? snapshot.auditLogs.slice(0, 5).map((log: any) => <div className="feed-row" key={log.id}><div className={`feed-avatar ${log.actorType === "AI_AGENT" ? "agent" : "human"}`}>{log.actorType === "AI_AGENT" ? <Sparkles size={15} /> : <UserRound size={15} />}</div><div className="feed-main"><div><b>{log.action}</b><span className="feed-meta">{log.actorId}</span></div><span className="feed-files">{log.targetFiles.join(" · ")}</span></div><div className="feed-side"><Badge tone="green">{log.signatureStatus}</Badge><span>{formatTime(log.createdAt)}</span></div></div>) : <EmptyState title="Verified idle — no signed transitions" body="The ledger is quiet. New entries appear after a cryptographically signed FSM transition is committed." />}</div>
      </Panel>
      <Panel title="Security posture" eyebrow="LAST 24 HOURS" action={<Button variant="ghost" className="panel-link" onClick={() => onNavigate("security")}>Investigate <ChevronRight size={14} /></Button>}>
        <div className="security-score"><div className="score-ring"><strong>{securityScore}</strong><span>/ 100</span></div><div><b>{unresolvedCritical ? "Investigate critical event" : "Hardened perimeter"}</b><p>{snapshot.securityEvents.length ? `${snapshot.securityEvents.length} detection(s) recorded in this feed.` : "No security events recorded yet."}</p></div></div>
        <div className="security-bars"><div><span><i className="dot red" />Critical</span><b>{String(criticalCount).padStart(2, "0")}</b></div><div><span><i className="dot amber" />High</span><b>{String(highCount).padStart(2, "0")}</b></div><div><span><i className="dot blue" />Medium</span><b>{String(mediumCount).padStart(2, "0")}</b></div></div>
      </Panel>
    </div>
    <Panel title="Workspace mesh" eyebrow="E2EE / CRDT REPLICATION" action={<IconButton label="Refresh workspace state"><RefreshCw size={15} /></IconButton>}>
      <div className="workspace-grid">{snapshot.workspaces.length ? snapshot.workspaces.map((workspace: any) => <div className="workspace-card" key={workspace.id}><div className="workspace-card-top"><span className={`sync-icon ${workspace.syncStatus.toLowerCase()}`}><GitBranch size={16} /></span><Badge tone={workspace.syncStatus === "SYNCED" ? "green" : "amber"}>{workspace.syncStatus}</Badge></div><b>{workspace.name}</b><span className="workspace-repo">{workspace.repoName}</span><div className="workspace-meta"><span><UsersRound size={13} /> {workspace.crdtPeers} peers</span><span><LockKeyhole size={13} /> {workspace.e2eeStatus}</span><span>{formatTime(workspace.lastSyncAt)}</span></div></div>) : <EmptyState title="Mesh awaiting attestation" body="Connect a workspace to begin E2EE / CRDT replication for this organization." />}</div>
    </Panel>
  </div>;
}

function AuditView({ snapshot }: { snapshot: any }) {
  const [actorFilter, setActorFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const verifiedCount = snapshot.auditLogs.filter((log: any) => log.signatureStatus === "VERIFIED" && log.chainStatus !== "INVALID").length;
  const verificationPercent = snapshot.auditLogs.length ? Math.round((verifiedCount / snapshot.auditLogs.length) * 100) : 0;
  const filtered = snapshot.auditLogs.filter((log: any) => (actorFilter === "ALL" || log.actorType === actorFilter) && (actionFilter === "ALL" || log.action === actionFilter));
  const pageSize = 5;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  return <div className="view-stack"><ViewHeader eyebrow="CRYPTOGRAPHIC EVIDENCE" title="Merkle Audit Logs" description="Immutable custody chain for every FSM transition, WAL commit and human approval." action={<Button className="btn-dark" onClick={() => exportCsv("forja-audit-logs.csv", filtered)}><Download size={15} /> Export CSV</Button>} /><div className="audit-summary"><div><span>CHAIN TIP</span><b>{snapshot.auditLogs[0]?.walHash ?? "—"}</b></div><div><span>SIGNATURE SCHEME</span><b>Ed25519 / SHA-256</b></div><div><span>VERIFICATION</span><b className={verificationPercent === 100 ? "text-green" : "delta-negative"}><CheckCircle2 size={15} /> {verificationPercent}% VERIFIED</b></div><div><span>RETENTION</span><b>7 years</b></div></div><Panel title="Ledger entries" eyebrow={`${filtered.length} RECORDS`} action={<div className="inline-filters"><select value={actorFilter} onChange={(event) => { setActorFilter(event.target.value); setPage(1); }}><option value="ALL">All actors</option><option value="HUMAN">HUMAN</option><option value="AI_AGENT">AI_AGENT</option></select><select value={actionFilter} onChange={(event) => { setActionFilter(event.target.value); setPage(1); }}><option value="ALL">All actions</option><option value="PLAN_GENERATED">PLAN_GENERATED</option><option value="TOOL_EXECUTED">TOOL_EXECUTED</option><option value="WAL_COMMITTED">WAL_COMMITTED</option><option value="ROLLBACK_TRIGGERED">ROLLBACK_TRIGGERED</option><option value="SANDBOX_TRAPPED">SANDBOX_TRAPPED</option></select></div>}><div className="table-scroll"><table className="data-table"><thead><tr><th>TIME / ID</th><th>ACTOR</th><th>FSM ACTION</th><th>TARGET FILES</th><th>WAL HASH</th><th>SIGNATURE</th><th /></tr></thead><tbody>{items.map((log: any) => <tr key={log.id}><td><b>{formatTime(log.createdAt)}</b><span className="table-sub">#{log.id}</span></td><td><span className="actor-cell"><span className={`mini-avatar ${log.actorType === "AI_AGENT" ? "agent" : "human"}`}>{log.actorType === "AI_AGENT" ? <Sparkles size={12} /> : <UserRound size={12} />}</span><span>{log.actorId}<small>{log.actorType}</small></span></span></td><td><span className="action-code">{log.action}</span></td><td><span className="files-cell">{log.targetFiles.map((file: string) => <code key={file}>{file}</code>)}</span></td><td><span className="hash-cell">{log.walHash}</span></td><td><Badge tone={log.signatureStatus === "VERIFIED" && log.chainStatus !== "INVALID" ? "green" : log.signatureStatus === "PENDING" ? "amber" : "red"}><CheckCircle2 size={12} /> {log.signatureStatus} · {log.chainStatus ?? "UNVERIFIED"}</Badge></td><td><IconButton label="Copy audit evidence" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(log)); toast.success("Audit evidence copied"); }}><Copy size={15} /></IconButton></td></tr>)}</tbody></table></div>{items.length === 0 && <EmptyState title="No audit entries" body="Adjust filters or wait for the next signed transition." />}<div className="pagination"><span>Showing {items.length} of {filtered.length} records</span><div><IconButton label="Previous page" onClick={() => setPage(Math.max(1, page - 1))}><ChevronLeft size={15} /></IconButton><b>{page} / {pages}</b><IconButton label="Next page" onClick={() => setPage(Math.min(pages, page + 1))}><ChevronRight size={15} /></IconButton></div></div></Panel></div>;
}

function PoliciesView({ snapshot }: { snapshot: any }) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState("junior_dev");
  const [resource, setResource] = useState("state:EXECUTING_TOOL");
  const [effect, setEffect] = useState("REQUIRE_HUMAN_APPROVAL");
  const [editing, setEditing] = useState<any | null>(null);
  const create = trpc.enterprise.createPolicy.useMutation({ onSuccess: () => { toast.success("RBAC policy created"); setShowForm(false); utils.enterprise.snapshot.invalidate(); }, onError: () => toast.error("Policy could not be created") });
  const update = trpc.enterprise.updatePolicy.useMutation({ onSuccess: () => { toast.success("RBAC policy updated"); setShowForm(false); setEditing(null); utils.enterprise.snapshot.invalidate(); }, onError: () => toast.error("Policy could not be updated") });
  const remove = trpc.enterprise.deletePolicy.useMutation({ onSuccess: () => { toast.success("Policy deleted"); utils.enterprise.snapshot.invalidate(); } });
  return <div className="view-stack"><ViewHeader eyebrow="POLICY DECISION POINT" title="RBAC Policies" description="Every tool execution is evaluated against an explicit organization policy before it enters EXECUTING_TOOL." action={<Button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> New policy</Button>} /><Panel title="Organization policy matrix" eyebrow={`${snapshot.organizations[0]?.name ?? "ORGANIZATION"} · RBAC`}><div className="policy-grid">{snapshot.policies.map((policy: any) => <div className="policy-card" key={policy.id}><div className="policy-card-top"><Badge tone={policy.effect === "ALLOW" ? "green" : policy.effect === "DENY" ? "red" : "amber"}>{policy.effect}</Badge><span><IconButton label="Edit policy" onClick={() => { setEditing(policy); setRole(policy.role); setResource(policy.resource); setEffect(policy.effect); setShowForm(true); }}><Pencil size={14} /></IconButton><IconButton label="Delete policy" onClick={() => remove.mutate({ id: policy.id })}><Trash2 size={14} /></IconButton></span></div><b>{policy.resource}</b><span className="policy-role"><UserRound size={13} /> {policy.role}</span><div className="policy-conditions">{Object.entries(policy.conditions ?? {}).map(([key, value]) => <span key={key}>{key}: <b>{String(value)}</b></span>)}</div><span className="policy-updated">Updated {formatDate(policy.updatedAt)}</span></div>)}</div></Panel>{showForm && <Modal title={editing ? "Update RBAC policy" : "Create RBAC policy"} onClose={() => { setShowForm(false); setEditing(null); }}><div className="form-grid"><label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option>junior_dev</option><option>senior_dev</option><option>ciso</option><option>admin</option></select></label><label>Resource<Input value={resource} onChange={(event) => setResource(event.target.value)} /></label><label>Effect<select value={effect} onChange={(event) => setEffect(event.target.value)}><option>ALLOW</option><option>REQUIRE_HUMAN_APPROVAL</option><option>DENY</option></select></label></div><div className="modal-actions"><Button className="btn-dark" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button><Button className="btn-primary" onClick={() => editing ? update.mutate({ id: editing.id, role: role as any, resource, effect: effect as any }) : create.mutate({ role: role as any, resource, effect: effect as any })}>{create.isPending || update.isPending ? "Saving…" : editing ? "Update policy" : "Create policy"}</Button></div></Modal>}</div>;
}

function OrganizationsView({ snapshot }: { snapshot: any }) {
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("senior_dev");
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<number | null>(null);
  const [memberWorkspaceId, setMemberWorkspaceId] = useState<number | null>(null);
  const memberInput = useMemo(() => ({ workspaceId: memberWorkspaceId ?? 0 }), [memberWorkspaceId]);
  const membersQuery = trpc.enterprise.workspaceMembers.useQuery(memberInput, { enabled: memberWorkspaceId !== null });
  const updateRole = trpc.enterprise.updateMemberRole.useMutation({ onSuccess: () => { toast.success("Member role updated"); membersQuery.refetch(); utils.enterprise.snapshot.invalidate(); }, onError: () => toast.error("Member role could not be updated") });
  const create = trpc.enterprise.createOrganization.useMutation({ onSuccess: () => { toast.success("Organization created"); setShowCreate(false); setName(""); utils.enterprise.snapshot.invalidate(); } });
  const invite = trpc.enterprise.inviteMember.useMutation({ onSuccess: (result) => { if (result.success) { toast.success("Invitation queued"); setShowInvite(false); setInviteEmail(""); } else toast.error("Invitation could not be persisted"); } });
  return <div className="view-stack"><ViewHeader eyebrow="MULTI-TENANT CONTROL" title="Organizations & workspaces" description="Isolate policy, cryptographic trust and collaborative state by organization and workspace." action={<Button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> Create organization</Button>} /><div className="org-grid">{snapshot.organizations.map((org: any) => <div className="org-card" key={org.id}><div className="org-card-top"><div className="org-mark">{org.name.slice(0, 2).toUpperCase()}</div><Badge tone={org.plan === "FEDRAMP" ? "purple" : "blue"}>{org.plan}</Badge></div><h3>{org.name}</h3><span className="muted-copy">{org.slug}</span><div className="org-stats"><span><b>{org.members}</b> members</span><span><b>{org.workspaces}</b> workspaces</span></div><div className="org-key"><LockKeyhole size={13} /> {org.e2eePublicKey}</div></div>)}</div><Panel title="Workspace directory" eyebrow="SYNC STATE"><div className="table-scroll"><table className="data-table"><thead><tr><th>WORKSPACE</th><th>REPOSITORY</th><th>SYNC STATUS</th><th>CRDT PEERS</th><th>VECTOR CLOCK</th><th /></tr></thead><tbody>{snapshot.workspaces.map((workspace: any) => <tr key={workspace.id}><td><b>{workspace.name}</b><span className="table-sub">org #{workspace.orgId}</span></td><td><span className="repo-cell"><GitBranch size={13} />{workspace.repoName}</span></td><td><Badge tone={workspace.syncStatus === "SYNCED" ? "green" : "amber"}>{workspace.syncStatus}</Badge></td><td>{workspace.crdtPeers} peers</td><td><span className="hash-cell">{Object.entries(workspace.vectorClock).map(([key, value]) => `${key}:${value}`).join(" · ")}</span></td><td><div className="table-actions"><Button variant="ghost" className="table-action" onClick={() => setMemberWorkspaceId(workspace.id)}><UsersRound size={14} /> Manage</Button><Button variant="ghost" className="table-action" onClick={() => { setInviteWorkspaceId(workspace.id); setShowInvite(true); }}><Mail size={14} /> Invite</Button></div></td></tr>)}</tbody></table></div></Panel>{memberWorkspaceId !== null && <Panel title="Workspace access" eyebrow={`WORKSPACE #${memberWorkspaceId}`}><div className="member-panel-head"><select value={memberWorkspaceId} onChange={(event) => setMemberWorkspaceId(Number(event.target.value))}>{snapshot.workspaces.map((workspace: any) => <option value={workspace.id} key={workspace.id}>{workspace.name}</option>)}</select><Button variant="ghost" className="table-action" onClick={() => membersQuery.refetch()}><RefreshCw size={14} /> Refresh</Button></div>{membersQuery.isLoading ? <div className="empty-state"><b>Loading members…</b></div> : membersQuery.data?.length ? <div className="member-list">{membersQuery.data.map((member: any) => <div className="member-row" key={member.id}><div><b>{member.inviteEmail ?? `user #${member.userId}`}</b><span>{member.status}</span></div><select value={member.role} onChange={(event) => updateRole.mutate({ id: member.id, role: event.target.value as any })}><option>junior_dev</option><option>senior_dev</option><option>ciso</option><option>admin</option></select></div>)}</div> : <EmptyState title="No members yet" body="Invite a member and assign junior_dev, senior_dev, ciso or admin." />}</Panel>}{showCreate && <Modal title="Create organization" onClose={() => setShowCreate(false)}><div className="form-grid"><label>Organization name<Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Helix Payments" /></label><label>Plan<select defaultValue="ENTERPRISE"><option>ENTERPRISE</option><option>FEDRAMP</option><option>TEAM</option><option>FREE</option></select></label></div><div className="modal-actions"><Button className="btn-dark" onClick={() => setShowCreate(false)}>Cancel</Button><Button className="btn-primary" onClick={() => create.mutate({ name, plan: "ENTERPRISE" })} disabled={!name.trim()}>Create organization</Button></div></Modal>}{showInvite && inviteWorkspaceId && <Modal title="Invite workspace member" onClose={() => setShowInvite(false)}><div className="form-grid"><label>Email address<Input autoFocus type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" /></label><label>Role<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}><option>junior_dev</option><option>senior_dev</option><option>ciso</option><option>admin</option></select></label></div><div className="modal-actions"><Button className="btn-dark" onClick={() => setShowInvite(false)}>Cancel</Button><Button className="btn-primary" disabled={!inviteEmail.includes("@")} onClick={() => invite.mutate({ workspaceId: inviteWorkspaceId, email: inviteEmail, role: inviteRole as any })}>{invite.isPending ? "Inviting…" : "Send invitation"}</Button></div></Modal>}</div>;
}

function PluginsView({ snapshot }: { snapshot: any }) {
  const utils = trpc.useUtils();
  const [showRegister, setShowRegister] = useState(false);
  const [pluginName, setPluginName] = useState("");
  const [pluginVersion, setPluginVersion] = useState("1.0.0");
  const [wasmDigest, setWasmDigest] = useState("");
  const [signer, setSigner] = useState("");
  const [sigstoreBundle, setSigstoreBundle] = useState("");
  const [capabilityText, setCapabilityText] = useState("filesystem:read");
  const toggle = trpc.enterprise.togglePlugin.useMutation({ onSuccess: () => { utils.enterprise.snapshot.invalidate(); toast.success("Plugin state updated"); } });
  const register = trpc.enterprise.createPlugin.useMutation({ onSuccess: () => { toast.success("Plugin registered"); setShowRegister(false); setPluginName(""); setWasmDigest(""); setSigner(""); setSigstoreBundle(""); utils.enterprise.snapshot.invalidate(); }, onError: () => toast.error("Plugin registration failed") });
  return <div className="view-stack"><ViewHeader eyebrow="SUPPLY-CHAIN TRUST" title="Wasm OCI Plugins" description="Only verified binaries with an accepted Sigstore bundle may enter the Wasmtime sandbox." action={<Button className="btn-primary" onClick={() => setShowRegister(true)}><Plus size={15} /> Register plugin</Button>} /><div className="plugin-banner"><div className="banner-icon"><ShieldCheck size={23} /></div><div><b>Registry policy is enforced</b><span>Unsigned, revoked or unknown artifacts are trapped before instantiation.</span></div><div className="banner-stat"><b>{snapshot.plugins.filter((p: any) => p.status === "VERIFIED").length}</b><span>VERIFIED</span></div><div className="banner-stat"><b>{snapshot.plugins.filter((p: any) => p.status === "QUARANTINED").length}</b><span>QUARANTINED</span></div></div><Panel title="Enterprise plugin registry" eyebrow={`${snapshot.plugins.length} ARTIFACTS`}><div className="table-scroll"><table className="data-table"><thead><tr><th>PLUGIN</th><th>STATUS</th><th>CAPABILITIES</th><th>WASM DIGEST</th><th>SIGNER</th><th>ENABLED</th><th /></tr></thead><tbody>{snapshot.plugins.map((plugin: any) => <tr key={plugin.id}><td><span className="plugin-name"><span className="plugin-logo"><Box size={15} /></span><span><b>{plugin.name}</b><small>v{plugin.version}</small></span></span></td><td><Badge tone={plugin.status === "VERIFIED" ? "green" : "red"}>{plugin.status}</Badge></td><td><div className="capability-list">{plugin.capabilities.map((capability: string) => <code key={capability}>{capability}</code>)}</div></td><td><span className="hash-cell">{plugin.wasmDigest}</span></td><td>{plugin.signer}</td><td><button className={`toggle ${plugin.enabled ? "on" : ""}`} aria-label={`Toggle ${plugin.name}`} onClick={() => toggle.mutate({ id: plugin.id })}><span /></button></td><td><IconButton label="Copy Sigstore bundle" onClick={() => { navigator.clipboard?.writeText(plugin.sigstoreBundle); toast.success("Sigstore bundle copied"); }}><Copy size={15} /></IconButton></td></tr>)}</tbody></table></div></Panel>{showRegister && <Modal title="Register verified Wasm plugin" onClose={() => setShowRegister(false)}><div className="form-grid"><label>Plugin name<Input autoFocus value={pluginName} onChange={(event) => setPluginName(event.target.value)} placeholder="forja-sonar-scanner" /></label><label>Version<Input value={pluginVersion} onChange={(event) => setPluginVersion(event.target.value)} /></label><label>Wasm digest<Input value={wasmDigest} onChange={(event) => setWasmDigest(event.target.value)} placeholder="sha256:…" /></label><label>Signer<Input value={signer} onChange={(event) => setSigner(event.target.value)} placeholder="Internal CI/CD" /></label><label>Sigstore bundle<Input value={sigstoreBundle} onChange={(event) => setSigstoreBundle(event.target.value)} placeholder="rekor-entry:…" /></label><label>Capabilities<Input value={capabilityText} onChange={(event) => setCapabilityText(event.target.value)} placeholder="filesystem:read,network:egress" /></label></div><div className="modal-actions"><Button className="btn-dark" onClick={() => setShowRegister(false)}>Cancel</Button><Button className="btn-primary" disabled={!pluginName || wasmDigest.length < 16 || !signer || !sigstoreBundle} onClick={() => register.mutate({ name: pluginName, version: pluginVersion, wasmDigest, signer, sigstoreBundle, capabilities: capabilityText.split(",").map((item) => item.trim()).filter(Boolean) })}>{register.isPending ? "Registering…" : "Register plugin"}</Button></div></Modal>}</div>;
}

function RefactorView({ snapshot }: { snapshot: any }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("JS → TS / core-ledger");
  const [files, setFiles] = useState("500");
  const [workspaceId, setWorkspaceId] = useState("1");
  const create = trpc.enterprise.createRefactorJob.useMutation({ onSuccess: () => { toast.success("WAL refactor job queued"); utils.enterprise.snapshot.invalidate(); } });
  const advance = trpc.enterprise.advanceRefactorJob.useMutation({ onSuccess: (result) => { toast.success(result?.status === "COMMITTED" ? "WAL job committed" : "WAL batch advanced"); utils.enterprise.snapshot.invalidate(); }, onError: () => toast.error("WAL batch could not be advanced") });
  return <div className="view-stack"><ViewHeader eyebrow="ASYNC WAL EXECUTION" title="Mass refactor pipeline" description="Launch large codebase transformations without blocking the developer loop. Every file operation is recoverable." action={<Button className="btn-primary" onClick={() => create.mutate({ name, workspaceId: Number(workspaceId), sourceLanguage: "JS", targetLanguage: "TS", totalFiles: Number(files) })}><Play size={15} /> Launch job</Button>} /><div className="pipeline-layout"><Panel title="Launch a WAL task" eyebrow="NEW BACKGROUND JOB"><div className="refactor-form"><label>Job name<Input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Workspace<select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)}>{snapshot.workspaces.map((workspace: any) => <option value={workspace.id} key={workspace.id}>{workspace.name}</option>)}</select></label><div className="form-row"><label>Source<select defaultValue="JS"><option>JS</option><option>TS</option><option>PY</option><option>RUST</option></select></label><span className="arrow-separator"><ArrowRightIcon /></span><label>Target<select defaultValue="TS"><option>TS</option><option>JS</option><option>PY</option><option>RUST</option></select></label></div><label>Files in scope<Input type="number" min="1" value={files} onChange={(event) => setFiles(event.target.value)} /></label><div className="wal-note"><LockKeyhole size={14} /><span>WAL snapshots are signed before the first file operation.</span></div></div><Button className="btn-primary full-width" onClick={() => create.mutate({ name, workspaceId: Number(workspaceId), sourceLanguage: "JS", targetLanguage: "TS", totalFiles: Number(files) })}>{create.isPending ? "Queueing…" : "Queue background task"}</Button></Panel><Panel title="Pipeline status" eyebrow="ACTIVE TASKS"><div className="job-list">{snapshot.jobs.map((job: any) => <div className="job-row" key={job.id}><div className={`job-status ${job.status.toLowerCase()}`}><Workflow size={16} /></div><div className="job-main"><div><b>{job.name}</b><Badge tone={job.status === "COMMITTED" ? "green" : job.status === "ROLLED_BACK" ? "red" : "amber"}>{job.status}</Badge></div><span>{job.sourceLanguage} → {job.targetLanguage} · {job.processedFiles}/{job.totalFiles} files</span><div className="progress-track"><span style={{ width: `${job.progress}%` }} /></div></div><strong>{job.progress}%</strong>{job.status !== "COMMITTED" && <Button variant="ghost" className="table-action" onClick={() => advance.mutate({ id: job.id })}><Play size={13} /> Batch</Button>}</div>)}</div></Panel></div><Panel title="Write-Ahead Log" eyebrow="LATEST ENTRIES" action={<Button variant="ghost" className="panel-link" onClick={() => exportRecords("forja-wal.json", snapshot.walEntries)}><Download size={14} /> Download WAL</Button>}><div className="table-scroll"><table className="data-table"><thead><tr><th>TIME</th><th>JOB</th><th>OPERATION</th><th>FILE PATH</th><th>BEFORE → AFTER</th><th>STATUS</th></tr></thead><tbody>{snapshot.walEntries.map((entry: any) => <tr key={entry.id}><td>{formatTime(entry.createdAt)}</td><td>#{entry.jobId}</td><td><span className="action-code">{entry.operationType}</span></td><td><code>{entry.filePath}</code></td><td><span className="hash-cell">{entry.beforeHash ?? "—"} → {entry.afterHash ?? "—"}</span></td><td><Badge tone={entry.status === "APPLIED" ? "green" : entry.status === "ROLLED_BACK" ? "red" : "amber"}>{entry.status}</Badge></td></tr>)}</tbody></table></div></Panel></div>;
}

function SecurityView({ snapshot }: { snapshot: any }) {
  const utils = trpc.useUtils();
  const resolve = trpc.enterprise.resolveSecurityEvent.useMutation({ onSuccess: () => { toast.success("Security event resolved"); utils.enterprise.snapshot.invalidate(); } });
  const critical = snapshot.securityEvents.filter((event: any) => event.severity === "CRITICAL" && !event.resolved).length;
  const high = snapshot.securityEvents.filter((event: any) => event.severity === "HIGH").length;
  const resolved = snapshot.securityEvents.filter((event: any) => event.resolved).length;
  return <div className="view-stack"><ViewHeader eyebrow="ZERO-TRUST MONITORING" title="Security events" description="Real-time signals from toxic-context filters, Wasm capability guards and secret scanners." action={<Button className="btn-dark" onClick={() => exportRecords("forja-security-events.json", snapshot.securityEvents)}><Download size={15} /> Export incident report</Button>} /><div className="security-overview"><div className="security-overview-card"><span className="security-overview-icon red"><ShieldX size={19} /></span><div><b>{String(critical).padStart(2, "0")}</b><span>CRITICAL UNRESOLVED</span></div></div><div className="security-overview-card"><span className="security-overview-icon amber"><AlertTriangle size={19} /></span><div><b>{String(high).padStart(2, "0")}</b><span>HIGH SEVERITY</span></div></div><div className="security-overview-card"><span className="security-overview-icon green"><CheckCircle2 size={19} /></span><div><b>{String(resolved).padStart(2, "0")}</b><span>RESOLVED</span></div></div><div className="security-overview-card"><span className="security-overview-icon cyan"><Timer size={19} /></span><div><b>{snapshot.securityEvents.length ? "LIVE" : "—"}</b><span>EVENT STREAM</span></div></div></div><Panel title="Detection feed" eyebrow="STREAMING NOW" action={<span className="streaming-label"><span className="live-dot" /> LIVE</span>}><div className="security-feed">{snapshot.securityEvents.length ? snapshot.securityEvents.map((event: any) => <div className={`security-row ${event.resolved ? "resolved" : ""}`} key={event.id}><div className={`severity-bar ${event.severity.toLowerCase()}`} /><div className="security-event-icon">{event.eventType === "SANDBOX_VIOLATION" ? <Box size={17} /> : event.eventType === "SECRET_DETECTED" ? <KeyRound size={17} /> : <AlertTriangle size={17} />}</div><div className="security-event-main"><div><b>{event.eventType}</b><Badge tone={event.severity === "CRITICAL" || event.severity === "HIGH" ? "red" : event.severity === "MEDIUM" ? "amber" : "blue"}>{event.severity}</Badge></div><span>{event.source}</span><small>{event.actionTaken}</small></div><div className="security-event-side"><span>{formatTime(event.createdAt)}</span>{event.resolved ? <Badge tone="green">RESOLVED</Badge> : <Button variant="ghost" className="table-action" onClick={() => resolve.mutate({ id: event.id })}><Check size={14} /> Resolve</Button>}</div></div>) : <EmptyState title="No security events" body="The stream is ready and will show PROMPT_INJECTION, SANDBOX_VIOLATION or SECRET_DETECTED events." />}</div></Panel></div>;
}

function GraphView({ snapshot }: { snapshot: any }) {
  const [workspaceId, setWorkspaceId] = useState<number | null>(snapshot.workspaces[0]?.id ?? null);
  const workspace = snapshot.workspaces.find((item: any) => item.id === workspaceId);
  const nodes = snapshot.graphNodes.filter((node: any) => !workspaceId || node.workspaceId === workspaceId);
  const nodeIds = new Set(nodes.map((node: any) => node.id));
  const edges = snapshot.graphEdges.filter((edge: any) => (!workspaceId || edge.workspaceId === workspaceId) && nodeIds.has(edge.fromNodeId) && nodeIds.has(edge.toNodeId));
  const vectorClock = workspace?.vectorClock ?? {};
  const vectorTotal = Object.values(vectorClock).reduce((sum: number, value: any) => sum + Number(value), 0);
  const syncScore = workspace ? (workspace.syncStatus === "SYNCED" ? 100 : workspace.syncStatus === "SYNCING" ? 75 : workspace.syncStatus === "DEGRADED" ? 45 : 0) : 0;
  return <div className="view-stack"><ViewHeader eyebrow="COLLABORATIVE CONTEXT" title="Semantic Graph" description="E2EE Graph-RAG state shared over CRDT peers. Raw source never leaves the workspace perimeter." action={<div className="select-wrap"><GitBranch size={14} /><select value={workspaceId ?? ""} onChange={(event) => setWorkspaceId(Number(event.target.value))}><option value="">Select workspace</option>{snapshot.workspaces.map((item: any) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><ChevronDown size={14} /></div>} /><div className="graph-layout"><Panel title="Workspace semantic topology" eyebrow="LIVE CRDT GRAPH" className="graph-panel">{workspace ? <><div className="graph-canvas"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="graph-lines">{edges.map((edge: any) => { const from = nodes.find((node: any) => node.id === edge.fromNodeId); const to = nodes.find((node: any) => node.id === edge.toNodeId); return from && to ? <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#42576b" strokeWidth="0.35" strokeDasharray="1.2 1.2" /> : null; })}</svg>{nodes.map((node: any) => <div className="graph-node" style={{ left: `${node.x}%`, top: `${node.y}%` }} key={node.id}><span className={`graph-node-dot ${node.embeddingState.toLowerCase()}`}><Code2 size={14} /></span><b>{node.label}</b><small>{node.symbolType} · {node.language}</small></div>)}</div><div className="graph-legend"><span><i className="dot teal" />ENCRYPTED</span><span><i className="dot amber" />SYNCING</span><span><i className="dot violet" />LOCAL_ONLY</span><span className="graph-e2ee"><LockKeyhole size={13} /> E2EE {workspace.e2eeStatus}</span></div></> : <EmptyState title="Select a workspace" body="A workspace is required to render its E2EE semantic graph." />}</Panel><Panel title="Graph state" eyebrow="VECTOR CLOCK"><div className="vector-card"><div className="vector-head"><span><span className="live-dot" /> {workspace?.syncStatus ?? "OFFLINE"}</span><b>{syncScore}%</b></div><div className="vector-bar"><span style={{ width: `${syncScore}%` }} /></div><div className="vector-rows">{Object.entries(vectorClock).length ? Object.entries(vectorClock).map(([peer, value]) => <div key={peer}><span>{peer}</span><b>{String(value)}</b></div>) : <div><span>vector clock</span><b>{vectorTotal}</b></div>}</div></div><div className="relation-list">{edges.slice(0, 5).map((edge: any) => <div key={edge.id}><span>{edge.relationType}</span><b>{Math.round(edge.weight * 100)}%</b></div>)}</div></Panel></div></div>;
}

function AnalyticsView({ snapshot }: { snapshot: any }) {
  const estimatedSpend = snapshot.analytics.models.reduce((sum: number, model: any) => sum + Number(model.cost || 0), 0);
  const meanLatency = snapshot.analytics.tools.length ? Math.round(snapshot.analytics.tools.reduce((sum: number, tool: any) => sum + Number(tool.latency || 0), 0) / snapshot.analytics.tools.length) : 0;
  return <div className="view-stack"><ViewHeader eyebrow="OBSERVABILITY" title="Analytics" description="Token consumption, tool latency and rollback rates across the control plane." action={<Button className="btn-dark" onClick={() => exportRecords("forja-analytics.json", [snapshot.analytics])}><Download size={15} /> Export report</Button>} /><div className="analytics-grid"><Panel title="Tokens & cost" eyebrow="BY MODEL"><div className="chart-wrap medium-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={snapshot.analytics.models} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}><CartesianGrid stroke="#273443" horizontal={false} /><XAxis type="number" tick={{ fill: "#728298", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="model" tick={{ fill: "#b8c5d6", fontSize: 10 }} axisLine={false} tickLine={false} width={105} /><Tooltip contentStyle={{ background: "#111a25", border: "1px solid #2c3b4d", borderRadius: 10, fontSize: 12 }} /><Bar dataKey="tokens" fill="#a88bff" radius={[0, 5, 5, 0]} barSize={16} /></BarChart></ResponsiveContainer></div><div className="analytics-footer"><span>Estimated spend</span><b>${estimatedSpend.toFixed(2)}</b></div></Panel><Panel title="Tool performance" eyebrow="P95 LATENCY"><div className="chart-wrap medium-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={snapshot.analytics.tools} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}><CartesianGrid stroke="#273443" vertical={false} /><XAxis dataKey="tool" tick={{ fill: "#728298", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#728298", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#111a25", border: "1px solid #2c3b4d", borderRadius: 10, fontSize: 12 }} /><Bar dataKey="latency" fill="#55d6c2" radius={[5, 5, 0, 0]} barSize={28} /></BarChart></ResponsiveContainer></div><div className="analytics-footer"><span>Mean tool latency</span><b>{meanLatency} ms</b></div></Panel><Panel title="Spend mix" eyebrow="THIS MONTH"><div className="pie-layout"><div className="pie-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={snapshot.analytics.models} dataKey="cost" nameKey="model" innerRadius={44} outerRadius={66} paddingAngle={3}><Cell fill="#a88bff" /><Cell fill="#55d6c2" /><Cell fill="#ffb45c" /><Cell fill="#5e83ff" /></Pie><Tooltip contentStyle={{ background: "#111a25", border: "1px solid #2c3b4d", borderRadius: 10, fontSize: 12 }} /></PieChart></ResponsiveContainer></div><div className="pie-legend">{snapshot.analytics.models.map((model: any, index: number) => <div key={model.model}><span><i className={`pie-dot p${index}`} />{model.model}</span><b>${model.cost.toFixed(2)}</b></div>)}</div></div></Panel></div></div>;
}

function KeysView({ snapshot }: { snapshot: any }) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [issuer, setIssuer] = useState("Internal CI/CD");
  const create = trpc.enterprise.createTrustedKey.useMutation({ onSuccess: () => { toast.success("TrustedKey registered"); setShowForm(false); setKeyName(""); setFingerprint(""); setPublicKey(""); utils.enterprise.snapshot.invalidate(); } });
  const revoke = trpc.enterprise.revokeTrustedKey.useMutation({ onSuccess: () => { toast.success("TrustedKey revoked"); utils.enterprise.snapshot.invalidate(); } });
  return <div className="view-stack"><ViewHeader eyebrow="CRYPTOGRAPHIC TRUST STORE" title="TrustedKeys" description="Manage Ed25519 signers allowed to verify plugins, commits and enterprise audit roots." action={<Button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Register key</Button>} /><div className="key-callout"><Fingerprint size={20} /><div><b>Trust store scope: {snapshot.organizations[0]?.name ?? "Authenticated organization"}</b><span>Revocation propagates to all connected Wasm hosts within 60 seconds.</span></div><Badge tone="green">ONLINE</Badge></div><Panel title="Authorized signers" eyebrow={`${snapshot.trustedKeys.length} KEYS`}><div className="table-scroll"><table className="data-table"><thead><tr><th>KEY NAME</th><th>FINGERPRINT</th><th>ISSUER</th><th>STATUS</th><th>CREATED</th><th /></tr></thead><tbody>{snapshot.trustedKeys.map((key: any) => <tr key={key.id}><td><span className="key-name"><KeyRound size={15} /> <b>{key.keyName}</b></span></td><td><span className="hash-cell">{key.fingerprint}</span></td><td>{key.issuer}</td><td><Badge tone={key.status === "ACTIVE" ? "green" : "red"}>{key.status}</Badge></td><td>{formatDate(key.createdAt)}</td><td>{key.status === "ACTIVE" && <Button variant="ghost" className="danger-action" onClick={() => revoke.mutate({ id: key.id })}><ShieldX size={14} /> Revoke</Button>}</td></tr>)}</tbody></table></div></Panel>{showForm && <Modal title="Register TrustedKey" onClose={() => setShowForm(false)}><div className="form-grid"><label>Key name<Input value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="security-ci-2026" /></label><label>Issuer<select value={issuer} onChange={(event) => setIssuer(event.target.value)}><option>Internal CI/CD</option><option>Sigstore Root</option><option>External Vendor</option></select></label><label>SHA-256 fingerprint<Input value={fingerprint} onChange={(event) => setFingerprint(event.target.value)} placeholder="SHA256:..." /></label><label>Public key<Input value={publicKey} onChange={(event) => setPublicKey(event.target.value)} placeholder="ssh-ed25519 / base64" /></label></div><div className="modal-actions"><Button className="btn-dark" onClick={() => setShowForm(false)}>Cancel</Button><Button className="btn-primary" disabled={!keyName || !fingerprint || !publicKey} onClick={() => create.mutate({ keyName, fingerprint, issuer, publicKey })}>Register key</Button></div></Modal>}</div>;
}

function SearchDialog({ snapshot, onNavigate }: { snapshot: any; onNavigate: (view: ViewId) => void }) {
  const [term, setTerm] = useState("");
  const query = term.trim().toLowerCase();
  const results = [
    ...snapshot.auditLogs.map((item: any) => ({ view: "audit" as ViewId, title: item.action, detail: `${item.actorType} · ${item.walHash}` })),
    ...snapshot.plugins.map((item: any) => ({ view: "plugins" as ViewId, title: item.name, detail: `Wasm · ${item.status}` })),
    ...snapshot.workspaces.map((item: any) => ({ view: "organizations" as ViewId, title: item.name, detail: item.repoName })),
    ...snapshot.policies.map((item: any) => ({ view: "policies" as ViewId, title: item.resource, detail: `${item.role} · ${item.effect}` })),
  ].filter((item) => !query || `${item.title} ${item.detail}`.toLowerCase().includes(query)).slice(0, 8);
  return <div className="search-dialog"><div className="search-input-wrap"><Search size={15} /><Input autoFocus value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search logs, plugins, workspaces or policies" /></div><div className="search-results">{results.length ? results.map((result, index) => <button key={`${result.title}-${index}`} onClick={() => onNavigate(result.view)}><span className="search-result-icon"><Search size={13} /></span><span><b>{result.title}</b><small>{result.detail}</small></span><ChevronRight size={14} /></button>) : <EmptyState title="No matching records" body="Try an actor, action, plugin or workspace name." />}</div></div>;
}

function ViewHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="view-header"><div><span className="kicker">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className="view-header-action">{action}</div></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal-card" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><span className="panel-eyebrow">CONTROL PLANE</span><h2>{title}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={17} /></IconButton></div>{children}</div></div>;
}

function ArrowRightIcon() { return <ChevronRight size={16} />; }

export default function EnterpriseDashboard() {
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const snapshotQuery = trpc.enterprise.snapshot.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 5000, refetchIntervalInBackground: false, refetchOnWindowFocus: true, staleTime: 4000, retry: 2 });
  const snapshot = snapshotQuery.data;
  const tenant = snapshot?.organizations[0];
  const userInitials = (user?.name || user?.email || "AI").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const content = useMemo(() => {
    if (snapshotQuery.isError || snapshot?.dataSource === "UNAVAILABLE") return <div className="error-state" role="alert" aria-live="polite"><AlertTriangle size={22} /><strong>Control plane unavailable</strong><span>{snapshotQuery.error?.message ?? "Production data is unavailable. Preview data is disabled in production."}</span><Button className="btn-primary" onClick={() => snapshotQuery.refetch()}><RefreshCw size={15} /> Retry connection</Button></div>;
    if (!snapshot) return <div className="loading-state" role="status" aria-live="polite"><RefreshCw className="spin" size={20} /> Loading control plane…</div>;
    if (activeView === "overview") return <Overview snapshot={snapshot} onNavigate={setActiveView} />;
    if (activeView === "audit") return <AuditView snapshot={snapshot} />;
    if (activeView === "policies") return <PoliciesView snapshot={snapshot} />;
    if (activeView === "organizations") return <OrganizationsView snapshot={snapshot} />;
    if (activeView === "plugins") return <PluginsView snapshot={snapshot} />;
    if (activeView === "refactor") return <RefactorView snapshot={snapshot} />;
    if (activeView === "security") return <SecurityView snapshot={snapshot} />;
    if (activeView === "graph") return <GraphView snapshot={snapshot} />;
    if (activeView === "analytics") return <AnalyticsView snapshot={snapshot} />;
    return <KeysView snapshot={snapshot} />;
  }, [activeView, snapshot, snapshotQuery.error, snapshotQuery.isError, snapshotQuery.refetch]);

  if (authLoading) return <div className="auth-gate"><div className="auth-card"><div className="brand-mark"><span>F</span></div><RefreshCw className="spin" size={20} /><p>Restoring secure control-plane session…</p></div></div>;
  if (!isAuthenticated || !user) return <div className="auth-gate"><div className="auth-card"><div className="brand-mark"><span>F</span></div><span className="kicker">FORJA CONTROL PLANE v4.0</span><h1>Secure engineering governance.</h1><p>Sign in to access organization-scoped audit logs, policies, plugins and refactor operations.</p><Button className="btn-primary full-width" onClick={() => startLogin()}>Sign in securely</Button></div></div>;

  return <div className="forja-shell">
    <aside className={`forja-sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark"><span>F</span></div><div><b>FORJA</b><small>CONTROL PLANE <em>v4.0</em></small></div><IconButton label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={17} /></IconButton></div>
      <div className="tenant-switch" aria-label={`Active organization: ${tenant?.name ?? "Organization"}`}><span className="tenant-avatar">{(tenant?.name ?? "ORG").slice(0, 2).toUpperCase()}</span><span><b>{tenant?.name ?? "Organization"}</b><small>{tenant?.plan ?? "Enterprise"} · org-{user.organizationId}</small></span><ChevronDown size={15} /></div>
      <nav className="main-nav"><span className="nav-label">COMMAND CENTER</span>{navItems.slice(0, 1).map((item) => <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false); }} />)}<span className="nav-label secondary">GOVERNANCE</span>{navItems.slice(1, 6).map((item) => <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false); }} />)}<span className="nav-label secondary">OBSERVABILITY</span>{navItems.slice(6).map((item) => <NavButton key={item.id} item={item} active={activeView === item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false); }} />)}</nav>
      <div className="sidebar-bottom"><div className="security-mini"><span className="security-mini-icon"><ShieldCheck size={16} /></span><span><b>Perimeter secure</b><small>{snapshotQuery.isError || snapshot?.dataSource === "UNAVAILABLE" ? "Connection degraded" : "Session authenticated"}</small></span><span className="live-dot" /></div><button className="user-mini" onClick={() => void logout()} aria-label="Sign out"><span className="user-avatar">{userInitials}</span><span><b>{user.name ?? user.email ?? "User"}</b><small>{user.enterpriseRole} · org-{user.organizationId}</small></span><LogOut size={16} /></button></div>
    </aside>
    {sidebarOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <main className="forja-main"><header className="topbar"><div className="topbar-left"><IconButton label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={18} /></IconButton><div className="breadcrumbs"><span>Control Plane</span><ChevronRight size={13} /><b>{navItems.find((item) => item.id === activeView)?.label}</b></div></div><div className="topbar-right"><div className="system-status"><span className="live-dot" /> {snapshotQuery.isError || snapshot?.dataSource === "UNAVAILABLE" ? "Connection degraded" : snapshot?.dataSource === "DATABASE" ? "All systems operational" : "Preview data active"}</div><IconButton label="Search" onClick={() => setSearchOpen(true)}><Search size={17} /></IconButton><IconButton label="Settings" onClick={() => setActiveView("keys")}><Settings2 size={17} /></IconButton><div className="topbar-avatar">{userInitials}</div></div></header><div className="forja-content">{content}</div>{searchOpen && snapshot && <Modal title="Search control plane" onClose={() => setSearchOpen(false)}><SearchDialog snapshot={snapshot} onNavigate={(view) => { setActiveView(view); setSearchOpen(false); }} /></Modal>}<footer className="forja-footer"><span><span className="live-dot" /> {snapshotQuery.isError || snapshot?.dataSource === "UNAVAILABLE" ? "Control plane unavailable" : `Control plane synced ${snapshot ? formatTime(snapshot.generatedAt) : "—"}`}</span><span>Data source: <b>{snapshot?.dataSource ?? "—"}</b> · <button onClick={() => snapshotQuery.refetch()}>Refresh</button></span></footer></main>
  </div>;
}

function NavButton({ item, active, onClick }: { item: typeof navItems[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button type="button" className={`nav-button ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} onClick={onClick}><Icon aria-hidden="true" size={16} strokeWidth={active ? 2 : 1.7} /><span>{item.label}</span>{active && <span className="nav-active-line" />}</button>;
}

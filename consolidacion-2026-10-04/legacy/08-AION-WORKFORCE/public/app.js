const DEMO = [
  { id: "S-1001", worker: "Mara Silva", role: "Turno A", start: "06:00", end: "14:00", site: "Planta Barcelona", status: "activo" },
  { id: "S-1002", worker: "Joao Lima", role: "Turno B", start: "14:00", end: "22:00", site: "Planta Barcelona", status: "activo" },
  { id: "S-1003", worker: "Nuria Roca", role: "Supervisión", start: "08:00", end: "16:00", site: "Oficina Central", status: "activo" },
  { id: "S-1004", worker: "Leo Costa", role: "Turno C", start: "22:00", end: "06:00", site: "Planta Barcelona", status: "pausa" }
];
let shifts = DEMO.slice();
let apiOk = false;

function textCell(value) {
  const td = document.createElement("td");
  td.textContent = value == null ? "" : String(value);
  return td;
}

function statusCell(status) {
  const td = document.createElement("td");
  const span = document.createElement("span");
  const safeStatus = status === "pausa" ? "pausa" : "activo";
  span.className = "pill " + safeStatus;
  span.textContent = status == null ? "" : String(status);
  td.appendChild(span);
  return td;
}

function render() {
  const tb = document.getElementById("tbody");
  tb.replaceChildren();
  for (const s of shifts) {
    const tr = document.createElement("tr");
    tr.appendChild(textCell(s.id));
    tr.appendChild(textCell(s.worker));
    tr.appendChild(textCell(s.role));
    tr.appendChild(textCell(`${s.start} – ${s.end}`));
    tr.appendChild(textCell(s.site));
    tr.appendChild(statusCell(s.status));
    tb.appendChild(tr);
  }
  document.getElementById("statActive").textContent = shifts.filter(s => s.status === "activo").length;
  document.getElementById("statWorkers").textContent = new Set(shifts.map(s => s.worker)).size;
  document.getElementById("statSites").textContent = new Set(shifts.map(s => s.site)).size;
  const hours = shifts.filter(s => s.status === "activo").length * 8;
  document.getElementById("statCoverage").textContent = hours >= 24 ? `${hours}h ✓` : `${hours}h`;
  document.getElementById("apiState").textContent = apiOk ? "api conectada" : "modo demo local";
}

async function load() {
  try {
    const r = await fetch("/api/shifts");
    if (r.ok) {
      const data = await r.json();
      shifts = data.shifts;
      apiOk = true;
    }
  } catch { /* modo demo */ }
  render();
}

document.getElementById("form").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;
  const shift = {
    worker: f.worker.value, role: f.role.value, start: f.start.value,
    end: f.end.value, site: f.site.value || "Sin asignar", status: "activo"
  };
  try {
    const r = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shift)
    });
    if (r.ok) {
      const created = await r.json();
      shifts.push(created);
    } else {
      shifts.push({ id: "S-" + (1000 + shifts.length + 1), ...shift });
    }
  } catch {
    shifts.push({ id: "S-" + (1000 + shifts.length + 1), ...shift });
  }
  f.reset();
  render();
});

load();

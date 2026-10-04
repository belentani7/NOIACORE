from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
DATA_HOME = Path(os.environ.get("NEXUS_DATA_HOME", ROOT))
DATA_HOME.mkdir(parents=True, exist_ok=True)
DEFAULT_CONFIG = DATA_HOME / "sources.yml"
if not DEFAULT_CONFIG.exists():
    shutil.copy2(ROOT / "config" / "sources.yml", DEFAULT_CONFIG)
sys.path.insert(0, str(ROOT / "src"))

from nexus.pipeline import Pipeline, export_rows

st.set_page_config(page_title="NEXUS DATA", page_icon="N", layout="wide")
st.title("NEXUS DATA")
st.caption("Inteligencia de contratación pública con fuentes públicas, procedencia y control humano.")

with st.sidebar:
    st.header("Ejecución")
    config = st.text_input("Configuración YAML", str(DEFAULT_CONFIG))
    db = st.text_input("Base SQLite", str(DATA_HOME / "data" / "nexus.db"))
    execute = st.button("Ejecutar pipeline", type="primary")
    st.caption("El LLM permanece desactivado salvo activación explícita mediante variable de entorno.")

if execute:
    try:
        with st.spinner("Consultando APIs, normalizando y priorizando…"):
            rows, metrics, report = Pipeline(config, db).run()
            export_rows(rows, str(DATA_HOME / "data" / "processed"))
            st.session_state.update(rows=rows, metrics=metrics, report=report)
    except Exception as exc:  # noqa: BLE001
        st.error(f"La ejecución se detuvo de forma segura: {exc}")

rows = st.session_state.get("rows", [])
if not rows:
    st.info("Ejecuta el pipeline. Las oportunidades abiertas y las adjudicaciones se diferencian explícitamente.")
    st.stop()

metrics = st.session_state["metrics"]
df = pd.DataFrame(rows)
st.success(f"Ejecución {metrics['run_id']} · procedencia: {df['data_origin'].value_counts().to_dict()}")
a, b, c, d = st.columns(4)
a.metric("Oportunidades accionables", metrics.get("actionable_opportunities", 0))
b.metric("Urgentes", metrics.get("urgent", 0))
c.metric("Adjudicaciones", metrics.get("award_records", 0))
d.metric("Registros válidos", metrics.get("valid_records", 0))

st.subheader("Informe accionable")
st.markdown(st.session_state["report"])

st.subheader("Salud de fuentes")
source_metrics = pd.DataFrame(metrics.get("source_metrics", {}).values())
if not source_metrics.empty:
    st.dataframe(source_metrics, use_container_width=True, hide_index=True)

st.subheader("Explorar registros")
left, right = st.columns(2)
with left:
    source_filter = st.multiselect("Fuentes", sorted(df["source"].unique()), default=sorted(df["source"].unique()))
with right:
    types = st.multiselect("Tipo de registro", sorted(df["record_type"].unique()), default=["opportunity"])
view = df[df["source"].isin(source_filter) & df["record_type"].isin(types)].copy()
view = view.sort_values(["sme_fit", "days_to_deadline"], ascending=[False, True], na_position="last")
st.dataframe(view, use_container_width=True, hide_index=True, column_config={"source_url": st.column_config.LinkColumn("Fuente oficial"), "sme_fit": st.column_config.ProgressColumn("Score", min_value=0, max_value=100)})
st.download_button("Descargar CSV filtrado", view.to_csv(index=False), "nexus-opportunities.csv", "text/csv")
st.download_button("Descargar JSON filtrado", view.to_json(orient="records", force_ascii=False, indent=2), "nexus-opportunities.json", "application/json")

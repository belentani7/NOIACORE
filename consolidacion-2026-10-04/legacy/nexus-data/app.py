from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import streamlit as st
import yaml

from nexus_data.pipeline import run_sync

st.set_page_config(page_title="NEXUS DATA", page_icon=None, layout="wide")
st.title("NEXUS DATA")
st.caption("Inteligencia de empleo tecnológico remoto basada en fuentes públicas autorizadas")

config_path = Path(st.sidebar.text_input("Configuración YAML", "sources.yaml"))
db_path = Path(st.sidebar.text_input("Base SQLite", "nexus.db"))

if not config_path.exists():
    st.error(f"No existe la configuración: {config_path}")
    st.stop()

with st.sidebar.expander("Fuentes activas", expanded=True):
    config = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    for source in config.get("sources", []):
        st.write(f"**{source['name']}** — {source['endpoint']}")
        st.caption(f"rate limit: {source.get('rate_limit_seconds', 2)} s")

if st.button("Ejecutar extracción y análisis", type="primary"):
    with st.spinner("Consultando fuentes, limpiando datos y calculando insights…"):
        result = run_sync(config_path, db_path)
    st.session_state["result"] = result
    st.success("Ejecución completada.")

result = st.session_state.get("result")
if result is None:
    st.info("Pulsa el botón para iniciar una ejecución. El proceso respeta los límites configurados por fuente.")
    st.stop()

report = result.report
kpis = report.get("kpis", {})
cols = st.columns(5)
cols[0].metric("Registros válidos", kpis.get("valid_records", 0))
cols[1].metric("Fuentes", kpis.get("sources", 0))
cols[2].metric("Tasa remota", f"{kpis.get('remote_rate', 0):.0%}")
cols[3].metric("Cobertura salarial", f"{kpis.get('salary_coverage', 0):.0%}")
cols[4].metric("Duplicados", kpis.get("duplicate_records", 0))

st.subheader("Insights accionables")
for insight in report.get("insights", []):
    st.write(f"— {insight}")

if report.get("anomalies"):
    st.subheader("Anomalías y señales de calidad")
    st.json(report["anomalies"])

left, right = st.columns(2)
with left:
    st.subheader("Skills más frecuentes")
    skills = pd.Series(report.get("top_skills", {}), name="vacantes")
    st.bar_chart(skills)
with right:
    st.subheader("Vacantes por fuente")
    st.bar_chart(pd.Series(report.get("by_source", {}), name="vacantes"))

st.subheader("Informe LLM opcional")
llm = report.get("llm_report")
if llm:
    try:
        st.json(json.loads(llm))
    except json.JSONDecodeError:
        st.write(llm)
else:
    st.caption("No se generó informe LLM: configure OPENAI_API_KEY para activar el enriquecimiento opcional.")

rows = [record.model_dump(mode="json") for record in result.records]
df = pd.DataFrame(rows)
st.subheader("Datos normalizados")
st.dataframe(df, use_container_width=True, hide_index=True)
st.download_button("Descargar CSV", df.to_csv(index=False), "nexus_jobs.csv", "text/csv")
st.download_button("Descargar JSON", json.dumps(rows, ensure_ascii=False, indent=2), "nexus_jobs.json", "application/json")

st.caption("Las fuentes y sus términos de uso deben revisarse antes de cualquier uso comercial o redistribución.")

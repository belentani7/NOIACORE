from __future__ import annotations

import argparse
import json
import logging
from typing import Any

from .pipeline import Pipeline, export_rows


def _configure_logging(verbose: bool) -> None:
    logging.basicConfig(level=logging.DEBUG if verbose else logging.INFO, format="%(message)s")


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="nexus-data", description="NEXUS DATA — inteligencia de contratación pública conforme")
    parser.add_argument("--config", default="config/sources.yml", help="Ruta al YAML de fuentes")
    parser.add_argument("--db", default="data/nexus.db", help="Ruta a la base SQLite")
    parser.add_argument("--verbose", action="store_true", help="Activa logging detallado")
    commands = parser.add_subparsers(dest="command")
    run = commands.add_parser("run", help="Ejecuta conectores, limpieza, análisis y exportación")
    run.add_argument("--out", default="data/processed", help="Directorio para CSV/JSON")
    run.add_argument("--source", action="append", dest="sources", help="Fuente a ejecutar; repetir para varias")
    run.add_argument("--json", action="store_true", dest="as_json", help="Emite resumen JSON")
    commands.add_parser("health", help="Comprueba configuración y SQLite sin contactar fuentes")
    metrics = commands.add_parser("metrics", help="Muestra métricas de la última ejecución")
    metrics.add_argument("--json", action="store_true", dest="as_json", help="Emite métricas JSON")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    _configure_logging(args.verbose)
    command = args.command or "run"
    if args.command is None:
        args.out = "data/processed"
        args.sources = None
        args.as_json = False
    pipeline = Pipeline(args.config, args.db)
    if command == "health":
        print(json.dumps(pipeline.healthcheck(), ensure_ascii=False, indent=2))
        return 0
    if command == "metrics":
        latest = pipeline.latest_source_metrics()
        if args.as_json:
            print(json.dumps(latest, ensure_ascii=False, indent=2))
        else:
            for row in latest:
                print(f"{row['source']}: status={row['status']} received={row['received']} valid={row['valid']} invalid={row['invalid']} latency_ms={row['latency_ms']}")
        return 0
    rows, metrics, text = pipeline.run(args.sources)
    csv_path, json_path = export_rows(rows, args.out)
    payload: dict[str, Any] = {
        "run_id": metrics["run_id"],
        "records": len(rows),
        "actionable_opportunities": metrics["actionable_opportunities"],
        "csv": str(csv_path),
        "json": str(json_path),
        "source_metrics": metrics["source_metrics"],
    }
    if args.as_json:
        print(json.dumps(payload, ensure_ascii=False, indent=2, default=str))
    else:
        print(text)
        print(f"\nrun_id={payload['run_id']} records={payload['records']} actionable={payload['actionable_opportunities']} csv={csv_path} json={json_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

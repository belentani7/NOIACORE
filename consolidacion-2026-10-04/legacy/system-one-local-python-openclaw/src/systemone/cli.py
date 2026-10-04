"""CLI: python -m systemone.cli decide --file input.json"""
from __future__ import annotations
import argparse, json, sys

from .schema import DecideRequest
from .api import run_decide


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="systemone", description="Decisiones tipadas con confianza.")
    sub = p.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("decide", help="Decide a partir de un JSON (state + questions)")
    d.add_argument("--file", required=True, help="Ruta del JSON de entrada")
    d.add_argument("--backend", default=None, help="heuristic | ollama")
    args = p.parse_args(argv)

    try:
        payload = json.load(open(args.file, encoding="utf-8"))
    except Exception as e:
        print(f"ERROR leyendo {args.file}: {e}", file=sys.stderr); return 2

    req = DecideRequest(**payload)
    if args.backend:
        req.backend = args.backend
    resp = run_decide(req)
    print(resp.model_dump_json(indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

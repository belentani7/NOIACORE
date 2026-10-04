from __future__ import annotations

import argparse
import asyncio
import json

from nexus_data.pipeline import load_config
from nexus_data.pipeline_v2 import run_intelligence_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the NEXUS DATA V2 intelligence pipeline")
    parser.add_argument("--config", default="sources.yaml")
    parser.add_argument("--db", default="nexus.db")
    args = parser.parse_args()
    result = asyncio.run(run_intelligence_pipeline(load_config(args.config), args.db))
    print(json.dumps({
        "run_id": result.run_id,
        "snapshot_id": result.snapshot_id,
        "records": len(result.records),
        "signals": [signal.model_dump(mode="json") for signal in result.signals],
        "insights": [insight.model_dump(mode="json") for insight in result.insights],
        "changes": len(result.changes),
        "source_health": [health.model_dump(mode="json") for health in result.source_health],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

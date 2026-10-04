from __future__ import annotations

import asyncio
import json
from pathlib import Path

import httpx

from nexus_data.automation import Job, PersistentJobStore, WorkerPool
from nexus_data.pipeline import load_config


async def main() -> None:
    config = load_config("sources.yaml")
    store = PersistentJobStore("nexus.db")
    for source in config.sources:
        store.enqueue(source.name, source.endpoint, source.params)

    async def handler(job: Job) -> None:
        source = next(item for item in config.sources if item.name == job.source)
        async with httpx.AsyncClient(
            headers={"User-Agent": config.user_agent, "Accept": "application/json"},
            follow_redirects=True,
            timeout=source.timeout_seconds,
        ) as client:
            response = await client.get(job.endpoint, params=job.payload)
            response.raise_for_status()
            output = Path("data") / f"automation_{job.source.lower()}.json"
            output.write_text(json.dumps(response.json(), ensure_ascii=False), encoding="utf-8")

    pool = WorkerPool(store, workers=min(10, len(config.sources)))
    await pool.run(handler)
    print(json.dumps({"jobs": store.counts(), "metrics": pool.metrics.prometheus()}, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())

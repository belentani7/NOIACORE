from __future__ import annotations

import asyncio
from pathlib import Path

from nexus_data.automation import PersistentJobStore, WorkerPool


def test_worker_pool_completes_jobs(tmp_path: Path) -> None:
    store = PersistentJobStore(str(tmp_path / "jobs.db"))
    store.enqueue("source-a", "https://a.example/api", {"page": 1})
    store.enqueue("source-b", "https://b.example/api", {"page": 1})
    seen: list[str] = []

    async def handler(job) -> None:
        seen.append(job.source)

    asyncio.run(WorkerPool(store, workers=2).run(handler))
    assert sorted(seen) == ["source-a", "source-b"]
    assert store.counts() == {"completed": 2}


def test_worker_pool_dead_letters_after_retries(tmp_path: Path) -> None:
    store = PersistentJobStore(str(tmp_path / "jobs.db"))
    store.enqueue("bad-source", "https://bad.example/api", {})

    async def handler(_job) -> None:
        raise RuntimeError("permanent failure")

    asyncio.run(WorkerPool(store, workers=1, max_attempts=1).run(handler))
    assert store.counts() == {"dead_letter": 1}


def test_worker_pool_scales_across_domains(tmp_path: Path) -> None:
    store = PersistentJobStore(str(tmp_path / "load.db"))
    for index in range(100):
        store.enqueue(f"source-{index}", f"https://domain-{index}.example/api", {"page": 1})
    seen: list[str] = []

    async def handler(job) -> None:
        seen.append(job.job_id)

    asyncio.run(WorkerPool(store, workers=10).run(handler, idle_rounds=2))
    assert len(seen) == 100
    assert store.counts() == {"completed": 100}

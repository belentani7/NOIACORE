from __future__ import annotations

import threading
import time
from collections import defaultdict


class MetricsRegistry:
    """Registro pequeño compatible con el formato de exposición Prometheus."""

    def __init__(self) -> None:
        self._counters: defaultdict[str, float] = defaultdict(float)
        self._latencies: defaultdict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def inc(self, name: str, value: float = 1.0) -> None:
        with self._lock:
            self._counters[name] += value

    def observe(self, name: str, value: float) -> None:
        with self._lock:
            self._latencies[name].append(value)

    def timer(self, name: str):
        registry = self
        start = time.perf_counter()

        class Timer:
            def __enter__(self):
                return self

            def __exit__(self, *_):
                registry.observe(name, time.perf_counter() - start)

        return Timer()

    def prometheus(self) -> str:
        lines: list[str] = []
        with self._lock:
            for name, value in sorted(self._counters.items()):
                lines.append(f"# TYPE {name} counter")
                lines.append(f"{name} {value}")
            for name, values in sorted(self._latencies.items()):
                if values:
                    lines.append(f"# TYPE {name}_seconds summary")
                    lines.append(f"{name}_seconds_count {len(values)}")
                    lines.append(f"{name}_seconds_sum {sum(values)}")
        return "\n".join(lines) + "\n"

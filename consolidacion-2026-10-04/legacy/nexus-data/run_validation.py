from nexus_data.pipeline import run_sync

result = run_sync("sources.yaml", "nexus.db")
print({
    "raw": result.raw_records,
    "valid": result.valid_records,
    "duplicates": result.duplicate_records,
    "sources": [
        {
            "source": item.source,
            "status": item.status,
            "http_status": item.http_status,
            "records": len(item.records),
            "error": item.error,
        }
        for item in result.source_results
    ],
})
for insight in result.report.get("insights", []):
    print(insight)

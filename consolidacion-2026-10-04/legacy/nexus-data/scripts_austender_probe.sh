#!/usr/bin/env bash
set -euo pipefail
curl -sS --max-time 30 -A 'NexusDataPrototype/0.2 (+https://example.invalid/contact)' \
  -H 'Accept: application/json' \
  'https://api.tenders.gov.au/ocds/findByDates/contractPublished/2025-08-01T00%3A00%3A00Z/2025-08-02T00%3A00%3A00Z' \
  -o /tmp/austender_probe.json -w 'HTTP %{http_code}\n'
head -c 1600 /tmp/austender_probe.json

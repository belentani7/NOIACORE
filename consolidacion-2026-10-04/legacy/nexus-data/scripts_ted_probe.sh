#!/usr/bin/env bash
set -euo pipefail
curl -sS --max-time 25 -A 'NexusDataPrototype/0.2 (+https://example.invalid/contact)' \
  -H 'Accept: application/json' \
  'https://api.ted.europa.eu/api/v3.0/notices/search?query=software&limit=1&page=1' \
  -o /tmp/ted_probe_v2.json -w 'HTTP %{http_code}\n'
head -c 1000 /tmp/ted_probe_v2.json

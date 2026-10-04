#!/usr/bin/env bash
set -euo pipefail
curl -sS --max-time 25 -A 'NexusDataPrototype/0.2 (+https://example.invalid/contact)' \
  -H 'Accept: application/json' \
  'https://ted.europa.eu/api/v3.0/notices/search?query=software&limit=1&page=1' \
  -o /tmp/ted_host_probe.json -w 'HTTP %{http_code}\n'
head -c 1200 /tmp/ted_host_probe.json

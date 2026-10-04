#!/usr/bin/env bash
set -euo pipefail
curl -sS --max-time 25 -A 'NexusDataPrototype/0.2 (+https://example.invalid/contact)' \
  -H 'Accept: application/json' \
  'https://data.cityofchicago.org/resource/rsxa-ify5.json?$limit=3' \
  -o /tmp/chicago_contracts_probe.json -w 'HTTP %{http_code}\n'
head -c 1600 /tmp/chicago_contracts_probe.json

#!/usr/bin/env bash
set -euo pipefail
curl -sS --max-time 25 -A 'NexusDataPrototype/0.2 (+https://example.invalid/contact)' \
  -H 'Content-Type: application/json' \
  -X POST 'https://api.usaspending.gov/api/v2/search/spending_by_award/' \
  --data '{"filters":{"time_period":[{"start_date":"2025-01-01","end_date":"2026-08-19"}],"award_type_codes":["A","B","C","D"]},"fields":["Award ID","Recipient Name","Start Date","End Date","Award Amount","Awarding Agency","Description"],"page":1,"limit":1,"sort":"Award Amount","order":"desc"}' \
  -o /tmp/usaspending_probe.json -w 'HTTP %{http_code}\n'
head -c 1000 /tmp/usaspending_probe.json

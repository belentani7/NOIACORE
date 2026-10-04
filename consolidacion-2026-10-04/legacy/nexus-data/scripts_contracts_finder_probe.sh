#!/usr/bin/env bash
set -euo pipefail
curl -sS --max-time 25 -A 'NexusDataPrototype/0.2 (+https://example.invalid/contact)' \
  -H 'Content-Type: application/json' \
  -X POST 'https://www.contractsfinder.service.gov.uk/api/rest/2/search_notices/json' \
  --data '{"searchCriteria":{"types":["Contract"],"statuses":["Open"],"keyword":"software","queryString":null,"regions":null,"postcode":null,"radius":0,"valueFrom":null,"valueTo":null,"publishedFrom":null,"publishedTo":null,"deadlineFrom":null,"deadlineTo":null,"approachMarketFrom":null,"approachMarketTo":null,"awardedFrom":null,"awardedTo":null,"isSubcontract":null,"suitableForSme":null,"suitableForVco":null,"awardedToSme":null,"awardedToVcse":null,"cpvCodes":null},"size":3}' \
  -o /tmp/contracts_finder_probe.json -w 'HTTP %{http_code}\n'
head -c 1400 /tmp/contracts_finder_probe.json

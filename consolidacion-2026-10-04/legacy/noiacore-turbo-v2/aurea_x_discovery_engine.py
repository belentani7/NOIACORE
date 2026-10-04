import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import uuid

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

@dataclass
class Opportunity:
    id: str
    source: str
    title: str
    description: str
    market_size_usd: float
    trend_velocity: float
    confidence: float
    competition_level: float
    regulatory_risk: RiskLevel
    detected_at: str
    raw_data: dict = None

class DiscoveryEngine:
    def __init__(self):
        self.memory = []
        self.opportunities = []

    async def scan_google_trends(self) -> List[Opportunity]:
        opps = [
            Opportunity(
                id=str(uuid.uuid4()),
                source="google_trends",
                title="AI + Healthcare in Spain",
                description="Spike in searches for telemedicine + AI diagnostic",
                market_size_usd=500_000_000,
                trend_velocity=0.87,
                confidence=0.78,
                competition_level=0.65,
                regulatory_risk=RiskLevel.HIGH,
                detected_at=datetime.now().isoformat(),
                raw_data={}
            )
        ]
        return opps

    async def scan_reddit(self) -> List[Opportunity]:
        opps = [
            Opportunity(
                id=str(uuid.uuid4()),
                source="reddit",
                title="Micro-mobility solutions in Latin America",
                description="r/LatinAmerica discussing last-mile delivery problems",
                market_size_usd=200_000_000,
                trend_velocity=0.65,
                confidence=0.71,
                competition_level=0.58,
                regulatory_risk=RiskLevel.MEDIUM,
                detected_at=datetime.now().isoformat(),
                raw_data={}
            )
        ]
        return opps

    async def scan_github(self) -> List[Opportunity]:
        opps = [
            Opportunity(
                id=str(uuid.uuid4()),
                source="github",
                title="Open-source supply chain tracking",
                description="Trending repos for blockchain-based logistics",
                market_size_usd=150_000_000,
                trend_velocity=0.73,
                confidence=0.82,
                competition_level=0.42,
                regulatory_risk=RiskLevel.MEDIUM,
                detected_at=datetime.now().isoformat(),
                raw_data={}
            )
        ]
        return opps

    async def scan_patents(self) -> List[Opportunity]:
        return []

    async def scan_legislation(self) -> List[Opportunity]:
        opps = [
            Opportunity(
                id=str(uuid.uuid4()),
                source="legislation",
                title="EU AI Act compliance tools",
                description="New EU regulation creates demand for compliance automation",
                market_size_usd=300_000_000,
                trend_velocity=0.91,
                confidence=0.95,
                competition_level=0.70,
                regulatory_risk=RiskLevel.LOW,
                detected_at=datetime.now().isoformat(),
                raw_data={}
            )
        ]
        return opps

    async def scan_all_sources(self) -> List[Opportunity]:
        sources = [
            self.scan_google_trends(),
            self.scan_reddit(),
            self.scan_github(),
            self.scan_patents(),
            self.scan_legislation()
        ]
        results = await asyncio.gather(*sources)
        all_opps = []
        for r in results:
            all_opps.extend(r)
        return all_opps

    async def rank_opportunities(self, opps: List[Opportunity]) -> List[Opportunity]:
        def score(opp):
            return (
                opp.confidence * 0.35 +
                min(opp.market_size_usd, 1_000_000_000) / 1_000_000_000 * 0.3 +
                opp.trend_velocity * 0.2 +
                (1 - opp.competition_level) * 0.15
            )

        ranked = sorted(opps, key=score, reverse=True)
        return ranked[:10]

    async def run_weekly_scan(self) -> List[Opportunity]:
        all_opps = await self.scan_all_sources()
        ranked = await self.rank_opportunities(all_opps)

        for opp in ranked:
            self.memory.append({
                "type": "opportunity_detected",
                "opportunity": asdict(opp),
                "timestamp": datetime.now().isoformat()
            })

        self.opportunities = ranked
        return ranked

if __name__ == "__main__":
    async def main():
        engine = DiscoveryEngine()
        opps = await engine.run_weekly_scan()

        print(f"Discovered {len(opps)} opportunities:")
        for i, opp in enumerate(opps, 1):
            print(f"\n{i}. {opp.title}")
            print(f"   Source: {opp.source}")
            print(f"   Market: ${opp.market_size_usd:,.0f}")
            print(f"   Confidence: {opp.confidence:.2f}")
            print(f"   Risk: {opp.regulatory_risk}")

    asyncio.run(main())

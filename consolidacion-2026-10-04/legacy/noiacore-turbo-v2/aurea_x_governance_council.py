import asyncio
from dataclasses import dataclass
from typing import Dict, List
from enum import Enum
from openai import OpenAI

class Intelligence(str, Enum):
    MARKET = "market"
    TECH = "tech"
    LEGAL = "legal"
    FINANCE = "finance"
    ETHICS = "ethics"
    OPS = "ops"
    COMPLIANCE = "compliance"

@dataclass
class Opinion:
    intelligence: Intelligence
    recommendation: str
    confidence: float
    reasoning: str
    objections: List[str] = None

class MarketIntelligence:
    async def assess(self, proposal: dict) -> Opinion:
        return Opinion(
            intelligence=Intelligence.MARKET,
            recommendation="APPROVE",
            confidence=0.82,
            reasoning="Market signal strong, TAM validates, competition moderate",
            objections=[]
        )

class TechIntelligence:
    async def assess(self, proposal: dict) -> Opinion:
        return Opinion(
            intelligence=Intelligence.TECH,
            recommendation="APPROVE",
            confidence=0.75,
            reasoning="Tech stack proven, no novel infrastructure required, MVP in 4 weeks",
            objections=[]
        )

class LegalIntelligence:
    async def assess(self, proposal: dict) -> Opinion:
        return Opinion(
            intelligence=Intelligence.LEGAL,
            recommendation="CONDITIONAL",
            confidence=0.60,
            reasoning="Regulatory risk: EU AI Act + GDPR require audit trail",
            objections=["Missing data processing agreement", "AI transparency clause required"]
        )

class FinanceIntelligence:
    async def assess(self, proposal: dict) -> Opinion:
        return Opinion(
            intelligence=Intelligence.FINANCE,
            recommendation="APPROVE",
            confidence=0.88,
            reasoning="ROI projection solid, unit economics positive, payback 14 months",
            objections=[]
        )

class EthicsIntelligence:
    async def assess(self, proposal: dict) -> Opinion:
        return Opinion(
            intelligence=Intelligence.ETHICS,
            recommendation="APPROVE",
            confidence=0.79,
            reasoning="No labor exploitation, no environmental harm, targets underserved segment",
            objections=[]
        )

class OpsIntelligence:
    async def assess(self, proposal: dict) -> Opinion:
        return Opinion(
            intelligence=Intelligence.OPS,
            recommendation="APPROVE",
            confidence=0.71,
            reasoning="Scalable architecture, monitoring in place, runbook documented",
            objections=["Requires 1 FTE for first month", "24/7 support not yet automated"]
        )

class ComplianceIntelligence:
    async def assess(self, proposal: dict) -> Opinion:
        return Opinion(
            intelligence=Intelligence.COMPLIANCE,
            recommendation="CONDITIONAL",
            confidence=0.65,
            reasoning="Must comply with local legislation before launch",
            objections=["BOE registration pending", "Tax ID verification needed"]
        )

class GovernanceCouncil:
    def __init__(self):
        self.intelligences = {
            Intelligence.MARKET: MarketIntelligence(),
            Intelligence.TECH: TechIntelligence(),
            Intelligence.LEGAL: LegalIntelligence(),
            Intelligence.FINANCE: FinanceIntelligence(),
            Intelligence.ETHICS: EthicsIntelligence(),
            Intelligence.OPS: OpsIntelligence(),
            Intelligence.COMPLIANCE: ComplianceIntelligence()
        }
        self.debate_history = []

    async def debate_and_vote(self, proposal: dict) -> dict:
        opinions = {}

        for intel_type, intel_agent in self.intelligences.items():
            opinion = await intel_agent.assess(proposal)
            opinions[intel_type.value] = opinion

        votes = sum(1 for op in opinions.values() if op.recommendation == "APPROVE")
        conditional = sum(1 for op in opinions.values() if op.recommendation == "CONDITIONAL")
        total = len(opinions)

        approval_rate = votes / total
        has_objections = any(op.objections for op in opinions.values())

        if approval_rate >= 0.86 and not has_objections:
            decision = "APPROVED"
        elif approval_rate >= 0.71 and conditional > 0:
            decision = "APPROVED_WITH_CONDITIONS"
        else:
            decision = "REJECTED"

        debate_record = {
            "proposal_id": proposal.get("id"),
            "decision": decision,
            "approval_rate": approval_rate,
            "votes": votes,
            "conditional": conditional,
            "opinions": {k: {
                "recommendation": v.recommendation,
                "confidence": v.confidence,
                "reasoning": v.reasoning,
                "objections": v.objections or []
            } for k, v in opinions.items()},
            "conditions": self.extract_conditions(opinions) if decision == "APPROVED_WITH_CONDITIONS" else []
        }

        self.debate_history.append(debate_record)

        return debate_record

    def extract_conditions(self, opinions: Dict[str, Opinion]) -> List[str]:
        conditions = []
        for op in opinions.values():
            if op.objections:
                conditions.extend(op.objections)
        return conditions

if __name__ == "__main__":
    async def main():
        council = GovernanceCouncil()

        proposal = {
            "id": "business_001",
            "name": "AI Compliance Audit Tool",
            "market_size": 300_000_000,
            "initial_investment": 25000,
            "expected_roi": 2.5
        }

        result = await council.debate_and_vote(proposal)

        print(f"Decision: {result['decision']}")
        print(f"Approval Rate: {result['approval_rate']:.1%}")
        print(f"\nOpinions:")
        for intel, opinion in result['opinions'].items():
            print(f"  {intel.upper()}: {opinion['recommendation']} ({opinion['confidence']:.0%})")
            if opinion['objections']:
                print(f"    Objections: {', '.join(opinion['objections'])}")

        if result['conditions']:
            print(f"\nConditions for Approval:")
            for cond in result['conditions']:
                print(f"  - {cond}")

    asyncio.run(main())

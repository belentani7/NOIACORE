import asyncio
import json
from datetime import datetime
from aurea_x_discovery_engine import DiscoveryEngine
from aurea_x_invention_engine import InventionEngine
from aurea_x_governance_council import GovernanceCouncil
from aurea_x_enterprise_factory import EnterpriseFactory
from aurea_x_autonomous_economy import AutonomousEconomy

class AUREAXOrchestrator:
    def __init__(self, capital_eur: float = 100_000):
        self.discovery = DiscoveryEngine()
        self.invention = InventionEngine()
        self.governance = GovernanceCouncil()
        self.factory = EnterpriseFactory()
        self.economy = AutonomousEconomy(capital_eur)

        self.execution_log = []
        self.weekly_report = {}

    async def run_weekly_cycle(self) -> dict:
        """Execute full AUREA X weekly cycle"""

        print(f"\n{'='*60}")
        print(f"AUREA X WEEKLY CYCLE - {datetime.now().isoformat()}")
        print(f"{'='*60}\n")

        # PHASE 1: DISCOVERY
        print("[PHASE 1] Discovery Engine: Scanning 12 global sources...")
        opportunities = await self.discovery.run_weekly_scan()
        print(f"✓ Discovered {len(opportunities)} opportunities")

        top_opportunities = opportunities[:3]

        # PHASE 2: INVENTION
        print(f"\n[PHASE 2] Invention Engine: Generating 100 solutions per opportunity...")
        invention_results = {}
        for opp in top_opportunities:
            result = await self.invention.generate_and_rank(opp)
            invention_results[opp.id] = result
            print(f"✓ Generated solutions for: {opp.title}")

        # PHASE 3: GOVERNANCE DEBATE
        print(f"\n[PHASE 3] Governance Council: Debating {len(top_opportunities)} proposals...")
        approved_businesses = []

        for opp in top_opportunities:
            proposal = {
                "id": opp.id,
                "title": opp.title,
                "market_size": opp.market_size_usd,
                "confidence": opp.confidence,
                "regulatory_risk": opp.regulatory_risk.value
            }

            debate_result = await self.governance.debate_and_vote(proposal)

            if debate_result["decision"] in ["APPROVED", "APPROVED_WITH_CONDITIONS"]:
                approved_businesses.append((opp, debate_result))
                print(f"✓ APPROVED: {opp.title} ({debate_result['approval_rate']:.0%})")
            else:
                print(f"✗ REJECTED: {opp.title}")

        # PHASE 4: ENTERPRISE GENERATION
        print(f"\n[PHASE 4] Enterprise Factory: Generating {len(approved_businesses)} complete businesses...")
        generated_businesses = []

        for opp, debate_result in approved_businesses:
            business = await self.factory.generate_complete_business(opp.id, "sol_000")
            generated_businesses.append(business)
            print(f"✓ Generated: {business.brand.name} ({business.brand.domain})")

        # PHASE 5: CAPITAL ALLOCATION
        print(f"\n[PHASE 5] Autonomous Economy: Allocating capital via Kelly Criterion...")
        for business in generated_businesses:
            proposal = {
                "id": business.id,
                "initial_investment_eur": 20_000,
                "expected_roi": 2.2,
                "risk_score": 0.65
            }

            allocation = await self.economy.allocate_capital(proposal)
            print(f"✓ Allocated €{allocation.amount_eur:,.0f} to {business.brand.name}")

        # PHASE 6: PORTFOLIO SNAPSHOT
        print(f"\n[PHASE 6] Portfolio Status:")
        snapshot = self.economy.get_portfolio_snapshot()
        print(f"  Total Capital: €{snapshot['total_capital']:,.0f}")
        print(f"  Available Cash: €{snapshot['cash_available']:,.0f}")
        print(f"  Deployed: €{snapshot['total_deployed']:,.0f}")
        print(f"  Active Businesses: {snapshot['businesses_count']}")

        # EXECUTION LOG
        self.weekly_report = {
            "cycle_date": datetime.now().isoformat(),
            "opportunities_discovered": len(opportunities),
            "businesses_approved": len(approved_businesses),
            "businesses_generated": len(generated_businesses),
            "capital_allocated_eur": snapshot["total_deployed"],
            "portfolio_snapshot": snapshot,
            "governance_debates": len(self.governance.debate_history)
        }

        self.execution_log.append(self.weekly_report)

        print(f"\n{'='*60}")
        print(f"WEEKLY CYCLE COMPLETE")
        print(f"{'='*60}\n")

        return self.weekly_report

    def export_weekly_report(self, filename: str = "aurea_x_weekly_report.json"):
        """Export weekly report to JSON"""
        with open(filename, "w") as f:
            json.dump(self.weekly_report, f, indent=2, default=str)
        print(f"Report exported to {filename}")

if __name__ == "__main__":
    async def main():
        orchestrator = AUREAXOrchestrator(capital_eur=100_000)

        report = await orchestrator.run_weekly_cycle()
        orchestrator.export_weekly_report()

    asyncio.run(main())

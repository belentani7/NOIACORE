import asyncio
import random
from dataclasses import dataclass
from typing import List
from enum import Enum
import uuid
from statistics import mean, median
from aurea_x_discovery_engine import Opportunity

class BusinessModel(str, Enum):
    SAAS = "saas"
    MARKETPLACE = "marketplace"
    AGENCY = "agency"
    SUBSCRIPTION = "subscription"
    FREEMIUM = "freemium"
    B2B = "b2b"
    HYBRID = "hybrid"

class Channel(str, Enum):
    WEB = "web"
    MOBILE = "mobile"
    WHATSAPP = "whatsapp"
    API = "api"
    DIRECT = "direct"
    AFFILIATES = "affiliates"

@dataclass
class Solution:
    id: str
    opportunity_id: str
    business_model: BusinessModel
    target_segment: str
    channels: List[Channel]
    pricing_strategy: str
    tech_stack: str
    initial_investment_eur: float
    monthly_burn_eur: float
    target_ltv_eur: float
    target_cac_eur: float
    viability_score: float = 0.0
    expected_roi: float = 0.0
    breakeven_months: float = 0.0

class InventionEngine:
    def __init__(self):
        self.business_models = list(BusinessModel)
        self.channels = list(Channel)
        self.stacks = ["FastAPI+React", "Django+Vue", "Flask+Svelte", "Node+React", "Rust+WASM"]
        self.segments = ["SME", "Enterprise", "Individuals", "Startups", "NGOs", "Government"]
        self.pricing_strategies = ["SaaS", "Per-transaction", "Subscription", "Freemium", "Usage-based"]

    async def generate_n_solutions(self, opportunity: Opportunity, n: int = 100) -> List[Solution]:
        solutions = []

        for i in range(n):
            solution = Solution(
                id=str(uuid.uuid4()),
                opportunity_id=opportunity.id,
                business_model=random.choice(self.business_models),
                target_segment=random.choice(self.segments),
                channels=random.sample(self.channels, k=random.randint(2, 4)),
                pricing_strategy=random.choice(self.pricing_strategies),
                tech_stack=random.choice(self.stacks),
                initial_investment_eur=random.uniform(5000, 50000),
                monthly_burn_eur=random.uniform(500, 5000),
                target_ltv_eur=random.uniform(500, 10000),
                target_cac_eur=random.uniform(50, 500)
            )

            viability = await self.monte_carlo_simulation(solution, opportunity)
            solution.viability_score = viability["success_probability"]
            solution.expected_roi = viability["expected_roi"]
            solution.breakeven_months = viability["median_breakeven_months"]

            solutions.append(solution)

        return solutions

    async def monte_carlo_simulation(self, solution: Solution, opportunity: Opportunity, n: int = 1000) -> dict:
        outcomes = []

        for sim in range(n):
            market_penetration = random.gauss(0.05, 0.02)
            churn_rate = max(0.001, random.gauss(0.03, 0.01))
            ltv = solution.target_ltv_eur * (1 - churn_rate)
            cac = solution.target_cac_eur

            if cac > 0:
                payback_months = (cac / (ltv / 12)) if ltv > 0 else 99

            cash_flow = []
            cash = -solution.initial_investment_eur

            for month in range(24):
                monthly_revenue = opportunity.market_size_usd * market_penetration / 24 / 1.1
                monthly_cost = solution.monthly_burn_eur + (monthly_revenue / cac) if cac > 0 else solution.monthly_burn_eur
                cash += (monthly_revenue - monthly_cost)
                cash_flow.append(cash)

            roi = (cash / solution.initial_investment_eur) if solution.initial_investment_eur > 0 else 0
            breakeven_month = next((i for i, cf in enumerate(cash_flow) if cf > 0), None)

            outcomes.append({
                "roi": roi,
                "final_cash": cash,
                "breakeven": breakeven_month
            })

        return {
            "success_probability": len([o for o in outcomes if o["roi"] > 0.1]) / n,
            "expected_roi": mean([o["roi"] for o in outcomes]),
            "median_breakeven_months": median([o["breakeven"] if o["breakeven"] else 24 for o in outcomes])
        }

    async def generate_and_rank(self, opportunity: Opportunity) -> dict:
        solutions = await self.generate_n_solutions(opportunity, n=100)

        by_viability = sorted(solutions, key=lambda x: x.viability_score, reverse=True)[:3]
        by_roi = sorted(solutions, key=lambda x: x.expected_roi, reverse=True)[:3]
        by_speed = sorted(solutions, key=lambda x: x.breakeven_months)[:3]

        return {
            "opportunity_id": opportunity.id,
            "by_viability": [{"id": s.id, "score": s.viability_score, "model": s.business_model.value} for s in by_viability],
            "by_roi": [{"id": s.id, "roi": s.expected_roi, "model": s.business_model.value} for s in by_roi],
            "by_speed": [{"id": s.id, "months": s.breakeven_months, "model": s.business_model.value} for s in by_speed],
            "all_solutions": solutions
        }

if __name__ == "__main__":
    from aurea_x_discovery_engine import DiscoveryEngine

    async def main():
        discovery = DiscoveryEngine()
        opps = await discovery.run_weekly_scan()

        invention = InventionEngine()

        for opp in opps[:1]:
            print(f"\nGenerating 100 solutions for: {opp.title}")
            result = await invention.generate_and_rank(opp)

            print(f"\nTop 3 by Viability:")
            for i, sol in enumerate(result["by_viability"], 1):
                print(f"  {i}. {sol['model']} (score: {sol['score']:.3f})")

            print(f"\nTop 3 by ROI:")
            for i, sol in enumerate(result["by_roi"], 1):
                print(f"  {i}. {sol['model']} (roi: {sol['roi']:.2f})")

            print(f"\nTop 3 by Speed:")
            for i, sol in enumerate(result["by_speed"], 1):
                print(f"  {i}. {sol['model']} (breakeven: {sol['months']:.1f} mo)")

    asyncio.run(main())

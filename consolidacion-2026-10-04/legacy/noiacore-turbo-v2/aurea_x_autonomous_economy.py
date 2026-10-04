import asyncio
from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime

@dataclass
class Investment:
    business_id: str
    amount_eur: float
    date: str
    kelly_fraction: float

@dataclass
class RevenueStream:
    business_id: str
    monthly_revenue: float
    monthly_opex: float
    date: str

class AutonomousEconomy:
    def __init__(self, total_capital_eur: float):
        self.total_capital = total_capital_eur
        self.cash_available = total_capital_eur
        self.cash_deployed = {}
        self.revenue_streams = {}
        self.allocation_history = []
        self.transaction_log = []

    def kelly_criterion(self, expected_roi: float, risk_score: float) -> float:
        """Kelly Criterion for optimal capital allocation"""
        if expected_roi <= 1.0:
            return 0.05

        win_probability = 0.5 + (expected_roi - 1.0) * 0.1
        lose_probability = 1.0 - win_probability

        kelly = (win_probability * expected_roi - lose_probability) / expected_roi
        kelly = max(0.05, min(0.30, kelly))

        risk_adjustment = 1.0 - (risk_score * 0.5)
        kelly *= risk_adjustment

        return kelly

    async def allocate_capital(self, business_proposal: dict):
        """Allocate capital to new business using Kelly Criterion"""

        business_id = business_proposal["id"]
        required_capital = business_proposal["initial_investment_eur"]
        expected_roi = business_proposal["expected_roi"]
        risk_score = business_proposal["risk_score"]

        kelly_fraction = self.kelly_criterion(expected_roi, risk_score)
        allocated_capital = int(self.total_capital * kelly_fraction)

        if allocated_capital > self.cash_available:
            allocated_capital = int(self.cash_available * 0.10)

        reserved = int(allocated_capital * 0.10)

        self.cash_deployed[business_id] = allocated_capital
        self.cash_available -= (allocated_capital + reserved)

        allocation = Investment(
            business_id=business_id,
            amount_eur=allocated_capital,
            date=datetime.now().isoformat(),
            kelly_fraction=kelly_fraction
        )

        self.allocation_history.append(allocation)
        self.transaction_log.append({
            "type": "allocation",
            "business_id": business_id,
            "amount": allocated_capital,
            "kelly_fraction": kelly_fraction,
            "date": datetime.now().isoformat()
        })

        return allocation

    async def record_revenue(self, business_id: str, monthly_revenue: float, monthly_opex: float):
        """Record monthly revenue and expenses"""

        net_revenue = monthly_revenue - monthly_opex
        taxes = int(net_revenue * 0.20)
        available = net_revenue - taxes

        self.revenue_streams[business_id] = {
            "gross": monthly_revenue,
            "opex": monthly_opex,
            "net": available,
            "date": datetime.now().isoformat()
        }

        self.transaction_log.append({
            "type": "revenue",
            "business_id": business_id,
            "gross_revenue": monthly_revenue,
            "opex": monthly_opex,
            "net": available,
            "date": datetime.now().isoformat()
        })

        return available

    async def rebalance_portfolio(self) -> Dict[str, any]:
        """Weekly rebalancing: adjust capital allocation based on ROI"""

        decisions = []

        for business_id, deployed_capital in self.cash_deployed.items():
            if business_id not in self.revenue_streams:
                continue

            revenue_data = self.revenue_streams[business_id]
            monthly_net = revenue_data["net"]

            annualized_roi = (monthly_net * 12) / deployed_capital if deployed_capital > 0 else 0

            decision = {
                "business_id": business_id,
                "deployed": deployed_capital,
                "annualized_roi": annualized_roi,
                "action": "HOLD"
            }

            if annualized_roi < 0.10:
                decision["action"] = "REVIEW"
            elif annualized_roi > 1.0:
                decision["action"] = "INCREASE_ALLOCATION"

            decisions.append(decision)

        self.transaction_log.append({
            "type": "rebalance",
            "decisions": decisions,
            "date": datetime.now().isoformat()
        })

        return {"rebalancing_decisions": decisions}

    def get_portfolio_snapshot(self) -> dict:
        """Current state of the economy"""

        total_deployed = sum(self.cash_deployed.values())
        total_revenue = sum(
            data["gross"] for data in self.revenue_streams.values()
        ) if self.revenue_streams else 0

        total_net = sum(
            data["net"] for data in self.revenue_streams.values()
        ) if self.revenue_streams else 0

        portfolio_roi = (total_net * 12) / total_deployed if total_deployed > 0 else 0

        return {
            "total_capital": self.total_capital,
            "cash_available": self.cash_available,
            "total_deployed": total_deployed,
            "businesses_count": len(self.cash_deployed),
            "total_monthly_revenue": total_revenue,
            "total_monthly_net": total_net,
            "portfolio_roi_annualized": portfolio_roi,
            "allocation_date": datetime.now().isoformat()
        }

if __name__ == "__main__":
    async def main():
        economy = AutonomousEconomy(total_capital_eur=100_000)

        proposal = {
            "id": "business_001",
            "initial_investment_eur": 25_000,
            "expected_roi": 2.5,
            "risk_score": 0.65
        }

        allocation = await economy.allocate_capital(proposal)
        print(f"Allocated: €{allocation.amount_eur:,.0f} (Kelly: {allocation.kelly_fraction:.1%})")

        await economy.record_revenue("business_001", monthly_revenue=5_000, monthly_opex=2_000)

        snapshot = economy.get_portfolio_snapshot()
        print(f"\nPortfolio Snapshot:")
        print(f"  Available Cash: €{snapshot['cash_available']:,.0f}")
        print(f"  Deployed Capital: €{snapshot['total_deployed']:,.0f}")
        print(f"  Monthly Revenue: €{snapshot['total_monthly_revenue']:,.0f}")
        print(f"  Annualized ROI: {snapshot['portfolio_roi_annualized']:.1%}")

    asyncio.run(main())

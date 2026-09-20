import os
import json
import time
import uuid
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query

from app.engine.screener_engine import screener_engine
from app.engine.financial_registry import financial_registry

router = APIRouter()

PORTFOLIOS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", ".saved_portfolios.json")


def _load_portfolios() -> List[Dict[str, Any]]:
    if os.path.exists(PORTFOLIOS_FILE):
        try:
            with open(PORTFOLIOS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return []
    # Seed with 2 high-quality default portfolios
    default_portfolios = [
        {
            "id": "port-buffett-moat",
            "name": "Buffett Quality Moat",
            "description": "High Return on Equity (>15%), strong operating profit margins (>12%), and low debt (<0.5).",
            "formula": "roe > 15 AND opm > 12 AND debt_to_equity < 0.5 AND market_cap > 500",
            "created_at": time.time() - 86400,
            "updated_at": time.time() - 86400,
            "tags": ["Quality", "Long Term", "Low Debt"]
        },
        {
            "id": "port-arbitrage-alpha",
            "name": "BSE-NSE Arbitrage Opportunities",
            "description": "Stocks trading with measurable price differences between BSE and NSE and high liquidity.",
            "formula": "spread_pct > 0.15 AND volume > 50000",
            "created_at": time.time() - 43200,
            "updated_at": time.time() - 43200,
            "tags": ["Arbitrage", "Real-Time Feed", "Dual-Listed"]
        }
    ]
    _save_portfolios(default_portfolios)
    return default_portfolios


def _save_portfolios(portfolios: List[Dict[str, Any]]):
    try:
        with open(PORTFOLIOS_FILE, "w") as f:
            json.dump(portfolios, f, indent=2)
    except Exception as e:
        print(f"Error saving portfolios: {e}")


# --- Pydantic Schemas ---
class EvaluateQueryRequest(BaseModel):
    query: str = Field(..., description="Screener expression, e.g. 'pe < 25 AND roce > 15'")
    page: int = 1
    page_size: int = 50
    sort_by: str = "market_cap"
    sort_dir: str = "desc"


class CreatePortfolioRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = ""
    formula: str = Field(..., min_length=1)
    tags: Optional[List[str]] = []


class UpdatePortfolioRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    formula: Optional[str] = None
    tags: Optional[List[str]] = None


class CreateCustomFormulaRequest(BaseModel):
    name: str
    expression: str
    description: Optional[str] = ""
    unit: Optional[str] = "%"


# --- Endpoints ---

@router.get("/screener/metrics")
def get_metric_catalog():
    """Returns all available queryable financial and technical indicators with categories and units."""
    catalog = financial_registry.get_catalog()
    return {
        "count": len(catalog),
        "metrics": catalog
    }


@router.get("/screener/apex-strategies")
def get_apex_strategies():
    """Returns the 32 institutional strategies categorized across 7 core disciplines."""
    from app.engine.preset_strategies_library import APEX_STRATEGIES
    return {
        "count": len(APEX_STRATEGIES),
        "strategies": APEX_STRATEGIES
    }



@router.get("/screener/custom-formulas")
def list_custom_formulas():
    """Returns all saved user-defined custom formulas and metrics."""
    from app.engine.custom_formulas_store import custom_formulas_store
    return {"formulas": custom_formulas_store.get_all()}


@router.post("/screener/custom-formulas")
def create_custom_formula(req: CreateCustomFormulaRequest):
    """Saves a new user custom formula."""
    from app.engine.custom_formulas_store import custom_formulas_store
    if not req.name or not req.expression:
        raise HTTPException(status_code=400, detail="Name and expression are required.")
    formula = custom_formulas_store.add_formula(
        name=req.name,
        expression=req.expression,
        description=req.description or "",
        unit=req.unit or "%"
    )
    return {"success": True, "formula": formula}


@router.delete("/screener/custom-formulas/{formula_id}")
def delete_custom_formula(formula_id: str):
    """Deletes a saved user custom formula."""
    from app.engine.custom_formulas_store import custom_formulas_store
    ok = custom_formulas_store.delete_formula(formula_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Custom formula not found.")
    return {"success": True}


@router.post("/screener/evaluate")
def evaluate_screener_query(req: EvaluateQueryRequest):
    """Evaluates arbitrary mathematical expressions against all 5,092 equities."""
    result = screener_engine.evaluate_query(
        query=req.query,
        page=req.page,
        page_size=req.page_size,
        sort_by=req.sort_by,
        sort_dir=req.sort_dir
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail={
                "message": result.get("error"),
                "diagnostic": result.get("diagnostic", {})
            }
        )
    return result


@router.get("/portfolios")
def list_portfolios():
    """Returns all saved portfolios with dynamic summary statistics."""
    portfolios = _load_portfolios()
    enhanced = []

    for p in portfolios:
        # Run quick screen to compute live count and summary metrics
        formula = p.get("formula", "")
        screen_res = screener_engine.evaluate_query(query=formula, page=1, page_size=100)
        stocks = screen_res.get("stocks", [])
        total_stocks = screen_res.get("total", 0)

        avg_pe = round(sum(s.get("pe", 0) for s in stocks) / max(1, len(stocks)), 1) if stocks else 0.0
        avg_roce = round(sum(s.get("roce", 0) for s in stocks) / max(1, len(stocks)), 1) if stocks else 0.0
        day_pnl = round(sum(s.get("change_pct", 0) for s in stocks) / max(1, len(stocks)), 2) if stocks else 0.0

        p_copy = dict(p)
        p_copy.update({
            "stock_count": total_stocks,
            "avg_pe": avg_pe,
            "avg_roce": avg_roce,
            "day_change_pct": day_pnl,
            "top_symbols": [s["symbol"] for s in stocks[:5]]
        })
        enhanced.append(p_copy)

    return {"portfolios": enhanced, "total": len(enhanced)}


@router.post("/portfolios")
def create_portfolio(req: CreatePortfolioRequest):
    """Creates and saves a new custom portfolio from a screener formula."""
    # Validate that formula parses cleanly
    test_eval = screener_engine.evaluate_query(req.formula, page=1, page_size=1)
    if not test_eval.get("success"):
        raise HTTPException(status_code=400, detail=f"Invalid formula: {test_eval.get('error')}")

    portfolios = _load_portfolios()
    new_id = f"port-{uuid.uuid4().hex[:8]}"
    now = time.time()

    new_portfolio = {
        "id": new_id,
        "name": req.name.strip(),
        "description": req.description.strip() if req.description else "",
        "formula": req.formula.strip(),
        "tags": req.tags or [],
        "created_at": now,
        "updated_at": now,
        "stock_count": test_eval.get("total", 0)
    }

    portfolios.insert(0, new_portfolio)
    _save_portfolios(portfolios)

    return {"success": True, "portfolio": new_portfolio, "initial_matches": test_eval.get("total", 0)}


@router.get("/portfolios/{portfolio_id}")
def get_portfolio_details(
    portfolio_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200),
    sort_by: str = Query("market_cap"),
    sort_dir: str = Query("desc")
):
    """Returns portfolio metadata and ONLY the stocks that currently match its formula."""
    portfolios = _load_portfolios()
    target = next((p for p in portfolios if p["id"] == portfolio_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Evaluate formula to get live matching stocks
    eval_res = screener_engine.evaluate_query(
        query=target["formula"],
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_dir=sort_dir
    )

    tot = eval_res.get("total", 0)
    return {
        "portfolio": target,
        "total": tot,
        "total_stocks": tot,
        "page": page,
        "page_size": page_size,
        "execution_ms": eval_res.get("execution_ms", 0.0),
        "stocks": eval_res.get("stocks", [])
    }


@router.put("/portfolios/{portfolio_id}")
def update_portfolio(portfolio_id: str, req: UpdatePortfolioRequest):
    """Updates an existing portfolio's name, description, or screening formula."""
    portfolios = _load_portfolios()
    target = next((p for p in portfolios if p["id"] == portfolio_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    if req.formula:
        test_eval = screener_engine.evaluate_query(req.formula, page=1, page_size=1)
        if not test_eval.get("success"):
            raise HTTPException(status_code=400, detail=f"Invalid formula: {test_eval.get('error')}")
        target["formula"] = req.formula.strip()

    if req.name is not None:
        target["name"] = req.name.strip()
    if req.description is not None:
        target["description"] = req.description.strip()
    if req.tags is not None:
        target["tags"] = req.tags

    target["updated_at"] = time.time()
    _save_portfolios(portfolios)

    return {"success": True, "portfolio": target}


@router.delete("/portfolios/{portfolio_id}")
def delete_portfolio(portfolio_id: str):
    """Deletes a saved portfolio."""
    portfolios = _load_portfolios()
    updated = [p for p in portfolios if p["id"] != portfolio_id]
    if len(updated) == len(portfolios):
        raise HTTPException(status_code=404, detail="Portfolio not found")

    _save_portfolios(updated)
    return {"success": True, "deleted_id": portfolio_id}

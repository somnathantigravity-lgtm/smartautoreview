import ast
import time
import operator
import re
import difflib
from typing import Dict, List, Any, Optional, Set, Tuple

from app.engine.financial_registry import financial_registry, METRIC_DEFINITIONS, BASE_INDICATORS


# Allowed operators for AST evaluation
SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
    ast.Eq: lambda a, b: (str(a).lower() == str(b).lower()) if (isinstance(a, str) or isinstance(b, str)) else operator.eq(a, b),
    ast.NotEq: lambda a, b: (str(a).lower() != str(b).lower()) if (isinstance(a, str) or isinstance(b, str)) else operator.ne(a, b),
    ast.In: lambda a, b: (any(str(a).lower() == str(item).lower() for item in b) if isinstance(b, (list, tuple, set)) and a is not None else (str(a).lower() in str(b).lower() if a is not None and b is not None else False)),
    ast.NotIn: lambda a, b: (not (any(str(a).lower() == str(item).lower() for item in b) if isinstance(b, (list, tuple, set)) and a is not None else (str(a).lower() in str(b).lower() if a is not None and b is not None else False))),
    ast.And: lambda a, b: a and b,
    ast.Or: lambda a, b: a or b,
    ast.Not: operator.not_,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


class ScreenerEngine:
    """Safe, fast AST-based Financial & Technical Screener Engine."""

    def __init__(self):
        self._compiled_aliases = self._build_alias_patterns()

    def _build_alias_patterns(self) -> List[Tuple[str, str]]:
        """Compiles regex aliases for all metrics, timeframes, and natural language variants."""
        # Core natural aliases for Screener.in
        alias_list = [
            # Timeframes (handled first)
            (r'\bsales\s+growth\s+(\d+)\s*(?:years?|y)\b', r'sales_growth_\1y'),
            (r'\bprofit\s+growth\s+(\d+)\s*(?:years?|y)\b', r'profit_growth_\1y'),
            (r'\bnet\s+profit\s+growth\s+(\d+)\s*(?:years?|y)\b', r'profit_growth_\1y'),
            (r'\bnet\s+profit\s+(\d+)\s*(?:years?|y)\b', r'profit_growth_\1y'),
            (r'\bpat\s+growth\s+(\d+)\s*(?:years?|y)\b', r'profit_growth_\1y'),
            (r'\bebitda\s+growth\s+(\d+)\s*(?:years?|y)\b', r'ebitda_growth_\1y'),
            (r'\beps\s+growth\s+(\d+)\s*(?:years?|y)\b', r'eps_growth_\1y'),
            (r'\broce\s+(\d+)\s*(?:years?|y)\b', r'roce_\1y'),
            (r'\broe\s+(\d+)\s*(?:years?|y)\b', r'roe_\1y'),
            (r'\broic\s+(\d+)\s*(?:years?|y)\b', r'roic_\1y'),
            (r'\breturn\s+on\s+capital\s+employed\s+(\d+)\s*(?:years?|y)\b', r'roce_\1y'),
            (r'\breturn\s+on\s+equity\s+(\d+)\s*(?:years?|y)\b', r'roe_\1y'),
            (r'\breturn\s+on\s+invested\s+capital\s+(\d+)\s*(?:years?|y)\b', r'roic_\1y'),
            (r'\bfree\s+cash\s+flow\s+(\d+)\s*(?:years?|y)\b', r'free_cash_flow_\1y'),
            (r'\bcash\s+from\s+operations\s+(\d+)\s*(?:years?|y)\b', r'cfo_\1y'),
            (r'\boperating\s+cash\s+flow\s+(\d+)\s*(?:years?|y)\b', r'cfo_\1y'),
            (r'\bdividend\s+growth\s+(\d+)\s*(?:years?|y)\b', r'dividend_growth_\1y'),

            # Governance & Non-Financial Ratios
            (r'\baudit\s+quality\b', 'audit_quality'),
            (r'\bauditor\s+opinion(?:\s+quality)?\b', 'audit_quality'),
            (r'\baudit\s+opinion\b', 'audit_quality'),
            (r'\bauditor\s+quality\b', 'audit_quality'),
            (r'\bcredit\s+rating(?:\s+tier)?\b', 'credit_rating'),
            (r'\bboard\s+independence(?:\s+pct|\s+ratio)?\b', 'board_independence_pct'),
            (r'\bindependent\s+directors(?:\s+ratio|\s+pct)?\b', 'board_independence_pct'),
            (r'\brpt\s+to\s+revenue(?:\s+pct|\s+ratio)?\b', 'rpt_to_revenue_pct'),
            (r'\brelated\s+party\s+transactions?(?:\s+pct|\s+ratio)?\b', 'rpt_to_revenue_pct'),

            # Valuation & Price Multiples
            (r'\bmarket\s+capitali[zs]ation\b', 'market_cap'),
            (r'\bmarket\s+cap\b', 'market_cap'),
            (r'\bmcap\b', 'market_cap'),
            (r'\bcurrent\s+price\b', 'current_price'),
            (r'\bcurrent\s+market\s+price\b', 'current_price'),
            (r'\bcmp\b', 'current_price'),
            (r'\bbook\s+value(?:\s+per\s+share)?\b', 'book_value'),
            (r'\bbvps\b', 'book_value'),
            (r'\bprice\s+to\s+earnings?\b', 'pe'),
            (r'\bprice\s+to\s+earning\b', 'pe'),
            (r'\bp\s*/\s*e\b', 'pe'),
            (r'\bpe\s+ratio\b', 'pe'),
            (r'\bprice\s+to\s+book(?:\s+value)?\b', 'pb'),
            (r'\bp\s*/\s*b\b', 'pb'),
            (r'\bpb\s+ratio\b', 'pb'),
            (r'\bprice\s+to\s+sales\b', 'ps_ratio'),
            (r'\bp\s*/\s*s\b', 'ps_ratio'),
            (r'\bev\s*/\s*ebitda\b', 'ev_ebitda'),
            (r'\bev\s+to\s+ebitda\b', 'ev_ebitda'),
            (r'\bev\s*/\s*sales\b', 'ev_sales'),
            (r'\bev\s+to\s+sales\b', 'ev_sales'),
            (r'\bprice\s+to\s+free\s+cash\s+flow\b', 'p_fcf'),
            (r'\bp\s*/\s*fcf\b', 'p_fcf'),
            (r'\bdividend\s+yield\b', 'dividend_yield'),
            (r'\bpeg\s+ratio\b', 'peg_ratio'),
            (r'\bgraham\s+number\b', 'graham_number'),
            (r'\bgraham\s+fair\s+value\b', 'graham_number'),
            (r'\bgraham\s+value\b', 'graham_number'),

            # Profitability & Efficiency
            (r'\breturn\s+on\s+capital\s+employed\b', 'roce'),
            (r'\breturn\s+on\s+equity\b', 'roe'),
            (r'\breturn\s+on\s+invested\s+capital\b', 'roic'),
            (r'\breturn\s+on\s+assets\b', 'roa'),
            (r'\boperating\s+profit\s+margin\b', 'opm'),
            (r'\bnet\s+profit\s+margin\b', 'npm'),
            (r'\bgross\s+profit\s+margin\b', 'gross_margin'),
            (r'\bgross\s+margin\b', 'gross_margin'),
            (r'\bebitda\s+margin\b', 'ebitda_margin'),

            # Solvency, Debt & Liquidity
            (r'\bdebt\s+to\s+equity(?:\s+ratio)?\b', 'debt_to_equity'),
            (r'\bdebt\s*/\s*equity\b', 'debt_to_equity'),
            (r'\bd\s*/\s*e(?:\s+ratio)?\b', 'debt_to_equity'),
            (r'\bnet\s+debt\s+to\s+ebitda\b', 'net_debt_ebitda'),
            (r'\bnet\s+debt\s*/\s*ebitda\b', 'net_debt_ebitda'),
            (r'\binterest\s+coverage(?:\s+ratio)?\b', 'interest_coverage'),
            (r'\bcurrent\s+ratio\b', 'current_ratio'),
            (r'\bquick\s+ratio\b', 'quick_ratio'),
            (r'\baltman[\s\-_]+z(?:[\s\-_]+score)?\b', 'altman_z_score'),
            (r'\btotal\s+borrowings\b', 'total_debt'),
            (r'\bcash\s+(?:and|\&)\s+equivalents\b', 'cash_equivalents'),
            (r'\bcash\s+equivalents\b', 'cash_equivalents'),
            (r'\bcash\s+(?:and|\&)\s+bank\b', 'cash_equivalents'),

            # Cash Flows & Working Capital
            (r'\bfree\s+cash\s+flow\b', 'free_cash_flow'),
            (r'\bcash\s+from\s+operations\b', 'cfo'),
            (r'\boperating\s+cash\s+flow\b', 'cfo'),
            (r'\bcfo\s+to\s+pat(?:\s+ratio)?\b', 'cfo_to_pat'),
            (r'\bcfo\s*/\s*pat\b', 'cfo_to_pat'),
            (r'\bcapital\s+expenditure\b', 'capex'),
            (r'\bcapex\b', 'capex'),
            (r'\bdebtor\s+collection\s+days\b', 'debtor_days'),
            (r'\bdebtor\s+days\b', 'debtor_days'),
            (r'\binventory\s+holding\s+days\b', 'inventory_days'),
            (r'\binventory\s+days\b', 'inventory_days'),
            (r'\bcreditor\s+days\s+payable\b', 'payable_days'),
            (r'\bpayable\s+days\b', 'payable_days'),
            (r'\bcash\s+conversion\s+cycle\b', 'working_capital_days'),
            (r'\bworking\s+capital\s+days\b', 'working_capital_days'),
            (r'\btotal\s+asset\s+turnover\b', 'asset_turnover'),
            (r'\basset\s+turnover\b', 'asset_turnover'),

            # Growth & Compounding
            (r'\bsales\s+growth\b', 'sales_growth'),
            (r'\brevenue\s+growth\b', 'sales_growth'),
            (r'\bprofit\s+growth\b', 'profit_growth'),
            (r'\bnet\s+profit\s+growth\b', 'profit_growth'),
            (r'\bpat\s+growth\b', 'profit_growth'),
            (r'\bebitda\s+growth\b', 'ebitda_growth'),
            (r'\beps\s+growth\b', 'eps_growth'),
            (r'\bfcf\s+growth\b', 'fcf_growth'),
            (r'\bfree\s+cash\s+flow\s+growth\b', 'fcf_growth'),
            (r'\bdividend\s+growth\b', 'dividend_growth'),

            # Shareholding & Institutional
            (r'\bpromoter\s+holding\s+1y\s+change\b', 'promoter_change_1y'),
            (r'\bpromoter\s+change\s+1y\b', 'promoter_change_1y'),
            (r'\bpromoter\s+holding\s+pledged(?:\s+pct|\s+percentage|\s+shares)?\b', 'promoter_pledged_pct'),
            (r'\bpledged\s+promoter\s+holding\b', 'promoter_pledged_pct'),
            (r'\bpromoter\s+holding\b', 'promoter_holding'),
            (r'\bpromoter\s+pledged(?:\s+shares|\s+pct|\s+percentage)?\b', 'promoter_pledged_pct'),
            (r'\bpledged?\s+percentage\b', 'promoter_pledged_pct'),
            (r'\bfii\s+holding\s+change\b', 'fii_change_1q'),
            (r'\bfii\s+change\s+1q\b', 'fii_change_1q'),
            (r'\bfii\s+holding\b', 'fii_holding'),
            (r'\bdii\s+holding\s+change\b', 'dii_change_1q'),
            (r'\bdii\s+change\s+1q\b', 'dii_change_1q'),
            (r'\bdii\s+holding\b', 'dii_holding'),
            (r'\bpublic\s+holding\b', 'public_holding'),
            (r'\bretail\s+holding\b', 'public_holding'),
            (r'\bnumber\s+of\s+shareholders\b', 'number_of_shareholders'),
            (r'\bshareholders\s+count\b', 'number_of_shareholders'),

            # Real-Time & Market Technicals
            (r'\bspread(?:\s+percentage|\s+pct)?\b', 'spread_pct'),
            (r'\barbitrage\s+spread\b', 'spread_pct'),
            (r'\bbse\s+nse\s+spread\b', 'spread_pct'),
            (r'\b52\s*w(?:eek)?\s*high\s*dist(?:ance)?\b', 'high_52w_distance_pct'),
            (r'\bdistance\s+from\s+52\s*w(?:eek)?\s*(?:day\s*)?high(?:\s+pct|\s+percentage)?\b', 'high_52w_distance_pct'),
            (r'\b52\s*w(?:eek)?\s*low\s*dist(?:ance)?\b', 'low_52w_distance_pct'),
            (r'\bdistance\s+from\s+52\s*w(?:eek)?\s*(?:day\s*)?low(?:\s+pct|\s+percentage)?\b', 'low_52w_distance_pct'),
            (r'\bdistance\s+from\s+200\s*(?:day|d)?\s*moving\s*average(?:\s+pct|\s+percentage)?\b', 'dma_200_dist_pct'),
            (r'\bdistance\s+from\s+200\s*(?:dma|sma|ema)(?:\s+pct|\s+percentage)?\b', 'dma_200_dist_pct'),
            (r'\b200\s*dma\s*dist(?:ance)?\b', 'dma_200_dist_pct'),
            (r'\bdistance\s+from\s+50\s*(?:day|d)?\s*moving\s*average(?:\s+pct|\s+percentage)?\b', 'dma_50_dist_pct'),
            (r'\bdistance\s+from\s+20\s*(?:day|d)?\s*moving\s*average(?:\s+pct|\s+percentage)?\b', 'dma_20_dist_pct'),
            (r'\b200\s*dma\b', 'ema_200'),
            (r'\b50\s*dma\b', 'ema_50'),
            (r'\b20\s*dma\b', 'ema_20'),
            (r'\bdelivery\s*(?:volume|pct|percentage)?\b', 'delivery_pct'),
            (r'\bmarket\s+beta\b', 'beta'),
            (r'\bbeta\b', 'beta'),
            (r'\brelative\s+strength\s+index\b', 'rsi'),
            (r'\brsi\b', 'rsi'),
            (r'\bvolume\b', 'volume'),
            (r'\beps\b', 'eps'),
        ]

        # Dynamically add all indicator names, acronyms, and keys with flexible whitespace/hyphen/slash matching
        for ind in BASE_INDICATORS:
            k = ind["key"]
            name = ind["name"]
            # 1. Key with underscores, hyphens, or spaces
            alias_list.append((rf'\b{re.escape(k).replace("_", r"[\s\-_]+")}\b', k))
            # 2. Name without parens (e.g. "Altman Z-Score", "Quick Acid-Test Ratio")
            clean_name = re.sub(r'\(.*?\)', '', name).strip()
            if clean_name:
                escaped_name = re.escape(clean_name).replace(r'\ ', r'\s+').replace(r'\-', r'[\s\-_]+').replace(r'\/', r'\s*\/\s*').replace(r'\&', r'\s*(?:&|and)\s*')
                alias_list.append((rf'\b{escaped_name}\b', k))
            # 3. Acronym inside parens if any (e.g. "P/E", "P/B", "ROCE", "FCF", "CFO", "RSI")
            m_ac = re.search(r'\((.*?)\)', name)
            if m_ac:
                acronym = m_ac.group(1).strip()
                escaped_ac = re.escape(acronym).replace(r'\/', r'\s*\/\s*').replace(r'\-', r'[\s\-_]+')
                alias_list.append((rf'\b{escaped_ac}\b', k))

        # Sort all aliases by pattern length descending so longer phrases match first
        alias_list.sort(key=lambda item: len(item[0]), reverse=True)
        return alias_list

    def _clean_query(self, query_str: str) -> str:
        """Converts human Screener.in keywords, aliases (AND, OR, NOT, =, %, Cr), and timeframes into Python AST syntax."""
        q = query_str.strip()

        # 0. Substitute custom user formulas if any are referenced by name
        try:
            from app.engine.custom_formulas_store import custom_formulas_store
            customs = custom_formulas_store.get_all()
            for cf in sorted(customs, key=lambda x: len(x.get("name", "")), reverse=True):
                cf_name = cf.get("name")
                cf_expr = cf.get("expression")
                if cf_name and cf_expr:
                    q = re.sub(rf'\b{re.escape(cf_name)}\b', f'({cf_expr})', q, flags=re.IGNORECASE)
        except Exception:
            pass

        # Apply compiled aliases
        for pattern, repl in self._compiled_aliases:
            q = re.sub(pattern, repl, q, flags=re.IGNORECASE)

        # 3. Transform 2-factor bracket notation: e.g. sales_growth[3y] -> sales_growth_3y
        q = re.sub(r'([a-zA-Z_]+)\s*\[\s*(\d+[yYmqMQ]|ttm|latest)\s*\]', r'\1_\2', q)
        # Transform 2-factor function notation: e.g. sales_growth(5y) -> sales_growth_5y
        q = re.sub(r'([a-zA-Z_]+)\s*\(\s*(\d+[yYmqMQ]|ttm|latest)\s*\)', r'\1_\2', q)
        # Transform space timeframe notation: e.g. sales_growth 5y -> sales_growth_5y
        q = re.sub(r'\b([a-zA-Z_]+)\s+(\d+[yY]|ttm)\b', r'\1_\2', q)
        # Normalize latest/ttm
        q = re.sub(r'_latest\b', '', q, flags=re.IGNORECASE)
        q = re.sub(r'_ttm\b', '_1y', q, flags=re.IGNORECASE)

        # 4. Replace case-insensitive AND, OR, NOT
        q = re.sub(r'\bAND\b', ' and ', q, flags=re.IGNORECASE)
        q = re.sub(r'\bOR\b', ' or ', q, flags=re.IGNORECASE)
        q = re.sub(r'\bNOT\b', ' not ', q, flags=re.IGNORECASE)
        # Replace single '=' with '==' if not preceded by <, >, !
        q = re.sub(r'(?<![<>!=])=(?!=)', '==', q)
        # Strip trailing % symbols after numbers
        q = re.sub(r'(\d+)\s*%', r'\1', q)
        # Strip 'Cr' or 'crore' if user typed e.g. 500 Cr
        q = re.sub(r'(\d+)\s*(cr|crore|crores)\b', r'\1', q, flags=re.IGNORECASE)
        return q

    def diagnose_query_error(self, query_str: str, cleaned_query: str, exc: Optional[Exception] = None) -> Dict[str, Any]:
        """Provides human-friendly explanations, exact pinpoint of errors, and actionable suggestions."""
        raw = query_str.strip()
        if not raw:
            return {
                "message": "Query terminal is empty. Please enter a filter condition or pick a preset strategy.",
                "type": "empty_query",
                "hint": "Try an expression like 'ROCE > 15 AND Debt to equity < 1'."
            }

        # 1. Unbalanced Parentheses
        open_count = raw.count("(")
        close_count = raw.count(")")
        if open_count > close_count:
            return {
                "message": f"Unclosed parenthesis: Found {open_count} '(' but only {close_count} ')'.",
                "type": "unclosed_parenthesis",
                "problem_token": "(",
                "hint": "Ensure every opening parenthesis '(' has a corresponding closing ')'."
            }
        elif close_count > open_count:
            return {
                "message": f"Extra closing parenthesis: Found {close_count} ')' without matching opening '('.",
                "type": "extra_parenthesis",
                "problem_token": ")",
                "hint": "Remove the unmatched closing parenthesis ')'."
            }

        # 2. Incomplete / Trailing Operator
        m_trail = re.search(r'(?:\b(AND|OR|NOT)\b|([<>!=+\-*/]))\s*$', raw, flags=re.IGNORECASE)
        if m_trail:
            token = (m_trail.group(1) or m_trail.group(2)).strip()
            return {
                "message": f"Incomplete query ending with '{token}'. Expected a metric or value after '{token}'.",
                "type": "trailing_operator",
                "problem_token": token,
                "hint": f"Provide a comparison value or condition after '{token}' (e.g. '{token} 15')."
            }

        # 3. Consecutive Comparison Operators
        m_consec = re.search(r'([<>!=]+)\s+([<>!=]+)', raw)
        if not m_consec:
            m_consec = re.search(r'(?:[<>!=]{3,}|><)', raw)
        if m_consec:
            dup = m_consec.group(0).strip()
            return {
                "message": f"Conflicting operators placed together: '{dup}'.",
                "type": "consecutive_operators",
                "problem_token": dup,
                "hint": "Remove one of the adjacent comparison operators."
            }

        # Build dictionary of all human names and keys for fuzzy matching
        all_human_labels: Dict[str, Tuple[str, str]] = {}
        for ind in BASE_INDICATORS:
            k = ind["key"]
            name = ind["name"]
            clean_name = re.sub(r'\(.*?\)', '', name).strip()
            all_human_labels[k.lower()] = (k, name)
            all_human_labels[k.replace('_', ' ').lower()] = (k, name)
            all_human_labels[clean_name.lower()] = (k, name)
            m_ac = re.search(r'\((.*?)\)', name)
            if m_ac:
                all_human_labels[m_ac.group(1).strip().lower()] = (k, name)

        # 4. Check each clause for unmapped words or typos
        clauses = re.split(r'\s+\b(?:AND|OR)\b\s+', raw, flags=re.IGNORECASE)
        for clause in clauses:
            clause_clean = clause.strip()
            if not clause_clean:
                continue

            m_op = re.search(r'([<>!=]+|\b(?:in|not\s+in)\b)', clause_clean, flags=re.IGNORECASE)
            if m_op:
                left_side = clause_clean[:m_op.start()].strip()
                left_base = re.sub(r'\s*\d+\s*(?:years?|y)\b', '', left_side, flags=re.IGNORECASE).strip()
                if left_base and not re.match(r'^-?\d+(\.\d+)?$', left_base):
                    cleaned_left = self._clean_query(left_side).strip()
                    if ' ' in cleaned_left or (cleaned_left.lower() not in METRIC_DEFINITIONS and cleaned_left.lower() not in all_human_labels):
                        cand_keys = list(all_human_labels.keys())
                        matches = difflib.get_close_matches(left_base.lower(), cand_keys, n=1, cutoff=0.35)
                        if matches:
                            canonical_key, display_name = all_human_labels[matches[0]]
                            return {
                                "message": f"Unrecognized metric '{left_side}'. Did you mean '{display_name}'?",
                                "type": "unrecognized_metric",
                                "problem_token": left_side,
                                "suggestion": display_name,
                                "suggestion_key": canonical_key,
                                "hint": f"Replace '{left_side}' with '{display_name}' or select from the Ratio Palette."
                            }
                        else:
                            return {
                                "message": f"Unrecognized metric or term '{left_side}'.",
                                "type": "unrecognized_metric",
                                "problem_token": left_side,
                                "hint": "Check spelling or select directly from the Ratio Palette on the right."
                            }
            else:
                m_num = re.search(r'\b([a-zA-Z\s]+?)\s+(\d+(?:\.\d+)?)\b', clause_clean)
                if m_num:
                    metric_part = m_num.group(1).strip()
                    num_part = m_num.group(2).strip()
                    return {
                        "message": f"Missing comparison operator between '{metric_part}' and '{num_part}'.",
                        "type": "missing_operator",
                        "problem_token": clause_clean,
                        "hint": f"Did you mean '{metric_part} > {num_part}' or '{metric_part} < {num_part}'?"
                    }

        # 5. Generic AST syntax error details
        syntax_msg = str(exc) if exc else "Invalid syntax in query"
        return {
            "message": f"Query syntax error: {syntax_msg}.",
            "type": "syntax_error",
            "hint": "Ensure your query uses the format: Metric > Value (e.g. ROCE > 15 AND Debt to equity < 1)."
        }

    def _extract_identifiers(self, node: ast.AST) -> Set[str]:
        """Extracts all variable identifiers from the AST to check missing data beforehand."""
        identifiers = set()
        for child in ast.walk(node):
            if isinstance(child, ast.Name):
                identifiers.add(child.id.lower())
        return identifiers

    def _eval_node(self, node: ast.AST, context: Dict[str, Any]) -> Any:
        """Safely evaluates an AST node strictly using SAFE_OPERATORS."""
        if isinstance(node, ast.Constant):  # Python 3.8+ numbers/strings/booleans
            return node.value

        elif isinstance(node, (ast.List, ast.Tuple, ast.Set)):
            return [self._eval_node(elem, context) for elem in node.elts]

        elif isinstance(node, ast.Name):
            var_name = node.id.lower()
            if var_name not in context or context[var_name] is None:
                # Strictly return None for missing data
                return None
            return context[var_name]

        elif isinstance(node, ast.UnaryOp):
            operand = self._eval_node(node.operand, context)
            if operand is None:
                return None
            op_type = type(node.op)
            if op_type in SAFE_OPERATORS:
                return SAFE_OPERATORS[op_type](operand)
            raise ValueError(f"Unsupported unary operator: {op_type}")

        elif isinstance(node, ast.BinOp):
            left = self._eval_node(node.left, context)
            right = self._eval_node(node.right, context)
            if left is None or right is None:
                return None
            op_type = type(node.op)
            if op_type in SAFE_OPERATORS:
                try:
                    return SAFE_OPERATORS[op_type](left, right)
                except ZeroDivisionError:
                    return None
            raise ValueError(f"Unsupported binary operator: {op_type}")

        elif isinstance(node, ast.Compare):
            left = self._eval_node(node.left, context)
            if left is None:
                return False

            for op, comparator in zip(node.ops, node.comparators):
                right = self._eval_node(comparator, context)
                if right is None:
                    return False
                op_type = type(op)
                if op_type not in SAFE_OPERATORS:
                    raise ValueError(f"Unsupported comparison operator: {op_type}")
                if not SAFE_OPERATORS[op_type](left, right):
                    return False
                left = right
            return True

        elif isinstance(node, ast.BoolOp):
            if isinstance(node.op, ast.And):
                for val_node in node.values:
                    res = self._eval_node(val_node, context)
                    if res is None or not res:
                        return False
                return True
            elif isinstance(node.op, ast.Or):
                for val_node in node.values:
                    res = self._eval_node(val_node, context)
                    if res is not None and bool(res):
                        return True
                return False
            raise ValueError(f"Unsupported boolean operator: {type(node.op)}")

        raise ValueError(f"Unsupported syntax expression: {type(node)}")

    def evaluate_query(
        self,
        query: str,
        page: int = 1,
        page_size: int = 50,
        sort_by: str = "market_cap",
        sort_dir: str = "desc"
    ) -> Dict[str, Any]:
        """Evaluates a free-form or condition string against all 5,092 equities.
        Returns execution time in ms, total matches, and paginated stocks with metrics.
        """
        start_t = time.perf_counter()
        cleaned_query = self._clean_query(query)

        try:
            parsed_ast = ast.parse(cleaned_query, mode='eval')
        except SyntaxError as e:
            diag = self.diagnose_query_error(query, cleaned_query, e)
            return {
                "success": False,
                "error": diag["message"],
                "diagnostic": diag,
                "total": 0,
                "stocks": [],
                "execution_ms": 0.0
            }

        required_metrics = self._extract_identifiers(parsed_ast)

        # Check for any unrecognized identifiers in AST
        for m in required_metrics:
            if m not in METRIC_DEFINITIONS:
                # If metric is not known, diagnose and provide recommendation
                diag = self.diagnose_query_error(query, cleaned_query)
                return {
                    "success": False,
                    "error": diag["message"],
                    "diagnostic": diag,
                    "total": 0,
                    "stocks": [],
                    "execution_ms": 0.0
                }

        from app.engine.universe_provider import universe_provider
        all_symbols = list(universe_provider.stocks_cache.keys())

        matched_stocks = []

        for sym in all_symbols:
            stock_metrics = financial_registry.get_stock_metrics(sym)
            
            # Strict missing data rule:
            # If ANY required metric is None or missing for this company, exclude it immediately
            has_all_data = True
            for m in required_metrics:
                if m in METRIC_DEFINITIONS:
                    if stock_metrics.get(m) is None:
                        has_all_data = False
                        break

            if not has_all_data:
                continue

            try:
                res = self._eval_node(parsed_ast.body, stock_metrics)
                if res and isinstance(res, (bool, int, float)) and bool(res):
                    matched_stocks.append(stock_metrics)
            except Exception:
                continue

        # Sorting
        reverse = sort_dir.lower() == "desc"
        def _sort_key(s):
            val = s.get(sort_by)
            if val is None or val == 0:
                return float('-inf') if reverse else float('inf')
            if isinstance(val, str):
                return val.lower()
            return val

        matched_stocks.sort(key=_sort_key, reverse=reverse)

        total = len(matched_stocks)
        page = max(1, page)
        page_size = max(10, min(500, page_size))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated = matched_stocks[start_idx:end_idx]

        elapsed_ms = round((time.perf_counter() - start_t) * 1000, 2)

        advancing = sum(1 for s in matched_stocks if (s.get("change_pct") or 0) > 0)
        declining = sum(1 for s in matched_stocks if (s.get("change_pct") or 0) < 0)
        unchanged = sum(1 for s in matched_stocks if (s.get("change_pct") or 0) == 0)
        valid_changes = [s.get("change_pct") for s in matched_stocks if s.get("change_pct") is not None]
        avg_change = round(sum(valid_changes) / len(valid_changes), 2) if valid_changes else 0.0

        valid_performers = [
            s for s in matched_stocks
            if s.get("change_pct") is not None and abs(s.get("change_pct", 0.0)) < 100.0 and not s.get("symbol", "").endswith("TEST")
        ]
        valid_performers.sort(key=lambda s: s.get("change_pct", 0.0), reverse=True)
        top_gainer = None
        top_loser = None
        if valid_performers:
            top_gainer = {
                "symbol": valid_performers[0]["symbol"],
                "name": valid_performers[0].get("name") or valid_performers[0]["symbol"],
                "change_pct": round(float(valid_performers[0].get("change_pct", 0.0)), 2)
            }
            if valid_performers[-1]["symbol"] != valid_performers[0]["symbol"]:
                top_loser = {
                    "symbol": valid_performers[-1]["symbol"],
                    "name": valid_performers[-1].get("name") or valid_performers[-1]["symbol"],
                    "change_pct": round(float(valid_performers[-1].get("change_pct", 0.0)), 2)
                }

        summary = {
            "total": total,
            "advancing": advancing,
            "declining": declining,
            "unchanged": unchanged,
            "avg_change": avg_change,
            "top_gainer": top_gainer,
            "top_loser": top_loser
        }

        return {
            "success": True,
            "query": query,
            "cleaned_query": cleaned_query,
            "total": total,
            "page": page,
            "page_size": page_size,
            "execution_ms": elapsed_ms,
            "metrics_used": list(required_metrics),
            "summary": summary,
            "stocks": paginated
        }


screener_engine = ScreenerEngine()

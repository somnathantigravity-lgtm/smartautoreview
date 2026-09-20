import os
import json
import time
import uuid
from typing import List, Dict, Any, Optional

FORMULAS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", ".saved_custom_formulas.json")

class CustomFormulasStore:
    def __init__(self):
        self._load()

    def _load(self):
        if os.path.exists(FORMULAS_FILE):
            try:
                with open(FORMULAS_FILE, "r") as f:
                    self.formulas = json.load(f)
                    return
            except Exception:
                pass
        # Default built-in custom formulas
        self.formulas = [
            {
                "id": "formula-owners-earnings-yield",
                "name": "Owner's Earnings Yield",
                "description": "Warren Buffett metric: Free Cash Flow (CFO - Capex) divided by Market Cap as a percentage.",
                "expression": "(free_cash_flow / market_cap) * 100",
                "created_at": time.time() - 86400,
                "category": "Custom Formula",
                "unit": "%"
            },
            {
                "id": "formula-croci",
                "name": "Cash Return on Capital (CROCI)",
                "category": "Custom Formula",
                "description": "Cash from Operations divided by Enterprise Value.",
                "expression": "(cfo / enterprise_value) * 100",
                "created_at": time.time() - 43200,
                "unit": "%"
            },
            {
                "id": "formula-defensive-graham-spread",
                "name": "Defensive Graham Discount",
                "category": "Custom Formula",
                "description": "Percentage discount of CMP relative to Graham Number.",
                "expression": "((graham_number - current_price) / graham_number) * 100",
                "created_at": time.time() - 21600,
                "unit": "%"
            }
        ]
        self._save()

    def _save(self):
        try:
            with open(FORMULAS_FILE, "w") as f:
                json.dump(self.formulas, f, indent=2)
        except Exception:
            pass

    def get_all(self) -> List[Dict[str, Any]]:
        return self.formulas

    def add_formula(self, name: str, expression: str, description: str = "", unit: str = "%") -> Dict[str, Any]:
        item = {
            "id": f"custom-{uuid.uuid4().hex[:8]}",
            "name": name.strip(),
            "expression": expression.strip(),
            "description": description.strip() or f"User custom formula: {expression}",
            "category": "My Custom Formulas",
            "unit": unit or "%",
            "created_at": time.time()
        }
        self.formulas.insert(0, item)
        self._save()
        return item

    def delete_formula(self, formula_id: str) -> bool:
        initial_len = len(self.formulas)
        self.formulas = [f for f in self.formulas if f["id"] != formula_id]
        if len(self.formulas) < initial_len:
            self._save()
            return True
        return False

custom_formulas_store = CustomFormulasStore()

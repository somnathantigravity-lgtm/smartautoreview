# AI Stock Recommendation & Continuous Learning Platform
## Architecture, Status & Enhancement Roadmap

> **Target Asset Class**: Indian Equities (BSE Large-Cap & Mid-Cap)  
> **Core Principle**: Clear, plain-English explanations. Zero confusing jargon.  
> **Dual Port Architecture**:
> - **Public User Dashboard**: `http://localhost:3000`
> - **Admin Command Deck**: `http://localhost:3001` (Restricted to `somnathdey269@gmail.com`)

---

## 1. Executive Status: What Was Developed vs. What Is Being Added

### A. What Was Developed Previously
1. **Dedicated Admin Portal on Port 3001**:
   - Independent Next.js portal secured behind single-user login (`somnathdey269@gmail.com` / `Deevarsh@190521`).
   - 1-Click Strategy switcher promoting Challenger versions to Champion in database.
   - Admin Manual Stock Injector.
2. **Core Recommendation Lifecycle Engine**:
   - SQLite schema tracking recommendations across states: `WAITING_FOR_ENTRY` → `OPEN` → `CLOSED_SUCCESS` / `CLOSED_FAILURE`.
   - Daily EOD report generation framework (post-mortem analysis).

---

### B. What Was Pending & What We Discussed
1. **The UI was cluttered and difficult to read**:
   - The user screen had too many distracting banners: Dalal Street ticker tape, top losers marquee, extra terminal tabs.
   - The table was stretched wide with tiny gray headers and robotic badges.
2. **Missing Time Horizons**:
   - Recommendations were previously lumped into a single generic swing category without distinguishing between **Intraday**, **Short-Term Swing**, and **Long-Term Wealth**.
3. **Missing User Metric Scorecard**:
   - Users need to see upfront:
     - **Total recommendations for the day**
     - **Successful trades (number and win %)**
     - **Failed / Stopped out trades**
     - **Exact name of the strategy that is performing best today**
4. **Too Few Strategies for Real Learning (3 vs. 12)**:
   - 3 strategies are not enough to train and learn across diverse market environments.
   - We need a robust fleet of **12 distinct strategies** spanning Intraday, Swing, and Long-Term.
5. **Rock-Solid Multi-Factor Requirements**:
   - No stock should be recommended on a single indicator. Every recommendation must be backed by a **13-factor matrix** combining chart price structure, institutional delivery, corporate filings, earnings blackout safety, broad market regime, India VIX, ASM/GSM safety, liquidity, and trailing stops.

---

## 2. The 13-Factor Composite Validation Matrix

Every recommendation must pass through these 13 independent checks:

| # | Factor | Verification Rule | Plain-English Benefit |
| :--- | :--- | :--- | :--- |
| **1** | **Graph & Base Structure** | Breakout from 3-6 week consolidation or 20 EMA bounce with tight candles. | Ensures we only buy when selling pressure has dried up. |
| **2** | **Institutional Delivery %** | BSE delivery % > 50–60% (significantly above 20-day baseline). | Confirms smart institutions are buying real shares to keep. |
| **3** | **Volume Surge** | Volume is 1.5x to 3.0x above 20-day historical average. | Guarantees institutional buying power behind the move. |
| **4** | **SEBI LODR Filings** | Regulatory filings checked for order wins, capacity expansion, or debt reduction. | Confirms real business growth backs the chart. |
| **5** | **Binary Event Blackout** | Automatic disqualification if quarterly earnings board meeting is within 7 days. | Protects users from unexpected overnight earnings crashes. |
| **6** | **Sector Relative Strength** | Stock's sector is outperforming the BSE Sensex benchmark over last 10 days. | We only buy leaders in leading industries. |
| **7** | **Fundamental Quality** | RoCE > 18–22%, Debt-to-Equity < 0.5, and zero promoter share pledge. | High-quality business that cannot go bankrupt. |
| **8** | **Risk/Reward Geometry** | Asymmetric math: Minimum 1:2.0 to 1:3.0 Risk-to-Reward ratio. | Potential profit is at least 2x to 3x the stop-loss risk. |
| **9** | **Broad Market Regime** | BSE Sensex and Midcap Index are trading above their 20-day moving averages. | We do not buy breakout stocks during a market panic. |
| **10** | **India VIX Volatility** | VIX level checked: Normal (11-16) vs High Volatility (>19). | Adjusts stops so random noise doesn't trigger exits. |
| **11** | **SEBI ASM/GSM Watchdog** | Rejects any stock under ASM, GSM, or restricted 5% circuit bands. | Ensures your money is never trapped in lower circuits. |
| **12** | **Liquidity Floor** | Daily turnover > ₹15 Crores with tight bid-ask spread (<0.15%). | Guarantees instant entry and exit with zero slippage. |
| **13** | **Trailing Stop Loss** | Once Target 1 is reached (+5%), stop moves to breakeven (entry price). | Completely removes risk and locks in profits. |

---

## 3. The 12-Strategy Library (Continuous Learning Fleet)

### A. ⚡ Intraday Momentum Strategies (Exit by 3:15 PM)
1. **Intraday VWAP & Volume Spike (`v1.0-INTRA-VWAP`)**: Enters above VWAP when 15-min volume surges >2.5x. Target +1.5% to +3%.
2. **Opening Range Breakout / ORB (`v1.0-INTRA-ORB`)**: High-velocity break of the first 15-minute high with market index confirmation.
3. **Intraday Pullback to EMA (`v1.0-INTRA-PULLBACK`)**: Buys shallow dips to 20 EMA/VWAP in strong trending intraday leaders.

### B. 📈 Short-Term Swing Strategies (1 to 4 Weeks)
4. **Institutional VCP Breakout (`v1.0`)**: Flagship swing strategy based on Mark Minervini's Volatility Contraction Pattern + BSE delivery surge.
5. **Smart Money Delivery Accumulation (`v1.1-DELIVERY`)**: 3 consecutive sessions of delivery % >55% with supply drying up.
6. **52-Week High Stage-2 Momentum (`v1.0-52W`)**: Stage-2 breakout of 12-week bases to fresh 52-week highs in Large & Mid-caps.
7. **20 EMA Trend Pullback (`v1.0-EMA`)**: Shallow retest of prior breakout zone near 20-day EMA on declining sell volume.
8. **Sector Relative Strength Leader (`v2.0-SECTOR`)**: Top stocks in sectors beating the BSE Sensex by >2.5%.
9. **Post-Earnings Announcement Drift / PEAD (`v1.0-PEAD`)**: Quarterly profit jump >25% YoY with immediate volume gap continuation.

### C. 🏛️ Long-Term Wealth Compounders (3 to 12 Months)
10. **High RoCE & Zero-Debt Compounder (`v1.0-WEALTH-ROCE`)**: RoCE > 22%, Debt/Equity < 0.2, zero pledge, steady 18% 3-year profit CAGR.
11. **Growth at Reasonable Price / GARP (`v1.0-WEALTH-GARP`)**: PEG ratio < 1.0 with accelerating EBITDA margins and high institutional holding.
12. **Valuation Floor & Support Reversal (`v1.0-WEALTH-REVERSAL`)**: Blue-chips at 3-year valuation floors with open-market promoter buying disclosures.

---

## 4. User Experience (Port 3000) Redesign

1. **Top Daily Performance Metric Card**:
   - Total Picks Today (e.g. `12 Recommendations`)
   - Success Count & Win Rate % (e.g. `9 Wins (75.0%)`)
   - Failed / Stopped Out (e.g. `3 Losses`)
   - Top Working Strategy Today (e.g. `Institutional VCP Breakout`)
2. **Category Horizon Filter**:
   - `[ All Recommendations ]` | `[ ⚡ Intraday ]` | `[ 📈 Short-Term Swing ]` | `[ 🏛️ Long-Term Wealth ]`
3. **Clean Recommendation Cards / Table**:
   - Stock Name & BSE/NSE Identifiers
   - Category Tag & Strategy Name
   - Clear Buy Range (e.g. `Buy ₹942 - ₹956`)
   - Exit Target with Gain % (e.g. `₹1,050 • Target (+10.2%)`)
   - Stop Loss with Risk % (e.g. `₹912 • Stop Loss (-4.0%)`)
   - Live Status (Pulsing green `In Buy Range`, `Waiting for Entry`, `Target Hit`)
   - Simple 1-sentence plain English reason
   - "View Full Analysis" button to open slide-over evidence drawer.

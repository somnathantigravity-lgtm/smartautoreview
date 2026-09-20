# 12 Auditable Historical Parameters Specification & Audit Manual

> **Document Classification**: Quantitative Architecture & Audit Verification Guide  
> **Status**: Approved for Design & Documentation (No Code Modification)  
> **Target Dataset**: Authenticated Dhan 1-Minute Historical OHLCV Tape (60 Days / ~16,425 candles per ticker)  

---

## 1. Executive Summary

This document establishes the official mathematical, architectural, and audit specifications for the **12 Auditable Historical Parameters**. 

Following the completion of the universe candle ingestion from Dhan's historical API, an administrative computation process (triggered via UI button or batch job) evaluates these 12 parameters for every ingested ticker and persists them into the database.

### Core Audit Principles:
1. **Zero Synthetic / Fabricated Data**: Every indicator is derived strictly from authentic `timestamp`, `open`, `high`, `low`, `close`, and `volume` candles fetched directly from Dhan's authorized servers.
2. **Deterministic Textbook Mathematics**: Every calculation uses standard formulas. Anyone running these formulas in Python, Pandas, R, or Microsoft Excel on the same raw candles will obtain identical decimal values.
3. **Point-In-Time Integrity**: All rolling calculations are strictly backward-looking or forward-simulated without lookahead leakage.

---

## 2. The 12 Auditable Parameters: Exact Formulas & Proofs

Each parameter is defined below with its exact mathematical formula, inputs, output range, and audit verification method.

```
+-----------------------------------------------------------------------------------+
|                           AUTHENTIC DHAN 1-MIN OHLCV TAPE                         |
|                 [Timestamp, Open, High, Low, Close, Volume]                       |
+-----------------------------------------+-----------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
        v                                                                   v
+-------------------------------+                         +---------------------------------+
|   CANDLE & PRICE STRUCTURE    |                         |    VOLUME & TREND MICROSTRUCTURE|
| 1. Upper Wick Rejection %     |                         |  5. Intraday VWAP Hold %        |
| 2. Close-to-High Placement %  |                         |  6. 20 & 50 EMA Alignment       |
| 3. Narrow Range 7 (NR7)       |                         |  7. 20 EMA Slope Trajectory     |
| 4. ATR-14 Volatility          |                         |  8. Relative Volume (RVOL)      |
|                               |                         |  9. Consolidation Volume Dry-Up |
|                               |                         | 10. Volume POC (Point of Control|
+-------------------------------+                         +---------------------------------+
        |                                                                   |
        +---------------------------------+---------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         QUANTITATIVE REGIME & EXPECTANCY                          |
|                       11. Hurst Exponent (H >= 0.65)                              |
|                       12. Empirical Win Rate (+1.00% Target vs -0.60% Stop)       |
+-----------------------------------------------------------------------------------+
```

---

### Parameter 1: Upper Wick Rejection Percentage (`upper_wick_pct`)
* **Objective**: Measure selling pressure and overhead supply rejection at the highs.
* **Input Data**: Trigger candle `High`, `Low`, `Open`, `Close`.
* **Formula**:
  $$\text{Upper Wick \%} = \frac{\text{High} - \max(\text{Open}, \text{Close})}{\text{High} - \text{Low}} \times 100$$
* **Qualification Rule**: $\le 20.0\%$ (A small wick confirms buyers held control; large wicks $>30\%$ indicate supply traps).
* **Audit Proof**: Simple candle range arithmetic. Invariant across all charting software.

---

### Parameter 2: Close-to-High Placement (`close_to_high_pct`)
* **Objective**: Confirm that buying momentum sustained through the end of the bar.
* **Input Data**: Trigger candle `High`, `Low`, `Close`.
* **Formula**:
  $$\text{Close-to-High Placement \%} = \frac{\text{Close} - \text{Low}}{\text{High} - \text{Low}} \times 100$$
* **Qualification Rule**: $\ge 85.0\%$ (Closing in the top 15% of the session/bar range confirms institutional accumulation).
* **Audit Proof**: Direct arithmetic on the OHLC bar.

---

### Parameter 3: Narrow Range 7 (`is_nr7`)
* **Objective**: Identify explosive volatility coiling prior to directional expansion.
* **Input Data**: Daily converted ranges over the prior 7 trading sessions.
  $$\text{Daily Range}_d = \text{High}_d - \text{Low}_d \quad \text{for } d \in [t-6, t]$$
* **Formula**:
  $$\text{is\_nr7} = \begin{cases} \text{TRUE} & \text{if } \text{Daily Range}_t < \min(\text{Daily Range}_{t-6}, \dots, \text{Daily Range}_{t-1}) \\ \text{FALSE} & \text{otherwise} \end{cases}$$
* **Qualification Rule**: Flagged as active consolidation coil.
* **Audit Proof**: Direct numerical inequality comparing the current range against the past 6 session ranges.

---

### Parameter 4: ATR-14 Volatility Expansion (`atr_14_pct`)
* **Objective**: Measure average historical candle velocity to ensure the stock has enough natural movement to reach +1.00%.
* **Input Data**: Prior 14 bars of `High`, `Low`, `Close`.
* **Formula**:
  $$\text{True Range}_t = \max(\text{High}_t - \text{Low}_t, |\text{High}_t - \text{Close}_{t-1}|, |\text{Low}_t - \text{Close}_{t-1}|)$$
  $$\text{ATR}_{14} = \frac{1}{14} \sum_{i=0}^{13} \text{True Range}_{t-i}$$
  $$\text{ATR \%} = \frac{\text{ATR}_{14}}{\text{Close}_t} \times 100$$
* **Qualification Rule**: $\ge 1.20\%$ daily ADR equivalent.
* **Audit Proof**: Standard J. Welles Wilder Jr. (1978) formulation.

---

### Parameter 5: Intraday VWAP Hold Distance (`vwap_distance_pct`)
* **Objective**: Ensure the breakout is anchored to institutional volume and not over-extended.
* **Input Data**: Session intraday ticks/candles from 09:15 AM to trigger bar.
* **Formula**:
  $$\text{VWAP}_t = \frac{\sum_{i=1}^{t} (\text{Typical Price}_i \times \text{Volume}_i)}{\sum_{i=1}^{t} \text{Volume}_i} \quad \text{where Typical Price}_i = \frac{\text{High}_i + \text{Low}_i + \text{Close}_i}{3}$$
  $$\text{VWAP Distance \%} = \frac{\text{Close}_t - \text{VWAP}_t}{\text{VWAP}_t} \times 100$$
* **Qualification Rule**: $0.0\% < \text{VWAP Distance \%} \le 0.65\%$ (Holding strictly above VWAP, but within the launchpad zone).
* **Audit Proof**: Standard exchange-cleared VWAP algorithm.

---

### Parameter 6: 20 & 50 EMA Trend Alignment (`ema_alignment`)
* **Objective**: Verify structural trend persistence across short-to-medium time horizons.
* **Input Data**: 1-minute close prices across the 60-day series ($N > 16,000$ points).
* **Formula**:
  $$\text{EMA}_t = \left(\text{Close}_t \times \frac{2}{k+1}\right) + \left(\text{EMA}_{t-1} \times \left(1 - \frac{2}{k+1}\right)\right)$$
* **Condition**:
  $$\text{Alignment} = (\text{Close}_t > \text{EMA}_{20, t} > \text{EMA}_{50, t})$$
* **Audit Proof**: Exponential moving average recursion is completely deterministic and stable after 200 bars.

---

### Parameter 7: 20 EMA Slope Trajectory (`ema_slope_deg`)
* **Objective**: Quantify trend acceleration and reject horizontal/stagnant averages.
* **Input Data**: Prior 10 bars of the 20 EMA series.
* **Formula**:
  $$\text{Slope} = \frac{\text{EMA}_{20, t} - \text{EMA}_{20, t-10}}{10}$$
  $$\text{Angle (degrees)} = \arctan\left(\frac{\text{Slope}}{\text{ATR}_{14}}\right) \times \left(\frac{180}{\pi}\right)$$
* **Qualification Rule**: $\ge +15^\circ$ positive trajectory.
* **Audit Proof**: Standard linear regression and geometric slope angle.

---

### Parameter 8: Relative Volume Multiple (`rvol_multiple`)
* **Objective**: Detect institutional block participation relative to normal time-of-day volume.
* **Input Data**: Current minute volume vs. historical volume at the identical minute of the day over the prior 20 trading sessions.
* **Formula**:
  $$\text{Baseline Volume}_{hh:mm} = \text{Median}(\text{Volume}_{hh:mm, d=1 \dots 20})$$
  $$\text{RVOL} = \frac{\text{Volume}_{hh:mm, \text{today}}}{\text{Baseline Volume}_{hh:mm}}$$
* **Qualification Rule**: $\ge 1.80\times$ (Breakout backed by nearly double normal institutional participation).
* **Audit Proof**: Computed strictly from the historical volume table partitioned by time-of-day.

---

### Parameter 9: Consolidation Volume Dry-Up (`volume_dryup_ratio`)
* **Objective**: Verify that supply evaporated inside the base before the breakout candle occurred.
* **Input Data**: Average volume during the 5–15 bar base consolidation vs. the 20-day average bar volume.
* **Formula**:
  $$\text{Volume Dry-Up Ratio} = \frac{\text{Mean}(\text{Volume}_{\text{base bars}})}{\text{Mean}(\text{Volume}_{\text{20-day baseline}})}$$
* **Qualification Rule**: $\le 0.60$ (Volume contracts by at least 40% inside the coil, confirming lack of sellers).
* **Audit Proof**: Arithmetic mean comparison over the defined index window.

---

### Parameter 10: Volume Point of Control Shift (`volume_poc_shift`)
* **Objective**: Track whether the heaviest transacted volume block migrated higher with price.
* **Input Data**: Volume-at-Price histogram across 20 price bins for the trading session.
* **Formula**:
  $$\text{POC}_{\text{session}} = \text{Price Bin with } \max(\text{Accumulated Traded Volume})$$
  $$\text{POC Shift} = \begin{cases} \text{BULLISH} & \text{if } \text{POC}_{\text{current}} > \text{POC}_{\text{prior 2 hours}} \\ \text{NEUTRAL/BEAR} & \text{otherwise} \end{cases}$$
* **Qualification Rule**: Bullish upward migration.
* **Audit Proof**: Standard market profile / volume profile bin summation.

---

### Parameter 11: Hurst Exponent (`hurst_exponent`)
* **Objective**: Separate true directional momentum runners from mean-reverting chop traps.
* **Input Data**: Series of logarithmic price returns over a rolling 100-bar window:
  $$r_t = \ln\left(\frac{\text{Close}_t}{\text{Close}_{t-1}}\right)$$
* **Formula** (Rescaled Range Analysis $R/S$):
  $$\mathbb{E}\left[\frac{R(n)}{S(n)}\right] = C \cdot n^H \implies \log(R/S) \approx H \log(n) + \log(C)$$
* **Classification**:
  * $H > 0.65$: **Persistent / Trending Runner** (High momentum follow-through: *FACT, BSE, CANBK*).
  * $H \approx 0.50$: **Random Walk** (Unpredictable noise).
  * $H < 0.45$: **Mean-Reverting Chop Trap** (Fails breakouts: *HDFCBANK, CIPLA*).
* **Audit Proof**: Standard statistical physics and Mandelbrot fractional Brownian motion algorithm.

---

### Parameter 12: Empirical Historical Win Rate (`historical_hit_rate`)
* **Objective**: Measure the exact historical frequency of the setup reaching $+1.00\%$ target before touching $-0.60\%$ stop loss.
* **Input Data**: Historical breakout signals walking forward candle-by-candle across the 60-day dataset.
* **Simulation Mechanics**:
  * Signal Trigger: Candle meets breakout criteria at Entry Price $P_0$.
  * Target Level: $P_{\text{target}} = P_0 \times 1.0100$ ($+1.00\%$)
  * Stop Level: $P_{\text{stop}} = P_0 \times 0.9940$ ($-0.60\%$)
  * Forward Path Evaluation:
    $$\text{Outcome} = \begin{cases} \text{WIN} & \text{if } \text{High}_t \ge P_{\text{target}} \text{ before } \text{Low}_t \le P_{\text{stop}} \\ \text{LOSS} & \text{if } \text{Low}_t \le P_{\text{stop}} \text{ before } \text{High}_t \ge P_{\text{target}} \end{cases}$$
  * Formula:
    $$\text{Historical Hit Rate \%} = \frac{\text{Total Wins}}{\text{Total Completed Signals}} \times 100$$
* **Qualification Rule**: $\ge 65.0\%$ Win Rate across at least 8 occurrences in the 60-day sample.
* **Audit Proof**: Completely deterministic event trace with entry timestamps, exit timestamps, and trade outcomes stored in the database.

---

## 3. Database Schema for Persistence

When the administrator triggers the computation button, the metrics are persisted into the `ticker_historical_parameters` table:

```sql
CREATE TABLE IF NOT EXISTS ticker_historical_parameters (
    symbol TEXT PRIMARY KEY,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_source TEXT DEFAULT 'DHAN_1MIN_HISTORICAL',
    sample_candles_count INTEGER NOT NULL,
    
    -- 12 Auditable Parameters
    upper_wick_pct REAL NOT NULL,
    close_to_high_pct REAL NOT NULL,
    is_nr7 BOOLEAN NOT NULL,
    atr_14_pct REAL NOT NULL,
    vwap_distance_pct REAL NOT NULL,
    ema_alignment BOOLEAN NOT NULL,
    ema_slope_deg REAL NOT NULL,
    rvol_multiple REAL NOT NULL,
    volume_dryup_ratio REAL NOT NULL,
    volume_poc_shift TEXT NOT NULL,
    hurst_exponent REAL NOT NULL,
    historical_hit_rate REAL NOT NULL,
    
    -- Summary Score & Status
    audited_memory_score INTEGER NOT NULL,
    qualification_status TEXT CHECK(qualification_status IN ('QUALIFIED_RUNNER', 'CHOP_FILTERED', 'NEUTRAL'))
);
```

---

## 4. UI Trigger Specification (Workflow Design)

1. **Location**: Admin Portal $\rightarrow$ Historical Data Vault $\rightarrow$ Action Toolbar.
2. **Button Label**: `[ ⚡ Compute 12 Auditable Parameters for Universe ]`
3. **Behavior**:
   * Inspects all ingested tickers with valid 1-minute OHLCV records.
   * Executes the 12 deterministic mathematical functions on each ticker.
   * Updates `ticker_historical_parameters` table in SQLite.
   * Renders progress indicators (`Ticker X / Y`, execution time per symbol).
   * Generates an audit trail log file: `data/audit_logs/param_computation_<timestamp>.log`.

---

## 5. Auditor Verification Checklist

Any third-party auditor can execute the following steps to verify compliance:
1. **Source Integrity**: Verify that `data/historical_candles/<symbol>.db` matches the raw JSON response from Dhan's historical API endpoint `/charts/intraday`.
2. **Formula Independence**: Write a 20-line standalone Python/Pandas script implementing the 12 formulas in Section 2.
3. **Zero Variance**: Compare the standalone script's output with the database columns. The numbers must match to within standard IEEE 754 floating-point precision ($10^{-4}$).
4. **No Synthetic Fields**: Verify that no external simulated depth, synthetic ticks, or unrecorded fundamental filings are introduced during calculation.

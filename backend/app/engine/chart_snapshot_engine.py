"""
Chart Snapshot Engine for Gemini Vision AI
Generates high-clarity candlestick charts around trade trigger points
with VWAP, 20 EMA, Day High, and Volume indicators for visual inspection.
"""

import io
import base64
import logging
from typing import List, Dict, Any, Optional, Tuple
import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.dates as mdates
from datetime import datetime

logger = logging.getLogger(__name__)

class ChartSnapshotEngine:
    """Renders 1-minute intraday candlestick snapshots for Gemini Vision AI."""

    @staticmethod
    def render_candlestick_chart(
        candles: List[Dict[str, Any]],
        trigger_idx: int,
        symbol: str,
        company_name: str = "",
        entry_price: float = 0.0,
        target_price: float = 0.0,
        stop_loss: float = 0.0,
        vwap_val: Optional[float] = None,
        ema20_val: Optional[float] = None,
        context_bars_before: int = 40,
        context_bars_after: int = 0
    ) -> Tuple[bytes, str]:
        """
        Renders a clean TradingView-style candlestick chart snapshot.
        Strictly plots past candles up to trigger minute (context_bars_after=0)
        to completely eliminate look-ahead bias during AI vision analysis.
        Returns:
            (png_bytes, base64_data_uri)
        """
        # 1. Determine window of candles to display (strictly past candles up to trigger_idx)
        start_idx = max(0, trigger_idx - context_bars_before)
        end_idx = min(len(candles), trigger_idx + context_bars_after + 1)
        slice_candles = candles[start_idx:end_idx]

        if not slice_candles:
            return b"", ""

        trigger_local_idx = trigger_idx - start_idx

        # 2. Compute cumulative VWAP & EMA across the visible slice
        closes = [float(c["close"]) for c in slice_candles]
        highs = [float(c["high"]) for c in slice_candles]
        lows = [float(c["low"]) for c in slice_candles]
        opens = [float(c["open"]) for c in slice_candles]
        volumes = [float(c.get("volume") or 0) for c in slice_candles]
        times = [c.get("datetime_str", "")[-8:-3] if c.get("datetime_str") else str(i) for i, c in enumerate(slice_candles)]

        # Pre-compute running VWAP
        cum_vol = 0.0
        cum_pv = 0.0
        vwap_line = []
        for c in slice_candles:
            v = float(c.get("volume") or 1.0)
            p = float(c.get("close") or 0.0)
            cum_vol += v
            cum_pv += (p * v)
            vwap_line.append(cum_pv / max(1.0, cum_vol))

        # Pre-compute 20 EMA
        ema20_line = []
        multiplier = 2.0 / (20 + 1)
        ema = closes[0]
        for cl in closes:
            ema = (cl - ema) * multiplier + ema
            ema20_line.append(ema)

        # Day High up to trigger point
        day_high = max(highs[:trigger_local_idx + 1]) if highs[:trigger_local_idx + 1] else max(highs)

        # 3. Create matplotlib dark-theme figure
        plt.style.use("dark_background")
        fig, (ax1, ax2) = plt.subplots(
            2, 1,
            figsize=(7.2, 4.2),
            gridspec_kw={"height_ratios": [3.0, 1.0]},
            facecolor="#0f172a",
            dpi=85
        )

        ax1.set_facecolor("#0f172a")
        ax2.set_facecolor("#0f172a")

        x_coords = list(range(len(slice_candles)))

        # Plot Candlesticks
        candle_width = 0.65
        for i in range(len(slice_candles)):
            op = opens[i]
            cl = closes[i]
            hi = highs[i]
            lo = lows[i]

            is_up = cl >= op
            color = "#10b981" if is_up else "#ef4444"
            edge_color = "#34d399" if is_up else "#f87171"

            # Wicks
            ax1.plot([i, i], [lo, hi], color=color, linewidth=1.2, zorder=3)

            # Body
            body_bottom = min(op, cl)
            body_height = max(abs(cl - op), (hi - lo) * 0.02)
            rect = patches.Rectangle(
                (i - candle_width / 2.0, body_bottom),
                candle_width,
                body_height,
                linewidth=1,
                edgecolor=edge_color,
                facecolor=color,
                alpha=0.95,
                zorder=4
            )
            ax1.add_patch(rect)

            # Volume bar
            vol_color = "#10b981" if is_up else "#ef4444"
            ax2.bar(i, volumes[i], width=candle_width, color=vol_color, alpha=0.75)

        # Plot Indicators on Price chart
        ax1.plot(x_coords, vwap_line, color="#38bdf8", linestyle="--", linewidth=1.4, label="VWAP", alpha=0.9, zorder=5)
        ax1.plot(x_coords, ema20_line, color="#fbbf24", linestyle="-", linewidth=1.4, label="20 EMA", alpha=0.9, zorder=5)
        ax1.axhline(day_high, color="#f43f5e", linestyle=":", linewidth=1.2, label=f"HOD (₹{day_high:.1f})", alpha=0.85)

        # Highlight Trigger Point
        if 0 <= trigger_local_idx < len(slice_candles):
            trig_hi = highs[trigger_local_idx]
            # Marker above trigger candle
            ax1.annotate(
                "⚡ TRIGGER",
                xy=(trigger_local_idx, trig_hi),
                xytext=(trigger_local_idx, trig_hi + (max(highs) - min(lows)) * 0.06),
                arrowprops=dict(facecolor="#f59e0b", shrink=0.08, width=1.5, headwidth=6),
                color="#fbbf24",
                fontweight="bold",
                fontsize=9,
                ha="center",
                zorder=6
            )

            # Target and SL levels if provided
            if entry_price > 0 and target_price > 0:
                ax1.axhline(target_price, color="#34d399", linestyle="-.", linewidth=1.1, alpha=0.8, label=f"Target (₹{target_price:.1f})")
            if entry_price > 0 and stop_loss > 0:
                ax1.axhline(stop_loss, color="#f87171", linestyle="-.", linewidth=1.1, alpha=0.8, label=f"SL (₹{stop_loss:.1f})")

        # Titles and formatting
        trigger_time = times[trigger_local_idx] if 0 <= trigger_local_idx < len(times) else ""
        ax1.set_title(
            f"{symbol} ({company_name or 'NSE'}) · Breakout Trigger at {trigger_time} IST [Blind Historical Window]\n"
            f"Entry: ₹{entry_price:.2f} | Target: ₹{target_price:.2f} | SL: ₹{stop_loss:.2f} · Past Candles Only (Zero Future Lookahead)",
            color="#f8fafc",
            fontsize=10.5,
            fontweight="bold",
            pad=10
        )

        # Ensure right margin has slight breathing room so the last bar and trigger label don't touch the frame
        ax1.set_xlim(-1, len(slice_candles) + 1.2)
        ax2.set_xlim(-1, len(slice_candles) + 1.2)

        ax1.grid(True, linestyle=":", alpha=0.18, color="#94a3b8")
        ax2.grid(True, linestyle=":", alpha=0.18, color="#94a3b8")

        ax1.legend(loc="upper left", fontsize=8, facecolor="#1e293b", edgecolor="#334155")
        ax2.set_ylabel("Vol", color="#94a3b8", fontsize=8)

        # X-Axis ticks
        tick_step = max(1, len(times) // 8)
        tick_locs = list(range(0, len(times), tick_step))
        tick_labels = [times[idx] for idx in tick_locs]

        ax1.set_xticks([])
        ax2.set_xticks(tick_locs)
        ax2.set_xticklabels(tick_labels, color="#94a3b8", fontsize=8)

        # Clean borders
        for ax in (ax1, ax2):
            for spine in ax.spines.values():
                spine.set_color("#334155")
            ax.tick_params(colors="#94a3b8", labelsize=8)

        plt.tight_layout()

        # Render directly to compact JPEG buffer (~18KB)
        buf = io.BytesIO()
        plt.savefig(buf, format="jpeg", pil_kwargs={"quality": 68}, bbox_inches="tight", facecolor=fig.get_facecolor(), edgecolor="none")
        plt.close(fig)
        buf.seek(0)
        raw_bytes = buf.read()
        base64_str = base64.b64encode(raw_bytes).decode("utf-8")
        data_uri = f"data:image/jpeg;base64,{base64_str}"

        return raw_bytes, data_uri

    @staticmethod
    def render_predicted_trajectory_chart(
        candles: List[Dict[str, Any]],
        trigger_idx: int,
        symbol: str,
        company_name: str = "",
        entry_price: float = 0.0,
        target_price: float = 0.0,
        stop_loss: float = 0.0,
        vwap_val: Optional[float] = None,
        ema20_val: Optional[float] = None,
        context_bars_before: int = 40,
        expected_mins: int = 35,
        hit_prob_pct: int = 75
    ) -> Tuple[bytes, str]:
        """
        Renders an AI Vision Predictive Trajectory Chart showing the current historical setup
        plus a forward-projected price corridor and expected timeline to reach Target Price.
        """
        start_idx = max(0, trigger_idx - context_bars_before)
        slice_candles = candles[start_idx: trigger_idx + 1]
        if not slice_candles:
            return b"", ""

        trigger_local_idx = len(slice_candles) - 1

        closes = [float(c["close"]) for c in slice_candles]
        highs = [float(c["high"]) for c in slice_candles]
        lows = [float(c["low"]) for c in slice_candles]
        opens = [float(c["open"]) for c in slice_candles]
        volumes = [float(c.get("volume") or 0) for c in slice_candles]
        times = [c.get("datetime_str", "")[-8:-3] if c.get("datetime_str") else str(i) for i, c in enumerate(slice_candles)]

        cum_vol = 0.0
        cum_pv = 0.0
        vwap_line = []
        for c in slice_candles:
            v = float(c.get("volume") or 1.0)
            p = float(c.get("close") or 0.0)
            cum_vol += v
            cum_pv += (p * v)
            vwap_line.append(cum_pv / cum_vol if cum_vol > 0 else p)

        ema_line = []
        multiplier = 2.0 / (20 + 1)
        curr_ema = closes[0]
        for cl in closes:
            curr_ema = (cl - curr_ema) * multiplier + curr_ema
            ema_line.append(curr_ema)

        fig, (ax1, ax2) = plt.subplots(
            2, 1,
            figsize=(9.2, 5.4),
            dpi=100,
            gridspec_kw={"height_ratios": [3.6, 1.0]},
            facecolor="#0b0f19"
        )
        ax1.set_facecolor("#0b0f19")
        ax2.set_facecolor("#0b0f19")

        # 1. Plot past candles
        candle_width = 0.65
        for i in range(len(slice_candles)):
            o, h, l, c = opens[i], highs[i], lows[i], closes[i]
            is_green = (c >= o)
            color = "#10b981" if is_green else "#f43f5e"
            ax1.plot([i, i], [l, h], color=color, linewidth=1.1, zorder=2)
            bottom = min(o, c)
            height = max(abs(c - o), 0.02)
            rect = patches.Rectangle(
                (i - candle_width / 2.0, bottom),
                candle_width,
                height,
                facecolor=color,
                edgecolor=color,
                zorder=3
            )
            ax1.add_patch(rect)
            ax2.bar(i, volumes[i], color=color, width=candle_width, alpha=0.65, zorder=2)

        ax1.plot(range(len(vwap_line)), vwap_line, color="#38bdf8", linewidth=1.4, alpha=0.9, label="VWAP")
        ax1.plot(range(len(ema_line)), ema_line, color="#f59e0b", linewidth=1.4, alpha=0.9, label="20 EMA")

        # 2. Trigger point
        trigger_p = closes[trigger_local_idx]
        ax1.scatter([trigger_local_idx], [trigger_p], color="#fbbf24", s=110, zorder=6, edgecolors="#ffffff", linewidths=1.2)

        # 3. Forward Projected Trajectory Corridor (6 future forward periods)
        future_steps = 7
        proj_x = list(range(trigger_local_idx, trigger_local_idx + future_steps))
        tgt_val = target_price if target_price > 0 else (trigger_p * 1.015)
        sl_val = stop_loss if stop_loss > 0 else (trigger_p * 0.992)

        proj_y = [trigger_p + (tgt_val - trigger_p) * ((step / (future_steps - 1)) ** 0.85) for step in range(future_steps)]
        proj_upper = [y * 1.002 for y in proj_y]
        proj_lower = [max(trigger_p * 0.998, y * 0.997) for y in proj_y]

        ax1.plot(proj_x, proj_y, color="#34d399", linestyle="--", linewidth=2.0, alpha=0.95, label="Predicted Trajectory")
        ax1.fill_between(proj_x, proj_lower, proj_upper, color="#10b981", alpha=0.18, label="Predicted Corridor")

        # 4. Horizontal Target & Stop Loss
        ax1.axhline(tgt_val, color="#10b981", linestyle="-.", linewidth=1.2, alpha=0.85, label=f"Target ₹{tgt_val:.2f}")
        ax1.axhline(sl_val, color="#f43f5e", linestyle="-.", linewidth=1.2, alpha=0.85, label=f"SL ₹{sl_val:.2f}")

        # Goal destination Star
        dest_x = proj_x[-1]
        dest_y = tgt_val
        ax1.scatter([dest_x], [dest_y], color="#34d399", marker="*", s=160, zorder=7, edgecolors="#ffffff")
        ax1.annotate(
            f"🎯 Target ₹{dest_y:.2f}\n(~{expected_mins}m · {hit_prob_pct}% Prob)",
            xy=(dest_x, dest_y),
            xytext=(dest_x - 3.5, dest_y * 1.003),
            bbox=dict(boxstyle="round,pad=0.3", facecolor="#064e3b", edgecolor="#10b981", alpha=0.9),
            fontsize=8.5,
            fontweight="bold",
            color="#ecfdf5",
            arrowprops=dict(arrowstyle="->", color="#34d399", lw=1.2)
        )

        trigger_time = times[trigger_local_idx] if 0 <= trigger_local_idx < len(times) else ""
        ax1.set_title(
            f"{symbol} ({company_name or 'NSE'}) · AI Vision Forward Trajectory Projection\n"
            f"Expected Target Hit: ~{expected_mins} Mins | Same-Day Probability: {hit_prob_pct}% | Entry ₹{trigger_p:.2f} → ₹{dest_y:.2f}",
            color="#f8fafc",
            fontsize=10.5,
            fontweight="bold",
            pad=10
        )

        total_bars = len(slice_candles) + future_steps
        ax1.set_xlim(-1, total_bars + 1.0)
        ax2.set_xlim(-1, total_bars + 1.0)

        ax1.grid(True, linestyle=":", alpha=0.18, color="#94a3b8")
        ax2.grid(True, linestyle=":", alpha=0.18, color="#94a3b8")

        ax1.legend(loc="upper left", fontsize=7.5, facecolor="#1e293b", edgecolor="#334155")
        ax2.set_ylabel("Vol", color="#94a3b8", fontsize=8)

        tick_step = max(1, len(times) // 7)
        tick_locs = list(range(0, len(times), tick_step))
        tick_labels = [times[idx] for idx in tick_locs]

        ax1.set_xticks([])
        ax2.set_xticks(tick_locs)
        ax2.set_xticklabels(tick_labels, color="#94a3b8", fontsize=8)

        for ax in (ax1, ax2):
            for spine in ax.spines.values():
                spine.set_color("#334155")
            ax.tick_params(colors="#94a3b8", labelsize=8)

        plt.tight_layout()
        buf = io.BytesIO()
        plt.savefig(buf, format="jpeg", pil_kwargs={"quality": 68}, bbox_inches="tight", facecolor=fig.get_facecolor(), edgecolor="none")
        plt.close(fig)
        buf.seek(0)
        raw_bytes = buf.read()
        base64_str = base64.b64encode(raw_bytes).decode("utf-8")
        data_uri = f"data:image/jpeg;base64,{base64_str}"

        return raw_bytes, data_uri

chart_snapshot_engine = ChartSnapshotEngine()

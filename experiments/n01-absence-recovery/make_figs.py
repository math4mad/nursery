#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""N01 图腿 · MEF hybrid 规范 (0928 主人令):
figsize=(7.5,4.2) · dpi=150 · "o-" ms=3 · axhline(k,":",lw0.8) · legend(fs7) · grid(α.3) · tight_layout
数据一律从 out_v1/report_n01.jsonl 直出, 可复算。"""
import json, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
ROWS = [json.loads(l) for l in open(os.path.join(HERE, "out_v1/report_n01.jsonl"))]
FIGS = os.path.abspath(os.path.join(HERE, "..", "..", "figs"))
os.makedirs(FIGS, exist_ok=True)
DELTAS = [0, 15, 30, 60, 120, 240, 480]

def get(mu, rho, k, field):
    return [next(r for r in ROWS if r["mu"] == mu and r["rho"] == rho and r["k"] == k and r["delta"] == d)[field] for d in DELTAS]

# ── 图1 · 存活悬崖 S(Δ), ρ=0, k=8 (判据1) ──
fig, ax = plt.subplots(figsize=(7.5, 4.2))
for mu, lab in [(0.0, "μ=0 strong-permanence"), (0.001, "μ=0.001"), (0.005, "μ=0.005"),
               (0.02, "μ=0.02 (neg-savings)"), (0.1, "μ=0.1 (anchor never holds, clip −1)")]:
    s = [max(v, -1.0) for v in get(mu, 0.0, 8, "S")]
    ax.plot(DELTAS, s, "o-", ms=3, label=lab)
ax.axhline(0.5, color="k", ls=":", lw=0.8)   # 存活线 (冻册判据1)
ax.axhline(0.2, color="k", ls=":", lw=0.8)   # 灰飞线
ax.set_title("N01 survival cliff: savings S(Δ) by decay scaffold ρ=0,k=8")
ax.set_xlabel("absence delay Δ (ticks)"); ax.set_ylabel("savings S = 1 − T_rec/T_cold")
ax.legend(fontsize=7); ax.grid(alpha=0.3)
fig.tight_layout(); fig.savefig(os.path.join(FIGS, "n01_survival_cliff.png"), dpi=150); plt.close(fig)

# ── 图2 · 错置与反转 P_err(Δ), ρ=0.5, k=8 (判据2/3) ──
fig, ax = plt.subplots(figsize=(7.5, 4.2))
for mu, lab in [(0.0, "μ=0 (flat zero)"), (0.005, "μ=0.005 (anti-Diamond)"),
               (0.02, "μ=0.02 (Diamond-like)"), (0.1, "μ=0.1")]:
    ax.plot(DELTAS, get(mu, 0.5, 8, "P_err"), "o-", ms=3, label=lab)
ax.axhline(0.5, color="k", ls=":", lw=0.8)   # chance 面
ax.set_title("N01 A-not-B error vs delay: direction set by μ, floor at chance (ρ=0.5,k=8)")
ax.set_xlabel("absence delay Δ (ticks)"); ax.set_ylabel("P_err (search B after cover)")
ax.set_ylim(0, 1.05); ax.legend(fontsize=7); ax.grid(alpha=0.3)
fig.tight_layout(); fig.savefig(os.path.join(FIGS, "n01_error_reversal.png"), dpi=150); plt.close(fig)

# ── 图3 · 潜知窗口散点 全140格 (判据4) ──
fig, ax = plt.subplots(figsize=(7.5, 4.2))
xs = [r["P_lost"] for r in ROWS]; ys = [max(r["S"], -1.0) for r in ROWS]
ax.scatter(xs, ys, s=18, alpha=0.55, edgecolors="none", label="all 140 cells")
ax.axvspan(0.35, 0.65, color="orange", alpha=0.15)
ax.axhline(0.5, color="k", ls=":", lw=0.8)
ax.annotate("frozen 'forgotten-but-still-there' window:\nbehavior lost (P_lost≈0.5) ∧ savings>0.5\n— 0 cells (constructively empty)",
            xy=(0.5, 0.75), fontsize=7, ha="center", color="#8a5a00")
ax.set_title("N01 single-store coupling: P_lost × S, all cells")
ax.set_xlabel("behavioral loss rate P_lost at probe"); ax.set_ylabel("savings S (μ=0.1 clipped at −1)")
ax.set_xlim(0, 1); ax.legend(fontsize=7); ax.grid(alpha=0.3)
fig.tight_layout(); fig.savefig(os.path.join(FIGS, "n01_latent_window.png"), dpi=150); plt.close(fig)

print("三图规范落:", "n01_survival_cliff.png n01_error_reversal.png n01_latent_window.png")

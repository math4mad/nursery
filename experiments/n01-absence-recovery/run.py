#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""N01 缺-复探针 · 客体恒常假说机 (Nursery own案第一号, 0928)
判据先冻后用 — 参数与判读一切以 PREREG_N01.md 为准，一字不易。
CPU numpy，全向量化；即算即落盘（园律 0927）。"""
import json, math, os, hashlib, time, zlib
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out_v1")
os.makedirs(OUT, exist_ok=True)
REPORT = os.path.join(OUT, "report_n01.jsonl")

# ---- 冻结参数 (PREREG_N01) ----
ALPHA = 0.15      # 呈现增量率
NU    = 1.0       # 弱痕衰快项 (ν)
THETA = 0.7       # 行为判据阈
EPS   = 0.02      # 探针选择噪声
NTRIAL = 2000
MUS   = [0.0, 0.001, 0.005, 0.02, 0.1]
DELTAS = [0, 15, 30, 60, 120, 240, 480]
RHOS  = [0.0, 0.5]
KS    = [0, 8]
SEEDS = [11, 22, 33]
ANCHOR_PRES = 20      # ① A 呈现次数 (每拍一次)
COVER_GAP   = 5       # ② 覆盖期 B 每次呈现间隔拍数
RECOV_CAP   = 400     # ⑤ 重现期上限

def decay(a, mu, nu=NU):
    return a - mu * a * (1.0 + nu * (1.0 - a))

def present(a_x, a_y, rho):
    a_x = a_x + ALPHA * (1.0 - a_x)
    a_y = a_y + ALPHA * rho * (1.0 - a_y) / 2.0
    return a_x, a_y

def cold_time(rng, rho):
    """T_cold: 自零痕 A 单呈至 THETA (含每拍衰减 μ=0 → 与 μ 无关)."""
    a = 0.0; b = 0.0; t = 0
    while a < THETA and t < RECOV_CAP:
        a, b = present(a, b, rho); t += 1
    return t

def run_cell(mu, delta, rho, k, seeds=SEEDS):
    """返回格统计: P_err, S(节省), 行为丢失率, T_rec/T_cold 均值."""
    tc = cold_time(None, rho)
    perr, sav, lost, trec_all = [], [], [], []
    for s in seeds:
        rng = np.random.default_rng(s * 7919 + zlib.crc32(f"{mu}|{delta}|{rho}|{k}".encode()))
        aA = np.zeros(NTRIAL); aB = np.zeros(NTRIAL)
        # ① 锚定期: A 每拍呈 20 次
        for _ in range(ANCHOR_PRES):
            aA, aB = present(aA, aB, rho); aA = decay(aA, mu); aB = decay(aB, mu)
        # ② 覆盖期: B 呈 k 次, 每 5 拍一次
        for i in range(k):
            for _ in range(COVER_GAP):
                aA = decay(aA, mu); aB = decay(aB, mu)
            aB, aA = present(aB, aA, rho)
        # ③ 缺席期 Δ 拍
        for _ in range(delta):
            aA = decay(aA, mu); aB = decay(aB, mu)
        # ④ 探针: argmax + 各向同性噪声
        pickB = (aB + rng.normal(0, EPS, NTRIAL)) > (aA + rng.normal(0, EPS, NTRIAL))
        perr.append(float(pickB.mean()))
        lost.append(float((aA < THETA).mean()))   # 行为面: 痕下于阈
        # ⑤ 重现期: A 复呈至 aA≥THETA, 逐试次计时
        aA_c = aA.copy(); aB_c = aB.copy()
        t = np.zeros(NTRIAL, dtype=int); alive = aA_c < THETA
        while alive.any() and t.max() < RECOV_CAP:
            idx = np.where(alive)[0]
            aA_c[idx], aB_c[idx] = present(aA_c[idx], aB_c[idx], rho)
            aA_c[idx] = decay(aA_c[idx], mu); aB_c[idx] = decay(aB_c[idx], mu)
            t[idx] += 1
            alive = aA_c < THETA
        t = np.minimum(t, RECOV_CAP)
        trec_all.append(float(t.mean()))
        sav.append(float(np.mean(1.0 - t / tc)))
    return dict(mu=mu, delta=delta, rho=rho, k=k, T_cold=tc,
                P_err=round(float(np.mean(perr)), 4),
                P_lost=round(float(np.mean(lost)), 4),
                T_rec=round(float(np.mean(trec_all)), 3),
                S=round(float(np.mean(sav)), 4))

def selftest():
    """5号判据: ν=0 纯乘性闭式 a(Δ)=a0(1-μ)^Δ 对 MC 递推 |Δa|≤0.02."""
    worst = 0.0
    for mu in [0.001, 0.005, 0.02, 0.1]:
        a = np.full(1, 0.9)
        for _ in range(480):
            a = decay(a, mu, nu=0.0)
        ana = 0.9 * (1.0 - mu) ** 480
        worst = max(worst, abs(float(a[0]) - ana))
    return worst

def main():
    t0 = time.time()
    st = selftest()
    line = dict(cell="SELFTEST", nu0_max_abs_dev=round(st, 6), tol=0.02, pass_=bool(st <= 0.02))
    print("SELFTEST " + json.dumps(line)); 
    if st > 0.02:
        print("SELFTEST-FAIL — 器未校, 不开火 (园律: 新尺先校旧册)"); raise SystemExit(1)
    n = 0
    with open(REPORT, "a") as f:
        for mu in MUS:
            for rho in RHOS:
                for k in KS:
                    for delta in DELTAS:
                        rec = run_cell(mu, delta, rho, k)
                        rec["ts"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
                        f.write(json.dumps(rec) + "\n"); f.flush()
                        b64 = __import__("base64").b64encode((json.dumps(rec) + "\n").encode()).decode()
                        print(f"REPORT_LINE {b64}")
                        n += 1
    digest = hashlib.sha256(open(REPORT, "rb").read()).hexdigest()
    print(f"CELLS {n}/140 · sha256={digest} · {time.time()-t0:.1f}s")
    print("N01-ABSENCE-DONE")

if __name__ == "__main__":
    main()

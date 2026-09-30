# Recorded benchmarks

These are historical measurements, not a fresh performance run. The September 30 verification did not change engine algorithms or rerun these workloads. Run `npm run bench` to measure your own machine.

## Benchmarks

Measured 2026-09-27 with Node v24.20.0 on an Intel Core Ultra 7 256V, 8 logical CPUs, 15.2 GiB RAM, Linux 7.2.5, x64. One process and one worker-equivalent execution thread; results vary by machine and runtime.

| Workload                                        |              Throughput |
| ----------------------------------------------- | ----------------------: |
| Fast seven-card evaluation                      |  4,650,931 hands/second |
| Monte Carlo, AA versus one random opponent      |   917,822 trials/second |
| Monte Carlo, weighted persona range             |   195,541 trials/second |
| Lesson experiment, seven-card one pair          | 2,810,444 trials/second |
| Six-seat side-pot awards, five random opponents |   114,073 trials/second |

`npm run bench` warms the evaluator with 10,000 seeded hands, then measures one million evaluations, 100,000 random-opponent Monte Carlo trials, 10,000 weighted-range trials, 100,000 seven-card category lesson trials, and 10,000 six-seat side-pot trials. Hand generation is outside the evaluator timer; Monte Carlo includes dealing, evaluating both players, statistics, and snapshot construction. The timing excludes worker messaging and UI rendering. Seed: `0123456789abcdef0123456789abcdef`. The script prints hardware details and a checksum so the work remains observable.

The Phase 7 baseline was 4,647,845 evaluations/s, 938,968 random-opponent trials/s, 188,605 weighted-range trials/s, 2,780,098 lesson trials/s, and 67,605 six-seat payout trials/s. The performance pass builds one used-card set per accepted joint deal instead of repeatedly flattening exclusions for each candidate card. The final six-seat rate is 114,073 trials/s (about 69% above that baseline); an earlier run in this delivery measured 120,050. These single-run timings are not a controlled statistical benchmark. Evaluator/equity algorithms are unchanged, and their timing differences should not be credited to the payout optimization. The two-river experiment also replaces full-deck shuffling with two distinct bounded index draws.

## Bot follow-up benchmark

Measured September 28, 2026 local time (September 29 UTC), Node 24.20.0, Intel Core Ultra 7 256V, 8 logical CPUs, 15.2 GiB RAM, Linux 7.2.5 x64. The browser checks were stopped for this run. Each bot measurement averages 20 repeated preflop decisions after warmup, 800 shared samples per decision; worker startup and UI delay are excluded.

| Workload                         |                Measured |
| -------------------------------- | ----------------------: |
| Fast seven-card evaluation       |  4,735,221 hands/second |
| Monte Carlo, one random opponent |   933,869 trials/second |
| Monte Carlo, weighted range      |   194,785 trials/second |
| Lesson category experiment       | 2,756,477 trials/second |
| Six-seat side-pot awards         |   115,809 trials/second |
| Bot decision, heads-up           |        4.34 ms/decision |
| Bot decision, six seats          |       10.81 ms/decision |

The previous evaluator/equity/payout algorithms remain unchanged. Relative to the September 27 measurement, throughput was +1.8% evaluation, +1.7% random equity, −0.4% weighted equity, −1.9% lesson trials, and +1.5% payouts. These small differences are single-run timing variation, not evidence of an algorithmic change. Bot decision timings are new workloads with no earlier comparable baseline.

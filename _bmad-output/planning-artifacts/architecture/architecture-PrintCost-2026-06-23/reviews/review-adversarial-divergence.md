# Review - Adversarial Divergence

Verdict: pass after inline fixes.

Attack 1:
- Builder A uses `multiPlateSurchargePercent` and multiplies time/material by plates from PRD.
- Builder B follows user correction and treats plates as only extra work.
- Resolution: AD-4 now explicitly forbids plate multipliers and names `extraWorkFeePercent`.

Attack 2:
- Builder A deducts filament on save.
- Builder B deducts only on sale.
- Resolution: AD-5 and AD-6 separate save, print occurrence, and sale effects.

Attack 3:
- Builder A blocks `+1` when Filament is soft-deleted or stock is too low.
- Builder B allows it and drives negative stock.
- Resolution: AD-6 now resolves by saved `filamentId`, includes soft-deleted records, clamps low stock to zero with warning, and blocks only missing records.

Attack 4:
- Builder A puts customer/printer/settings services inside `features/more`.
- Builder B puts shared services in domain/core.
- Resolution: AD-2 and Structural Seed keep More as navigation/forms only while services remain shared.

No remaining high-risk divergence found at feature altitude.

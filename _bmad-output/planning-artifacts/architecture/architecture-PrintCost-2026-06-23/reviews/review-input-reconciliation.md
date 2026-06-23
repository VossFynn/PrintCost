# Review - Input Reconciliation

Verdict: pass with explicit source overrides.

Covered from PRD:
- Offline PWA, local IndexedDB, static hosting, no account/cloud sync.
- Printer, Filament, Calculation, Inventory/Sales, Customers, Settings, Templates, Backup.
- IndexedDB stores and soft-delete/snapshot behavior.
- German UI, English implementation identifiers.
- Performance, accessibility, CSP, service worker update behavior.
- Delivery/build gates and lazy-loaded routes.

Covered from UX spines:
- Four primary surfaces: Kalkulation, Bestand, Filamente, Mehr.
- Bottom navigation and mobile-first constrained tool layout.
- German copy and accessibility labels.
- Design-token ownership through DESIGN.md and shared UI.

Source overrides captured from user:
- `gramsUsed` and `printMinutes` are total job inputs.
- Plate count does not multiply any material or time-based costs.
- Plate count only exposes an optional extra-work fee percentage.
- Saving a Calculation does not deduct filament.
- Explicit print occurrence deducts filament.
- Saved calculations live under Bestand > Drucke, not Teile.

Unlanded source items:
- CSV export remains deferred per PRD.
- Custom PWA icons remain deferred.
- Desktop two-pane behavior remains deferred.

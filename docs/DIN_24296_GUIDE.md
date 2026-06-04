# DIN 24296 Guide — Spare Parts for Pumps

## Table of Contents

1. [What is DIN 24296?](#what-is-din-24296)
2. [Why It Matters](#why-it-matters)
3. [Classification Overview](#classification-overview)
4. [Table 32 — Recommended Quantities](#table-32--recommended-quantities)
5. [Part Type Definitions](#part-type-definitions)
6. [Interchangeability Concept](#interchangeability-concept)
7. [Worked Example](#worked-example)
8. [Industry Best Practices](#industry-best-practices)

---

## What is DIN 24296?

**DIN 24296** is a German standard published by the *Deutsches Institut für Normung (DIN)* titled:

> **"Spare parts for pumps, compressors and armatures — Recommended spare parts for maintenance and overhaul"**

It provides a systematic framework for:
- Determining which spare parts to stock for pump installations
- Calculating appropriate stock quantities based on fleet size
- Optimizing inventory by exploiting interchangeability between pump models

The standard is widely used in the chemical, petrochemical, water treatment, and power generation industries — particularly in Germany and across the EU.

---

## Why It Matters

Without a structured approach, maintenance teams commonly:
- Over-stock non-critical parts
- Under-stock critical parts
- Keep separate stocks for each pump, ignoring potential interchangeability
- Tie up capital in slow-moving spares

DIN 24296 addresses all four problems:
1. It prioritizes critical components (shafts, impellers, seals)
2. It scales recommendations to the actual fleet size
3. It encourages consolidation of common parts across pumps
4. It provides a quantitative basis for purchasing decisions

---

## Classification Overview

DIN 24296 divides spare parts into groups based on **function and failure impact**:

| Class | Description | Examples |
|-------|-------------|---------|
| **A – Critical / Fast Wear** | Parts that fail frequently or are essential for operation | Mechanical seals, O-rings, gaskets, packing |
| **B – Standard Wear** | Parts with moderate wear rates | Bearings, coupling elements, wear rings |
| **C – Structural / Long-life** | Parts that rarely fail, but have long lead times | Impellers, shafts, casings |

In this application the classification is based on keyword matching of the part designation (see `js/dinClassifier.js`).

---

## Table 32 — Recommended Quantities

The core of DIN 24296 is **Table 32** (Section 7.7.2), which specifies the recommended stock quantity for each part type as a function of the number of installed pumps.

### Shaft / Shaft Sleeve

| Number of Pumps | Recommended Stock |
|:--------------:|:-----------------:|
| 2 | 1 piece |
| 3 | 1 piece |
| 4 | 1 piece |
| 5 | 2 pieces |
| 6–7 | 2 pieces |
| 8–9 | 2 pieces |
| ≥ 10 | 20% of fleet (rounded up) |

### Impeller

| Number of Pumps | Recommended Stock |
|:--------------:|:-----------------:|
| 2 | 1 piece |
| 3 | 1 piece |
| 4 | 1 piece |
| 5 | 2 pieces |
| 6–7 | 2 pieces |
| 8–9 | 2 pieces |
| ≥ 10 | 20% of fleet (rounded up) |

### Rolling Bearing (Ball / Roller)

| Number of Pumps | Recommended Stock |
|:--------------:|:-----------------:|
| 2 | 1 piece |
| 3 | 1 piece |
| 4 | 2 pieces |
| 5 | 2 pieces |
| 6–7 | 3 pieces |
| 8–9 | 3 pieces |
| ≥ 10 | 25% of fleet (rounded up) |

### Sealing Elements (Mechanical Seal, O-ring Set, Gasket)

| Number of Pumps | Recommended Stock |
|:--------------:|:-----------------:|
| 2 | 4 sets |
| 3 | 6 sets |
| 4 | 8 sets |
| 5 | 8 sets |
| 6–7 | 12 sets |
| 8–9 | 12 sets |
| ≥ 10 | 150% of fleet (rounded up) |

### Wear Ring / Protection Sleeve

| Number of Pumps | Recommended Stock |
|:--------------:|:-----------------:|
| 2 | 2 pieces |
| 3 | 2 pieces |
| 4 | 2 pieces |
| 5 | 3 pieces |
| 6–7 | 4 pieces |
| 8–9 | 4 pieces |
| ≥ 10 | 30% of fleet (rounded up) |

### Coupling Elements / Accessories

| Number of Pumps | Recommended Stock |
|:--------------:|:-----------------:|
| 2 | 1 set |
| 3 | 1 set |
| 4 | 2 sets |
| 5 | 2 sets |
| 6–7 | 3 sets |
| 8–9 | 3 sets |
| ≥ 10 | 20% of fleet (rounded up) |

---

## Part Type Definitions

The application uses keyword matching to assign parts to DIN categories:

| Category | Match Keywords |
|----------|---------------|
| **Shaft** | `shaft`, `welle`, `sleeve`, `buchse` |
| **Impeller** | `impeller`, `laufrad`, `runner` |
| **Rolling Bearing** | `bearing`, `lager`, `ball bearing`, `roller` |
| **Mechanical Seal** | `mechanical seal`, `gleitringdichtung`, `lip seal` |
| **O-ring** | `o-ring`, `oring`, `dichtring`, `sealing ring` |
| **Gasket** | `gasket`, `dichtung`, `flange gasket` |
| **Wear Ring** | `wear ring`, `verschleißring`, `protection sleeve` |
| **Accessories** | Everything else |

If a part designation matches multiple keywords, the first match in priority order takes precedence.

---

## Interchangeability Concept

Two parts are **interchangeable** when they are functionally and dimensionally identical and can be used in different pump models without modification.

**Interchangeability is identified by matching `Material Number`** (or part number when material number is absent). When the same material number appears in parts lists from two or more pumps, those pumps share a common interchangeable part.

### Benefit of Interchangeability

Instead of maintaining:
```
Pump A: 1× bearing [MA-321-00]
Pump B: 1× bearing [MA-321-00]
→ Total stock needed: 2 pieces (individual)
```

With DIN 24296 optimization for a fleet of 2:
```
Common bearing [MA-321-00] for both pumps:
→ Recommended stock: 1 piece (shared pool)
→ Savings: 1 piece
```

The shared pool provides the same service level with lower inventory because not all pumps fail simultaneously.

---

## Worked Example

**Scenario:** 4 identical centrifugal pumps in a cooling water circuit.

**Parts list per pump:**
- Shaft (qty 1)
- Impeller (qty 1)
- Rolling bearing DE (qty 1)
- Rolling bearing NDE (qty 1)
- Mechanical seal (qty 1)
- O-ring set (qty 1)
- Gasket set (qty 1)

**Without optimization (Standard):** `qty per pump × 4 pumps`

| Part | Qty/Pump | Standard Total |
|------|:--------:|:--------------:|
| Shaft | 1 | 4 |
| Impeller | 1 | 4 |
| Bearing DE | 1 | 4 |
| Bearing NDE | 1 | 4 |
| Mechanical seal | 1 | 4 |
| O-ring set | 1 | 4 |
| Gasket set | 1 | 4 |
| **Total** | | **28 items** |

**With DIN 24296 optimization (fleet of 4):**

| Part | DIN 24296 Qty | Savings |
|------|:-------------:|:-------:|
| Shaft | 1 | 3 |
| Impeller | 1 | 3 |
| Bearing DE | 2 | 2 |
| Bearing NDE | 2 | 2 |
| Mechanical seal | 8 sets | +4 (seal quantity goes up) |
| O-ring set | 8 sets | +4 |
| Gasket set | 8 sets | +4 |
| **Total** | | **Net savings: ~6 major items** |

The standard increases quantities for fast-wearing seals (designed for higher consumption), while decreasing quantities for structural parts that rarely fail simultaneously.

---

## Industry Best Practices

1. **Standardize pump models** — Use the same pump model across a system where possible, maximizing the interchangeable fleet size.
2. **Centralize common spares** — Store interchangeable parts in a central warehouse rather than next to each pump.
3. **Review annually** — Update the spare parts list each year, accounting for changes in fleet size, model updates, and actual failure experience.
4. **Track actual consumption** — Compare actual vs. DIN 24296 recommended quantities to tune the model to your specific operating conditions.
5. **Lead time awareness** — For parts with lead times > 4 weeks, consider adding a buffer above DIN 24296 minimums.
6. **Document interchangeability** — Maintain records of which pumps share common parts so that stock can be quickly allocated during breakdowns.
7. **Supplier qualification** — Ensure that interchangeable parts from different suppliers are truly dimensionally identical before pooling stock.

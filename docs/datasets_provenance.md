# Data Provenance, Lineage & Validation Framework

## 1. Overview and Core Philosophy

In accordance with NaviQGreen's foundational engineering rules, the platform strictly enforces **data provenance separation**. At no point are synthetic numbers conflated with empirical physical measurements or regulatory baselines. All records in the database, API responses, and analytics interfaces feature an explicit `data_source` tag and provenance ledger.

The platform classifies data into three distinct tiers:
1. **Tier 1: Regulatory & Standard Engineering Constants** (IMO, IPCC, ISO, DNV GL).
2. **Tier 2: Geographic & Hydrographic Ground Truth** (NOAA, World Port Index, Nautical Charts).
3. **Tier 3: Physics-Grounded Calibrated Datasets** (Synthetic telemetry derived from the Admiralty formula, Holtrop-Mennen resistance regressions, and Beaufort wind/wave additions).

---

## 2. Regulatory & Standard Baseline References (Tier 1)

All emissions factors, lower heating values (LHV), and carbon factors utilized in `backend/app/emissions/fuel_costs_emissions_engine.py` are sourced directly from international marine environmental standards:

| Fuel Type | Standard Reference | LHV (MJ/kg) | TTW CO₂ Factor ($C_f$) | WTW Well-to-Wake (g CO₂e/MJ) | IPCC AR5 CH₄ Slip (g/kg fuel) | IPCC AR5 N₂O Factor (g/kg fuel) |
|---|---|---|---|---|---|---|
| **Heavy Fuel Oil (HFO)** | IMO MEPC.281(70) / ISO 8217 | 40.2 | 3.1144 | 91.0 | 0.05 | 0.18 |
| **Very Low Sulfur Fuel Oil (VLSFO)** | IMO MEPC.308(73) / ISO 8217 | 41.2 | 3.1510 | 88.5 | 0.05 | 0.18 |
| **Marine Gas Oil (MGO)** | IMO MEPC.281(70) / ISO 8217 | 42.7 | 3.2060 | 87.0 | 0.05 | 0.18 |
| **Liquefied Natural Gas (LNG)** | IMO 4th GHG Study / MEPC.308(73) | 48.0 | 2.7500 | 76.5 (w/ slip) | 5.50 (Dual-Fuel 4-stroke) | 0.11 |
| **e-Methanol (Renewable)** | IRENA 2021 / IMO MEPC.323(74) | 19.9 | 1.3750 | 22.0 (PtX) | 0.00 | 0.05 |
| **Green Ammonia (NH₃)** | IMO Correspondence Group 2023 | 18.6 | 0.0000 | 12.0 (Green H₂ feed) | 0.00 | 0.25 (Engine combustion) |
| **Green Hydrogen (LH₂)** | ISO/TR 15916 / DNV Maritime | 120.0 | 0.0000 | 8.5 (Electrolysis) | 0.00 | 0.00 |
| **Cold Ironing (Shore Grid)** | EU Average 2024 / US EPA eGRID | N/A | N/A | 75.0 (g CO₂e/kWh) | N/A | N/A |

### Global Warming Potentials (GWP100)
- **Carbon Dioxide ($CO_2$)**: 1.0
- **Methane ($CH_4$)**: 28.0 (IPCC Fifth Assessment Report, AR5 with climate-carbon feedbacks excluded, 30.0 with feedbacks)
- **Nitrous Oxide ($N_2O$)**: 265.0 (IPCC AR5)

---

## 3. Geographic & Route Data Lineage (Tier 2)

Port coordinates, typical berth handling rates, and harbor grid carbon intensities are modeled using the **World Port Index (Pub 150)** and validated shipping lanes:

1. **Rotterdam (NLRTM)**: $51.95^\circ\text{N}, 4.14^\circ\text{E}$ — Deepwater container hub, LNG bunkering available, high shore-power electrification (0.245 kg CO₂e/kWh grid average).
2. **Singapore (SGSIN)**: $1.26^\circ\text{N}, 103.82^\circ\text{E}$ — Global top bunkering hub, low dwell time, equatorial calm waters (0.390 kg CO₂e/kWh grid average).
3. **Shanghai (CNSHA)**: $31.39^\circ\text{N}, 121.50^\circ\text{E}$ — World's largest container throughput port (0.540 kg CO₂e/kWh grid average).
4. **Houston (USHOU)**: $29.73^\circ\text{N}, -95.27^\circ\text{W}$ — Petrochemical and bulk export terminal (0.420 kg CO₂e/kWh grid average).
5. **Antwerp-Bruges (BEANR)**: $51.28^\circ\text{N}, 4.31^\circ\text{E}$ — European multimodal gateway (0.190 kg CO₂e/kWh grid average).
6. **Jebel Ali / Dubai (AEJEA)**: $24.99^\circ\text{N}, 55.06^\circ\text{E}$ — Middle Eastern transshipment center (0.480 kg CO₂e/kWh grid average).

### Corridors
- **Shanghai $\leftrightarrow$ Rotterdam via Suez Canal**: 10,500 nautical miles.
- **Singapore $\leftrightarrow$ Rotterdam**: 8,300 nautical miles.
- **Houston $\leftrightarrow$ Antwerp**: 4,850 nautical miles.
- **Dubai $\leftrightarrow$ Singapore**: 3,600 nautical miles.

---

## 4. Physics-Grounded Synthetic Dataset Generation (Tier 3)

### Rationale
Real shipboard high-frequency telemetry (noon reports and torque-meter SCADA streams) is proprietary to commercial shipowners and subject to strict maritime non-disclosure agreements (NDAs). To provide a fully functional, reproducible, and verifiable machine learning testbed without legal encumbrances, NaviQGreen includes a **physics-grounded synthetic telemetry generator** located at `backend/app/data/seed_datasets.py`.

### Mathematical Formulation
The training dataset ($N = 3,000$ voyages across diverse vessel types and sea states) models vessel fuel consumption via classical naval architecture hydrodynamics:

$$P_{\text{req}} = \frac{\Delta^{2/3} \cdot v^3}{C_a} \cdot \left(1 + 0.05 \cdot \text{Beaufort} + 0.02 \cdot \text{WaveHeight}\right) \cdot (1 + \text{FoulingPenalty})$$

Where:
- $\Delta$: Vessel total displacement (deadweight tonnage + lightship weight in metric tonnes).
- $v$: Cruising speed through water in knots.
- $C_a$: Admiralty Coefficient (calibrated between 450 and 650 depending on hull fineness and block coefficient $C_b$).
- $\text{Beaufort}$: Sea weather condition scaled from 0 (calm) to 8 (gale).
- $\text{WaveHeight}$: Significant wave height ($H_{1/3}$ in meters).
- $\text{FoulingPenalty}$: Biofouling resistance penalty ($0.00$ for clean hull, up to $0.15$ for degraded hull).
- $\text{Specific Fuel Consumption (SFOC)}$: Main engine efficiency curve based on MAN B&W / WinGD 2-stroke diesels ($165\text{--}195\text{ g/kWh}$).

### Ingestion Schema & Feature Description
The dataset resides at `backend/data/fuel_consumption_training.csv` and contains:
- `vessel_type`: Container, Bulk Carrier, Crude Tanker, LNG Carrier, Chemical Tanker.
- `dwt`: Vessel deadweight capacity in metric tonnes (15,000 to 220,000).
- `distance_nm`: Voyage distance in nautical miles (500 to 12,000).
- `speed_knots`: Operating speed in knots (10.0 to 24.0).
- `cargo_weight_tonnes`: Transported payload in metric tonnes.
- `weather_factor`: Weather severity factor (1.00 calm to 1.45 severe storm).
- `sea_state_beaufort`: Beaufort scale (0 to 8).
- `draft_ratio`: Actual draft divided by design draft ($0.45\text{--}1.00$).
- `fuel_type`: Primary propulsion fuel code.
- `fuel_consumption_kg`: **Target variable** — Total fuel burned during voyage in kilograms.

---

## 5. Ingestion Quality Control & Outlier Detection

The `backend/app/services/dataset_service.py` service enforces the following ingestion pipeline rules:
1. **Schema Validation**: Ensures all expected columns exist with compliant numeric types.
2. **Missing Value Screening**: Rows with `null` or NaN in critical hydrodynamic parameters are rejected.
3. **Statistical Outlier Detection**: Flags records where fuel consumption deviates by more than $3.5\sigma$ from the group mean for a given $(DWT, \text{speed})$ envelope.
4. **Physical Bounds Checking**:
   - $v_{\min} \ge 8.0\text{ knots}$, $v_{\max} \le 30.0\text{ knots}$.
   - Cargo load cannot exceed $1.10 \times \text{DWT}$.
   - Distance must be $\ge 10\text{ nm}$.
   - Target fuel consumption must be $> 0\text{ kg}$.

All imported datasets are stamped with SHA-256 hashes, creation timestamps, record counts, and status indicators (`validated`, `quarantined`, or `imported`).


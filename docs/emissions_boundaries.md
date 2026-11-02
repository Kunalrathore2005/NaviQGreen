# NaviQGreen — Fuel Cost & Lifecycle Emissions Accounting

**Standards**: IMO Fourth GHG Study (2020), Resolution MEPC.308(73), IPCC AR5, ISO 14040/44.

---

## 1. Lifecycle Boundaries

NaviQGreen distinctly reports two lifecycle boundaries to prevent ambiguous greenwashing claims:

1. **Tank-to-Wake (TTW) / Direct Operational Emissions**:
   - Accounts exclusively for emissions released from fuel combustion aboard the vessel at sea.
   - Includes $\text{CO}_2$, $\text{CH}_4$, and $\text{N}_2\text{O}$ converted via IPCC AR5 100-year Global Warming Potentials ($\text{GWP}_{\text{CH}_4} = 28$, $\text{GWP}_{\text{N}_2\text{O}} = 265$).

2. **Well-to-Wake (WTW) / Total Lifecycle Emissions**:
   - Sum of **Well-to-Tank (WTT)** (feedstock extraction, refining, electrolysis, liquefaction, transport) and **Tank-to-Wake (TTW)**.
   - Essential for green fuels (e-Methanol, Ammonia, Hydrogen) which have near-zero combustion carbon but require renewable energy upstream.

---

## 2. Marine Fuels Reference Table

| Fuel Code | Fuel Name | Category | Price ($/MT) | LHV (MJ/kg) | TTW Factor ($\text{tCO}_2/\text{t}$) | WTW Factor ($\text{tCO}_2\text{eq}/\text{t}$) | Zero-Carbon? |
|---|---|---|---|---|---|---|---|
| **VLSFO** | Very Low Sulphur Fuel Oil | Fossil | $620 | 40.2 | 3.114 | 3.650 | No |
| **MGO** | Marine Gas Oil (0.1% S) | Fossil | $780 | 42.7 | 3.206 | 3.780 | No |
| **LNG** | Liquefied Natural Gas | Fossil | $690 | 48.0 | 2.750 | 3.420 | No (Methane Slip) |
| **Methanol** | Bio/e-Methanol | Renewable | $850 | 19.9 | 1.375 | 0.450 | Carbon Neutral |
| **Ammonia** | Green Ammonia | Synthetic | $920 | 18.6 | 0.000 | 0.320 | Yes (Molecular Zero) |
| **Hydrogen** | Liquid Green Hydrogen | Synthetic | $2,400 | 120.0 | 0.000 | 0.180 | Yes |

---

## 3. Energy Density Equivalence Principle

**Important Rule**: One kilogram of Methanol or Ammonia cannot propel a ship the same distance as one kilogram of diesel fuel.  
NaviQGreen converts fuel mass based on Lower Heating Value (LHV) and relative engine thermal efficiency:

$$E_{\text{propulsion}} = \text{Mass}_{\text{VLSFO}} \times \text{LHV}_{\text{VLSFO}}$$
$$\text{Mass}_{\text{Alt}} = \frac{E_{\text{propulsion}}}{\text{LHV}_{\text{Alt}} \times \eta_{\text{rel}}}$$

- Methanol requires $\approx 2.02\times$ the mass of VLSFO for equal energy.
- Ammonia requires $\approx 2.16\times$ the mass of VLSFO.
- Liquid Hydrogen requires $\approx 0.27\times$ the mass due to its exceptional energy density ($120\text{ MJ/kg}$) and high fuel cell efficiency.


# NaviQGreen — Mathematical Fleet Optimization Formulation

**Domain**: Operations Research & Green Maritime Logistics  
**Formulation**: Mixed-Integer Multi-Objective Non-Linear Program (MINLP)  

---

## 1. Decision Variables

- $x_{ij} \in \{0, 1\}$: Binary variable indicating if vessel $i \in \{1, \dots, N\}$ is assigned to route $j \in \{1, \dots, M\}$.
- $v_{ij} \in [v_{\min, i}, v_{\max, i}]$: Continuous/discretized cruising speed in knots of vessel $i$ on route $j$.
- $f_{ij} \in \mathcal{F}_i$: Fuel type selected from compatible fuel set $\mathcal{F}_i$.
- $s_{ij} \in \{0, 1\}$: Binary decision to utilize port shore-power at destination berth.
- $q_{ij} \ge 0$: Cargo payload in metric tonnes carried by vessel $i$ on route $j$.

---

## 2. Multi-Objective Function

The objective is to minimize total economic cost, fuel consumption, and lifecycle greenhouse gas emissions:

$$\min J = w_{\text{cost}} \left(\frac{C_{\text{total}}}{C_{\text{ref}}}\right) + w_{\text{fuel}} \left(\frac{F_{\text{total}}}{F_{\text{ref}}}\right) + w_{\text{emissions}} \left(\frac{E_{\text{total}}}{E_{\text{ref}}}\right) + \sum \text{Penalties}$$

where non-negative weights satisfy $w_{\text{cost}} + w_{\text{fuel}} + w_{\text{emissions}} = 1.0$.

Reference normalization factors ($C_{\text{ref}} = \$500,000, F_{\text{ref}} = 600\text{ MT}, E_{\text{ref}} = 2,000\text{ tCO}_2$) eliminate magnitude distortions.

---

## 3. Operational Constraints

1. **Cargo Demand Satisfaction**:
   $$\sum_{i=1}^N x_{ij} \cdot q_{ij} \ge Q_j \quad \forall j \in \{1, \dots, M\}$$

2. **Deadweight & Cargo Capacity Bounds**:
   $$0 \le q_{ij} \le C_i \cdot x_{ij} \quad \forall i, j$$

3. **Schedule / Arrival Deadline Feasibility**:
   $$\frac{D_j}{v_{ij}} \le T_{\max, j} \quad \forall (i, j) \text{ where } x_{ij} = 1$$

4. **Single Voyage per Vessel Horizon**:
   $$\sum_{j=1}^M x_{ij} \le 1 \quad \forall i \in \{1, \dots, N\}$$

5. **Speed Envelope Bounds**:
   $$v_{\min, i} \le v_{ij} \le v_{\max, i} \quad \forall i, j$$

6. **Fuel Engine Compatibility**:
   $$f_{ij} \in \mathcal{F}_i \quad \forall i, j$$

7. **Shore Power Berth Availability**:
   $$s_{ij} \le \text{ShorePowerAvailable}_j \quad \forall i, j$$


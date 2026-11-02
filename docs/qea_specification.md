# NaviQGreen — Quantum-Inspired Evolutionary Algorithm (QEA) Specification

**SIH Problem Statement ID**: SIH26138  
**Algorithm Type**: Classical Quantum-Inspired Evolutionary Algorithm (QEA)  
**Scientific Reference**: Han, K. H., & Kim, J. H. (2002). *Quantum-inspired evolutionary algorithm for a class of combinatorial optimization problems*. IEEE Transactions on Evolutionary Computation, 6(6), 580-593.

---

## 1. Classical Quantum Metaphor & Foundations

NaviQGreen implements a genuine classical evolutionary algorithm utilizing quantum probability representations. **It executes entirely on classical hardware and does not require cryogenic quantum computers.**

In conventional Genetic Algorithms, a gene is a deterministic binary value $b \in \{0, 1\}$.  
In QEA, the decision state is represented by a **Quantum bit (Q-bit)** in a linear superposition:

$$|\psi\rangle = \alpha |0\rangle + \beta |1\rangle$$

where $\alpha$ and $\beta$ are complex or real probability amplitudes satisfying the normalization constraint:

$$|\alpha|^2 + |\beta|^2 = 1$$

- $|\alpha|^2$ is the probability that the decision bit collapses to state `0`.
- $|\beta|^2$ is the probability that the decision bit collapses to state `1`.

---

## 2. Chromosome Encoding for Fleet Decisions

A quantum individual chromosome is defined as:

$$Q = \begin{bmatrix} \alpha_1 & \alpha_2 & \dots & \alpha_M \\ \beta_1 & \beta_2 & \dots & \beta_M \end{bmatrix}$$

The $M$ Q-bits encode:
1. **Vessel Assignment Matrix** ($N_{\text{vessels}} \times N_{\text{routes}}$ bits): Binary selection indicating whether vessel $i$ is assigned to voyage route $j$.
2. **Cruising Speed Envelopes** ($N_{\text{vessels}} \times 3$ bits): 3 bits per vessel mapping to 8 discretized speed levels within allowable window $[v_{\min}, v_{\max}]$.
3. **Alternative Fuel Selection** ($N_{\text{vessels}} \times 3$ bits): Maps to compatible fuel options (VLSFO, MGO, LNG, Methanol, Ammonia, Hydrogen).
4. **Cold Ironing Shore Power** ($N_{\text{vessels}}$ bits): Binary decision to connect to port electrical grid at berth.

---

## 3. Quantum Measurement & Collapse Operator

During each generation, classical candidate solutions are sampled by measuring each Q-bit against a uniform random variable $r \sim U(0, 1)$:

$$x_k = \begin{cases} 0, & \text{if } r < |\alpha_k|^2 \\ 1, & \text{otherwise} \end{cases}$$

This maintains an implicit superposition of $2^M$ potential fleet configurations in a compact probability vector.

---

## 4. Quantum Rotation Gate Update Operator

To guide the population toward optimal feasible solutions without destroying diversity, Q-bit amplitudes are updated using a 2D **Quantum Rotation Gate** $U(\Delta \theta)$:

$$\begin{bmatrix} \alpha_k' \\ \beta_k' \end{bmatrix} = \begin{bmatrix} \cos(\Delta \theta_k) & -\sin(\Delta \theta_k) \\ \sin(\Delta \theta_k) & \cos(\Delta \theta_k) \end{bmatrix} \begin{bmatrix} \alpha_k \\ \beta_k \end{bmatrix}$$

The rotation angle $\Delta \theta_k = s(\alpha_k, \beta_k) \cdot \theta_0$ is looked up based on the Han & Kim lookup matrix comparing the current bit $x_k$ to the elite feasible bit $b_k$:

| $x_k$ | $b_k$ | $f(x) \ge f(b)$ | $\Delta \theta_k$ | Condition on $\alpha \beta$ |
|---|---|---|---|---|
| 0 | 0 | True | 0 | None |
| 0 | 1 | True | $+\theta_0$ | $\alpha \beta > 0$ |
| 0 | 1 | True | $-\theta_0$ | $\alpha \beta < 0$ |
| 1 | 0 | True | $-\theta_0$ | $\alpha \beta > 0$ |
| 1 | 0 | True | $+\theta_0$ | $\alpha \beta < 0$ |
| 1 | 1 | True | 0 | None |

Standard step size: $\theta_0 = 0.025\pi$ radians.

---

## 5. Quantum Catastrophe & Diversity Restoration

When the average amplitude entropy collapses ($|\alpha_k|^2 \approx 0.999$ or $0.001$), population diversity drops. A quantum catastrophe operator perturbs non-elite amplitudes back toward equal superposition ($\alpha_k \approx \beta_k \approx 1/\sqrt{2}$), escaping local premature minima.

---

## 6. Interactive Verification: Quantum Q-Bit Lab (`/quantum-lab`)

To allow judges, researchers, and operators to interactively inspect and verify every mathematical step of the Quantum-Inspired Evolutionary Algorithm, NaviQGreen features a dedicated **Quantum State & Q-Bit Lab** in the frontend:

1. **2D Hilbert / Bloch Unit Circle Visualizer**:
   - Live SVG representation plotting the normalized state vector $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$ on the unit circle.
   - Real-time scrubber allowing continuous modification of angle $\theta \in [0, \pi/2]$, with immediate dynamic computation of Born rule probabilities $P(0) = |\alpha|^2$ and $P(1) = |\beta|^2$.
2. **Step-by-Step Han & Kim Unitary Gate Inspector**:
   - Interactive toggles for candidate bit $x_i$, elite best bit $b_i$, and relative fitness $f(x) \ge f(b)$.
   - Displays the computed transformation matrix $U(\Delta\theta)$, rotation direction (clockwise vs. counter-clockwise), and the exact rule triggered from the Han & Kim (2002) look-up table.
3. **Monte Carlo Wavefunction Collapse Experiment**:
   - Performs $N \in [50, 1000]$ randomized measurements to demonstrate quantum measurement collapse into classical bitstrings and empirical frequency convergence toward $|\alpha|^2$ and $|\beta|^2$.
4. **Entropy Catastrophe Recovery Demonstration**:
   - Visualizes Shannon entropy monitoring across a 16-qubit register.
   - Simulates premature qubit collapse and demonstrates the automatic triggering of the catastrophe recovery operator when $H(Q) < 0.15$, restoring diversity to maximal superposition.


# Physics Complete Reference
### Laws · Equations · Definitions
> Covers CAPS Grades 10–12 and beyond — Classical Mechanics to Quantum Physics

---

## Table of Contents
1. [Fundamental Constants](#1-fundamental-constants)
2. [Mechanics — Kinematics](#2-mechanics--kinematics)
3. [Mechanics — Dynamics (Newton's Laws)](#3-mechanics--dynamics-newtons-laws)
4. [Mechanics — Work, Energy & Power](#4-mechanics--work-energy--power)
5. [Mechanics — Momentum & Impulse](#5-mechanics--momentum--impulse)
6. [Mechanics — Circular Motion & Gravitation](#6-mechanics--circular-motion--gravitation)
7. [Simple Harmonic Motion](#7-simple-harmonic-motion)
8. [Waves & Sound](#8-waves--sound)
9. [Optics](#9-optics)
10. [Thermodynamics](#10-thermodynamics)
11. [Electrostatics](#11-electrostatics)
12. [Electric Circuits](#12-electric-circuits)
13. [Magnetism & Electromagnetism](#13-magnetism--electromagnetism)
14. [Modern Physics — Quantum Mechanics](#14-modern-physics--quantum-mechanics)
15. [Nuclear Physics](#15-nuclear-physics)
16. [Relativity](#16-relativity)
17. [Fluid Mechanics](#17-fluid-mechanics)
18. [Rotational Mechanics](#18-rotational-mechanics)
19. [SI Units & Prefixes](#19-si-units--prefixes)
20. [Greek Letters Used in Physics](#20-greek-letters-used-in-physics)

---

## 1. Fundamental Constants

| Constant | Symbol | Value | Unit |
|---|---|---|---|
| Speed of light in vacuum | c | 3.00 × 10⁸ | m/s |
| Gravitational acceleration (Earth) | g | 9.8 | m/s² |
| Universal gravitational constant | G | 6.674 × 10⁻¹¹ | N·m²/kg² |
| Planck's constant | h | 6.626 × 10⁻³⁴ | J·s |
| Reduced Planck's constant | ħ | 1.055 × 10⁻³⁴ | J·s |
| Elementary charge | e | 1.602 × 10⁻¹⁹ | C |
| Electron mass | mₑ | 9.109 × 10⁻³¹ | kg |
| Proton mass | mₚ | 1.673 × 10⁻²⁷ | kg |
| Neutron mass | mₙ | 1.675 × 10⁻²⁷ | kg |
| Coulomb's constant | k | 8.99 × 10⁹ | N·m²/C² |
| Permittivity of free space | ε₀ | 8.854 × 10⁻¹² | C²/N·m² |
| Permeability of free space | μ₀ | 4π × 10⁻⁷ | T·m/A |
| Boltzmann constant | k_B | 1.381 × 10⁻²³ | J/K |
| Avogadro's number | Nₐ | 6.022 × 10²³ | mol⁻¹ |
| Universal gas constant | R | 8.314 | J/mol·K |
| Stefan-Boltzmann constant | σ | 5.670 × 10⁻⁸ | W/m²·K⁴ |
| Atomic mass unit | u | 1.661 × 10⁻²⁷ | kg |
| Speed of sound in air (20°C) | v_s | 343 | m/s |

---

## 2. Mechanics — Kinematics

### Definitions

**Displacement (s)** — The change in position of an object; a vector quantity with magnitude and direction. Unit: metre (m).

**Distance** — The total path length travelled; a scalar quantity. Unit: metre (m).

**Velocity (v)** — The rate of change of displacement with respect to time; a vector. Unit: m/s.

**Speed** — The magnitude of velocity; a scalar. Unit: m/s.

**Acceleration (a)** — The rate of change of velocity with respect to time; a vector. Unit: m/s².

**Uniform acceleration** — Constant acceleration; velocity changes by equal amounts in equal time intervals.

**Free fall** — Motion under gravity alone, with a = g = 9.8 m/s² downward.

---

### Equations of Motion (uniform acceleration)

| Equation | Variables | Use when |
|---|---|---|
| `v = u + at` | v, u, a, t | time is known, no displacement needed |
| `s = ut + ½at²` | s, u, a, t | final velocity not needed |
| `v² = u² + 2as` | v, u, a, s | time is not known |
| `s = ½(u + v)t` | s, u, v, t | acceleration not needed |
| `s = vt - ½at²` | s, v, a, t | initial velocity not needed |

> **u** = initial velocity, **v** = final velocity, **a** = acceleration, **t** = time, **s** = displacement

---

### Projectile Motion

A projectile moves with constant horizontal velocity and uniform vertical acceleration (g).

**Horizontal component** (no acceleration):
```
x = u·cosθ · t
v_x = u·cosθ  (constant throughout)
```

**Vertical component** (acceleration = g downward):
```
v_y = u·sinθ - gt
y = u·sinθ · t - ½gt²
v_y² = (u·sinθ)² - 2gy
```

**Time of flight** (for level ground):
```
T = 2u·sinθ / g
```

**Maximum height**:
```
H = (u·sinθ)² / 2g
```

**Horizontal range**:
```
R = u²·sin(2θ) / g
```

**Maximum range** occurs at θ = 45°.

---

### Relative Velocity

```
v_AB = v_A - v_B
```
> Velocity of A relative to B = velocity of A minus velocity of B.

---

## 3. Mechanics — Dynamics (Newton's Laws)

### Newton's First Law (Law of Inertia)
> *"An object remains at rest or in uniform motion in a straight line unless acted upon by a net external force."*

**Inertia** — The tendency of an object to resist changes in its state of motion. Proportional to mass.

**Equilibrium** — State in which net force = 0 and net torque = 0.

---

### Newton's Second Law
> *"The net force acting on an object is equal to the rate of change of its momentum, or equivalently, the product of its mass and acceleration."*

```
F_net = ma
F_net = Δp/Δt
```

> Direction of acceleration is always in the direction of the net force.

---

### Newton's Third Law
> *"For every action, there is an equal and opposite reaction. Forces always occur in action-reaction pairs."*

```
F_AB = -F_BA
```

> Action and reaction forces act on **different** objects.

---

### Weight and Mass

```
W = mg
```

**Mass (m)** — Amount of matter in an object; scalar; constant everywhere. Unit: kg.

**Weight (W)** — Gravitational force on an object; vector; varies with g. Unit: N.

---

### Friction

**Static friction** — Friction force that prevents an object from starting to move.
```
f_s ≤ μ_s · N
```

**Kinetic friction** — Friction force on a sliding object.
```
f_k = μ_k · N
```

**Normal force (N)** — Contact force perpendicular to the surface. On flat ground: N = mg.

**Coefficient of friction (μ)** — Dimensionless ratio; μ_s > μ_k always.

---

### Inclined Planes

For angle θ from horizontal:
```
Component along plane:    F_∥ = mg·sinθ
Component normal to plane: F_⊥ = mg·cosθ = N
Net force (frictionless):  F_net = mg·sinθ
Net force (with friction):  F_net = mg·sinθ - μ_k·mg·cosθ
```

---

### Hooke's Law

> *"The extension or compression of a spring is directly proportional to the applied force, provided the elastic limit is not exceeded."*

```
F = -kx
```

**Spring constant (k)** — Stiffness of the spring. Unit: N/m.
**Elastic limit** — Maximum force beyond which the spring does not return to its original length.

---

## 4. Mechanics — Work, Energy & Power

### Work

> *"Work is done when a force causes displacement in the direction of the force."*

```
W = F·d·cosθ
```

**θ** = angle between force and displacement.
- θ = 0°: maximum positive work
- θ = 90°: no work done
- θ = 180°: negative work (opposing force)

Unit: Joule (J) = N·m

---

### Kinetic Energy

```
KE = ½mv²
```

**Work-Energy Theorem:**
```
W_net = ΔKE = ½mv² - ½mu²
```

---

### Potential Energy

**Gravitational potential energy:**
```
PE = mgh
```

**Elastic (spring) potential energy:**
```
PE = ½kx²
```

---

### Conservation of Mechanical Energy

> *"In the absence of non-conservative forces (like friction), the total mechanical energy of a system remains constant."*

```
KE₁ + PE₁ = KE₂ + PE₂
½mu₁² + mgh₁ = ½mv₂² + mgh₂
```

**With friction/air resistance:**
```
KE₁ + PE₁ = KE₂ + PE₂ + W_friction
```

---

### Power

> *"Power is the rate at which work is done or energy is transferred."*

```
P = W/t
P = F·v
```

Unit: Watt (W) = J/s

**Efficiency:**
```
η = (useful output energy / total input energy) × 100%
η = P_out / P_in × 100%
```

---

## 5. Mechanics — Momentum & Impulse

### Momentum

> *"Momentum is the product of an object's mass and velocity."*

```
p = mv
```

Unit: kg·m/s  
Vector quantity — direction same as velocity.

---

### Impulse

> *"Impulse is the product of force and the time over which it acts; equals the change in momentum."*

```
J = FΔt = Δp = mv - mu
```

Unit: N·s = kg·m/s

---

### Conservation of Momentum

> *"The total momentum of a closed system remains constant if no external net force acts on it."*

```
Σp_before = Σp_after
m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂
```

---

### Types of Collisions

**Elastic collision** — Both momentum AND kinetic energy are conserved.
```
m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂
½m₁u₁² + ½m₂u₂² = ½m₁v₁² + ½m₂v₂²
```

**Inelastic collision** — Momentum conserved; kinetic energy NOT conserved (lost to heat/deformation).

**Perfectly inelastic collision** — Objects stick together after collision.
```
m₁u₁ + m₂u₂ = (m₁ + m₂)v_f
```

---

## 6. Mechanics — Circular Motion & Gravitation

### Circular Motion

**Period (T)** — Time for one complete revolution. Unit: s.

**Frequency (f)** — Number of revolutions per second. Unit: Hz.
```
f = 1/T
```

**Angular velocity (ω):**
```
ω = 2πf = 2π/T
```

**Linear speed:**
```
v = rω = 2πr/T
```

**Centripetal acceleration** — Always directed toward the centre:
```
a_c = v²/r = ω²r
```

**Centripetal force** — Net force directed inward:
```
F_c = mv²/r = mω²r
```

---

### Newton's Law of Universal Gravitation

> *"Every particle of matter in the universe attracts every other particle with a force that is directly proportional to the product of their masses and inversely proportional to the square of the distance between their centres."*

```
F = Gm₁m₂/r²
```

**Gravitational field strength:**
```
g = GM/r²
```

**Gravitational potential energy:**
```
U = -GMm/r
```

---

### Orbital Motion

For a circular orbit:
```
F_gravity = F_centripetal
GMm/r² = mv²/r
v = √(GM/r)
```

**Orbital period (Kepler's Third Law):**
```
T² = (4π²/GM) · r³
T² ∝ r³
```

**Escape velocity** — Minimum speed to escape gravitational field:
```
v_escape = √(2GM/r)
```

---

### Kepler's Laws

**First Law** — Planets move in ellipses with the Sun at one focus.

**Second Law** — A line from the Sun to a planet sweeps equal areas in equal times (conservation of angular momentum).

**Third Law** — T² ∝ r³ (the square of the period is proportional to the cube of the semi-major axis).

---

## 7. Simple Harmonic Motion

### Definitions

**Simple Harmonic Motion (SHM)** — Oscillatory motion where the restoring force is proportional to and opposite to the displacement from equilibrium.

```
F = -kx   (restoring force)
a = -ω²x  (acceleration in SHM)
```

**Amplitude (A)** — Maximum displacement from equilibrium.

---

### SHM Equations

**Displacement:**
```
x(t) = A·cos(ωt + φ)
```

**Velocity:**
```
v(t) = -Aω·sin(ωt + φ)
v = ω√(A² - x²)
```

**Acceleration:**
```
a(t) = -Aω²·cos(ωt + φ) = -ω²x
```

**Angular frequency:**
```
ω = 2πf = 2π/T = √(k/m)
```

---

### Simple Pendulum

> Valid for small angles (θ < 15°).

```
T = 2π√(L/g)
f = (1/2π)√(g/L)
```

**L** = length of pendulum, **g** = gravitational field strength.

> T is independent of mass and amplitude (for small angles).

---

### Spring-Mass System

```
T = 2π√(m/k)
f = (1/2π)√(k/m)
ω = √(k/m)
```

---

### Energy in SHM

```
KE = ½mω²(A² - x²)
PE = ½mω²x²
Total E = ½mω²A²  (constant)
```

Maximum KE at x = 0 (equilibrium). Maximum PE at x = ±A (extremes).

---

## 8. Waves & Sound

### Definitions

**Wave** — A disturbance that transfers energy through a medium or space without transferring matter.

**Transverse wave** — Particles vibrate perpendicular to the direction of wave propagation. Example: light, water waves.

**Longitudinal wave** — Particles vibrate parallel to the direction of propagation. Example: sound.

**Wavelength (λ)** — Distance between two consecutive points in phase (e.g., crest to crest). Unit: m.

**Frequency (f)** — Number of complete waves passing a point per second. Unit: Hz.

**Period (T)** — Time for one complete wave to pass a point. Unit: s.

**Amplitude (A)** — Maximum displacement of a particle from equilibrium.

**Wave speed (v)** — Speed at which the wave pattern moves through the medium.

---

### Wave Equation

```
v = fλ
f = 1/T
v = λ/T
```

---

### Wave Properties

**Reflection** — Wave bounces off a boundary.
- Fixed end: phase inverts (crest → trough)
- Free end: phase unchanged

**Refraction** — Wave changes direction when entering a different medium (speed changes).

**Diffraction** — Wave bends around obstacles or through openings. Most significant when λ ≈ slit width.

**Interference:**
- Constructive: two waves in phase, amplitudes add: `A_total = A₁ + A₂`
- Destructive: two waves 180° out of phase, amplitudes subtract: `A_total = |A₁ - A₂|`

**Superposition Principle** — The resultant displacement at any point is the vector sum of all individual wave displacements.

---

### Standing Waves

Formed by interference of two identical waves travelling in opposite directions.

**Nodes** — Points of zero displacement (destructive interference).
**Antinodes** — Points of maximum displacement (constructive interference).

**String fixed at both ends / pipe closed at both ends:**
```
λ_n = 2L/n
f_n = nv/2L    (n = 1, 2, 3, ...)
```

**Pipe open at both ends:**
```
f_n = nv/2L
```

**Pipe closed at one end (only odd harmonics):**
```
f_n = nv/4L    (n = 1, 3, 5, ...)
```

---

### Sound

**Speed of sound in air:** v_s ≈ 343 m/s at 20°C.
```
v_s = 331√(1 + T_C/273)   (T_C in °C)
```

**Intensity:**
```
I = P/A   (W/m²)
```

**Intensity level (decibels):**
```
β = 10·log₁₀(I/I₀)   dB
I₀ = 10⁻¹² W/m²  (threshold of hearing)
```

---

### Doppler Effect

> *"The apparent change in frequency of a wave when the source or observer is moving relative to the medium."*

```
f_L = f_S · (v ± v_L) / (v ∓ v_S)
```

**Sign convention:**
- Numerator: + when observer moves toward source; − when moving away
- Denominator: − when source moves toward observer; + when moving away

**Approaching** → higher observed frequency (blue shift)  
**Receding** → lower observed frequency (red shift)

---

### Electromagnetic Spectrum

| Type | Wavelength Range |
|---|---|
| Radio waves | > 1 mm |
| Microwaves | 1 mm – 1 m |
| Infrared | 700 nm – 1 mm |
| Visible light | 380 nm – 700 nm |
| Ultraviolet | 10 nm – 380 nm |
| X-rays | 0.01 nm – 10 nm |
| Gamma rays | < 0.01 nm |

All EM waves travel at **c = 3 × 10⁸ m/s** in vacuum.

---

## 9. Optics

### Reflection

**Law of Reflection:**
> *"The angle of incidence equals the angle of reflection, measured from the normal."*
```
θ_i = θ_r
```

---

### Refraction

**Snell's Law:**
> *"When a wave passes from one medium to another, the ratio of the sines of the angles is equal to the ratio of the wave speeds in the media."*

```
n₁·sinθ₁ = n₂·sinθ₂
n = c/v   (refractive index)
```

**Refractive index** — Ratio of the speed of light in vacuum to the speed in the medium.
```
n = c/v
```

**Optical density** — A medium with a higher refractive index is optically denser; light slows down and bends toward the normal.

---

### Total Internal Reflection (TIR)

> Occurs when light travels from a denser medium to a less dense medium and the angle of incidence exceeds the critical angle.

**Critical angle:**
```
sinθ_c = n₂/n₁   (when n₁ > n₂)
sinθ_c = 1/n    (when n₂ = air ≈ 1)
```

Applications: optical fibres, diamonds, mirages.

---

### Lenses

**Converging (convex) lens** — Focal length f > 0; brings parallel rays to focus.

**Diverging (concave) lens** — Focal length f < 0; spreads rays apart.

**Thin Lens Equation:**
```
1/f = 1/d_o + 1/d_i
```

**Magnification:**
```
m = -d_i/d_o = h_i/h_o
```

**Power of a lens:**
```
P = 1/f   (dioptres, D)
```

---

### Mirrors

**Concave mirror** (converging) — Centre of curvature C, focal point F = R/2.

**Convex mirror** (diverging) — Virtual focus behind mirror.

**Mirror equation** (same as lens equation):
```
1/f = 1/d_o + 1/d_i
f = R/2
```

---

### Young's Double Slit Experiment

Demonstrates wave nature of light (interference).

**Fringe spacing:**
```
Δy = λL/d
```
**L** = distance to screen, **d** = slit separation.

---

## 10. Thermodynamics

### Definitions

**Temperature** — A measure of the average kinetic energy of particles in a substance. Unit: Kelvin (K) or Celsius (°C).

**Thermal equilibrium** — Two objects in contact reach the same temperature; no net heat transfer.

**Internal energy (U)** — Total kinetic + potential energy of all particles in a substance.

**Heat (Q)** — Energy transferred between objects due to a temperature difference. Unit: J.

**Specific heat capacity (c)** — Energy needed to raise 1 kg of a substance by 1 K.

---

### Temperature Conversions

```
T(K) = T(°C) + 273.15
T(°C) = T(K) - 273.15
```

---

### Thermal Equations

**Heat transfer:**
```
Q = mcΔT
```

**Latent heat** (phase change at constant temperature):
```
Q = mL
L_f = latent heat of fusion (melting/freezing)
L_v = latent heat of vaporisation (boiling/condensing)
```

---

### Gas Laws

**Boyle's Law** (constant T):
```
P₁V₁ = P₂V₂     or     P ∝ 1/V
```

**Charles's Law** (constant P):
```
V₁/T₁ = V₂/T₂     or     V ∝ T
```

**Gay-Lussac's Law** (constant V):
```
P₁/T₁ = P₂/T₂     or     P ∝ T
```

**Combined Gas Law:**
```
P₁V₁/T₁ = P₂V₂/T₂
```

**Ideal Gas Law:**
```
PV = nRT
PV = Nk_BT
```
**n** = moles, **R** = 8.314 J/mol·K, **N** = number of molecules, **k_B** = Boltzmann constant.

**Kinetic Theory — Average KE of a molecule:**
```
KE_avg = (3/2)k_BT
```

**Root mean square speed:**
```
v_rms = √(3k_BT/m) = √(3RT/M)
```

---

### Laws of Thermodynamics

**Zeroth Law** — If A is in thermal equilibrium with B, and B with C, then A is in equilibrium with C.

**First Law** (Conservation of Energy):
```
ΔU = Q - W
```
> Increase in internal energy = heat added to system − work done BY system.

**Second Law** — Heat cannot spontaneously flow from a cold object to a hot object. Entropy of an isolated system never decreases.

**Third Law** — The entropy of a perfect crystal at absolute zero (0 K) is zero.

---

### Thermodynamic Processes

| Process | Constant | Equation |
|---|---|---|
| Isothermal | Temperature (T) | PV = constant |
| Isobaric | Pressure (P) | V/T = constant |
| Isochoric (Isovolumetric) | Volume (V) | P/T = constant |
| Adiabatic | No heat exchange (Q=0) | PVᵞ = constant |

---

## 11. Electrostatics

### Coulomb's Law

> *"The electrostatic force between two point charges is directly proportional to the product of the charges and inversely proportional to the square of the distance between them."*

```
F = kQ₁Q₂/r²
k = 1/(4πε₀) = 8.99 × 10⁹ N·m²/C²
```

- Like charges: repel
- Unlike charges: attract

---

### Electric Field

> *"The electric field at a point is the force per unit positive test charge placed at that point."*

```
E = F/q
E = kQ/r²
```

Unit: N/C = V/m  
Direction: away from positive charge, toward negative charge.

**Electric field between parallel plates (uniform):**
```
E = V/d
```

---

### Electric Potential

**Electric potential (V)** — Work done per unit charge to move a positive charge from infinity to that point.
```
V = W/q = kQ/r
```

Unit: Volt (V) = J/C

**Potential difference:**
```
V = W/q     →     W = qV
```

**Relationship between E and V:**
```
E = -ΔV/Δr = V/d  (uniform field)
```

---

### Capacitance

> *"Capacitance is the ability of a component to store electric charge."*

```
C = Q/V
```

Unit: Farad (F)

**Energy stored:**
```
U = ½QV = ½CV² = Q²/2C
```

**Parallel plate capacitor:**
```
C = ε₀A/d
```

**Capacitors in series:**
```
1/C_total = 1/C₁ + 1/C₂ + 1/C₃
```

**Capacitors in parallel:**
```
C_total = C₁ + C₂ + C₃
```

---

## 12. Electric Circuits

### Definitions

**Current (I)** — Rate of flow of electric charge.
```
I = Q/t = ΔQ/Δt
```
Unit: Ampere (A)

**Conventional current** flows from + to −. Electron flow is from − to +.

**Resistance (R)** — Opposition to current flow.
Unit: Ohm (Ω)

**EMF (ε)** — Work done per unit charge by a source (battery) in driving charge around a complete circuit.
Unit: Volt (V)

---

### Ohm's Law

> *"The current through a conductor is directly proportional to the voltage across it, provided temperature remains constant."*

```
V = IR
```

**Ohmic conductor** — Obeys Ohm's Law (constant R). e.g., resistor at constant temperature.  
**Non-ohmic conductor** — R changes with conditions. e.g., light bulb filament, diode.

---

### Resistors

**Series:**
```
R_total = R₁ + R₂ + R₃
I is the same through all components
V_total = V₁ + V₂ + V₃
```

**Parallel:**
```
1/R_total = 1/R₁ + 1/R₂ + 1/R₃
V is the same across all components
I_total = I₁ + I₂ + I₃
```

**Resistivity:**
```
R = ρL/A
```
**ρ** = resistivity (Ω·m), **L** = length, **A** = cross-sectional area.

---

### Power in Circuits

```
P = VI = I²R = V²/R
```

**Energy:**
```
E = Pt = VIt = I²Rt
```

---

### Kirchhoff's Laws

**KCL — Kirchhoff's Current Law (Junction Rule):**
> *"The sum of currents entering a junction equals the sum of currents leaving it."*
```
ΣI_in = ΣI_out
```

**KVL — Kirchhoff's Voltage Law (Loop Rule):**
> *"The sum of all EMFs in a closed loop equals the sum of all potential drops."*
```
ΣV_EMF = ΣIR
```

---

### Internal Resistance

```
ε = V_terminal + Ir
V_terminal = ε - Ir
```
**r** = internal resistance, **I** = current drawn from battery.

Short circuit: R_external → 0, I = ε/r (maximum current).

---

### Alternating Current (AC)

```
V_rms = V_peak / √2
I_rms = I_peak / √2
P_avg = V_rms · I_rms = ½V_peak · I_peak
f = 50 Hz  (South Africa standard)
```

**Transformer:**
```
V_s/V_p = N_s/N_p = I_p/I_s
```
Step-up: N_s > N_p, V_s > V_p.  
Step-down: N_s < N_p, V_s < V_p.

---

## 13. Magnetism & Electromagnetism

### Magnetic Field

**Magnetic flux density (B)** — Strength of a magnetic field. Unit: Tesla (T).

**Field around a straight wire:**
```
B = μ₀I / 2πr
```

**Field inside a solenoid:**
```
B = μ₀nI
```
**n** = number of turns per metre.

**Right-hand rule** — Point thumb in direction of current; fingers curl in direction of B field.

---

### Force on a Current-Carrying Conductor

```
F = BIL·sinθ
```
**L** = length of conductor in field, **θ** = angle between I and B.

**Fleming's Left-Hand Rule** (motor rule):
- Index finger → magnetic field (B)
- Middle finger → conventional current (I)
- Thumb → force/motion (F)

---

### Force on a Moving Charge (Lorentz Force)

```
F = qvB·sinθ
F = q(v × B)   (vector form)
```

**Cyclotron radius** of a charged particle in a B field:
```
r = mv / qB
```

---

### Magnetic Flux

```
Φ = B·A·cosθ
```
Unit: Weber (Wb) = T·m²

---

### Faraday's Law of Electromagnetic Induction

> *"The induced EMF in a circuit is equal to the rate of change of magnetic flux through the circuit."*

```
ε = -ΔΦ/Δt = -N·ΔΦ/Δt   (N = number of turns)
```

---

### Lenz's Law

> *"The direction of the induced current is such that it opposes the change in flux that caused it."*

(Explains the negative sign in Faraday's Law — conservation of energy.)

---

### Generator and Motor

**Generator** — Converts mechanical energy → electrical energy (Faraday's Law).  
**Motor** — Converts electrical energy → mechanical energy (force on current in B field).

**Back-EMF in a motor:**
```
V_applied = ε_back + Ir
```

---

### Self-Inductance

```
ε = -L · dI/dt
```
**L** = inductance. Unit: Henry (H).

**Energy stored in an inductor:**
```
U = ½LI²
```

---

## 14. Modern Physics — Quantum Mechanics

### Photoelectric Effect

> *"When light of sufficient frequency strikes a metal surface, electrons are ejected. The kinetic energy of ejected electrons depends on frequency, not intensity."*

**Einstein's photoelectric equation:**
```
E_photon = hf
KE_max = hf - W
```

**Work function (W)** — Minimum energy needed to eject an electron from a metal surface.

**Threshold frequency (f₀):**
```
f₀ = W/h
hf₀ = W
```

**Stopping potential (V₀):**
```
eV₀ = KE_max = hf - W
```

Key observations:
- Below f₀: no electrons ejected, regardless of intensity
- Above f₀: electrons ejected instantly; more intensity = more electrons but not higher KE
- Higher frequency = higher KE of ejected electrons

---

### Wave-Particle Duality

**de Broglie wavelength** — All matter has an associated wavelength:
```
λ = h/p = h/mv
```

**Photon momentum:**
```
p = h/λ = E/c
```

**Photon energy:**
```
E = hf = hc/λ = pc
```

---

### Heisenberg Uncertainty Principle

> *"It is impossible to simultaneously know the exact position and exact momentum of a particle."*

```
Δx · Δp ≥ ħ/2
ΔE · Δt ≥ ħ/2
```

**ħ = h/2π = 1.055 × 10⁻³⁴ J·s**

---

### Atomic Models

**Bohr Model (hydrogen atom):**

Electron energy levels:
```
E_n = -13.6 / n²   eV
```

**n** = principal quantum number (1, 2, 3, ...)

**Energy of emitted/absorbed photon:**
```
ΔE = E_upper - E_lower = hf
hf = 13.6(1/n_lower² - 1/n_upper²)   eV
```

**Rydberg formula:**
```
1/λ = R_H(1/n₁² - 1/n₂²)
R_H = 1.097 × 10⁷ m⁻¹
```

**Atomic emission spectrum** — Each element emits specific wavelengths of light when excited; used to identify elements.

**Atomic absorption spectrum** — Dark lines where specific wavelengths are absorbed.

---

### Schrödinger's Wave Equation (conceptual)

> Particles are described by wave functions ψ. The square |ψ|² gives the probability density of finding the particle at a given location. Electrons don't orbit in fixed paths — they exist in **orbitals** (probability clouds).

---

### Quantum Numbers

| Quantum Number | Symbol | Values | Describes |
|---|---|---|---|
| Principal | n | 1, 2, 3, ... | Energy level / shell |
| Angular momentum | l | 0 to n-1 | Shape of orbital |
| Magnetic | m_l | -l to +l | Orientation of orbital |
| Spin | m_s | +½, −½ | Electron spin direction |

**Pauli Exclusion Principle** — No two electrons in an atom can have the same set of four quantum numbers.

**Aufbau Principle** — Electrons fill the lowest available energy levels first.

**Hund's Rule** — Electrons occupy separate orbitals (in the same subshell) before pairing up.

---

## 15. Nuclear Physics

### Definitions

**Nucleus** — Dense core of an atom containing protons and neutrons (nucleons).

**Atomic number (Z)** — Number of protons. Defines the element.

**Mass number (A)** — Total number of protons + neutrons.

**Neutron number (N):** N = A - Z

**Nuclide notation:**
```
ᴬ_Z X
```
Example: ²³⁸₉₂U = Uranium-238

**Isotopes** — Atoms of the same element with different numbers of neutrons.

**Nuclear binding energy** — Energy needed to completely separate all nucleons.

**Mass defect (Δm):**
```
Δm = (Z·mₚ + N·mₙ) - m_nucleus
```

**Binding energy:**
```
E_binding = Δm · c²
```

---

### Radioactive Decay

**Alpha (α) decay** — Nucleus emits a helium-4 nucleus (2 protons + 2 neutrons):
```
ᴬ_Z X → ᴬ⁻⁴_{Z-2} Y + ⁴₂He
```
- Penetrating power: low (stopped by paper)
- Ionising power: high

**Beta-minus (β⁻) decay** — Neutron converts to proton, emits electron + antineutrino:
```
ᴬ_Z X → ᴬ_{Z+1} Y + ⁰₋₁e + v̄
```

**Beta-plus (β⁺) decay** — Proton converts to neutron, emits positron + neutrino:
```
ᴬ_Z X → ᴬ_{Z-1} Y + ⁰₊₁e + v
```

**Gamma (γ) decay** — Nucleus releases excess energy as a high-energy photon:
```
ᴬ_Z X* → ᴬ_Z X + γ
```
- Penetrating power: very high (needs thick lead or concrete)
- Ionising power: low

---

### Half-Life

> *"The half-life is the time taken for half of the radioactive nuclei in a sample to decay."*

```
N(t) = N₀ · (½)^(t/T½)
N(t) = N₀ · e^(-λt)
```

**Decay constant (λ):**
```
λ = ln2 / T½ = 0.693 / T½
```

**Activity (A)** — Number of decays per second:
```
A = λN
A(t) = A₀ · e^(-λt)
```
Unit: Becquerel (Bq) = decay/s

---

### Nuclear Fission

> *"A heavy nucleus splits into two lighter nuclei with the release of energy and neutrons."*

Example:
```
²³⁵₉₂U + n → ¹⁴¹₅₆Ba + ⁹²₃₆Kr + 3n + energy
```

**Chain reaction** — Released neutrons trigger further fission events.

Energy released:
```
E = Δm · c²
```

---

### Nuclear Fusion

> *"Two light nuclei combine to form a heavier nucleus, releasing large amounts of energy."*

Example:
```
²₁H + ³₁H → ⁴₂He + n + 17.6 MeV
```

Fusion releases more energy per kg than fission. Powers the Sun.
Requires extremely high temperature and pressure (plasma state).

---

### Einstein's Mass-Energy Equivalence

```
E = mc²
E = Δm · c²
```

1 atomic mass unit (u) = 931.5 MeV/c²

---

## 16. Relativity

### Special Relativity (Einstein, 1905)

**Two postulates:**
1. The laws of physics are the same in all inertial reference frames.
2. The speed of light in vacuum is the same for all observers, regardless of motion.

**Lorentz factor:**
```
γ = 1 / √(1 - v²/c²)
```

**Time dilation** — Moving clocks run slow:
```
Δt = γ · Δt₀
```
**Δt₀** = proper time (in the rest frame of the moving object).

**Length contraction** — Moving objects are shorter in the direction of motion:
```
L = L₀ / γ
```

**Relativistic mass:**
```
m = γm₀
```

**Relativistic momentum:**
```
p = γm₀v
```

**Relativistic energy:**
```
E = γm₀c²
E² = (pc)² + (m₀c²)²
```

**Rest energy:**
```
E₀ = m₀c²
```

---

## 17. Fluid Mechanics

### Definitions

**Density (ρ):**
```
ρ = m/V
```
Unit: kg/m³

**Pressure (P):**
```
P = F/A
```
Unit: Pascal (Pa) = N/m²

---

### Fluid Pressure

**Pressure at depth h:**
```
P = ρgh
```

**Total pressure (with atmospheric):**
```
P_total = P_atm + ρgh
```

**Pascal's Principle** — Pressure applied to an enclosed fluid is transmitted equally in all directions.
```
F₁/A₁ = F₂/A₂
```

**Atmospheric pressure:** P_atm = 101 325 Pa ≈ 1 × 10⁵ Pa

---

### Archimedes' Principle

> *"A body immersed in a fluid experiences a buoyant force equal to the weight of the fluid displaced."*

```
F_buoy = ρ_fluid · V_displaced · g
```

Object floats if F_buoy ≥ W (i.e., ρ_object ≤ ρ_fluid).

---

### Bernoulli's Principle

> *"For a streamline flow of an ideal fluid, the sum of pressure, kinetic energy per unit volume, and potential energy per unit volume is constant."*

```
P + ½ρv² + ρgh = constant
P₁ + ½ρv₁² + ρgh₁ = P₂ + ½ρv₂² + ρgh₂
```

Higher fluid speed → lower pressure.

**Continuity equation** (conservation of mass):
```
A₁v₁ = A₂v₂
```

---

## 18. Rotational Mechanics

### Definitions

**Angular displacement (θ)** — Angle rotated. Unit: radian (rad).

**Angular velocity (ω):**
```
ω = Δθ/Δt = 2πf
```

**Angular acceleration (α):**
```
α = Δω/Δt
```

---

### Rotational Equations of Motion

```
ω = ω₀ + αt
θ = ω₀t + ½αt²
ω² = ω₀² + 2αθ
```

---

### Torque

> *"The turning effect of a force about an axis."*

```
τ = r × F = rF·sinθ
```

Unit: N·m

**Equilibrium condition:**
```
Στ = 0   AND   ΣF = 0
```

**Principle of moments:**
```
Sum of clockwise moments = Sum of anticlockwise moments
```

---

### Moment of Inertia (I)

> The rotational equivalent of mass.

```
I = Σmr²
```

Common shapes:
- Solid sphere: I = (2/5)mr²
- Hollow sphere: I = (2/3)mr²
- Solid cylinder: I = ½mr²
- Thin ring: I = mr²
- Rod about centre: I = (1/12)mL²
- Rod about end: I = (1/3)mL²

---

### Rotational Newton's Second Law

```
τ_net = Iα
```

**Angular momentum (L):**
```
L = Iω = mvr
```

**Conservation of angular momentum:**
```
L_initial = L_final   (if no external torque)
I₁ω₁ = I₂ω₂
```

**Rotational kinetic energy:**
```
KE_rot = ½Iω²
```

**Rolling (no slip):**
```
v = rω
KE_total = ½mv² + ½Iω²
```

---

## 19. SI Units & Prefixes

### Base SI Units

| Quantity | Unit | Symbol |
|---|---|---|
| Length | metre | m |
| Mass | kilogram | kg |
| Time | second | s |
| Electric current | ampere | A |
| Temperature | kelvin | K |
| Amount of substance | mole | mol |
| Luminous intensity | candela | cd |

### Derived Units

| Quantity | Unit | Symbol | In base units |
|---|---|---|---|
| Force | newton | N | kg·m/s² |
| Energy / Work | joule | J | kg·m²/s² |
| Power | watt | W | kg·m²/s³ |
| Pressure | pascal | Pa | kg/m·s² |
| Electric charge | coulomb | C | A·s |
| Voltage | volt | V | kg·m²/A·s³ |
| Resistance | ohm | Ω | kg·m²/A²·s³ |
| Capacitance | farad | F | A²·s⁴/kg·m² |
| Magnetic flux | weber | Wb | kg·m²/A·s² |
| Magnetic flux density | tesla | T | kg/A·s² |
| Inductance | henry | H | kg·m²/A²·s² |
| Frequency | hertz | Hz | s⁻¹ |
| Activity | becquerel | Bq | s⁻¹ |

### SI Prefixes

| Prefix | Symbol | Factor |
|---|---|---|
| tera | T | 10¹² |
| giga | G | 10⁹ |
| mega | M | 10⁶ |
| kilo | k | 10³ |
| hecto | h | 10² |
| deca | da | 10¹ |
| deci | d | 10⁻¹ |
| centi | c | 10⁻² |
| milli | m | 10⁻³ |
| micro | μ | 10⁻⁶ |
| nano | n | 10⁻⁹ |
| pico | p | 10⁻¹² |
| femto | f | 10⁻¹⁵ |

---

## 20. Greek Letters Used in Physics

| Letter | Name | Common use |
|---|---|---|
| α | alpha | Angular acceleration, fine structure constant, alpha particle |
| β | beta | Beta particle, velocity ratio v/c |
| γ | gamma | Lorentz factor, gamma ray, heat capacity ratio |
| δ, Δ | delta | Small change, finite change |
| ε | epsilon | EMF, permittivity, strain |
| η | eta | Efficiency |
| θ | theta | Angle |
| λ | lambda | Wavelength, decay constant |
| μ | mu | Coefficient of friction, permeability, micro- prefix |
| ν | nu | Frequency (optics) |
| π | pi | 3.14159... |
| ρ | rho | Density, resistivity |
| σ | sigma | Stefan-Boltzmann constant, stress |
| τ | tau | Torque, time constant |
| φ, Φ | phi | Magnetic flux, phase angle, work function |
| ω | omega | Angular velocity |
| Ω | Omega | Ohm (resistance unit) |

---

*Last updated: 2026 | Vector AI Physics Reference*  
*Covers CAPS Grades 10–12 · Classical Mechanics · Modern Physics · Quantum · Nuclear*

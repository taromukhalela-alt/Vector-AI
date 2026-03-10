"""
physics_engine.py

Physics simulation, dataset generation, ML learner, and explanation engine
for the Vector AI Science Expo project.

This module exposes three main objects:
- simulator: functions to run ground-truth physics simulations
- learner: a simple, interpretable ML learner (scikit-learn Ridge) to predict
  x/y positions from features and time
- explainer: rules for producing a human-readable explanation comparing
  physics and ML results

The code is intentionally well-documented and beginner-friendly.
"""

from dataclasses import dataclass
import numpy as np
import joblib
import os
import torch
import warnings
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

# Try to import sympy for symbolic derivations; optional
try:
    import sympy as sp
except Exception:
    sp = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)


# -------------------------------
# Simulator (ground-truth physics)
# -------------------------------

class Simulator:
    """Simple 2D projectile simulator with optional linear drag.

    The simulator uses a small time step numerical integrator (explicit Euler)
    to provide a flexible, readable implementation. It supports linear drag
    F_drag = -c * v where `drag` parameter is the coefficient c.
    """

    def __init__(self, g=9.8):
        self.g = g

    def simulate_projectile(self, v0=50.0, angle=45.0, mass=1.0, drag=0.0,
                            dt=0.01, max_time=20.0, g=None, scale_height=None):
        """Simulate projectile motion until it hits the ground (y <= 0).

        Parameters
        - v0: initial speed (m/s)
        - angle: launch angle in degrees
        - mass: mass in kg
        - drag: linear drag coefficient (N·s/m)
        - dt: timestep for integration
        - max_time: safety cutoff

        Returns
        A dict with numpy arrays: t, x, y, vx, vy
        """
        theta = np.deg2rad(angle)
        vx = v0 * np.cos(theta)
        vy = v0 * np.sin(theta)

        x = 0.0
        y = 0.0

        t = 0.0
        ts = []
        xs = []
        ys = []
        vxs = []
        vys = []

        _ = scale_height
        gravity = self.g if g is None else g
        while t <= max_time and y >= 0 - 1e-6:
            ts.append(t)
            xs.append(x)
            ys.append(y)
            vxs.append(vx)
            vys.append(vy)

            # Compute accelerations
            # Linear drag: a_drag = -(drag / m) * v
            ax = - (drag / mass) * vx
            ay = -gravity - (drag / mass) * vy

            # Euler integration
            vx = vx + ax * dt
            vy = vy + ay * dt
            x = x + vx * dt
            y = y + vy * dt
            t += dt

            # Safety: if speed is NaN or exploding, break
            if not np.isfinite(x) or not np.isfinite(y):
                break

        res = {
            "t": np.array(ts),
            "x": np.array(xs),
            "y": np.array(ys),
            "vx": np.array(vxs),
            "vy": np.array(vys)
        }
        return res


# -------------------------------
# Dataset generation & Learner
# -------------------------------

def generate_dataset(n_samples=500, t_samples=50, random_state=42):
    """Generates a dataset of (features -> x,y) by sampling projectile params.

    Features: [t, v0, angle_rad, mass, drag]
    Targets: x, y

    Returns: X array (N, 5), yx (N,), yy (N,)
    """
    rng = np.random.RandomState(random_state)

    # Parameter ranges chosen to be realistic and diverse
    v0s = rng.uniform(5, 100, size=n_samples)
    angles = rng.uniform(10, 80, size=n_samples)  # degrees
    masses = rng.uniform(0.1, 10.0, size=n_samples)
    drags = rng.uniform(0.0, 0.5, size=n_samples)

    sim = Simulator()

    X_list = []
    yx_list = []
    yy_list = []

    for v0, angle, mass, drag in zip(v0s, angles, masses, drags):
        sim_res = sim.simulate_projectile(v0=v0, angle=angle, mass=mass, drag=drag,
                                          dt=0.02, max_time=15.0)
        
        if len(sim_res["t"]) < 2:
            continue

        # Sample t grid (uniformly) up to the duration
        ts = np.linspace(0, sim_res["t"][-1], t_samples)

        # Interpolate x,y at these timestamps
        xs = np.interp(ts, sim_res["t"], sim_res["x"])
        ys = np.interp(ts, sim_res["t"], sim_res["y"])

        for t_val, x_val, y_val in zip(ts, xs, ys):
            X_list.append([t_val, v0, np.deg2rad(angle), mass, drag])
            yx_list.append(x_val)
            yy_list.append(y_val)

    X = np.array(X_list)
    yx = np.array(yx_list)
    yy = np.array(yy_list)
    return X, yx, yy


@dataclass
class TrainResult:
    metrics: dict
    model_paths: dict


class Learner:
    """Interpretable ML learner using Ridge regression to predict x(t) and y(t).

    The learner is intentionally simple and explainable. It exposes
    train(), predict_trajectory(), and supports persisting models to disk.
    """
    def __init__(self):
        self.is_trained = False
        self.model_x = None
        self.model_y = None
        self.last_metrics = {}
        self.model_x_path = os.path.join(MODEL_DIR, "ridge_x.joblib")
        self.model_y_path = os.path.join(MODEL_DIR, "ridge_y.joblib")

    def train(self, n_samples=800, t_samples=40):
        """Generate dataset and train Ridge regressors. Returns metrics summary."""
        X, yx, yy = generate_dataset(n_samples=n_samples, t_samples=t_samples)

        # Shuffle and split train/test (80/20)
        idx = np.arange(len(X))
        np.random.shuffle(idx)
        split = int(0.8 * len(idx))
        train_idx, test_idx = idx[:split], idx[split:]

        X_train, X_test = X[train_idx], X[test_idx]
        yx_train, yx_test = yx[train_idx], yx[test_idx]
        yy_train, yy_test = yy[train_idx], yy[test_idx]

        # Use a pipeline with StandardScaler and Ridge for interpretability
        self.model_x = make_pipeline(StandardScaler(), Ridge(alpha=1.0))
        self.model_y = make_pipeline(StandardScaler(), Ridge(alpha=1.0))

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.model_x.fit(X_train, yx_train)
            self.model_y.fit(X_train, yy_train)

        # Evaluate on test set
        yx_pred = self.model_x.predict(X_test)
        yy_pred = self.model_y.predict(X_test)

        metrics = {
            "x_mse": float(mean_squared_error(yx_test, yx_pred)),
            "y_mse": float(mean_squared_error(yy_test, yy_pred)),
            "x_rmse": float(np.sqrt(mean_squared_error(yx_test, yx_pred))),
            "y_rmse": float(np.sqrt(mean_squared_error(yy_test, yy_pred))),
            "x_r2": float(r2_score(yx_test, yx_pred)),
            "y_r2": float(r2_score(yy_test, yy_pred)),
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test))
        }

        self.last_metrics = metrics
        self.is_trained = True

        # Persist models
        joblib.dump(self.model_x, self.model_x_path)
        joblib.dump(self.model_y, self.model_y_path)

        # Return simple, JSON-serializable metrics dict for the API
        return metrics

    def load(self):
        """Load models from disk if available."""
        if os.path.exists(self.model_x_path) and os.path.exists(self.model_y_path):
            self.model_x = joblib.load(self.model_x_path)
            self.model_y = joblib.load(self.model_y_path)
            self.is_trained = True
            return True
        return False

    def predict_trajectory(self, v0, angle, mass, drag, t_array):
        """Predict x,y positions for given parameters and timestamps t_array.

        t_array: numpy array
        Returns: dict {"t": t_array, "x": x_pred, "y": y_pred}
        """
        if not self.is_trained:
            raise RuntimeError("Learner is not trained yet")

        X_pred = np.column_stack((t_array, np.full_like(t_array, v0),
                                  np.full_like(t_array, np.deg2rad(angle)),
                                  np.full_like(t_array, mass),
                                  np.full_like(t_array, drag)))
        x_pred = self.model_x.predict(X_pred)
        y_pred = self.model_y.predict(X_pred)
        return {"t": t_array, "x": np.array(x_pred), "y": np.array(y_pred)}


# -------------------------------
# Explainer
# -------------------------------

class Explainer:
    """Produce human-readable explanations comparing physics vs ML predictions."""

    def __init__(self, simulator):
        self.simulator = simulator

    def explain_simulation(self, params, metrics, error_margin):
        """Return both a plain-English explanation and optional symbolic derivation.

        Returns a dict:
          { "text": <str>, "symbolic": [<str>, ...] }
        """
        parts = []
        symbolic_steps = []
        parts.append("Simulation Explanation:")

        params = params or {}
        v0 = params.get("v0")
        angle = params.get("angle")
        mass = params.get("mass")
        drag = params.get("drag")

        parts.append(f"We launched a projectile at v0={v0} m/s, angle={angle}°, mass={mass} kg, drag={drag}.")

        # Add analytic solution snippet if sympy available and drag is negligible
        if sp is not None and (not params or float(params.get('drag', 0.0)) == 0.0):
            try:
                # Define symbols and expressions
                t = sp.symbols('t', real=True)
                v0s, thetas, g = sp.symbols('v0 thetas g', positive=True)
                x_expr = sp.simplify(v0s * sp.cos(thetas) * t)
                y_expr = sp.simplify(v0s * sp.sin(thetas) * t - sp.Rational(1, 2) * g * t**2)

                parts.append("Analytic (no-drag) derivation and results:")
                parts.append("Step 1: Define position functions.")
                parts.append(f"  x(t) = {sp.pretty(x_expr)}")
                parts.append(f"  y(t) = {sp.pretty(y_expr)}")

                symbolic_steps.append({
                    "step": "define",
                    "expr": {
                        "x(t)": str(x_expr),
                        "y(t)": str(y_expr)
                    }
                })

                # Time of flight: solve y(t)=0 for t>0
                sols = sp.solve(sp.Eq(y_expr, 0), t)
                # select positive non-zero root
                t_flight_expr = None
                for s in sols:
                    try:
                        if s != 0:
                            t_flight_expr = sp.simplify(s)
                            break
                    except Exception:
                        continue

                if t_flight_expr is not None:
                    parts.append("Step 2: Solve y(t)=0 for time of flight (t>0).")
                    parts.append(f"  t_flight (symbolic) = {sp.pretty(t_flight_expr)}")
                    symbolic_steps.append({"step": "t_flight", "expr": str(t_flight_expr)})

                    # Range = x(t_flight)
                    range_expr = sp.simplify(x_expr.subs(t, t_flight_expr))
                    parts.append("Step 3: Horizontal range (substitute t_flight into x(t)).")
                    parts.append(f"  Range (symbolic) = {sp.pretty(range_expr)}")
                    symbolic_steps.append({"step": "range", "expr": str(range_expr)})

                    # Max height: dy/dt = 0
                    t_peak = sp.simplify(sp.solve(sp.Eq(sp.diff(y_expr, t), 0), t)[0])
                    h_max_expr = sp.simplify(y_expr.subs(t, t_peak))
                    parts.append("Step 4: Time to peak and max height.")
                    parts.append(f"  t_peak (symbolic) = {sp.pretty(t_peak)}")
                    parts.append(f"  h_max (symbolic) = {sp.pretty(h_max_expr)}")
                    symbolic_steps.append({"step": "t_peak", "expr": str(t_peak)})
                    symbolic_steps.append({"step": "h_max", "expr": str(h_max_expr)})

                    # Numeric evaluations using provided params
                    subs_map = {v0s: float(v0), thetas: float(np.deg2rad(angle)), g: float(self.simulator.g)}
                    try:
                        t_flight_val = float(sp.N(t_flight_expr.subs(subs_map)))
                        range_val = float(sp.N(range_expr.subs(subs_map)))
                        t_peak_val = float(sp.N(t_peak.subs(subs_map)))
                        h_max_val = float(sp.N(h_max_expr.subs(subs_map)))

                        parts.append("Step 5: Numeric evaluation for given parameters:")
                        parts.append(f"  Time of flight ≈ {t_flight_val:.3f} s")
                        parts.append(f"  Range ≈ {range_val:.3f} m")
                        parts.append(f"  Time to peak ≈ {t_peak_val:.3f} s")
                        parts.append(f"  Max height ≈ {h_max_val:.3f} m")

                        symbolic_steps.append({"step": "numeric", "values": {
                            "t_flight": t_flight_val,
                            "range": range_val,
                            "t_peak": t_peak_val,
                            "h_max": h_max_val
                        }})
                    except Exception as e:
                        parts.append(f"  (Numeric evaluation failed: {e})")
                else:
                    parts.append("Could not symbolically determine time-of-flight (unexpected root set).")
            except Exception as e:
                parts.append(f"(Sympy derivation failed: {e})")
        else:
            if sp is None:
                parts.append("(Analytic formulas omitted: sympy not available.)")
            else:
                parts.append("(Analytic closed-form omitted due to non-zero drag — numeric simulation used instead.)")

        # Describe ML behavior
        if metrics:
            parts.append("Machine learning performance on held-out test data:")
            x_rmse = metrics.get("x_rmse")
            y_rmse = metrics.get("y_rmse")
            if x_rmse is not None and y_rmse is not None:
                rmse = float(np.mean([x_rmse, y_rmse]))
            else:
                rmse = metrics.get("rmse", metrics.get("val_loss", 0))
            parts.append(f"- Overall RMSE: {rmse:.3f}")
            parts.append("- Model: Ridge regression with standardization")

            # Offer interpretability hints
            if metrics.get('y_rmse', 0) > 5.0:
                parts.append("The ML model shows larger error in vertical predictions, which can happen because vertical motion is strongly nonlinear (gravity causes quadratic t² terms). Simple linear models can underfit this curvature.")
            else:
                parts.append("The ML model captures the trajectory shape decently within the training range.")

        # Discuss observed error for this simulation
        parts.append(f"For this specific run, the average pointwise error between physics and ML was about {error_margin:.3f} meters.")

        # Practical note on when ML fails
        parts.append("Why differences can occur: the ML model learns from a finite dataset and may not extrapolate well to extreme speeds/angles or unseen drag regimes. Physics-based simulators preserve conservation laws that purely data-driven models do not enforce.")

        # Ethical / pedagogical note
        parts.append("Tip: Use ML to accelerate approximate predictions or to interpolate between known cases, but validate against physics for high-stakes or extrapolative scenarios.")

        return "\n".join(parts)


# Instantiate module-level objects to match app expectations
simulator = Simulator()
learner = Learner()
explainer = Explainer(simulator)

# Attempt to load pre-trained models quietly
try:
    if not learner.load():
        print("Physics models not found. Training now...")
        learner.train()
except Exception as e:
    print(f"Physics engine initialization warning: {e}")
    learner.train()
except Exception as e:
    print(f"Physics engine initialization warning: {e}")

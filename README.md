# Vector AI — Physics Intelligence Platform

A Flask-based educational platform demonstrating how machine learning can assist
in understanding and predicting physics, intended for science expos and teaching.

Features
- Deterministic physics simulator for projectile motion (with linear drag).
- Interpretable ML learner (Ridge regression) trained on simulated data to
  predict positions over time.
- Dashboard with interactive sliders, animation of true vs ML trajectory, and
  textual explanations comparing the two approaches.
- Cleanly separated modules: `physics_engine` (simulator, dataset, learner,
  explainer), intent classification (`ml_train.py`), and the Flask app (`app.py`).

Getting started
1. Create a virtual environment and install dependencies:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install sympy matplotlib
```

2. Run the app:

```bash
set FLASK_APP=app.py
python app.py
```

3. Open your browser at http://localhost:5000
Notes for judges and teachers
- The ML model is intentionally simple (Ridge) for interpretability. It shows
  how a data-driven model can approximate physical behavior but is not a
  substitute for first-principles physics.
- The `explainer` provides human-readable reasoning about model error and
  encourages critical validation.

Limitations & future work
- Extend the simulator to support quadratic drag and wind fields.
- Add uncertainty estimates (prediction intervals) to ML outputs.
- Replace simple regressors with small physics-aware neural nets for complex systems.

License
MIT

import physics_engine
import math


def test_explainer_symbolic_numeric():
    expl = physics_engine.explainer
    params = {"v0": 50.0, "angle": 45.0, "mass": 1.0, "drag": 0.0}
    res = expl.explain_simulation(params, physics_engine.learner.last_metrics if hasattr(physics_engine.learner, 'last_metrics') else None, 0.0)

    # The explainer should return a dict with text and symbolic when sympy is available
    assert isinstance(res, dict)
    assert 'text' in res
    # If sympy is available, numeric values should exist and be positive
    if res.get('symbolic'):
        nums = [s.get('values') for s in res['symbolic'] if isinstance(s, dict) and s.get('values')]
        if nums:
            values = nums[0]
            assert values['t_flight'] > 0
            assert values['range'] > 0
            assert values['h_max'] > 0

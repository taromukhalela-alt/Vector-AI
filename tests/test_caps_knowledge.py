import caps_knowledge


def test_force_calculation():
    answer = caps_knowledge.answer_caps_question(
        "Calculate force if mass is 5 kg and acceleration is 3 m/s^2",
        predicted_intent="forces",
    )
    assert answer is not None
    assert answer["kind"] == "calculation"
    assert "15" in answer["response"]


def test_formula_lookup():
    answer = caps_knowledge.answer_caps_question(
        "What is the formula for kinetic energy?",
        predicted_intent="energy",
    )
    assert answer is not None
    assert answer["kind"] == "formula"
    assert "0.5 m v^2" in answer["response"]


def test_training_corpus_contains_caps_topics():
    texts, labels = caps_knowledge.build_training_corpus()
    assert len(texts) == len(labels)
    assert "electricity" in labels
    assert "kinematics" in labels


def test_formula_symbol_definition_does_not_crash():
    answer = caps_knowledge.answer_caps_question(
        "What is i in refraction?",
        predicted_intent="optics",
    )
    assert answer is not None
    assert answer["kind"] == "definition"
    assert "angle of incidence" in answer["response"].lower()

from __future__ import annotations

import os
from typing import Dict, Tuple

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.preprocessing import LabelEncoder

from caps_knowledge import build_training_corpus, normalize_text


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "intent_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")
CONFIG_PATH = os.path.join(BASE_DIR, "model_config.pkl")


def _build_pipeline() -> Pipeline:
    features = FeatureUnion(
        [
            (
                "word_ngrams",
                TfidfVectorizer(
                    preprocessor=normalize_text,
                    ngram_range=(1, 2),
                    min_df=1,
                    sublinear_tf=True,
                ),
            ),
            (
                "char_ngrams",
                TfidfVectorizer(
                    preprocessor=normalize_text,
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    min_df=1,
                    sublinear_tf=True,
                ),
            ),
        ]
    )
    classifier = SGDClassifier(
        loss="log_loss",
        penalty="l2",
        alpha=1e-5,
        max_iter=2500,
        tol=1e-3,
        class_weight="balanced",
        random_state=42,
    )
    return Pipeline([("features", features), ("classifier", classifier)])


def _build_label_encoder(labels) -> LabelEncoder:
    encoder = LabelEncoder()
    encoder.fit(labels)
    return encoder


def train_model() -> Dict[str, float]:
    texts, labels = build_training_corpus()
    X_train, X_test, y_train, y_test = train_test_split(
        texts,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=labels,
    )

    pipeline = _build_pipeline()
    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    encoder = _build_label_encoder(labels)

    joblib.dump(pipeline, MODEL_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    joblib.dump(
        {
            "model_type": "tfidf_sgd_classifier",
            "training_examples": len(texts),
            "labels": list(encoder.classes_),
            "accuracy": float(accuracy),
        },
        CONFIG_PATH,
    )

    metrics = {
        "accuracy": float(accuracy),
        "training_examples": float(len(texts)),
        "label_count": float(len(encoder.classes_)),
    }
    print(
        "Intent model trained. "
        f"Accuracy={accuracy:.3f}, examples={len(texts)}, labels={len(encoder.classes_)}"
    )
    return metrics


def load_model_artifacts() -> Tuple[Pipeline, LabelEncoder, Dict]:
    pipeline = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    config = joblib.load(CONFIG_PATH)
    return pipeline, encoder, config


if __name__ == "__main__":
    train_model()

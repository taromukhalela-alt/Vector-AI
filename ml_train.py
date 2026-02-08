
import sympy
import matplotlib
import pytest
import sklearn
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import LabelEncoder
import joblib
import pandas as pd
import os
import logging
import re
from collections import Counter
import numpy as np
try:
    from google import genai
except ImportError:
    genai = None

def get_physics_corpus():
    """
    Returns a structured corpus of physics constants, equations, and facts
    for training or reference within the AI model.
    """
    return {
        "constants": {
            "c": "2.99792458×10⁸ m·s⁻¹",
            "G": "6.67430×10⁻¹¹ m³·kg⁻¹·s⁻²",
            "h": "6.62607015×10⁻³⁴ J·s",
            "hbar": "h / 2π",
            "k_B": "1.380649×10⁻²³ J·K⁻¹",
            "e": "1.602176634×10⁻¹⁹ C",
            "epsilon_0": "8.8541878128×10⁻¹² F·m⁻¹",
            "mu_0": "4π×10⁻⁷ N·A⁻²"
        },
        "equations": [
            {"domain": "kinematics", "eq": ["v = dx/dt", "a = dv/dt", "x = x₀ + v₀t + ½at²", "v = v₀ + at", "v² = v₀² + 2a(x − x₀)"]},
            {"domain": "dynamics", "eq": ["F = ma", "p = mv", "J = Δp", "ΣF = dp/dt"]},
            {"domain": "forces", "eq": ["F_grav = Gm₁m₂ / r²", "F_spring = −kx", "F_friction = μN", "F_drag ∝ v", "F_drag ∝ v²"]},
            {"domain": "work_energy", "eq": ["W = ∫F·dr", "K = ½mv²", "U_grav = mgh", "U_spring = ½kx²", "E_total = K + U", "ΔE = 0"]},
            {"domain": "momentum", "eq": ["p = mv", "Σp_initial = Σp_final"]}
        ]
    }

class IntentModel(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, output_dim, n_layers=2):
        super(IntentModel, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        # Bidirectional=True allows the model to look at context from both directions
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=n_layers, 
                            batch_first=True, dropout=0.2, bidirectional=True)
        # Output of bidirectional LSTM is hidden_dim * 2
        self.fc = nn.Linear(hidden_dim * 2, output_dim)
        
    def forward(self, text):
        # text: [batch_size, seq_len]
        embedded = self.embedding(text) # [batch_size, seq_len, embed_dim]
        # LSTM output
        _, (hidden, _) = self.lstm(embedded)
        
        # Concatenate the final forward and backward hidden states
        # hidden[-2] is the last forward layer, hidden[-1] is the last backward layer
        hidden_forward = hidden[-2]
        hidden_backward = hidden[-1]
        x = torch.cat((hidden_forward, hidden_backward), dim=1)
        
        x = self.fc(x)
        return x

class SimpleTokenizer:
    def __init__(self, max_words=2000):
        self.word2idx = {"<PAD>": 0, "<UNK>": 1}
        self.idx2word = {0: "<PAD>", 1: "<UNK>"}
        self.max_words = max_words
        
    def fit(self, texts):
        all_words = []
        for text in texts:
            words = re.findall(r'\w+', text.lower())
            all_words.extend(words)
        counts = Counter(all_words)
        for word, _ in counts.most_common(self.max_words - 2):
            self.word2idx[word] = len(self.word2idx)
            
    def texts_to_sequences(self, texts, max_len=20):
        seqs = []
        for text in texts:
            words = re.findall(r'\w+', text.lower())
            seq = [self.word2idx.get(w, 1) for w in words]
            if len(seq) < max_len:
                seq += [0] * (max_len - len(seq))
            else:
                seq = seq[:max_len]
            seqs.append(seq)
        return np.array(seqs)

def augment_data(texts, labels, api_key):
    """
    Uses GenAI to generate synthetic variations of the training data
    to improve model robustness.
    """
    if not genai or not api_key:
        return texts, labels
    
    print("Augmenting data with GenAI (this may take a moment)...")
    client = genai.Client(api_key=api_key)
    # Example: Generate one variation for the last added item to keep it fast
    # In a real scenario, you would loop through more data.
    # This is a placeholder for the integration capability.
    return texts, labels

def train_model():
    # Define training data
    data = {
        "text": [
            "What is AI?", "Tell me about artificial intelligence", "Explain machine learning",
            "What is physics?", "How does gravity work?", "Explain energy",
            "I want to learn Python", "How do I code in Python?", "Python programming",
            "What are the current trends?", "Tell me what is trending", "Analyze trends",
            "Tell me a joke", "Make me laugh", "Do you know any jokes?", "Funny story",
            "Hello", "Hi", "Hey", "Good morning", "Greetings",
            "What can you do?", "Help", "Features", "What are your skills?"
        ],
        "label": [
            "ai", "ai", "ai",
            "physics", "physics", "physics",
            "python", "python", "python",
            "trends", "trends", "trends",
            "jokes", "jokes", "jokes", "jokes",
            "greeting", "greeting", "greeting", "greeting", "greeting",
            "capabilities", "capabilities", "capabilities", "capabilities"
        ]
    }

    # Add physics training examples to the lists
    physics_texts = [
        "What is the speed of light?", "Explain Newton's laws", "What is thermodynamics?",
        "Tell me about quantum mechanics", "How does electromagnetism work?", "What is relativity?",
        "What is friction?", "Explain inertia", "Define thermodynamics", "What is quantum physics?"
    ]
    
    # Incorporate formulas and word problem styles
    corpus = get_physics_corpus()
    for group in corpus["equations"]:
        physics_texts.extend(group["eq"])
    
    physics_texts.extend([
        "Calculate the velocity", "Find the force", "Solve for acceleration",
        "How much energy is required?", "Determine the mass", "Physics word problem",
        "A car accelerates at 5 m/s^2", "Calculate the gravitational force between two planets",
        "What is the kinetic energy of a moving object?", "Solve this kinematics problem",
        "Calculate force given mass 10kg and acceleration 5m/s^2",
        "Find velocity if distance is 100m and time is 10s",
        "What is the kinetic energy of a 50kg object moving at 10m/s?",
        "Calculate the momentum of a 10kg object moving at 5m/s",
        "Find the work done by a 20N force over 5 meters",
        "Calculate potential energy of 10kg mass at 5m height",
        "Find power if work is 100J and time is 5s",
        "Calculate voltage if current is 2A and resistance is 5 ohms"
    ])
    
    data["text"].extend(physics_texts)
    data["label"].extend(["physics"] * len(physics_texts))

    # Optional: Augment data if enabled via env var (to avoid slow startup)
    if os.getenv("ENABLE_GENAI_TRAINING") == "true":
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            data["text"], data["label"] = augment_data(data["text"], data["label"], api_key)

    df = pd.DataFrame(data)

    # 1. Encode Labels
    le = LabelEncoder()
    y = le.fit_transform(df["label"])
    num_classes = len(le.classes_)

    # 2. Tokenize
    tokenizer = SimpleTokenizer(max_words=2000)
    tokenizer.fit(df["text"].values)
    X = tokenizer.texts_to_sequences(df["text"].values)
    
    X_tensor = torch.tensor(X, dtype=torch.long)
    y_tensor = torch.tensor(y, dtype=torch.long)

    # 3. Build PyTorch Model
    vocab_size = len(tokenizer.word2idx)
    embed_dim = 128
    hidden_dim = 128
    model = IntentModel(vocab_size, embed_dim, hidden_dim, num_classes)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    
    # Training Loop
    model.train()
    for epoch in range(60):
        optimizer.zero_grad()
        outputs = model(X_tensor)
        loss = criterion(outputs, y_tensor)
        loss.backward()
        optimizer.step()

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    torch.save(model.state_dict(), os.path.join(BASE_DIR, "intent_model.pth"))
    joblib.dump(le, os.path.join(BASE_DIR, "label_encoder.pkl"))
    joblib.dump(tokenizer, os.path.join(BASE_DIR, "tokenizer.pkl"))
    joblib.dump({
        "vocab_size": vocab_size, 
        "num_classes": num_classes,
        "embed_dim": embed_dim,
        "hidden_dim": hidden_dim
    }, os.path.join(BASE_DIR, "model_config.pkl"))
    print(f"PyTorch Model trained and saved.")

if __name__ == "__main__":
    train_model()
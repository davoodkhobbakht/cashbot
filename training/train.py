import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import hashlib

# Load rounds.json
with open("rounds.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Helper: convert md5 to int
def md5_to_int(md5):
    try:
        return int(md5[:8], 16) / 0xffffffff  # normalize to [0,1]
    except:
        return 0.0

# Prepare features and labels
X = []
y = []

for round in data:
    try:
        md5_val = md5_to_int(round["md5"])
        hash_busted = float(round["hashBusted"])
        # Optional: normalize timestamp (not really useful but added for experiment)
        start_time = round["startTime"] / 1e13  # shrink to ~0.x

        busted = float(round["busted"])

        # Input vector: [md5_normalized, hash_busted, start_time]
        X.append([md5_val, hash_busted, start_time])
        y.append(busted)
    except Exception as e:
        print(f"⚠️ Skipped a row due to error: {e}")
        continue

X = np.array(X)
y = np.array(y)

# Build model
model = keras.Sequential([
    layers.Input(shape=(3,)),
    layers.Dense(16, activation="relu"),
    layers.Dense(8, activation="relu"),
    layers.Dense(1)
])

model.compile(optimizer="adam", loss="mean_squared_error")

# Train
model.fit(X, y, epochs=30, batch_size=8)

# Save in Keras format
model.save("crash_predictor.keras")

print("✅ Model trained and saved as crash")

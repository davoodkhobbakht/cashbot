# 🎰 Crash Predictor Extension (Educational Project)

This Chrome extension is a **machine learning experiment** focused on analyzing and predicting crash multipliers in crash gambling games. The goal is to explore how deterministic hash values (like MD5) and observable data patterns can be used to **learn and estimate crash outcomes** — all for **educational and research purposes only**.

---

## 🚀 What It Does

- Captures WebSocket game data (e.g. bust value, players, md5 hash)
- Extracts features like average bet, update patterns, and calculated hash-based multipliers
- Stores data locally in IndexedDB
- Trains a TensorFlow.js model using this data
- Predicts the next round's crash multiplier based on prior inputs

---

## 🧠 Machine Learning Details

- Inputs:
  - `md5` (hash shown before each round)
  - `startTime` (round timestamp)
  - `hashBusted` (custom-calculated value from server hash)
- Label:
  - Actual `busted` multiplier

Model is trained offline using Python/Keras, exported to TensorFlow.js, and loaded into the extension for real-time predictions.

---

## 📁 Project Structure

/extention/ ├── content.js # Main script, injects code and handles game logic ├── injected.js # Page-level code to run TensorFlow ├── model/ # Trained ML model in TensorFlow.js format ├── tf.min.js # Local TensorFlow.js library ├── train.py # Python training script ├── manifest.json # Chrome extension manifest └── offscreen.html # Optional background inference


---

## ⚠️ Disclaimer

This project **does not encourage gambling**, cheating, or exploiting game systems. It is created for:

- Practicing data extraction from live environments
- Exploring ML applications in browser extensions
- Learning Chrome extension architecture and CSP limitations

**Please do not use this in any unauthorized or unethical way.**

---

## ✅ Status

- ✅ Data logging and feature extraction
- ✅ IndexedDB working and clean
- ✅ Offline TensorFlow model integration
- ❌ WebAssembly or GPU acceleration (optional)
- ⚠️ Real-time prediction in the browser context may still face CSP-related limitations (see issues)

---

## 📚 Want to Learn More?

Inspired by [TensorFlow.js in Chrome Extensions](https://www.tensorflow.org/js/tutorials/deployment/web_ml_in_chrome) and the challenge of working within CSP constraints.

---

## 📌 Author

Made with ❤️ by a curious developer learning AI in the browser.

---


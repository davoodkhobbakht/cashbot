// ✅ content.js
console.log("✅ content.js loaded");

  
// Inject injected.js (که خودش tf.min.js رو بارگذاری می‌کنه)
const injected = document.createElement('script');
injected.src = chrome.runtime.getURL('injected.js');
injected.onload = function () {
  this.remove();
    
};
(document.head || document.documentElement).appendChild(injected);

let model;

async function loadModel() {
  model = await tf.loadLayersModel(chrome.runtime.getURL("model/model.json"));
  console.log("✅ Model loaded!");
}

loadModel();




let tf;
const isTFReady = false;
const tfScript = document.createElement('script');
 tfScript.src = chrome.runtime.getURL('tf.min.js');   
 tfScript.onload = () => {
    console.log("✅ TensorFlow.js is loaded" );
    tf = window.tf;
    // چک کن واقعا آماده است؟
  const checkTF = setInterval(() => {
    if (tf && tf.tensor2d) {
      clearInterval(checkTF);
      isTFReady = true;
      console.log("🚀 tf is fully ready!");
      if (pendingFeatures) {
        console.log("🚀 اجرای صف پیش‌بینی بعد از آماده‌شدن tf...");
        predictNextCrash(pendingFeatures);
      }
    }
  }, 100);

  };

  (document.head || document.documentElement).appendChild(tfScript);

 


let currentRound = {
  updates: [],
  players: [],
  busted: null,
  hash: null,
  md5: null,
  startTime: Date.now()
};

window.addEventListener('message', function (event) {
  if (event.source !== window) return;

  if (event.data.type === 'TF_READY') {
    console.log("✅ TensorFlow.js is ready to use!");
    isTFReady = true;
  }

  if (event.data.type === 'FROM_GAME_WS') {
    const data = event.data.data;
    console.log("📩 WebSocket message:", data);

    switch (data.command) {
      case 'waiting':
        if (currentRound.busted !== null && currentRound.hash) {
          const features = extractFeatures(currentRound);
          console.log("💾 saving features:", features);
          saveRoundToIndexedDB(features);
          chrome.runtime.sendMessage({
            type: "PREDICT_CRASH",
            payload: features
          });
        }
        currentRound = {
          updates: [],
          players: [],
          busted: null,
          hash: null,
          md5: data.md5 || null,
          startTime: Date.now()
        };
        break;

      case 'update':
        currentRound.updates.push({ time: data.time, current: data.current });
        break;

      case 'play':
        currentRound.players.push({
          uid: data.uid,
          name: data.name,
          amount: data.amount,
          cashout: data.cashout
        });
        break;

      case 'busted':
        currentRound.busted = data.amount || null;
        currentRound.hash = data.hash || null;
        break;
    }
  }

  if (event.data.type === 'PREDICTION_RESULT') {
    console.log("🎯 Prediction Result:", event.data.result);
  }

  if (event.data.type === 'MODEL_READY') {
    console.log("🤖 Model is ready for predictions!");
  }
});

function calculateBustedFromHash(hash) {
  const hashInt = BigInt('0x' + hash);
  const shifted = hashInt >> 52n;
  const e = Number((100n * (2n ** 52n)) / shifted);
  return Math.max(1.0, Math.floor(e) / 100);
}

function extractFeatures(round) {
  const updates = round.updates.map(u => u.current);
  const avg = updates.reduce((a, b) => a + b, 0) / updates.length || 0;
  const variance = updates.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / updates.length || 0;
  const avgBet = round.players.reduce((a, b) => a + (b.amount || 0), 0) / round.players.length || 0;
  const hashBusted = calculateBustedFromHash(round.hash);

  return {
    startTime: round.startTime,
    md5: round.md5,
    busted: round.busted,
    hashBusted: hashBusted,
    updatesLength: updates.length,
    avgCurrent: avg,
    variance: variance,
    avgBetAmount: avgBet,
    playersLength: round.players.length
  };
}

function saveRoundToIndexedDB(round) {
  const request = indexedDB.open('CrashGameDB', 1);

  request.onupgradeneeded = function (e) {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('rounds')) {
      db.createObjectStore('rounds', { keyPath: 'startTime' });
    }
  };

  request.onsuccess = function (e) {
    const db = e.target.result;
    const tx = db.transaction('rounds', 'readwrite');
    tx.objectStore('rounds').put(round);
    tx.oncomplete = () => db.close();
  };

  request.onerror = function (e) {
    console.error("❌ IndexedDB error:", e.target.error);
  };
}

function predictNextCrash(currentFeatures) {
    if (!isTFReady || !tf || !tf.tensor2d) {
        console.warn("⚠️ TensorFlow هنوز آماده نیست. ذخیره در صف...");
        pendingFeatures = currentFeatures;
        return;
      }
    
      // اگر آماده‌ست، اجرا رو ادامه بده 👇
      pendingFeatures = null; // صف خالی
    const dbReq = indexedDB.open('CrashGameDB', 1);

    dbReq.onsuccess = function (event) {
      const db = event.target.result;
      const tx = db.transaction('rounds', 'readonly');
      const store = tx.objectStore('rounds');
      const getAllReq = store.getAll();

      getAllReq.onsuccess = async () => {
        const data = getAllReq.result;
        if (data.length < 20) return;

        const inputs = data.map(d => [
          d.updatesLength,
          d.avgCurrent,
          d.variance,
          d.avgBetAmount,
          d.playersLength,
          d.hashBusted
        ]);
        const labels = data.map(d => d.busted);

        const tfXs = tf.tensor2d(inputs);
        const tfYs = tf.tensor2d(labels.map(y => [y]));

        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 32, inputShape: [6], activation: 'relu' }));
        model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 1 }));
        model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

        await model.fit(tfXs, tfYs, { epochs: 30 });

        const input = tf.tensor2d([[
          currentFeatures.updatesLength,
          currentFeatures.avgCurrent,
          currentFeatures.variance,
          currentFeatures.avgBetAmount,
          currentFeatures.playersLength,
          currentFeatures.hashBusted
        ]]);

        const prediction = model.predict(input);
        prediction.data().then(res => {
          const result = res[0].toFixed(2);
          chrome.storage.local.set({ predictedCrash: result });
          console.log("📈 Predicted crash multiplier:", result);
        });
      };
    };
  
}

console.log("🧠 injected.js is running");




(function () {
    const OriginalWebSocket = window.WebSocket;
  
    window.WebSocket = function (url, protocols) {
      const ws = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);
  
      ws.addEventListener('message', function (event) {
        try {
          const data = JSON.parse(event.data);
  
          // ارسال به content.js
          window.postMessage({ type: 'FROM_GAME_WS', data }, '*');
        } catch (e) {
          // نادیده گرفتن پیام‌های غیر JSON
        }
      });
  
      return ws;
    };
  
    window.WebSocket.prototype = OriginalWebSocket.prototype;
  })();




  


// مدل نمونه (برای دمو)
let model;

async function initModel() {
  await tf.ready();

  // مدل ساده: 1 ورودی، 2 لایه dense، 1 خروجی
  model = tf.sequential();
  model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [1] }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

  console.log("✅ Model initialized!");

  // notify content.js
  window.postMessage({ type: 'MODEL_READY' }, '*');
}

// دریافت داده برای پیش‌بینی از content.js
window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  
  

  if (event.data.type === 'PREDICT' && model) {
    const input = event.data.payload; // فرض می‌کنیم payload یک عدد یا آرایه از اعداد هست

    try {
      const inputTensor = tf.tensor2d([input], [1, 1]); // مثلا یک عدد مثل 1.7
      const prediction = model.predict(inputTensor);
      const result = (await prediction.array())[0][0];

      // ارسال نتیجه
      window.postMessage({ type: 'PREDICTION_RESULT', result }, '*');
    } catch (err) {
      console.error("❌ Prediction error:", err);
    }
  }
});

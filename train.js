
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const crypto = require('crypto');

function md5ToSha256(md5) {
  return crypto.createHash('sha256').update(md5).digest('hex');
}

function sha256ToCrash(hash) {
  const chunks = hash.match(/.{1,4}/g);
  const sum = chunks.map(h => parseInt(h, 16)).reduce((a, b) => a + b, 0);
  if (sum % 50 === 0) return 0.0;

  const X = BigInt('0x' + hash.substring(0, 13));
  const Y = 4503599627370496n;
  const numerator = 100n * Y - X;
  const denominator = 100n * (Y - X);
  const result = Number(numerator * 10000n / denominator) / 10000;
  return Math.floor(result * 100) / 100;
}

function md5ToHashBusted(md5) {
  return sha256ToCrash(md5ToSha256(md5));
}

function md5ToFloat(md5) {
  const hash = crypto.createHash('sha256').update(md5).digest('hex');
  const bigInt = BigInt('0x' + hash.slice(0, 16));
  return Number(bigInt) / Number(2n ** 64n);
}

const rawData = fs.readFileSync('rounds_enriched.json');
const data = JSON.parse(rawData).filter(d => d.md5 && d.hashBusted && d.busted);

const inputs = data.map(d => [
  md5ToFloat(d.md5),
  d.hashBusted
]);

const outputs = data.map(d => d.busted);

const inputTensor = tf.tensor2d(inputs);
const outputTensor = tf.tensor2d(outputs, [outputs.length, 1]);

const model = tf.sequential();
model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [2] }));
model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
model.add(tf.layers.dense({ units: 1 }));

model.compile({
  optimizer: tf.train.adam(0.001),
  loss: 'meanSquaredError'
});

async function train() {
  console.log("🚀 Training started...");
  await model.fit(inputTensor, outputTensor, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`📊 Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)}, val_loss=${logs.val_loss.toFixed(4)}`);
      }
    }
  });

  await model.save('file://model');
  console.log("✅ Model saved in /model/");
}

train();

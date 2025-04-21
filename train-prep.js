
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

const rawData = JSON.parse(fs.readFileSync('rounds.json'));
const enriched = rawData
  .filter(d => d.md5 && d.busted)
  .map(d => ({
    ...d,
    hashBusted: md5ToHashBusted(d.md5)
  }));

fs.writeFileSync('rounds_enriched.json', JSON.stringify(enriched, null, 2));
console.log("✅ Enriched rounds saved to rounds_enriched.json");

const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 修正合約配置 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  // 正確的合約地址
  const HERO_ADDRESS = "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD";
  const RELIC_ADDRESS = "0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4";
  const DUNGEONCORE_ADDRESS = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13"; // 正確的 DungeonCore
  
  const heroPath = 'artifacts/contracts/current/nft/Hero.sol/Hero.json';
  const relicPath = 'artifacts/contracts/current/nft/Relic.sol/Relic.json';
  
  const heroJson = JSON.parse(fs.readFileSync(heroPath, 'utf8'));
  const relicJson = JSON.parse(fs.readFileSync(relicPath, 'utf8'));
  
  const hero = new ethers.Contract(HERO_ADDRESS, heroJson.abi, wallet);
  const relic = new ethers.Contract(RELIC_ADDRESS, relicJson.abi, wallet);
  
  console.log("🔧 修正 Hero 合約配置");
  console.log("─".repeat(60));
  
  console.log("設置正確的 DungeonCore 地址...");
  const heroCoreTx = await hero.setDungeonCore(DUNGEONCORE_ADDRESS);
  await heroCoreTx.wait();
  console.log("✅ Hero DungeonCore 已修正為:", DUNGEONCORE_ADDRESS);
  
  console.log("\n🔧 修正 Relic 合約配置");
  console.log("─".repeat(60));
  
  console.log("設置正確的 DungeonCore 地址...");
  const relicCoreTx = await relic.setDungeonCore(DUNGEONCORE_ADDRESS);
  await relicCoreTx.wait();
  console.log("✅ Relic DungeonCore 已修正為:", DUNGEONCORE_ADDRESS);
  
  console.log("\n✅ 配置修正完成");
  console.log("現在可以運行測試：node scripts/test-optimized-minting.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
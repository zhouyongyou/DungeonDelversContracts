const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 診斷 VRF 隨機數數量問題 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const vrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
  
  // 讀取 VRF Manager ABI
  const vrfPath = 'artifacts/contracts/current/core/VRFConsumerV2Plus.sol/VRFConsumerV2Plus.json';
  const vrfJson = JSON.parse(fs.readFileSync(vrfPath, 'utf8'));
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfJson.abi, wallet);
  
  console.log("📊 檢查 VRF 設置");
  console.log("─".repeat(60));
  
  const numWords = await vrfManager.numWords();
  console.log("當前 numWords 設置:", numWords.toString());
  console.log("問題：numWords 固定為 1，應該根據請求數量動態調整");
  
  console.log("\n📊 檢查最後的請求");
  console.log("─".repeat(60));
  
  const lastResult = await vrfManager.getRandomForUser(wallet.address);
  console.log("收到的隨機數數量:", lastResult.randomWords.length);
  console.log("預期的隨機數數量: 50");
  
  console.log("\n💡 解決方案：");
  console.log("─".repeat(60));
  console.log("1. VRFConsumerV2Plus 的 requestRandomForUser 函數需要修改");
  console.log("2. 應該使用 quantity 參數作為 numWords");
  console.log("3. 或者使用優化版（1 個隨機數生成多個）");
  
  console.log("\n📝 代碼問題：");
  console.log("─".repeat(60));
  console.log("當前代碼：");
  console.log("  numWords: numWords  // 固定值 1");
  console.log("\n應該改為：");
  console.log("  numWords: uint32(quantity)  // 動態值");
  
  console.log("\n🎯 建議：");
  console.log("─".repeat(60));
  console.log("方案 A：修改 VRFConsumerV2Plus 合約");
  console.log("  - 讓 numWords = quantity");
  console.log("  - 費用：50 × 0.00005 = 0.0025 BNB");
  console.log("\n方案 B：使用優化版合約");
  console.log("  - 1 個隨機數 + keccak256 生成 50 個");
  console.log("  - 費用：1 × 0.00005 = 0.00005 BNB（節省 98%）");
  console.log("  - 已部署：0xCcE39f6f06134fcEfb9382629358467F46692639");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
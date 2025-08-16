const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 修正 VRF Key Hash ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const managerAddress = "0xb772e15dF8aB4B38c1D4Ba1F4b0451B3e2B7B0C6";
  
  // 讀取 ABI
  const contractPath = 'artifacts/contracts/current/core/VRFSubscriptionManager.sol/VRFSubscriptionManager.json';
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const vrfManager = new ethers.Contract(managerAddress, contractJson.abi, wallet);
  
  console.log("📊 當前配置");
  console.log("─".repeat(50));
  
  const currentKeyHash = await vrfManager.keyHash();
  console.log("當前 Key Hash:", currentKeyHash);
  
  // 正確的 BSC 主網訂閱模式 key hashes
  const correctKeyHashes = {
    "200 Gwei": "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4",
    "500 Gwei": "0xeb0f72532fed5c94b4caf7b49caf454b35a729608a441101b9269efb7efe2c6c",
    "1000 Gwei": "0xb94a4fdb12830e15846df59b27d7c5d92c9c24c10cf6ae49655681ba560848dd"
  };
  
  console.log("\n📋 BSC 主網訂閱模式正確的 Key Hashes:");
  console.log("─".repeat(50));
  for (const [price, hash] of Object.entries(correctKeyHashes)) {
    console.log(`${price}: ${hash}`);
  }
  
  // 使用 200 Gwei 的 key hash（最便宜）
  const newKeyHash = correctKeyHashes["200 Gwei"];
  
  if (currentKeyHash !== newKeyHash) {
    console.log("\n🔄 更新 Key Hash");
    console.log("─".repeat(50));
    console.log("新 Key Hash (200 Gwei):", newKeyHash);
    
    try {
      const tx = await vrfManager.setVRFParams(
        newKeyHash,
        500000,  // callbackGasLimit
        3        // requestConfirmations
      );
      
      console.log("交易哈希:", tx.hash);
      await tx.wait();
      console.log("✅ Key Hash 已更新");
      
      // 驗證
      const updatedKeyHash = await vrfManager.keyHash();
      console.log("\n驗證更新:");
      console.log("新的 Key Hash:", updatedKeyHash);
      
      if (updatedKeyHash === newKeyHash) {
        console.log("✅ 更新成功！");
      } else {
        console.log("❌ 更新失敗");
      }
      
    } catch (error) {
      console.log("❌ 更新失敗:", error.message);
    }
  } else {
    console.log("\n✅ Key Hash 已經是正確的");
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("完成！現在可以測試 VRF 請求了");
  console.log("執行: node scripts/test-vrf-subscription.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
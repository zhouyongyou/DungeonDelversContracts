const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 優化 VRF Gas 設置 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const contractAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
  
  // 讀取 ABI
  const contractPath = 'artifacts/contracts/current/core/VRFConsumerV2Plus.sol/VRFConsumerV2Plus.json';
  const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const vrfConsumer = new ethers.Contract(contractAddress, contractJson.abi, wallet);
  
  console.log("📊 當前設置：");
  console.log("─".repeat(50));
  
  const currentGasLimit = await vrfConsumer.callbackGasLimit();
  const currentConfirmations = await vrfConsumer.requestConfirmations();
  
  console.log("Callback Gas Limit:", currentGasLimit.toString());
  console.log("Confirmations:", currentConfirmations.toString());
  
  // 優化設置
  console.log("\n🔧 優化 Gas 設置");
  console.log("─".repeat(50));
  
  const newGasLimit = 200000;  // 降低到 200k
  const newConfirmations = 3;   // 保持 3
  
  console.log("新 Gas Limit:", newGasLimit);
  console.log("新 Confirmations:", newConfirmations);
  
  try {
    const tx = await vrfConsumer.setVRFParams(
      "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4",  // keyHash
      newGasLimit,
      newConfirmations,
      1  // numWords
    );
    
    console.log("交易哈希:", tx.hash);
    await tx.wait();
    console.log("✅ 設置已更新");
    
    // 驗證
    const updatedGasLimit = await vrfConsumer.callbackGasLimit();
    console.log("\n驗證新設置:");
    console.log("Callback Gas Limit:", updatedGasLimit.toString());
    
    console.log("\n💰 費用影響：");
    console.log("─".repeat(50));
    console.log("舊最大費用: 500,000 × 200 Gwei = 0.1 BNB");
    console.log("新最大費用: 200,000 × 200 Gwei = 0.04 BNB");
    console.log("節省: 60%");
    
  } catch (error) {
    console.log("❌ 更新失敗:", error.message);
  }
  
  console.log("\n下一步：");
  console.log("1. 再次測試 VRF 請求");
  console.log("2. 執行: node scripts/test-vrf-simple.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
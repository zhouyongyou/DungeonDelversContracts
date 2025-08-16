const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 檢查 VRF V2.5 介面問題 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  
  const coordinatorAddress = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
  const managerAddress = "0xb772e15dF8aB4B38c1D4Ba1F4b0451B3e2B7B0C6";
  
  console.log("📊 問題診斷");
  console.log("─".repeat(50));
  
  console.log("\n可能的問題：");
  console.log("1. BSC 的 VRF V2.5 可能需要特殊的介面");
  console.log("2. requestRandomWords 函數簽名可能不同");
  console.log("3. 需要實現 VRFConsumerBaseV2Plus 介面");
  
  console.log("\n📋 BSC VRF V2.5 正確配置：");
  console.log("─".repeat(50));
  console.log("Coordinator: 0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9");
  console.log("LINK Token: 0x404460C6A5EdE2D891e8297795264fDe62ADBB75");
  console.log("Key Hash (200 Gwei): 0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4");
  
  console.log("\n🔍 檢查失敗交易：");
  console.log("─".repeat(50));
  console.log("最近失敗的交易: 0x76a55fb596ec14edeb3752dd2b76ca1827946ebfd57ca25b2cdbfc92ee4040d4");
  console.log("查看詳情: https://bscscan.com/tx/0x76a55fb596ec14edeb3752dd2b76ca1827946ebfd57ca25b2cdbfc92ee4040d4");
  
  console.log("\n💡 解決方案：");
  console.log("─".repeat(50));
  console.log("需要創建一個實現 VRFConsumerBaseV2Plus 的新合約");
  console.log("該合約必須：");
  console.log("1. 繼承 VRFConsumerBaseV2Plus");
  console.log("2. 實現 fulfillRandomWords 回調函數");
  console.log("3. 正確設置 coordinator 地址");
  console.log("4. 使用正確的函數簽名調用 requestRandomWords");
  
  console.log("\n建議下一步：");
  console.log("1. 從 Chainlink 官方 GitHub 獲取 VRFConsumerBaseV2Plus.sol");
  console.log("2. 創建新的 VRF Manager 合約，繼承該基類");
  console.log("3. 重新部署並測試");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });
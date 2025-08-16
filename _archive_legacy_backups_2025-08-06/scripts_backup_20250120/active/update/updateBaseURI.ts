import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // 你的 metadata server URL
  const NEW_BASE_URI = process.env.METADATA_SERVER_BASE_URL || "https://dungeon-delvers-metadata-server.onrender.com/api/";
  
  // 從環境變量讀取合約地址
  const contracts = {
    Hero: process.env.VITE_MAINNET_HERO_ADDRESS || "0x2a046140668cBb8F598ff3852B08852A8EB23b6a",
    Relic: process.env.VITE_MAINNET_RELIC_ADDRESS || "0x95F005e2e0d38381576DA36c5CA4619a87da550E",
    Party: process.env.VITE_MAINNET_PARTY_ADDRESS || "0x11FB68409222B53b04626d382d7e691e640A1DcD",
    VIPStaking: process.env.VITE_MAINNET_VIPSTAKING_ADDRESS || "0xefdfF583944A2c6318d1597AD1E41159fCd8F6dB"
  };

  console.log("🚀 開始更新 BaseURI...");
  console.log(`📍 新的 BaseURI: ${NEW_BASE_URI}`);
  console.log("------------------------");
  
  // 獲取簽名者
  const [signer] = await ethers.getSigners();
  console.log(`🔑 使用地址: ${signer.address}`);
  console.log("------------------------");
  
  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`\n📋 處理 ${name} 合約...`);
      console.log(`📍 合約地址: ${address}`);
      
      // 獲取合約實例
      // 注意：這裡假設你有合約的 ABI，如果沒有，需要先編譯合約
      const contract = await ethers.getContractAt(name, address, signer);
      
      // 檢查當前 BaseURI
      try {
        const currentBaseURI = await contract.baseURI();
        console.log(`📌 當前 BaseURI: ${currentBaseURI}`);
      } catch (e) {
        console.log(`⚠️  無法讀取當前 BaseURI`);
      }
      
      // 更新 BaseURI
      console.log(`🔄 發送更新交易...`);
      const tx = await contract.setBaseURI(NEW_BASE_URI);
      console.log(`📝 交易哈希: ${tx.hash}`);
      
      // 等待交易確認
      console.log(`⏳ 等待交易確認...`);
      const receipt = await tx.wait();
      console.log(`✅ ${name} BaseURI 已更新！`);
      console.log(`⛽ Gas 使用量: ${receipt.gasUsed.toString()}`);
      
      // 驗證更新
      try {
        const updatedBaseURI = await contract.baseURI();
        console.log(`✅ 驗證新 BaseURI: ${updatedBaseURI}`);
      } catch (e) {
        console.log(`⚠️  無法驗證更新後的 BaseURI`);
      }
      
    } catch (error: any) {
      console.error(`❌ ${name} 更新失敗:`, error.message);
      
      // 提供更詳細的錯誤信息
      if (error.message.includes("Ownable")) {
        console.log(`💡 提示: 請確保使用合約擁有者地址執行此腳本`);
      } else if (error.message.includes("gas")) {
        console.log(`💡 提示: 可能需要更多 gas 或 BNB 餘額不足`);
      }
    }
  }
  
  console.log("\n------------------------");
  console.log("✅ BaseURI 更新流程完成！");
  console.log("\n📋 後續步驟:");
  console.log("1. 確保 Render.com 上的 metadata API 正在運行");
  console.log("2. 測試 metadata API 是否正常返回數據:");
  console.log(`   curl ${NEW_BASE_URI}hero/1`);
  console.log("3. NFT 市場可能需要時間來更新快取");
  console.log("4. 可以在 BSCScan 上驗證交易");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
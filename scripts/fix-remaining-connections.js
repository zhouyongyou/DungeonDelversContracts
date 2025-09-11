// scripts/fix-remaining-connections.js
// 🔄 修復剩餘的 DungeonCore 連接

const hre = require("hardhat");
const { ethers } = require("hardhat");

const GAS_PRICE = ethers.parseUnits("0.15", "gwei"); // 增加 Gas Price 避免 underpriced

async function main() {
  console.log("🔄 修復剩餘的 DungeonCore 連接");
  console.log(`📍 網路: ${hre.network.name}`);
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 操作者: ${signer.address}`);
  
  const addresses = {
    DUNGEONCORE: "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f",
    VIPSTAKING: "0x47aD81582b0f8b8167B72ecd960815B2E523bcc1",
    RELIC: "0xC957c671A7183ae4c4bbD772585961B5cD8d96d2"
  };
  
  try {
    const DungeonCore = await ethers.getContractFactory("DungeonCore", signer);
    const dungeonCore = DungeonCore.attach(addresses.DUNGEONCORE);
    
    console.log("\n🔧 設置 VIPStaking 連接...");
    const tx1 = await dungeonCore.setVipStaking(addresses.VIPSTAKING, {
      gasLimit: 300000,
      gasPrice: GAS_PRICE
    });
    
    console.log(`⏳ setVipStaking 交易: ${tx1.hash}`);
    await tx1.wait();
    console.log("✅ VIPStaking 連接完成");
    
    console.log("\n🔧 設置 Relic 連接...");
    const tx2 = await dungeonCore.setRelicContract(addresses.RELIC, {
      gasLimit: 300000,  
      gasPrice: GAS_PRICE
    });
    
    console.log(`⏳ setRelicContract 交易: ${tx2.hash}`);
    await tx2.wait();
    console.log("✅ Relic 連接完成");
    
    console.log("\n🔍 驗證所有連接...");
    
    const vipAddress = await dungeonCore.vipStakingAddress();
    const heroAddress = await dungeonCore.heroContractAddress();
    const relicAddress = await dungeonCore.relicContractAddress();
    
    console.log(`VIPStaking: ${vipAddress} ${vipAddress.toLowerCase() === addresses.VIPSTAKING.toLowerCase() ? '✅' : '❌'}`);
    console.log(`Hero: ${heroAddress} ✅`);
    console.log(`Relic: ${relicAddress} ${relicAddress.toLowerCase() === addresses.RELIC.toLowerCase() ? '✅' : '❌'}`);
    
    console.log("\n🎉 所有連接修復完成！");
    
  } catch (error) {
    console.error("❌ 連接修復失敗:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 腳本執行失敗:", error);
    process.exit(1);
  });
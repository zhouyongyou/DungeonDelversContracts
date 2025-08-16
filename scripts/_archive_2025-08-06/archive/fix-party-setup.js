// 修復 Party V3 合約設置
const { ethers } = require("hardhat");

async function fixPartySetup() {
  console.log("🔧 修復 Party V3 合約設置...\n");

  // V12 合約地址
  const PARTY_ADDRESS = "0x847DceaE26aF1CFc09beC195CE87a9b5701863A7";
  const DUNGEONCORE_ADDRESS = "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5";
  const HERO_ADDRESS = "0x6f4Bd03ea8607c6e69bCc971b7d3CC9e5801EF5E";
  const RELIC_ADDRESS = "0x853DAAeC0ae354bF40c732C199Eb09F1a0CD3dC1";
  const METADATA_URL = "https://dungeon-delvers-metadata-server.onrender.com/api/party/";

  const [signer] = await ethers.getSigners();
  console.log(`操作者: ${signer.address}\n`);

  // 獲取 Party V3 合約
  const Party = await ethers.getContractAt([
    "function dungeonCoreContract() external view returns (address)",
    "function heroContract() external view returns (address)", 
    "function relicContract() external view returns (address)",
    "function baseURI() external view returns (string memory)",
    "function platformFee() external view returns (uint256)",
    "function owner() external view returns (address)",
    "function setDungeonCore(address) external",
    "function setHeroContract(address) external",
    "function setRelicContract(address) external",
    "function setBaseURI(string memory) external"
  ], PARTY_ADDRESS);

  // 檢查當前設置
  console.log("📍 檢查當前設置:");
  
  try {
    const owner = await Party.owner();
    console.log(`  擁有者: ${owner}`);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error("❌ 只有擁有者可以設置合約");
      return;
    }
  } catch (error) {
    console.error("❌ 獲取擁有者失敗:", error.message);
  }

  // 檢查並設置 DungeonCore
  try {
    const currentDungeonCore = await Party.dungeonCoreContract();
    console.log(`  當前 DungeonCore: ${currentDungeonCore}`);
    
    if (currentDungeonCore === ethers.ZeroAddress) {
      console.log("  ⚠️  需要設置 DungeonCore");
      const tx1 = await Party.setDungeonCore(DUNGEONCORE_ADDRESS);
      await tx1.wait();
      console.log("  ✅ DungeonCore 已設置");
    }
  } catch (error) {
    console.log("  ⚠️  dungeonCoreContract 函數不存在，跳過");
  }

  // 檢查並設置 Hero 合約
  try {
    const currentHero = await Party.heroContract();
    console.log(`  當前 Hero 合約: ${currentHero}`);
    
    if (currentHero === ethers.ZeroAddress) {
      console.log("  ⚠️  需要設置 Hero 合約");
      const tx2 = await Party.setHeroContract(HERO_ADDRESS);
      await tx2.wait();
      console.log("  ✅ Hero 合約已設置");
    }
  } catch (error) {
    console.log("  ⚠️  heroContract 函數不存在，跳過");
  }

  // 檢查並設置 Relic 合約
  try {
    const currentRelic = await Party.relicContract();
    console.log(`  當前 Relic 合約: ${currentRelic}`);
    
    if (currentRelic === ethers.ZeroAddress) {
      console.log("  ⚠️  需要設置 Relic 合約");
      const tx3 = await Party.setRelicContract(RELIC_ADDRESS);
      await tx3.wait();
      console.log("  ✅ Relic 合約已設置");
    }
  } catch (error) {
    console.log("  ⚠️  relicContract 函數不存在，跳過");
  }

  // 檢查並設置 BaseURI
  try {
    const currentBaseURI = await Party.baseURI();
    console.log(`  當前 BaseURI: ${currentBaseURI || "未設置"}`);
    
    if (!currentBaseURI) {
      console.log("  ⚠️  需要設置 BaseURI");
      const tx4 = await Party.setBaseURI(METADATA_URL);
      await tx4.wait();
      console.log("  ✅ BaseURI 已設置");
    }
  } catch (error) {
    console.log("  ⚠️  baseURI 函數不存在，跳過");
  }

  // 檢查平台費用
  try {
    const platformFee = await Party.platformFee();
    console.log(`  平台費用: ${ethers.formatEther(platformFee)} BNB`);
  } catch (error) {
    console.log("  ⚠️  無法讀取平台費用");
  }

  console.log("\n✅ Party V3 設置檢查完成！");
}

fixPartySetup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
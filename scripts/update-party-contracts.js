const hre = require("hardhat");

async function updateContract(contract, method, newAddress, name) {
  try {
    console.log(`\n更新 ${name}...`);
    const tx = await contract[method](newAddress);
    console.log(`   交易 Hash: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ ${name} 更新成功: ${newAddress}`);
    return true;
  } catch (error) {
    if (error.message && error.message.includes("invalid value")) {
      const match = error.message.match(/"hash":\s*"(0x[a-fA-F0-9]{64})"/);
      if (match) {
        console.log(`   交易 Hash: ${match[1]}`);
        console.log(`   ✅ ${name} 更新成功（交易已發送）`);
        return true;
      }
    }
    console.log(`   ❌ ${name} 更新失敗:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 更新 Party 合約的 Hero 和 Relic 地址...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 執行者:", deployer.address);
  
  // Party 合約地址 (V25 版本)
  const PARTY_ADDRESS = "0x6B32c2EEaB24C04bF97A022B1e55943FE1E772a5";
  
  // 新部署的合約地址
  const NEW_CONTRACTS = {
    Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
    DungeonCore: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13"
  };
  
  try {
    const party = await hre.ethers.getContractAt("Party", PARTY_ADDRESS);
    
    console.log("📋 開始更新 Party 合約設置...");
    console.log("=====================================");
    console.log("Party 合約地址:", PARTY_ADDRESS);
    console.log("=====================================");
    
    // 檢查當前設置
    console.log("\n🔍 檢查當前設置：");
    const currentHero = await party.heroContract();
    const currentRelic = await party.relicContract();
    const currentDungeonCore = await party.dungeonCoreContract();
    
    console.log("當前 Hero:", currentHero);
    console.log("當前 Relic:", currentRelic);
    console.log("當前 DungeonCore:", currentDungeonCore);
    
    // 更新合約地址
    console.log("\n📝 更新合約地址：");
    
    let needsUpdate = false;
    
    // 更新 Hero
    if (currentHero.toLowerCase() !== NEW_CONTRACTS.Hero.toLowerCase()) {
      await updateContract(party, "setHeroContract", NEW_CONTRACTS.Hero, "Hero Contract");
      needsUpdate = true;
    } else {
      console.log("\n✅ Hero 合約地址已是最新");
    }
    
    // 更新 Relic
    if (currentRelic.toLowerCase() !== NEW_CONTRACTS.Relic.toLowerCase()) {
      await updateContract(party, "setRelicContract", NEW_CONTRACTS.Relic, "Relic Contract");
      needsUpdate = true;
    } else {
      console.log("\n✅ Relic 合約地址已是最新");
    }
    
    // 檢查 DungeonCore（應該已經是正確的）
    if (currentDungeonCore.toLowerCase() !== NEW_CONTRACTS.DungeonCore.toLowerCase()) {
      await updateContract(party, "setDungeonCore", NEW_CONTRACTS.DungeonCore, "DungeonCore");
      needsUpdate = true;
    } else {
      console.log("\n✅ DungeonCore 地址已是最新");
    }
    
    if (!needsUpdate) {
      console.log("\n✅ Party 合約所有設置都已是最新！");
      return;
    }
    
    console.log("\n=====================================");
    console.log("✅ Party 合約更新完成！");
    console.log("=====================================");
    
    // 等待區塊確認
    console.log("\n等待區塊確認...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 驗證更新結果
    console.log("\n🔍 驗證更新結果：");
    const updatedHero = await party.heroContract();
    const updatedRelic = await party.relicContract();
    const updatedDungeonCore = await party.dungeonCoreContract();
    
    console.log("Hero Contract:", updatedHero);
    console.log("Relic Contract:", updatedRelic);
    console.log("DungeonCore:", updatedDungeonCore);
    
    // 檢查是否全部更新成功
    const allUpdated = 
      updatedHero.toLowerCase() === NEW_CONTRACTS.Hero.toLowerCase() &&
      updatedRelic.toLowerCase() === NEW_CONTRACTS.Relic.toLowerCase() &&
      updatedDungeonCore.toLowerCase() === NEW_CONTRACTS.DungeonCore.toLowerCase();
    
    if (allUpdated) {
      console.log("\n🎉 Party 合約所有地址已成功更新！");
    } else {
      console.log("\n⚠️  部分地址可能需要重新更新");
    }
    
  } catch (error) {
    console.error("❌ 錯誤:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
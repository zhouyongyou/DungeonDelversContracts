const hre = require("hardhat");

async function updateContract(dungeonCore, method, newAddress, name) {
  try {
    console.log(`\n更新 ${name}...`);
    const tx = await dungeonCore[method](newAddress);
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
  console.log("🚀 更新 DungeonCore 合約地址...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 執行者:", deployer.address);
  
  const DUNGEON_CORE = "0x8a2D2b1961135127228EdD71Ff98d6B097915a13";
  
  // 新部署的合約地址
  const NEW_CONTRACTS = {
    Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
    Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
    DungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
    AltarOfAscension: "0xa86749237d4631ad92ba859d0b0df4770f6147ba"
  };
  
  try {
    const dungeonCore = await hre.ethers.getContractAt("DungeonCore", DUNGEON_CORE);
    
    console.log("📋 開始更新 DungeonCore 合約地址...");
    console.log("=====================================");
    
    // 更新各個合約地址
    await updateContract(dungeonCore, "setHeroContract", NEW_CONTRACTS.Hero, "Hero");
    await updateContract(dungeonCore, "setRelicContract", NEW_CONTRACTS.Relic, "Relic");
    await updateContract(dungeonCore, "setDungeonMaster", NEW_CONTRACTS.DungeonMaster, "DungeonMaster");
    await updateContract(dungeonCore, "setAltarOfAscension", NEW_CONTRACTS.AltarOfAscension, "AltarOfAscension");
    
    console.log("\n=====================================");
    console.log("✅ DungeonCore 更新完成！");
    console.log("=====================================");
    
    // 等待一下確保交易完成
    console.log("\n等待區塊確認...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 驗證更新結果
    console.log("\n🔍 驗證更新結果：");
    const updatedSettings = {
      heroContract: await dungeonCore.heroContractAddress(),
      relicContract: await dungeonCore.relicContractAddress(),
      dungeonMaster: await dungeonCore.dungeonMasterAddress(),
      altarOfAscension: await dungeonCore.altarOfAscensionAddress()
    };
    
    console.log(`Hero: ${updatedSettings.heroContract}`);
    console.log(`Relic: ${updatedSettings.relicContract}`);
    console.log(`DungeonMaster: ${updatedSettings.dungeonMaster}`);
    console.log(`AltarOfAscension: ${updatedSettings.altarOfAscension}`);
    
    // 檢查是否全部更新成功
    const allUpdated = 
      updatedSettings.heroContract.toLowerCase() === NEW_CONTRACTS.Hero.toLowerCase() &&
      updatedSettings.relicContract.toLowerCase() === NEW_CONTRACTS.Relic.toLowerCase() &&
      updatedSettings.dungeonMaster.toLowerCase() === NEW_CONTRACTS.DungeonMaster.toLowerCase() &&
      updatedSettings.altarOfAscension.toLowerCase() === NEW_CONTRACTS.AltarOfAscension.toLowerCase();
    
    if (allUpdated) {
      console.log("\n🎉 所有合約地址已成功更新！");
    } else {
      console.log("\n⚠️  部分合約地址可能需要重新更新");
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
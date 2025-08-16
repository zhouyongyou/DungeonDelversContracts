const { ethers } = require("hardhat");
const v22Config = require("../../config/v22-config.js");

async function main() {
  console.log("\n=== 完整 V22 合約設置檢查與修復 ===\n");

  const [signer] = await ethers.getSigners();
  console.log("執行地址:", signer.address);

  // 元數據服務器 URL
  const METADATA_SERVER_URL = "https://dungeon-delvers-metadata-server.onrender.com";
  
  // 從 V22 配置獲取地址
  const addresses = {
    HERO: v22Config.contracts.HERO.address,
    RELIC: v22Config.contracts.RELIC.address,
    PARTY: v22Config.contracts.PARTY.address,
    VIPSTAKING: v22Config.contracts.VIPSTAKING.address,
    PLAYERPROFILE: v22Config.contracts.PLAYERPROFILE.address,
    DUNGEONCORE: v22Config.contracts.DUNGEONCORE.address,
    SOULSHARD: v22Config.contracts.SOULSHARD.address,
    ALTAROFASCENSION: v22Config.contracts.ALTAROFASCENSION.address,
    PLAYERVAULT: v22Config.contracts.PLAYERVAULT.address,
    DUNGEONMASTER: v22Config.contracts.DUNGEONMASTER.address,
    DUNGEONSTORAGE: v22Config.contracts.DUNGEONSTORAGE.address,
    ORACLE: v22Config.contracts.ORACLE.address
  };

  console.log("📋 V22 合約地址總覽：");
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  // 1. 檢查和設置 Hero 合約
  console.log("\n\n1️⃣ 檢查 Hero 合約設置...");
  const hero = await ethers.getContractAt("contracts/current/nft/Hero.sol:Hero", addresses.HERO);
  
  try {
    // 檢查 owner
    const heroOwner = await hero.owner();
    if (heroOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log(`  ⚠️  Hero owner 是 ${heroOwner}，跳過設置`);
    } else {
      // 檢查並設置各項依賴
      await checkAndSet(hero, "dungeonCore", addresses.DUNGEONCORE, "setDungeonCore");
      await checkAndSet(hero, "soulShardToken", addresses.SOULSHARD, "setSoulShardToken");
      await checkAndSet(hero, "ascensionAltarAddress", addresses.ALTAROFASCENSION, "setAscensionAltarAddress");
      
      // 檢查 baseURI
      const heroBaseURI = await hero.baseURI();
      if (!heroBaseURI || !heroBaseURI.includes("dungeon-delvers-metadata-server")) {
        const baseURI = `${METADATA_SERVER_URL}/api/hero/`;
        console.log(`  設置 baseURI: ${baseURI}`);
        const tx = await hero.setBaseURI(baseURI);
        await tx.wait();
        console.log(`  ✅ baseURI 設置成功`);
      }
      
      // 檢查鑄造價格
      const mintPrice = await hero.mintPriceUSD();
      console.log(`  當前鑄造價格: ${mintPrice} USD`);
      if (mintPrice.toString() !== "2") {
        console.log(`  設置鑄造價格為 2 USD`);
        const tx = await hero.setMintPriceUSD(2);
        await tx.wait();
        console.log(`  ✅ 鑄造價格設置成功`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Hero 設置出錯: ${error.message}`);
  }

  // 2. 檢查和設置 Relic 合約
  console.log("\n\n2️⃣ 檢查 Relic 合約設置...");
  const relic = await ethers.getContractAt("contracts/current/nft/Relic.sol:Relic", addresses.RELIC);
  
  try {
    const relicOwner = await relic.owner();
    if (relicOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log(`  ⚠️  Relic owner 是 ${relicOwner}，跳過設置`);
    } else {
      await checkAndSet(relic, "dungeonCore", addresses.DUNGEONCORE, "setDungeonCore");
      await checkAndSet(relic, "soulShardToken", addresses.SOULSHARD, "setSoulShardToken");
      await checkAndSet(relic, "ascensionAltarAddress", addresses.ALTAROFASCENSION, "setAscensionAltarAddress");
      
      const relicBaseURI = await relic.baseURI();
      if (!relicBaseURI || !relicBaseURI.includes("dungeon-delvers-metadata-server")) {
        const baseURI = `${METADATA_SERVER_URL}/api/relic/`;
        console.log(`  設置 baseURI: ${baseURI}`);
        const tx = await relic.setBaseURI(baseURI);
        await tx.wait();
        console.log(`  ✅ baseURI 設置成功`);
      }
      
      const mintPrice = await relic.mintPriceUSD();
      console.log(`  當前鑄造價格: ${ethers.formatEther(mintPrice)} USD`);
      if (mintPrice.toString() !== ethers.parseEther("0.8").toString()) {
        console.log(`  設置鑄造價格為 0.8 USD`);
        const tx = await relic.setMintPriceUSD(ethers.parseEther("0.8"));
        await tx.wait();
        console.log(`  ✅ 鑄造價格設置成功`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Relic 設置出錯: ${error.message}`);
  }

  // 3. 檢查和設置 Party 合約
  console.log("\n\n3️⃣ 檢查 Party 合約設置...");
  const party = await ethers.getContractAt("contracts/current/nft/Party.sol:PartyV3", addresses.PARTY);
  
  try {
    const partyOwner = await party.owner();
    if (partyOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log(`  ⚠️  Party owner 是 ${partyOwner}，跳過設置`);
    } else {
      await checkAndSet(party, "heroContract", addresses.HERO, "setHeroContract");
      await checkAndSet(party, "relicContract", addresses.RELIC, "setRelicContract");
      await checkAndSet(party, "dungeonCoreContract", addresses.DUNGEONCORE, "setDungeonCoreContract");
      
      const partyBaseURI = await party.baseURI();
      if (!partyBaseURI || !partyBaseURI.includes("dungeon-delvers-metadata-server")) {
        const baseURI = `${METADATA_SERVER_URL}/api/party/`;
        console.log(`  設置 baseURI: ${baseURI}`);
        const tx = await party.setBaseURI(baseURI);
        await tx.wait();
        console.log(`  ✅ baseURI 設置成功`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Party 設置出錯: ${error.message}`);
  }

  // 4. 檢查和設置 PlayerProfile 合約
  console.log("\n\n4️⃣ 檢查 PlayerProfile 合約設置...");
  const playerProfile = await ethers.getContractAt("contracts/current/nft/PlayerProfile.sol:PlayerProfile", addresses.PLAYERPROFILE);
  
  try {
    const profileOwner = await playerProfile.owner();
    if (profileOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log(`  ⚠️  PlayerProfile owner 是 ${profileOwner}，跳過設置`);
    } else {
      await checkAndSet(playerProfile, "dungeonCore", addresses.DUNGEONCORE, "setDungeonCore");
      
      const profileBaseURI = await playerProfile.baseURI();
      if (!profileBaseURI || !profileBaseURI.includes("dungeon-delvers-metadata-server")) {
        const baseURI = `${METADATA_SERVER_URL}/api/profile/`;
        console.log(`  設置 baseURI: ${baseURI}`);
        const tx = await playerProfile.setBaseURI(baseURI);
        await tx.wait();
        console.log(`  ✅ baseURI 設置成功`);
      }
    }
  } catch (error) {
    console.log(`  ❌ PlayerProfile 設置出錯: ${error.message}`);
  }

  // 5. 檢查 DungeonCore 註冊
  console.log("\n\n5️⃣ 檢查 DungeonCore 模組註冊...");
  const dungeonCore = await ethers.getContractAt("contracts/current/DungeonCore.sol:DungeonCore", addresses.DUNGEONCORE);
  
  try {
    const modules = [
      { name: "Hero", address: addresses.HERO, key: ethers.id("HERO") },
      { name: "Relic", address: addresses.RELIC, key: ethers.id("RELIC") },
      { name: "Party", address: addresses.PARTY, key: ethers.id("PARTY") },
      { name: "Oracle", address: addresses.ORACLE, key: ethers.id("ORACLE") },
      { name: "PlayerVault", address: addresses.PLAYERVAULT, key: ethers.id("PLAYER_VAULT") },
      { name: "DungeonMaster", address: addresses.DUNGEONMASTER, key: ethers.id("DUNGEON_MASTER") },
      { name: "PlayerProfile", address: addresses.PLAYERPROFILE, key: ethers.id("PLAYER_PROFILE") },
      { name: "VipStaking", address: addresses.VIPSTAKING, key: ethers.id("VIP_STAKING") },
      { name: "AltarOfAscension", address: addresses.ALTAROFASCENSION, key: ethers.id("ALTAR_OF_ASCENSION") }
    ];
    
    const coreOwner = await dungeonCore.owner();
    if (coreOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log(`  ⚠️  DungeonCore owner 是 ${coreOwner}，跳過註冊`);
    } else {
      for (const module of modules) {
        const registered = await dungeonCore.getModule(module.key);
        if (registered.toLowerCase() !== module.address.toLowerCase()) {
          console.log(`  註冊 ${module.name}: ${module.address}`);
          const tx = await dungeonCore.registerModule(module.key, module.address);
          await tx.wait();
          console.log(`  ✅ ${module.name} 註冊成功`);
        } else {
          console.log(`  ✅ ${module.name} 已正確註冊`);
        }
      }
    }
  } catch (error) {
    console.log(`  ❌ DungeonCore 註冊出錯: ${error.message}`);
  }

  // 6. 檢查 DungeonMaster 和 DungeonStorage 設置
  console.log("\n\n6️⃣ 檢查 DungeonMaster 和 DungeonStorage 設置...");
  const dungeonMaster = await ethers.getContractAt("contracts/current/DungeonMaster.sol:DungeonMaster", addresses.DUNGEONMASTER);
  const dungeonStorage = await ethers.getContractAt("contracts/current/DungeonStorage.sol:DungeonStorage", addresses.DUNGEONSTORAGE);
  
  try {
    // 檢查 DungeonStorage 的 logicContract
    const logicContract = await dungeonStorage.logicContract();
    if (logicContract.toLowerCase() !== addresses.DUNGEONMASTER.toLowerCase()) {
      const storageOwner = await dungeonStorage.owner();
      if (storageOwner.toLowerCase() === signer.address.toLowerCase()) {
        console.log(`  設置 DungeonStorage 的 logicContract`);
        const tx = await dungeonStorage.setLogicContract(addresses.DUNGEONMASTER);
        await tx.wait();
        console.log(`  ✅ logicContract 設置成功`);
      }
    } else {
      console.log(`  ✅ DungeonStorage logicContract 已正確設置`);
    }
    
    // 檢查 DungeonMaster 的各項設置
    const masterOwner = await dungeonMaster.owner();
    if (masterOwner.toLowerCase() === signer.address.toLowerCase()) {
      await checkAndSet(dungeonMaster, "dungeonCore", addresses.DUNGEONCORE, "setDungeonCore");
      await checkAndSet(dungeonMaster, "dungeonStorage", addresses.DUNGEONSTORAGE, "setDungeonStorage");
      await checkAndSet(dungeonMaster, "soulShardToken", addresses.SOULSHARD, "setSoulShardToken");
      await checkAndSet(dungeonMaster, "dungeonMasterWallet", "0x10925A7138649C7E1794CE646182eeb5BF8ba647", "setDungeonMasterWallet");
    }
  } catch (error) {
    console.log(`  ❌ DungeonMaster/Storage 設置出錯: ${error.message}`);
  }

  console.log("\n\n✅ 設置檢查完成！");
  console.log("\n📝 總結：");
  console.log("1. 所有 NFT 合約的 baseURI 都應該指向元數據服務器");
  console.log("2. 所有合約間的依賴關係都應該正確設置");
  console.log("3. DungeonCore 應該註冊所有模組");
  console.log("4. 請確保元數據服務器使用 V22 配置");
}

// 輔助函數：檢查並設置合約地址
async function checkAndSet(contract, getter, expectedAddress, setter) {
  try {
    const currentAddress = await contract[getter]();
    console.log(`  ${getter}: ${currentAddress}`);
    
    if (currentAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      console.log(`  ❌ 需要更新 ${getter}`);
      const tx = await contract[setter](expectedAddress);
      await tx.wait();
      console.log(`  ✅ ${getter} 設置成功`);
    } else {
      console.log(`  ✅ ${getter} 已正確設置`);
    }
  } catch (error) {
    console.log(`  ❌ 無法檢查/設置 ${getter}: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
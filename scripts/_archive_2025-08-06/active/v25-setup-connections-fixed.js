const hre = require("hardhat");

// V25 合約地址配置
const V25_CONTRACTS = {
  // 新部署的合約
  HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
  RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
  PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
  DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
  DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
  ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
  
  // 重複使用的合約
  DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
  PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
  PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
  VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
  ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
  
  // VRF Manager
  VRFMANAGER: '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038',
  
  // Tokens
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
  USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE'
};

async function main() {
  console.log('🔗 V25 合約連接設定 (修復版)');
  console.log('==============================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('執行賬戶:', signer.address);
  console.log('');
  
  console.log('📝 開始設定合約相互連接...\n');
  
  let successCount = 0;
  let failCount = 0;
  const results = [];
  
  try {
    // 1. DungeonCore 設定
    console.log('1️⃣ DungeonCore 設定:');
    console.log('   地址:', V25_CONTRACTS.DUNGEONCORE);
    
    const dungeonCore = await hre.ethers.getContractAt('DungeonCore', V25_CONTRACTS.DUNGEONCORE);
    
    // 設定 PlayerProfile
    try {
      const currentProfile = await dungeonCore.playerProfileAddress();
      if (currentProfile.toLowerCase() !== V25_CONTRACTS.PLAYERPROFILE.toLowerCase()) {
        console.log('   設定 PlayerProfile...');
        const tx1 = await dungeonCore.setPlayerProfile(V25_CONTRACTS.PLAYERPROFILE);
        await tx1.wait();
        console.log('   ✅ PlayerProfile 設定完成');
        successCount++;
      } else {
        console.log('   ✅ PlayerProfile 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ PlayerProfile 設定失敗:', error.message);
      failCount++;
    }
    
    // 設定其他合約地址
    const setters = [
      { name: 'Hero', setter: 'setHeroContract', address: V25_CONTRACTS.HERO },
      { name: 'Relic', setter: 'setRelicContract', address: V25_CONTRACTS.RELIC },
      { name: 'Party', setter: 'setPartyContract', address: V25_CONTRACTS.PARTY },
      { name: 'DungeonMaster', setter: 'setDungeonMaster', address: V25_CONTRACTS.DUNGEONMASTER },
      { name: 'AltarOfAscension', setter: 'setAltarOfAscension', address: V25_CONTRACTS.ALTAROFASCENSION },
      { name: 'PlayerVault', setter: 'setPlayerVault', address: V25_CONTRACTS.PLAYERVAULT },
      { name: 'VIPStaking', setter: 'setVipStaking', address: V25_CONTRACTS.VIPSTAKING },
      { name: 'Oracle', setter: 'setOracle', address: V25_CONTRACTS.ORACLE }
    ];
    
    for (const config of setters) {
      try {
        console.log(`   設定 ${config.name}...`);
        const tx = await dungeonCore[config.setter](config.address);
        await tx.wait();
        console.log(`   ✅ ${config.name} 設定完成`);
        successCount++;
      } catch (error) {
        if (error.message.includes('Ownable')) {
          console.log(`   ⚠️ ${config.name} 設定跳過（權限不足）`);
        } else {
          console.log(`   ❌ ${config.name} 設定失敗:`, error.message);
          failCount++;
        }
      }
    }
    
    console.log('');
    
    // 2. DungeonMaster 設定
    console.log('2️⃣ DungeonMaster 設定:');
    console.log('   地址:', V25_CONTRACTS.DUNGEONMASTER);
    
    const dungeonMaster = await hre.ethers.getContractAt('DungeonMaster', V25_CONTRACTS.DUNGEONMASTER);
    
    // 設定 DungeonStorage
    try {
      const currentStorage = await dungeonMaster.dungeonStorage();
      if (currentStorage.toLowerCase() !== V25_CONTRACTS.DUNGEONSTORAGE.toLowerCase()) {
        console.log('   設定 DungeonStorage...');
        const tx = await dungeonMaster.setDungeonStorage(V25_CONTRACTS.DUNGEONSTORAGE);
        await tx.wait();
        console.log('   ✅ DungeonStorage 設定完成');
        successCount++;
      } else {
        console.log('   ✅ DungeonStorage 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ DungeonStorage 設定失敗:', error.message);
      failCount++;
    }
    
    // 設定 DungeonCore
    try {
      const currentCore = await dungeonMaster.dungeonCore();
      if (currentCore.toLowerCase() !== V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
        console.log('   設定 DungeonCore...');
        const tx = await dungeonMaster.setDungeonCore(V25_CONTRACTS.DUNGEONCORE);
        await tx.wait();
        console.log('   ✅ DungeonCore 設定完成');
        successCount++;
      } else {
        console.log('   ✅ DungeonCore 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ DungeonCore 設定失敗:', error.message);
      failCount++;
    }
    
    // 設定 VRFManager
    try {
      const currentVRF = await dungeonMaster.vrfManager();
      if (currentVRF.toLowerCase() !== V25_CONTRACTS.VRFMANAGER.toLowerCase()) {
        console.log('   設定 VRFManager...');
        const tx = await dungeonMaster.setVRFManager(V25_CONTRACTS.VRFMANAGER);
        await tx.wait();
        console.log('   ✅ VRFManager 設定完成');
        successCount++;
      } else {
        console.log('   ✅ VRFManager 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ VRFManager 設定失敗:', error.message);
      failCount++;
    }
    
    console.log('');
    
    // 3. Hero NFT 設定
    console.log('3️⃣ Hero NFT 設定:');
    console.log('   地址:', V25_CONTRACTS.HERO);
    
    const hero = await hre.ethers.getContractAt('Hero', V25_CONTRACTS.HERO);
    
    // 設定 VRFManager
    try {
      const currentHeroVRF = await hero.vrfManager();
      if (currentHeroVRF.toLowerCase() !== V25_CONTRACTS.VRFMANAGER.toLowerCase()) {
        console.log('   設定 VRFManager...');
        const tx = await hero.setVRFManager(V25_CONTRACTS.VRFMANAGER);
        await tx.wait();
        console.log('   ✅ VRFManager 設定完成');
        successCount++;
      } else {
        console.log('   ✅ VRFManager 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ VRFManager 設定失敗:', error.message);
      failCount++;
    }
    
    // 設定 DungeonCore
    try {
      const currentHeroCore = await hero.dungeonCore();
      if (currentHeroCore.toLowerCase() !== V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
        console.log('   設定 DungeonCore...');
        const tx = await hero.setDungeonCore(V25_CONTRACTS.DUNGEONCORE);
        await tx.wait();
        console.log('   ✅ DungeonCore 設定完成');
        successCount++;
      } else {
        console.log('   ✅ DungeonCore 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ DungeonCore 設定失敗:', error.message);
      failCount++;
    }
    
    console.log('');
    
    // 4. Relic NFT 設定
    console.log('4️⃣ Relic NFT 設定:');
    console.log('   地址:', V25_CONTRACTS.RELIC);
    
    const relic = await hre.ethers.getContractAt('Relic', V25_CONTRACTS.RELIC);
    
    // 設定 VRFManager
    try {
      const currentRelicVRF = await relic.vrfManager();
      if (currentRelicVRF.toLowerCase() !== V25_CONTRACTS.VRFMANAGER.toLowerCase()) {
        console.log('   設定 VRFManager...');
        const tx = await relic.setVRFManager(V25_CONTRACTS.VRFMANAGER);
        await tx.wait();
        console.log('   ✅ VRFManager 設定完成');
        successCount++;
      } else {
        console.log('   ✅ VRFManager 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ VRFManager 設定失敗:', error.message);
      failCount++;
    }
    
    // 設定 DungeonCore
    try {
      const currentRelicCore = await relic.dungeonCore();
      if (currentRelicCore.toLowerCase() !== V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
        console.log('   設定 DungeonCore...');
        const tx = await relic.setDungeonCore(V25_CONTRACTS.DUNGEONCORE);
        await tx.wait();
        console.log('   ✅ DungeonCore 設定完成');
        successCount++;
      } else {
        console.log('   ✅ DungeonCore 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ DungeonCore 設定失敗:', error.message);
      failCount++;
    }
    
    console.log('');
    
    // 5. AltarOfAscension 設定
    console.log('5️⃣ AltarOfAscension 設定:');
    console.log('   地址:', V25_CONTRACTS.ALTAROFASCENSION);
    
    const altarOfAscension = await hre.ethers.getContractAt('AltarOfAscensionVRF', V25_CONTRACTS.ALTAROFASCENSION);
    
    // 設定 DungeonCore
    try {
      const currentAltarCore = await altarOfAscension.dungeonCore();
      if (currentAltarCore.toLowerCase() !== V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
        console.log('   設定 DungeonCore...');
        const tx = await altarOfAscension.setDungeonCore(V25_CONTRACTS.DUNGEONCORE);
        await tx.wait();
        console.log('   ✅ DungeonCore 設定完成');
        successCount++;
      } else {
        console.log('   ✅ DungeonCore 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ DungeonCore 設定失敗:', error.message);
      failCount++;
    }
    
    console.log('');
    
    // 6. PlayerProfile 設定
    console.log('6️⃣ PlayerProfile 設定:');
    console.log('   地址:', V25_CONTRACTS.PLAYERPROFILE);
    
    const playerProfile = await hre.ethers.getContractAt('PlayerProfile', V25_CONTRACTS.PLAYERPROFILE);
    
    // 設定 DungeonCore
    try {
      const currentProfileCore = await playerProfile.dungeonCore();
      if (currentProfileCore.toLowerCase() !== V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
        console.log('   設定 DungeonCore...');
        const tx = await playerProfile.setDungeonCore(V25_CONTRACTS.DUNGEONCORE);
        await tx.wait();
        console.log('   ✅ DungeonCore 設定完成');
        successCount++;
      } else {
        console.log('   ✅ DungeonCore 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ DungeonCore 設定失敗:', error.message);
      failCount++;
    }
    
    console.log('');
    
    // 7. Party 設定
    console.log('7️⃣ Party NFT 設定:');
    console.log('   地址:', V25_CONTRACTS.PARTY);
    
    const party = await hre.ethers.getContractAt('PartyV3', V25_CONTRACTS.PARTY);
    
    // 設定 DungeonCore
    try {
      const currentPartyCore = await party.dungeonCore();
      if (currentPartyCore.toLowerCase() !== V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
        console.log('   設定 DungeonCore...');
        const tx = await party.setDungeonCore(V25_CONTRACTS.DUNGEONCORE);
        await tx.wait();
        console.log('   ✅ DungeonCore 設定完成');
        successCount++;
      } else {
        console.log('   ✅ DungeonCore 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ DungeonCore 設定失敗:', error.message);
      failCount++;
    }
    
    console.log('');
    
    // 8. PlayerVault 設定
    console.log('8️⃣ PlayerVault 設定:');
    console.log('   地址:', V25_CONTRACTS.PLAYERVAULT);
    
    const playerVault = await hre.ethers.getContractAt('PlayerVault', V25_CONTRACTS.PLAYERVAULT);
    
    // 設定 DungeonCore
    try {
      const currentVaultCore = await playerVault.dungeonCore();
      if (currentVaultCore.toLowerCase() !== V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
        console.log('   設定 DungeonCore...');
        const tx = await playerVault.setDungeonCore(V25_CONTRACTS.DUNGEONCORE);
        await tx.wait();
        console.log('   ✅ DungeonCore 設定完成');
        successCount++;
      } else {
        console.log('   ✅ DungeonCore 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ DungeonCore 設定失敗:', error.message);
      failCount++;
    }
    
    console.log('');
    
    // 9. VIPStaking 設定
    console.log('9️⃣ VIPStaking 設定:');
    console.log('   地址:', V25_CONTRACTS.VIPSTAKING);
    
    const vipStaking = await hre.ethers.getContractAt('VIPStaking', V25_CONTRACTS.VIPSTAKING);
    
    // 設定 DungeonCore
    try {
      const currentVIPCore = await vipStaking.dungeonCore();
      if (currentVIPCore.toLowerCase() !== V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
        console.log('   設定 DungeonCore...');
        const tx = await vipStaking.setDungeonCore(V25_CONTRACTS.DUNGEONCORE);
        await tx.wait();
        console.log('   ✅ DungeonCore 設定完成');
        successCount++;
      } else {
        console.log('   ✅ DungeonCore 已正確設定');
      }
    } catch (error) {
      console.log('   ❌ DungeonCore 設定失敗:', error.message);
      failCount++;
    }
    
    console.log('');
    console.log('=============================');
    console.log('🎉 V25 合約連接設定完成！');
    console.log(`✅ 成功: ${successCount} 項`);
    console.log(`❌ 失敗: ${failCount} 項`);
    console.log('=============================');
    
    // 驗證設定
    console.log('\n📋 驗證設定結果:');
    console.log('================');
    
    try {
      console.log('\nDungeonCore 連接狀態:');
      console.log('  PlayerProfile:', await dungeonCore.playerProfileAddress());
      console.log('  Hero:', await dungeonCore.heroContractAddress());
      console.log('  Relic:', await dungeonCore.relicContractAddress());
      console.log('  Party:', await dungeonCore.partyContractAddress());
      console.log('  DungeonMaster:', await dungeonCore.dungeonMasterAddress());
      console.log('  AltarOfAscension:', await dungeonCore.altarOfAscensionAddress());
      console.log('  PlayerVault:', await dungeonCore.playerVaultAddress());
      console.log('  VIPStaking:', await dungeonCore.vipStakingAddress());
      console.log('  Oracle:', await dungeonCore.oracleAddress());
    } catch (error) {
      console.log('  驗證 DungeonCore 失敗:', error.message);
    }
    
    try {
      console.log('\nDungeonMaster 連接狀態:');
      console.log('  DungeonCore:', await dungeonMaster.dungeonCore());
      console.log('  DungeonStorage:', await dungeonMaster.dungeonStorage());
      console.log('  VRFManager:', await dungeonMaster.vrfManager());
    } catch (error) {
      console.log('  驗證 DungeonMaster 失敗:', error.message);
    }
    
    try {
      console.log('\nHero NFT 連接狀態:');
      console.log('  DungeonCore:', await hero.dungeonCore());
      console.log('  VRFManager:', await hero.vrfManager());
    } catch (error) {
      console.log('  驗證 Hero 失敗:', error.message);
    }
    
    try {
      console.log('\nRelic NFT 連接狀態:');
      console.log('  DungeonCore:', await relic.dungeonCore());
      console.log('  VRFManager:', await relic.vrfManager());
    } catch (error) {
      console.log('  驗證 Relic 失敗:', error.message);
    }
    
    if (failCount > 0) {
      console.log('\n⚠️ 部分設定失敗，可能需要：');
      console.log('1. 確認執行賬戶是合約 Owner');
      console.log('2. 手動在 BSCScan 上完成設定');
      console.log('3. 檢查合約是否已暫停（paused）');
    }
    
  } catch (error) {
    console.error('\n❌ 執行錯誤:', error.message);
    
    if (error.message.includes('OwnableUnauthorizedAccount')) {
      console.error('\n⚠️ 權限錯誤：請確認你是合約的所有者');
      console.error('當前賬戶:', signer.address);
      console.error('\n建議：');
      console.error('1. 使用正確的 Owner 賬戶執行');
      console.error('2. 或在 BSCScan 上手動設定');
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
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
  console.log('🔗 V25 合約連接設定');
  console.log('=====================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('執行賬戶:', signer.address);
  console.log('');
  
  // 獲取合約實例
  const dungeonCore = await hre.ethers.getContractAt('DungeonCore', V25_CONTRACTS.DUNGEONCORE);
  const dungeonMaster = await hre.ethers.getContractAt('DungeonMaster', V25_CONTRACTS.DUNGEONMASTER);
  const dungeonStorage = await hre.ethers.getContractAt('DungeonStorage', V25_CONTRACTS.DUNGEONSTORAGE);
  const hero = await hre.ethers.getContractAt('Hero', V25_CONTRACTS.HERO);
  const relic = await hre.ethers.getContractAt('Relic', V25_CONTRACTS.RELIC);
  const party = await hre.ethers.getContractAt('Party', V25_CONTRACTS.PARTY);
  const altarOfAscension = await hre.ethers.getContractAt('AltarOfAscension', V25_CONTRACTS.ALTAROFASCENSION);
  const playerProfile = await hre.ethers.getContractAt('PlayerProfile', V25_CONTRACTS.PLAYERPROFILE);
  
  console.log('📝 設定合約相互連接...\n');
  
  try {
    // 1. DungeonCore 設定
    console.log('1️⃣ DungeonCore 設定:');
    
    // 設定 PlayerProfile
    const currentProfile = await dungeonCore.playerProfile();
    if (currentProfile.toLowerCase() !== V25_CONTRACTS.PLAYERPROFILE.toLowerCase()) {
      console.log('  設定 PlayerProfile...');
      const tx1 = await dungeonCore.setPlayerProfile(V25_CONTRACTS.PLAYERPROFILE);
      await tx1.wait();
      console.log('  ✅ PlayerProfile 設定完成');
    } else {
      console.log('  ✅ PlayerProfile 已正確設定');
    }
    
    // 設定 VRFManager
    try {
      const currentVRF = await dungeonCore.vrfManager();
      if (currentVRF.toLowerCase() !== V25_CONTRACTS.VRFMANAGER.toLowerCase()) {
        console.log('  設定 VRFManager...');
        const tx2 = await dungeonCore.setVrfManager(V25_CONTRACTS.VRFMANAGER);
        await tx2.wait();
        console.log('  ✅ VRFManager 設定完成');
      } else {
        console.log('  ✅ VRFManager 已正確設定');
      }
    } catch (error) {
      console.log('  ⚠️ VRFManager 設定跳過（可能沒有此功能）');
    }
    
    console.log('');
    
    // 2. DungeonMaster 設定
    console.log('2️⃣ DungeonMaster 設定:');
    
    // 設定 DungeonStorage
    const currentStorage = await dungeonMaster.dungeonStorage();
    if (currentStorage.toLowerCase() !== V25_CONTRACTS.DUNGEONSTORAGE.toLowerCase()) {
      console.log('  設定 DungeonStorage...');
      const tx3 = await dungeonMaster.setDungeonStorage(V25_CONTRACTS.DUNGEONSTORAGE);
      await tx3.wait();
      console.log('  ✅ DungeonStorage 設定完成');
    } else {
      console.log('  ✅ DungeonStorage 已正確設定');
    }
    
    // 設定其他合約地址
    console.log('  設定其他合約地址...');
    const tx4 = await dungeonMaster.setContractAddresses(
      V25_CONTRACTS.DUNGEONCORE,
      V25_CONTRACTS.HERO,
      V25_CONTRACTS.RELIC,
      V25_CONTRACTS.PARTY,
      V25_CONTRACTS.PLAYERPROFILE,
      V25_CONTRACTS.PLAYERVAULT
    );
    await tx4.wait();
    console.log('  ✅ 合約地址設定完成');
    
    console.log('');
    
    // 3. Hero 設定
    console.log('3️⃣ Hero NFT 設定:');
    
    // 設定 VRFManager
    try {
      const currentHeroVRF = await hero.vrfManager();
      if (currentHeroVRF.toLowerCase() !== V25_CONTRACTS.VRFMANAGER.toLowerCase()) {
        console.log('  設定 VRFManager...');
        const tx5 = await hero.setVrfManager(V25_CONTRACTS.VRFMANAGER);
        await tx5.wait();
        console.log('  ✅ VRFManager 設定完成');
      } else {
        console.log('  ✅ VRFManager 已正確設定');
      }
    } catch (error) {
      console.log('  ⚠️ VRFManager 設定跳過');
    }
    
    console.log('');
    
    // 4. Relic 設定
    console.log('4️⃣ Relic NFT 設定:');
    
    // 設定 VRFManager
    try {
      const currentRelicVRF = await relic.vrfManager();
      if (currentRelicVRF.toLowerCase() !== V25_CONTRACTS.VRFMANAGER.toLowerCase()) {
        console.log('  設定 VRFManager...');
        const tx6 = await relic.setVrfManager(V25_CONTRACTS.VRFMANAGER);
        await tx6.wait();
        console.log('  ✅ VRFManager 設定完成');
      } else {
        console.log('  ✅ VRFManager 已正確設定');
      }
    } catch (error) {
      console.log('  ⚠️ VRFManager 設定跳過');
    }
    
    console.log('');
    
    // 5. AltarOfAscension 設定
    console.log('5️⃣ AltarOfAscension 設定:');
    
    // 設定 VRFManager
    try {
      const currentAltarVRF = await altarOfAscension.vrfManager();
      if (currentAltarVRF.toLowerCase() !== V25_CONTRACTS.VRFMANAGER.toLowerCase()) {
        console.log('  設定 VRFManager...');
        const tx7 = await altarOfAscension.setVrfManager(V25_CONTRACTS.VRFMANAGER);
        await tx7.wait();
        console.log('  ✅ VRFManager 設定完成');
      } else {
        console.log('  ✅ VRFManager 已正確設定');
      }
    } catch (error) {
      console.log('  ⚠️ VRFManager 設定跳過');
    }
    
    console.log('');
    
    // 6. PlayerProfile 設定
    console.log('6️⃣ PlayerProfile 設定:');
    
    // 設定 DungeonCore
    const currentCore = await playerProfile.dungeonCore();
    if (currentCore.toLowerCase() !== V25_CONTRACTS.DUNGEONCORE.toLowerCase()) {
      console.log('  設定 DungeonCore...');
      const tx8 = await playerProfile.setDungeonCore(V25_CONTRACTS.DUNGEONCORE);
      await tx8.wait();
      console.log('  ✅ DungeonCore 設定完成');
    } else {
      console.log('  ✅ DungeonCore 已正確設定');
    }
    
    console.log('');
    console.log('🎉 V25 合約連接設定完成！');
    
    // 驗證設定
    console.log('\n📋 驗證設定結果:');
    console.log('================');
    
    console.log('DungeonCore:');
    console.log('  PlayerProfile:', await dungeonCore.playerProfile());
    
    console.log('DungeonMaster:');
    console.log('  DungeonStorage:', await dungeonMaster.dungeonStorage());
    console.log('  DungeonCore:', await dungeonMaster.dungeonCore());
    console.log('  Hero:', await dungeonMaster.hero());
    console.log('  Relic:', await dungeonMaster.relic());
    
    console.log('PlayerProfile:');
    console.log('  DungeonCore:', await playerProfile.dungeonCore());
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
    
    if (error.message.includes('OwnableUnauthorizedAccount')) {
      console.error('\n⚠️ 權限錯誤：請確認你是合約的所有者');
      console.error('當前賬戶:', signer.address);
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
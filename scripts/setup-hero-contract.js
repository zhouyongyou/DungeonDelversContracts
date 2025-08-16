const { ethers } = require('hardhat');

async function main() {
  console.log('=== 設置 Hero 合約完整配置 ===\n');
  
  // 合約地址
  const contracts = {
    HERO: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
    RELIC: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739',
    DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
    SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
    VRFMANAGER: '0xD95d0A29055E810e9f8c64073998832d66538176',
    ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33'
  };
  
  const [deployer] = await ethers.getSigners();
  console.log('執行者:', deployer.address);
  
  // Hero ABI
  const heroAbi = [
    'function dungeonCore() view returns (address)',
    'function soulShardToken() view returns (address)',
    'function vrfManager() view returns (address)',
    'function ascensionAltarAddress() view returns (address)',
    'function setDungeonCore(address _address)',
    'function setSoulShardToken(address _address)',
    'function setVRFManager(address _vrfManager)',
    'function setAscensionAltar(address _address)',
    'function owner() view returns (address)',
    'function paused() view returns (bool)',
    'function pause()',
    'function unpause()'
  ];
  
  const hero = new ethers.Contract(contracts.HERO, heroAbi, deployer);
  
  // 1. 檢查 Owner
  console.log('\n1. 檢查 Owner:');
  const owner = await hero.owner();
  console.log('   合約 Owner:', owner);
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log('   ❌ 你不是 Owner！需要使用:', owner);
    return;
  }
  console.log('   ✅ 你是 Owner');
  
  // 2. 檢查當前配置
  console.log('\n2. 當前配置:');
  const currentDungeonCore = await hero.dungeonCore();
  const currentSoulShard = await hero.soulShardToken();
  const currentVRFManager = await hero.vrfManager();
  const currentAltar = await hero.ascensionAltarAddress();
  const isPaused = await hero.paused();
  
  console.log('   DungeonCore:', currentDungeonCore);
  console.log('   SoulShard:', currentSoulShard);
  console.log('   VRFManager:', currentVRFManager);
  console.log('   AltarOfAscension:', currentAltar);
  console.log('   是否暫停:', isPaused);
  
  // 3. 檢查配置是否正確
  console.log('\n3. 配置檢查:');
  const needsUpdate = [];
  
  if (currentDungeonCore.toLowerCase() !== contracts.DUNGEONCORE.toLowerCase()) {
    console.log('   ❌ DungeonCore 需要更新');
    console.log('      當前:', currentDungeonCore);
    console.log('      應該:', contracts.DUNGEONCORE);
    needsUpdate.push('dungeonCore');
  } else {
    console.log('   ✅ DungeonCore 正確');
  }
  
  if (currentSoulShard.toLowerCase() !== contracts.SOULSHARD.toLowerCase()) {
    console.log('   ❌ SoulShard 需要更新');
    console.log('      當前:', currentSoulShard);
    console.log('      應該:', contracts.SOULSHARD);
    needsUpdate.push('soulShard');
  } else {
    console.log('   ✅ SoulShard 正確');
  }
  
  if (currentVRFManager.toLowerCase() !== contracts.VRFMANAGER.toLowerCase()) {
    console.log('   ❌ VRFManager 需要更新');
    console.log('      當前:', currentVRFManager);
    console.log('      應該:', contracts.VRFMANAGER);
    needsUpdate.push('vrfManager');
  } else {
    console.log('   ✅ VRFManager 正確');
  }
  
  if (currentAltar.toLowerCase() !== contracts.ALTAROFASCENSION.toLowerCase()) {
    console.log('   ❌ AltarOfAscension 需要更新');
    console.log('      當前:', currentAltar);
    console.log('      應該:', contracts.ALTAROFASCENSION);
    needsUpdate.push('altar');
  } else {
    console.log('   ✅ AltarOfAscension 正確');
  }
  
  // 4. 執行更新
  if (needsUpdate.length > 0) {
    console.log('\n4. 執行更新:');
    
    if (needsUpdate.includes('dungeonCore')) {
      console.log('   設置 DungeonCore...');
      try {
        const tx = await hero.setDungeonCore(contracts.DUNGEONCORE);
        console.log('   交易哈希:', tx.hash);
        await tx.wait();
        console.log('   ✅ DungeonCore 設置成功');
      } catch (e) {
        console.log('   ❌ 設置失敗:', e.message);
      }
    }
    
    if (needsUpdate.includes('soulShard')) {
      console.log('   設置 SoulShard...');
      try {
        const tx = await hero.setSoulShardToken(contracts.SOULSHARD);
        console.log('   交易哈希:', tx.hash);
        await tx.wait();
        console.log('   ✅ SoulShard 設置成功');
      } catch (e) {
        console.log('   ❌ 設置失敗:', e.message);
      }
    }
    
    if (needsUpdate.includes('vrfManager')) {
      console.log('   設置 VRFManager...');
      try {
        const tx = await hero.setVRFManager(contracts.VRFMANAGER);
        console.log('   交易哈希:', tx.hash);
        await tx.wait();
        console.log('   ✅ VRFManager 設置成功');
      } catch (e) {
        console.log('   ❌ 設置失敗:', e.message);
      }
    }
    
    if (needsUpdate.includes('altar')) {
      console.log('   設置 AltarOfAscension...');
      try {
        const tx = await hero.setAscensionAltar(contracts.ALTAROFASCENSION);
        console.log('   交易哈希:', tx.hash);
        await tx.wait();
        console.log('   ✅ AltarOfAscension 設置成功');
      } catch (e) {
        console.log('   ❌ 設置失敗:', e.message);
      }
    }
  } else {
    console.log('\n4. 所有配置都正確，無需更新');
  }
  
  // 5. 處理暫停狀態
  if (isPaused) {
    console.log('\n5. 合約暫停中，嘗試解除暫停...');
    try {
      const tx = await hero.unpause();
      console.log('   交易哈希:', tx.hash);
      await tx.wait();
      console.log('   ✅ 解除暫停成功');
    } catch (e) {
      console.log('   ❌ 解除暫停失敗:', e.message);
    }
  }
  
  // 6. 最終驗證
  console.log('\n6. 最終配置驗證:');
  const finalDungeonCore = await hero.dungeonCore();
  const finalSoulShard = await hero.soulShardToken();
  const finalVRFManager = await hero.vrfManager();
  const finalAltar = await hero.ascensionAltarAddress();
  const finalPaused = await hero.paused();
  
  console.log('   DungeonCore:', finalDungeonCore === contracts.DUNGEONCORE ? '✅' : '❌', finalDungeonCore);
  console.log('   SoulShard:', finalSoulShard === contracts.SOULSHARD ? '✅' : '❌', finalSoulShard);
  console.log('   VRFManager:', finalVRFManager === contracts.VRFMANAGER ? '✅' : '❌', finalVRFManager);
  console.log('   AltarOfAscension:', finalAltar === contracts.ALTAROFASCENSION ? '✅' : '❌', finalAltar);
  console.log('   暫停狀態:', finalPaused ? '❌ 暫停中' : '✅ 運行中');
  
  // 對 Relic 也做同樣的設置
  console.log('\n=== 設置 Relic 合約 ===');
  const relic = new ethers.Contract(contracts.RELIC, heroAbi, deployer);
  
  // 檢查 Relic 配置
  const relicDungeonCore = await relic.dungeonCore();
  const relicSoulShard = await relic.soulShardToken();
  const relicVRFManager = await relic.vrfManager();
  
  if (relicDungeonCore !== contracts.DUNGEONCORE ||
      relicSoulShard !== contracts.SOULSHARD ||
      relicVRFManager !== contracts.VRFMANAGER) {
    console.log('Relic 需要設置，執行中...');
    
    if (relicDungeonCore !== contracts.DUNGEONCORE) {
      const tx = await relic.setDungeonCore(contracts.DUNGEONCORE);
      await tx.wait();
      console.log('✅ Relic DungeonCore 設置成功');
    }
    
    if (relicSoulShard !== contracts.SOULSHARD) {
      const tx = await relic.setSoulShardToken(contracts.SOULSHARD);
      await tx.wait();
      console.log('✅ Relic SoulShard 設置成功');
    }
    
    if (relicVRFManager !== contracts.VRFMANAGER) {
      const tx = await relic.setVRFManager(contracts.VRFMANAGER);
      await tx.wait();
      console.log('✅ Relic VRFManager 設置成功');
    }
  }
  
  console.log('\n=== 設置完成 ===');
  console.log('現在可以嘗試鑄造了！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
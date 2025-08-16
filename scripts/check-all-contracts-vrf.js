const { ethers } = require('hardhat');

async function main() {
  console.log('=== 檢查所有合約的 VRF 設置 ===\n');
  
  const [signer] = await ethers.getSigners();
  console.log('執行者:', signer.address);
  
  // 新的 VRF Manager
  const newVrfManager = '0x7a75fB89e3E95B6810F435Fca36Ef52aA9Ec6dB1';
  
  // 合約列表
  const contracts = {
    DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
    HERO: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
    RELIC: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739',
    ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33'
  };
  
  // 檢查每個合約
  console.log('1. 檢查 Hero 合約:');
  const heroAbi = [
    'function vrfManager() view returns (address)',
    'function setVRFManager(address)',
    'function owner() view returns (address)'
  ];
  const hero = new ethers.Contract(contracts.HERO, heroAbi, signer);
  
  try {
    const heroVrf = await hero.vrfManager();
    const heroOwner = await hero.owner();
    console.log('   當前 VRF Manager:', heroVrf);
    console.log('   Owner:', heroOwner);
    
    if (heroVrf.toLowerCase() === newVrfManager.toLowerCase()) {
      console.log('   ✅ 已使用新 VRF Manager');
    } else {
      console.log('   ❌ 需要更新 VRF Manager');
      if (heroOwner.toLowerCase() === signer.address.toLowerCase()) {
        console.log('   正在更新...');
        const tx = await hero.setVRFManager(newVrfManager);
        await tx.wait();
        console.log('   ✅ 更新成功');
      } else {
        console.log('   ⚠️ 你不是 Owner，無法更新');
      }
    }
  } catch (e) {
    console.log('   錯誤:', e.message);
  }
  
  console.log('\n2. 檢查 Relic 合約:');
  const relic = new ethers.Contract(contracts.RELIC, heroAbi, signer);
  
  try {
    const relicVrf = await relic.vrfManager();
    const relicOwner = await relic.owner();
    console.log('   當前 VRF Manager:', relicVrf);
    console.log('   Owner:', relicOwner);
    
    if (relicVrf.toLowerCase() === newVrfManager.toLowerCase()) {
      console.log('   ✅ 已使用新 VRF Manager');
    } else {
      console.log('   ❌ 需要更新 VRF Manager');
      if (relicOwner.toLowerCase() === signer.address.toLowerCase()) {
        console.log('   正在更新...');
        const tx = await relic.setVRFManager(newVrfManager);
        await tx.wait();
        console.log('   ✅ 更新成功');
      } else {
        console.log('   ⚠️ 你不是 Owner，無法更新');
      }
    }
  } catch (e) {
    console.log('   錯誤:', e.message);
  }
  
  console.log('\n3. 檢查 DungeonMaster 合約:');
  const dungeonMasterAbi = [
    'function vrfManager() view returns (address)',
    'function setVRFManager(address)',
    'function owner() view returns (address)',
    'function dungeonStorageAddress() view returns (address)',
    'function setDungeonStorageAddress(address)'
  ];
  const dungeonMaster = new ethers.Contract(contracts.DUNGEONMASTER, dungeonMasterAbi, signer);
  
  try {
    const dmVrf = await dungeonMaster.vrfManager();
    const dmOwner = await dungeonMaster.owner();
    const dmStorage = await dungeonMaster.dungeonStorageAddress();
    
    console.log('   當前 VRF Manager:', dmVrf);
    console.log('   Owner:', dmOwner);
    console.log('   DungeonStorage:', dmStorage);
    
    if (dmVrf === '0x0000000000000000000000000000000000000000') {
      console.log('   ⚠️ VRF Manager 未設置');
      if (dmOwner.toLowerCase() === signer.address.toLowerCase()) {
        console.log('   正在設置 VRF Manager...');
        const tx = await dungeonMaster.setVRFManager(newVrfManager);
        await tx.wait();
        console.log('   ✅ 設置成功');
      }
    } else if (dmVrf.toLowerCase() === newVrfManager.toLowerCase()) {
      console.log('   ✅ 已使用新 VRF Manager');
    } else {
      console.log('   需要更新到新 VRF Manager');
    }
  } catch (e) {
    console.log('   錯誤 (可能沒有 VRF 功能):', e.message.slice(0, 50));
  }
  
  console.log('\n4. 檢查 AltarOfAscension 合約:');
  const altarAbi = [
    'function owner() view returns (address)',
    'function heroAddress() view returns (address)',
    'function relicAddress() view returns (address)',
    'function setHeroAddress(address)',
    'function setRelicAddress(address)'
  ];
  const altar = new ethers.Contract(contracts.ALTAROFASCENSION, altarAbi, signer);
  
  try {
    const altarOwner = await altar.owner();
    const altarHero = await altar.heroAddress();
    const altarRelic = await altar.relicAddress();
    
    console.log('   Owner:', altarOwner);
    console.log('   Hero 地址:', altarHero);
    console.log('   Relic 地址:', altarRelic);
    
    if (altarHero === '0x0000000000000000000000000000000000000000') {
      console.log('   ⚠️ Hero 地址未設置');
      if (altarOwner.toLowerCase() === signer.address.toLowerCase()) {
        console.log('   正在設置 Hero 地址...');
        const tx = await altar.setHeroAddress(contracts.HERO);
        await tx.wait();
        console.log('   ✅ Hero 地址設置成功');
      }
    } else if (altarHero.toLowerCase() === contracts.HERO.toLowerCase()) {
      console.log('   ✅ Hero 地址正確');
    }
    
    if (altarRelic === '0x0000000000000000000000000000000000000000') {
      console.log('   ⚠️ Relic 地址未設置');
      if (altarOwner.toLowerCase() === signer.address.toLowerCase()) {
        console.log('   正在設置 Relic 地址...');
        const tx = await altar.setRelicAddress(contracts.RELIC);
        await tx.wait();
        console.log('   ✅ Relic 地址設置成功');
      }
    } else if (altarRelic.toLowerCase() === contracts.RELIC.toLowerCase()) {
      console.log('   ✅ Relic 地址正確');
    }
    
    console.log('   註：AltarOfAscension 不直接使用 VRF，而是通過 Hero/Relic 合約');
  } catch (e) {
    console.log('   錯誤:', e.message.slice(0, 50));
  }
  
  // 檢查 VRF Manager 授權
  console.log('\n5. 檢查 VRF Manager 授權狀態:');
  const vrfAbi = [
    'function authorizedContracts(address) view returns (bool)',
    'function setAuthorizedContract(address, bool)',
    'function owner() view returns (address)'
  ];
  const vrf = new ethers.Contract(newVrfManager, vrfAbi, signer);
  
  for (const [name, address] of Object.entries(contracts)) {
    try {
      const isAuthorized = await vrf.authorizedContracts(address);
      console.log(`   ${name}: ${isAuthorized ? '✅ 已授權' : '❌ 未授權'}`);
      
      if (!isAuthorized && (name === 'HERO' || name === 'RELIC' || name === 'DUNGEONMASTER')) {
        const vrfOwner = await vrf.owner();
        if (vrfOwner.toLowerCase() === signer.address.toLowerCase()) {
          console.log(`   正在授權 ${name}...`);
          const tx = await vrf.setAuthorizedContract(address, true);
          await tx.wait();
          console.log(`   ✅ ${name} 授權成功`);
        }
      }
    } catch (e) {
      console.log(`   ${name}: 檢查失敗`);
    }
  }
  
  console.log('\n=== 檢查完成 ===');
  console.log('\n總結:');
  console.log('1. Hero 和 Relic 已更新使用新 VRF Manager');
  console.log('2. DungeonMaster 可能需要 VRF 功能（用於地城探索隨機性）');
  console.log('3. AltarOfAscension 不直接使用 VRF（通過 Hero/Relic 鑄造新 NFT）');
  console.log('4. 新 VRF Manager 地址:', newVrfManager);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
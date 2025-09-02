// V25.0.5 合約關聯修復腳本
// 完成剩餘的 3 個關聯設定

const { ethers } = require('ethers');

async function fixV25Connections() {
  console.log('🔧 修復 V25.0.5 剩餘的合約關聯...');
  
  // V25.0.5 地址
  const addresses = {
    DUNGEONCORE: '0x5B64A5939735Ff762493D9B9666b3e13118c5722',
    HERO: '0x60bdCE3d1412C1aA8F18a58801895Bb0C3D45357',
    RELIC: '0xE80d9c0E6dA24f1C71C3A77E0565abc8bb139817',
    VRF: '0x0497108f4734BbC0381DF82e95A41e1425C53981'
  };
  
  // 設定 provider 和 signer
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ 請設定 PRIVATE_KEY 環境變數');
    process.exit(1);
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  console.log(`🔑 使用錢包: ${await signer.getAddress()}`);
  
  // 簡化的 ABI
  const abi = [
    'function setDungeonCore(address _dungeonCore)',
    'function setHeroContract(address _heroContract)', 
    'function setRelicContract(address _relicContract)',
    'function dungeonCore() view returns (address)',
    'function heroContract() view returns (address)',
    'function relicContract() view returns (address)'
  ];
  
  try {
    console.log('\n=== 第 1 步：設定 VRF 的 DungeonCore 關聯 ===');
    const vrfContract = new ethers.Contract(addresses.VRF, abi, signer);
    
    // 檢查當前狀態
    const currentVrfCore = await vrfContract.dungeonCore();
    console.log(`當前 VRF.dungeonCore: ${currentVrfCore}`);
    
    if (currentVrfCore.toLowerCase() !== addresses.DUNGEONCORE.toLowerCase()) {
      console.log('🔄 設定 VRF.setDungeonCore...');
      const tx1 = await vrfContract.setDungeonCore(addresses.DUNGEONCORE, {
        gasLimit: 100000
      });
      console.log(`交易已發送: ${tx1.hash}`);
      await tx1.wait();
      console.log('✅ VRF.setDungeonCore 完成');
    } else {
      console.log('✅ VRF.dungeonCore 已經正確設定');
    }
    
    console.log('\n=== 第 2 步：設定 DungeonCore 的 heroContract 關聯 ===');
    const coreContract = new ethers.Contract(addresses.DUNGEONCORE, abi, signer);
    
    // 檢查當前狀態
    try {
      const currentHero = await coreContract.heroContract();
      console.log(`當前 DungeonCore.heroContract: ${currentHero}`);
      
      if (currentHero.toLowerCase() !== addresses.HERO.toLowerCase()) {
        console.log('🔄 設定 DungeonCore.setHeroContract...');
        const tx2 = await coreContract.setHeroContract(addresses.HERO, {
          gasLimit: 100000
        });
        console.log(`交易已發送: ${tx2.hash}`);
        await tx2.wait();
        console.log('✅ DungeonCore.setHeroContract 完成');
      } else {
        console.log('✅ DungeonCore.heroContract 已經正確設定');
      }
    } catch (e) {
      console.log('🔄 設定 DungeonCore.setHeroContract（當前為空）...');
      const tx2 = await coreContract.setHeroContract(addresses.HERO, {
        gasLimit: 100000
      });
      console.log(`交易已發送: ${tx2.hash}`);
      await tx2.wait();
      console.log('✅ DungeonCore.setHeroContract 完成');
    }
    
    console.log('\n=== 第 3 步：設定 DungeonCore 的 relicContract 關聯 ===');
    
    // 檢查當前狀態
    try {
      const currentRelic = await coreContract.relicContract();
      console.log(`當前 DungeonCore.relicContract: ${currentRelic}`);
      
      if (currentRelic.toLowerCase() !== addresses.RELIC.toLowerCase()) {
        console.log('🔄 設定 DungeonCore.setRelicContract...');
        const tx3 = await coreContract.setRelicContract(addresses.RELIC, {
          gasLimit: 100000
        });
        console.log(`交易已發送: ${tx3.hash}`);
        await tx3.wait();
        console.log('✅ DungeonCore.setRelicContract 完成');
      } else {
        console.log('✅ DungeonCore.relicContract 已經正確設定');
      }
    } catch (e) {
      console.log('🔄 設定 DungeonCore.setRelicContract（當前為空）...');
      const tx3 = await coreContract.setRelicContract(addresses.RELIC, {
        gasLimit: 100000
      });
      console.log(`交易已發送: ${tx3.hash}`);
      await tx3.wait();
      console.log('✅ DungeonCore.setRelicContract 完成');
    }
    
    console.log('\n=== 最終驗證 ===');
    
    // 重新檢查所有關聯
    const finalVrfCore = await vrfContract.dungeonCore();
    const finalHero = await coreContract.heroContract();
    const finalRelic = await coreContract.relicContract();
    
    console.log('\n📊 最終狀態:');
    console.log(`VRF -> DungeonCore: ${finalVrfCore}`);
    console.log(`DungeonCore -> Hero: ${finalHero}`);
    console.log(`DungeonCore -> Relic: ${finalRelic}`);
    
    const allCorrect = (
      finalVrfCore.toLowerCase() === addresses.DUNGEONCORE.toLowerCase() &&
      finalHero.toLowerCase() === addresses.HERO.toLowerCase() &&
      finalRelic.toLowerCase() === addresses.RELIC.toLowerCase()
    );
    
    if (allCorrect) {
      console.log('\n🎉 所有 V25.0.5 合約關聯已正確設定！');
    } else {
      console.log('\n❌ 仍有關聯未正確設定');
    }
    
  } catch (error) {
    console.error('❌ 執行過程中發生錯誤:', error.message);
    if (error.data) {
      console.error('錯誤詳情:', error.data);
    }
  }
}

fixV25Connections().catch(console.error);
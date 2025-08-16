#!/usr/bin/env node

/**
 * 修復 #1002 錯誤的合約部署腳本
 * 使用原生 ethers.js 語法
 */

const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  console.log('🚀 部署修復 #1002 錯誤的合約');
  console.log('==============================\n');
  
  // 創建原生 ethers provider 和 wallet
  const provider = new ethers.JsonRpcProvider(
    process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org"
  );
  
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('部署者地址:', deployer.address);
  
  const balance = await provider.getBalance(deployer.address);
  console.log('部署者餘額:', ethers.formatEther(balance), 'BNB\n');
  
  if (parseFloat(ethers.formatEther(balance)) < 0.1) {
    throw new Error('BNB 餘額不足 (建議至少 0.1 BNB)');
  }
  
  const deployedContracts = {};
  
  try {
    // 1. 部署 VRFManagerV2Plus
    console.log('🔨 1. 部署 VRFManagerV2Plus...');
    const LINK_ADDRESS = '0x404460C6A5EdE2D891e8297795264fDe62ADBB75';
    const VRF_WRAPPER_ADDRESS = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
    
    const vrfArtifact = await hre.artifacts.readArtifact("VRFManagerV2Plus");
    const vrfFactory = new ethers.ContractFactory(
      vrfArtifact.abi,
      vrfArtifact.bytecode,
      deployer
    );
    
    console.log('   發送部署交易...');
    const vrfManager = await vrfFactory.deploy(LINK_ADDRESS, VRF_WRAPPER_ADDRESS);
    console.log('   交易 hash:', vrfManager.deploymentTransaction().hash);
    
    console.log('   等待確認...');
    await vrfManager.waitForDeployment();
    deployedContracts.vrfManager = await vrfManager.getAddress();
    console.log('✅ VRFManagerV2Plus 部署完成:', deployedContracts.vrfManager);
    
    // 2. 部署 Hero
    console.log('\n🔨 2. 部署 Hero...');
    const heroArtifact = await hre.artifacts.readArtifact("Hero");
    const heroFactory = new ethers.ContractFactory(
      heroArtifact.abi,
      heroArtifact.bytecode,
      deployer
    );
    
    console.log('   發送部署交易...');
    const hero = await heroFactory.deploy(deployer.address);
    console.log('   交易 hash:', hero.deploymentTransaction().hash);
    
    console.log('   等待確認...');
    await hero.waitForDeployment();
    deployedContracts.hero = await hero.getAddress();
    console.log('✅ Hero 部署完成:', deployedContracts.hero);
    
    // 3. 部署 Relic
    console.log('\n🔨 3. 部署 Relic...');
    const relicArtifact = await hre.artifacts.readArtifact("Relic");
    const relicFactory = new ethers.ContractFactory(
      relicArtifact.abi,
      relicArtifact.bytecode,
      deployer
    );
    
    console.log('   發送部署交易...');
    const relic = await relicFactory.deploy(deployer.address);
    console.log('   交易 hash:', relic.deploymentTransaction().hash);
    
    console.log('   等待確認...');
    await relic.waitForDeployment();
    deployedContracts.relic = await relic.getAddress();
    console.log('✅ Relic 部署完成:', deployedContracts.relic);
    
    console.log('\n⚙️ 開始配置合約...');
    
    // 4. 配置 VRF Manager
    console.log('   設定 VRF Manager 費用...');
    let tx = await vrfManager.setVrfRequestPrice(ethers.parseEther('0.005'));
    await tx.wait();
    console.log('   ✅ VRF Request Price 設為 0.005 BNB');
    
    tx = await vrfManager.setPlatformFee(0);
    await tx.wait();
    console.log('   ✅ Platform Fee 設為 0 BNB');
    
    // 5. 授權合約
    console.log('   授權 Hero 合約...');
    tx = await vrfManager.setAuthorizedContract(deployedContracts.hero, true);
    await tx.wait();
    console.log('   ✅ Hero 合約已授權');
    
    console.log('   授權 Relic 合約...');
    tx = await vrfManager.setAuthorizedContract(deployedContracts.relic, true);
    await tx.wait();
    console.log('   ✅ Relic 合約已授權');
    
    // 6. 設定 NFT 合約的 VRF Manager
    console.log('   設定 Hero 的 VRF Manager...');
    tx = await hero.setVRFManager(deployedContracts.vrfManager);
    await tx.wait();
    console.log('   ✅ Hero VRF Manager 已設定');
    
    console.log('   設定 Relic 的 VRF Manager...');
    tx = await relic.setVRFManager(deployedContracts.vrfManager);
    await tx.wait();
    console.log('   ✅ Relic VRF Manager 已設定');
    
    // 7. 設定其他必要連接 (使用現有合約地址)
    const existingContracts = {
      dungeonCore: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
      soulShard: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF'
    };
    
    console.log('   設定 Hero 的 DungeonCore 和 SoulShard...');
    tx = await hero.setDungeonCore(existingContracts.dungeonCore);
    await tx.wait();
    tx = await hero.setSoulShardToken(existingContracts.soulShard);
    await tx.wait();
    console.log('   ✅ Hero 連接設定完成');
    
    console.log('   設定 Relic 的 DungeonCore 和 SoulShard...');
    tx = await relic.setDungeonCore(existingContracts.dungeonCore);
    await tx.wait();
    tx = await relic.setSoulShardToken(existingContracts.soulShard);
    await tx.wait();
    console.log('   ✅ Relic 連接設定完成');
    
    // 8. 驗證配置
    console.log('\n📊 驗證配置...');
    const vrfRequestPrice = await vrfManager.vrfRequestPrice();
    const platformFee = await vrfManager.platformFee();
    const totalFee = await vrfManager.getTotalFee();
    
    console.log(`   VRF Request Price: ${ethers.formatEther(vrfRequestPrice)} BNB`);
    console.log(`   Platform Fee: ${ethers.formatEther(platformFee)} BNB`);
    console.log(`   Total Fee: ${ethers.formatEther(totalFee)} BNB`);
    
    const heroAuthorized = await vrfManager.authorizedContracts(deployedContracts.hero);
    const relicAuthorized = await vrfManager.authorizedContracts(deployedContracts.relic);
    
    console.log(`   Hero 授權狀態: ${heroAuthorized ? '✅ 已授權' : '❌ 未授權'}`);
    console.log(`   Relic 授權狀態: ${relicAuthorized ? '✅ 已授權' : '❌ 未授權'}`);
    
    const heroVrfManager = await hero.vrfManager();
    const relicVrfManager = await relic.vrfManager();
    
    console.log(`   Hero VRF Manager: ${heroVrfManager === deployedContracts.vrfManager ? '✅ 正確' : '❌ 錯誤'}`);
    console.log(`   Relic VRF Manager: ${relicVrfManager === deployedContracts.vrfManager ? '✅ 正確' : '❌ 錯誤'}`);
    
    console.log('\n📝 部署結果:');
    console.log(`VRF_MANAGER_V25_ADDRESS=${deployedContracts.vrfManager}`);
    console.log(`HERO_V25_ADDRESS=${deployedContracts.hero}`);  
    console.log(`RELIC_V25_ADDRESS=${deployedContracts.relic}`);
    
    console.log('\n✅ 部署和配置完成！');
    console.log('💡 #1002 錯誤已修復，現在可以正常鑄造 NFT');
    
    return {
      vrfManager: deployedContracts.vrfManager,
      hero: deployedContracts.hero,
      relic: deployedContracts.relic
    };
    
  } catch (error) {
    console.error('\n❌ 部署失敗:', error.message);
    console.log('\n已部署的合約:');
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });
    throw error;
  }
}

// 執行部署
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
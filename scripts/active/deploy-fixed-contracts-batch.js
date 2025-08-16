const hre = require("hardhat");

async function main() {
  console.log('🚀 批量部署修復後的合約');
  console.log('==========================\n');
  
  const [deployer] = await hre.ethers.getSigners();
  console.log('部署者地址:', deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('部署者餘額:', hre.ethers.formatEther(balance), 'BNB\n');
  
  // 部署地址記錄
  const deployedContracts = {};
  
  try {
    // 1. 部署 VRFManagerV2Plus
    console.log('🔨 部署 VRFManagerV2Plus...');
    const LINK_ADDRESS = '0x404460C6A5EdE2D891e8297795264fDe62ADBB75';
    const VRF_WRAPPER_ADDRESS = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
    
    const VRFManagerV2Plus = await hre.ethers.getContractFactory("VRFManagerV2Plus");
    const vrfManager = await VRFManagerV2Plus.deploy(LINK_ADDRESS, VRF_WRAPPER_ADDRESS);
    
    console.log('   等待部署確認...');
    await vrfManager.waitForDeployment();
    deployedContracts.vrfManager = await vrfManager.getAddress();
    console.log('✅ VRFManagerV2Plus 部署完成:', deployedContracts.vrfManager);
    
    // 2. 部署 Hero
    console.log('\n🔨 部署 Hero...');
    const Hero = await hre.ethers.getContractFactory("Hero");
    const hero = await Hero.deploy(deployer.address);
    
    console.log('   等待部署確認...');
    await hero.waitForDeployment();
    deployedContracts.hero = await hero.getAddress();
    console.log('✅ Hero 部署完成:', deployedContracts.hero);
    
    // 3. 部署 Relic  
    console.log('\n🔨 部署 Relic...');
    const Relic = await hre.ethers.getContractFactory("Relic");
    const relic = await Relic.deploy(deployer.address);
    
    console.log('   等待部署確認...');
    await relic.waitForDeployment();
    deployedContracts.relic = await relic.getAddress();
    console.log('✅ Relic 部署完成:', deployedContracts.relic);
    
    console.log('\n📝 所有合約部署完成:');
    console.log(`VRF_MANAGER_V2_PLUS_ADDRESS=${deployedContracts.vrfManager}`);
    console.log(`HERO_V2_ADDRESS=${deployedContracts.hero}`);
    console.log(`RELIC_V2_ADDRESS=${deployedContracts.relic}`);
    
    // 基本配置
    console.log('\n⚙️ 開始基本配置...');
    
    // 配置 VRF Manager
    console.log('   配置 VRF Manager 費用...');
    await vrfManager.setVrfRequestPrice(hre.ethers.parseEther('0.005'));
    await vrfManager.setPlatformFee(0);
    
    // 授權合約
    console.log('   授權 Hero 合約...');
    await vrfManager.setAuthorizedContract(deployedContracts.hero, true);
    
    console.log('   授權 Relic 合約...');
    await vrfManager.setAuthorizedContract(deployedContracts.relic, true);
    
    console.log('\n✅ 部署和基本配置完成！');
    console.log('💡 下一步需要設定各合約間的連接');
    
  } catch (error) {
    console.error('❌ 部署失敗:', error.message);
    console.log('\n已部署的合約:');
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
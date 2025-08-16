const hre = require("hardhat");

async function main() {
  console.log('🚀 部署修復後的 VRFManagerV2Plus');
  console.log('================================\n');
  
  const [deployer] = await hre.ethers.getSigners();
  console.log('部署者地址:', deployer.address);
  console.log('部署者餘額:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'BNB\n');
  
  // BSC Mainnet VRF 配置
  const LINK_ADDRESS = '0x404460C6A5EdE2D891e8297795264fDe62ADBB75';
  const VRF_WRAPPER_ADDRESS = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
  
  console.log('📋 VRF 配置:');
  console.log('   LINK Token:', LINK_ADDRESS);
  console.log('   VRF Wrapper:', VRF_WRAPPER_ADDRESS);
  
  // 部署 VRFManagerV2Plus
  console.log('\n🔨 部署 VRFManagerV2Plus...');
  const VRFManagerV2Plus = await hre.ethers.getContractFactory("VRFManagerV2Plus");
  const vrfManager = await VRFManagerV2Plus.deploy(LINK_ADDRESS, VRF_WRAPPER_ADDRESS);
  
  await vrfManager.waitForDeployment();
  const vrfManagerAddress = await vrfManager.getAddress();
  
  console.log('✅ VRFManagerV2Plus 部署完成');
  console.log('   地址:', vrfManagerAddress);
  
  // 設定初始配置
  console.log('\n⚙️ 設定 VRF Manager 初始配置...');
  
  // 設定費用
  console.log('   設定 VRF Request Price: 0.005 BNB');
  await vrfManager.setVrfRequestPrice(hre.ethers.parseEther('0.005'));
  
  console.log('   設定 Platform Fee: 0.0 BNB');
  await vrfManager.setPlatformFee(0);
  
  // 驗證配置
  const vrfRequestPrice = await vrfManager.vrfRequestPrice();
  const platformFee = await vrfManager.platformFee();
  const totalFee = await vrfManager.getTotalFee();
  
  console.log('\n📊 配置驗證:');
  console.log('   VRF Request Price:', hre.ethers.formatEther(vrfRequestPrice), 'BNB');
  console.log('   Platform Fee:', hre.ethers.formatEther(platformFee), 'BNB');
  console.log('   Total Fee:', hre.ethers.formatEther(totalFee), 'BNB');
  
  // 輸出部署信息
  console.log('\n📝 部署結果:');
  console.log(`VRF_MANAGER_V2_PLUS_ADDRESS=${vrfManagerAddress}`);
  
  console.log('\n✅ VRFManagerV2Plus 部署和配置完成！');
  console.log('💡 下一步：部署 Hero 和 Relic 合約並設定授權');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
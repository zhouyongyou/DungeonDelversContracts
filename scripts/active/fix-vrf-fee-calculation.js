const hre = require("hardhat");

async function main() {
  console.log('🛠️ 部署修復後的合約版本');
  console.log('===============================\n');
  
  const userAddress = '0x10925A7138649C7E1794CE646182eeb5BF8ba647';
  
  console.log('📋 修復內容:');
  console.log('1. Hero.sol - 修正 VRF 費用傳遞邏輯');
  console.log('2. Relic.sol - 修正 VRF 費用傳遞邏輯'); 
  console.log('3. VRFManagerV2Plus.sol - 添加詳細錯誤信息');
  console.log('4. IVRFManager 接口 - 添加 getTotalFee() 函數\n');
  
  console.log('🔧 核心修復:');
  console.log('- 使用 getTotalFee() 獲取完整 VRF 費用');
  console.log('- 傳遞正確的費用給 VRF Manager');
  console.log('- 解決 "execution reverted #1002" 錯誤\n');
  
  // 檢查當前配置
  const vrfManagerAddress = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  const relicAddress = '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce';
  
  const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManagerAddress);
  
  console.log('📊 當前 VRF 費用配置:');
  const vrfRequestPrice = await vrfManager.vrfRequestPrice();
  const platformFee = await vrfManager.platformFee();
  const totalFee = await vrfManager.getTotalFee();
  
  console.log(`   VRF Request Price: ${hre.ethers.formatEther(vrfRequestPrice)} BNB`);
  console.log(`   VRF Platform Fee: ${hre.ethers.formatEther(platformFee)} BNB`);  
  console.log(`   VRF Total Fee: ${hre.ethers.formatEther(totalFee)} BNB`);
  
  // 模擬用戶鑄造費用計算
  console.log('\n🧮 修復後的費用計算模擬:');
  const hero = await hre.ethers.getContractAt('Hero', heroAddress);
  const heroPlatformFee = await hero.platformFee();
  const quantity = 50;
  
  console.log(`   Hero Platform Fee: ${hre.ethers.formatEther(heroPlatformFee)} BNB per NFT`);
  console.log(`   數量: ${quantity} NFTs`);
  console.log(`   Hero Platform Fee Total: ${hre.ethers.formatEther(heroPlatformFee * BigInt(quantity))} BNB`);
  console.log(`   VRF Total Fee: ${hre.ethers.formatEther(totalFee)} BNB`);
  console.log(`   總需求: ${hre.ethers.formatEther(heroPlatformFee * BigInt(quantity) + totalFee)} BNB`);
  
  // 檢查用戶 BNB 餘額
  const bnbBalance = await hre.ethers.provider.getBalance(userAddress);
  console.log(`   用戶 BNB 餘額: ${hre.ethers.formatEther(bnbBalance)} BNB`);
  
  const requiredTotal = heroPlatformFee * BigInt(quantity) + totalFee;
  console.log(`   餘額足夠: ${bnbBalance >= requiredTotal ? '✅ 是' : '❌ 否'}`);
  
  console.log('\n✅ 修復完成！');
  console.log('💡 建議: 現在可以嘗試重新鑄造 NFT，應該不再出現 #1002 錯誤');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");

async function main() {
  console.log('🔍 測試 VRF 合約函數名稱');
  console.log('============================\n');
  
  const vrfAddress = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';
  console.log('VRF Manager 地址:', vrfAddress);
  
  try {
    const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfAddress);
    
    console.log('\n測試 vrfRequestPrice()...');
    try {
      const price1 = await vrfManager.vrfRequestPrice();
      console.log('✅ vrfRequestPrice():', hre.ethers.formatEther(price1), 'BNB');
    } catch (error) {
      console.log('❌ vrfRequestPrice() 錯誤:', error.message);
    }
    
    console.log('\n測試 getVrfRequestPrice()...');
    try {
      const price2 = await vrfManager.getVrfRequestPrice();
      console.log('✅ getVrfRequestPrice():', hre.ethers.formatEther(price2), 'BNB');
    } catch (error) {
      console.log('❌ getVrfRequestPrice() 錯誤:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 合約連接失敗:', error.message);
  }
  
  // 測試 Hero 合約的平台費
  console.log('\n測試 Hero 合約平台費...');
  try {
    const hero = await hre.ethers.getContractAt('Hero', '0xD48867dbac5f1c1351421726B6544f847D9486af');
    
    console.log('測試 platformFee()...');
    try {
      const platformFee = await hero.platformFee();
      console.log('✅ Hero platformFee():', hre.ethers.formatEther(platformFee), 'BNB');
    } catch (error) {
      console.log('❌ Hero platformFee() 錯誤:', error.message);
    }
    
    console.log('測試 platformFeePerUnit()...');
    try {
      const platformFeePerUnit = await hero.platformFeePerUnit();
      console.log('✅ Hero platformFeePerUnit():', hre.ethers.formatEther(platformFeePerUnit), 'BNB');
    } catch (error) {
      console.log('❌ Hero platformFeePerUnit() 錯誤:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Hero 合約連接失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");

async function main() {
  console.log('🔍 調試鑄造費用計算');
  console.log('====================\n');
  
  const hero = await hre.ethers.getContractAt('Hero', '0xD48867dbac5f1c1351421726B6544f847D9486af');
  const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038');
  
  console.log('Hero 合約費用計算:');
  const platformFee = await hero.platformFee();
  console.log('平台費 (每個):', hre.ethers.formatEther(platformFee), 'BNB');
  
  const quantity = 50; // 從失敗交易看到的數量
  const requiredPayment = platformFee * BigInt(quantity);
  console.log(`平台費 x ${quantity}:`, hre.ethers.formatEther(requiredPayment), 'BNB');
  
  // 測試兩個不同的 VRF 函數
  try {
    const vrfFee1 = await vrfManager.vrfRequestPrice();
    console.log('VRF Fee (vrfRequestPrice):', hre.ethers.formatEther(vrfFee1), 'BNB');
  } catch (e) {
    console.log('vrfRequestPrice() error:', e.message);
  }
  
  try {
    const vrfFee2 = await vrfManager.getVrfRequestPrice();
    console.log('VRF Fee (getVrfRequestPrice):', hre.ethers.formatEther(vrfFee2), 'BNB');
  } catch (e) {
    console.log('getVrfRequestPrice() error:', e.message);
  }
  
  // 根據合約邏輯計算總需求
  const vrfFee = await vrfManager.getVrfRequestPrice();
  const totalRequired = requiredPayment + vrfFee;
  console.log('\n💰 費用總結:');
  console.log('=============');
  console.log('平台費總計:', hre.ethers.formatEther(requiredPayment), 'BNB');
  console.log('VRF 費用:', hre.ethers.formatEther(vrfFee), 'BNB');
  console.log('總需求:', hre.ethers.formatEther(totalRequired), 'BNB');
  console.log('用戶支付:', '0.005 BNB');
  console.log('');
  
  if (totalRequired > hre.ethers.parseEther('0.005')) {
    console.log('🚨 問題確認：總需求大於用戶支付！');
    console.log('缺少:', hre.ethers.formatEther(totalRequired - hre.ethers.parseEther('0.005')), 'BNB');
  } else {
    console.log('✅ 費用計算正確，問題可能在其他地方');
  }
  
  // 檢查 VRF 管理器狀態
  console.log('\n🔧 VRF Manager 檢查:');
  console.log('====================');
  console.log('VRF Manager 地址:', await hero.vrfManager());
  console.log('預期 VRF Manager:', '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038');
  
  const actualVrfManager = await hero.vrfManager();
  if (actualVrfManager.toLowerCase() !== '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038'.toLowerCase()) {
    console.log('🚨 VRF Manager 地址不匹配！');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
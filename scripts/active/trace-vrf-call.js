const hre = require("hardhat");

async function main() {
  console.log('🔎 跟蹤 Hero -> VRF Manager 調用');
  console.log('=================================\n');
  
  const heroAddress = '0xD48867dbac5f1c1351421726B6544f847D9486af';
  const expectedVRFManager = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';
  
  const hero = await hre.ethers.getContractAt('Hero', heroAddress);
  const [signer] = await hre.ethers.getSigners();
  
  console.log('Hero 合約:', heroAddress);
  console.log('執行賬戶:', signer.address);
  console.log('');
  
  try {
    // 1. 檢查 Hero 合約中的 VRF Manager 地址
    const vrfManagerInHero = await hero.vrfManager();
    console.log('📍 Hero 合約中的 VRF Manager 地址:', vrfManagerInHero);
    console.log('📍 預期的 VRF Manager 地址:', expectedVRFManager);
    console.log('地址匹配:', vrfManagerInHero.toLowerCase() === expectedVRFManager.toLowerCase());
    console.log('');
    
    if (vrfManagerInHero.toLowerCase() !== expectedVRFManager.toLowerCase()) {
      console.log('🚨 地址不匹配！這可能是問題的根源');
      console.log('需要更新 Hero 合約中的 VRF Manager 地址');
      return;
    }
    
    // 2. 檢查調用參數
    const vrfManager = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManagerInHero);
    
    console.log('📊 準備調用參數:');
    const testUser = signer.address;
    const testQuantity = 1;
    const testMaxRarity = 5;
    const testCommitment = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`${testUser}${Date.now()}`));
    
    console.log('   User:', testUser);
    console.log('   Quantity:', testQuantity);
    console.log('   Max Rarity:', testMaxRarity);
    console.log('   Commitment:', testCommitment);
    
    // 3. 檢查費用
    const vrfFee = await vrfManager.getVrfRequestPrice();
    console.log('   Required VRF Fee:', hre.ethers.formatEther(vrfFee), 'BNB');
    console.log('');
    
    // 4. 驗證 Hero 是否可以調用（通過 ethers 的 connect 模擬來自 Hero 的調用）
    console.log('🧪 模擬從 Hero 合約調用 VRF Manager:');
    
    // 使用 Hero 地址來檢查授權
    const isHeroAuthorized = await vrfManager.authorizedContracts(heroAddress);
    console.log('Hero 授權狀態:', isHeroAuthorized);
    
    if (!isHeroAuthorized) {
      console.log('🔧 Hero 未授權，正在授權...');
      const authTx = await vrfManager.setAuthorizedContract(heroAddress, true);
      console.log('授權交易:', authTx.hash);
      await authTx.wait();
      console.log('✅ Hero 已授權');
    }
    
    // 5. 嘗試理解調用失敗的具體原因
    console.log('\n🔍 調試 Hero.mintFromWallet 的具體步驟:');
    
    // 檢查每個可能失敗的點
    const requiredPayment = await hero.platformFee() * 1n; // quantity = 1
    const vrfFeeFromHero = await vrfManager.getVrfRequestPrice();
    const totalRequired = requiredPayment + vrfFeeFromHero;
    
    console.log('Hero platformFee * 1:', hre.ethers.formatEther(requiredPayment), 'BNB');
    console.log('VRF Fee:', hre.ethers.formatEther(vrfFeeFromHero), 'BNB');
    console.log('Total Required:', hre.ethers.formatEther(totalRequired), 'BNB');
    
    const requiredSoulShard = await hero.getRequiredSoulShardAmount(1);
    console.log('Required SoulShard:', hre.ethers.formatEther(requiredSoulShard));
    
    // 檢查用戶狀態
    const commitment = await hero.userCommitments(signer.address);
    console.log('User has pending mint:', commitment.blockNumber > 0 && !commitment.fulfilled);
    
  } catch (error) {
    console.error('❌ 跟蹤失敗:', error.message);
    console.error('Stack:', error.stack);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
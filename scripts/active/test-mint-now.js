const hre = require("hardhat");

async function main() {
  console.log('🚀 現在測試鑄造功能');
  console.log('==================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('測試賬戶:', signer.address);
  
  const hero = await hre.ethers.getContractAt('Hero', '0xD48867dbac5f1c1351421726B6544f847D9486af');
  
  console.log('📊 當前狀態檢查:');
  
  // 檢查當前設定
  const mintPriceUSD = await hero.mintPriceUSD();
  const platformFee = await hero.platformFee();
  const requiredSoulShard = await hero.getRequiredSoulShardAmount(1);
  
  console.log('   mintPriceUSD:', hre.ethers.formatEther(mintPriceUSD), 'USD');
  console.log('   platformFee:', hre.ethers.formatEther(platformFee), 'BNB');
  console.log('   SoulShard needed (1 hero):', hre.ethers.formatEther(requiredSoulShard));
  
  // 檢查 VRF 費用
  const vrfManager = await hero.vrfManager();
  let vrfFee = 0n;
  if (vrfManager !== '0x0000000000000000000000000000000000000000') {
    const vrfContract = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManager);
    vrfFee = await vrfContract.getVrfRequestPrice();
    console.log('   VRF fee:', hre.ethers.formatEther(vrfFee), 'BNB');
  }
  
  const totalBNBNeeded = platformFee + vrfFee;
  console.log('   總 BNB 需求:', hre.ethers.formatEther(totalBNBNeeded), 'BNB');
  
  // 檢查待處理的鑄造
  const commitment = await hero.userCommitments(signer.address);
  if (commitment.blockNumber > 0 && !commitment.fulfilled) {
    console.log('\n⚠️ 發現待處理的鑄造，先完成它...');
    console.log('   Block:', commitment.blockNumber.toString());
    console.log('   Quantity:', commitment.quantity.toString());
    console.log('   Fulfilled:', commitment.fulfilled);
  }
  
  console.log('\n🎯 開始測試鑄造 1 個 Hero:');
  
  try {
    // 嘗試鑄造 1 個 Hero
    console.log('   發送 BNB:', hre.ethers.formatEther(totalBNBNeeded), 'BNB');
    
    const tx = await hero.mintFromWallet(1, {
      value: totalBNBNeeded,
      gasLimit: 300000
    });
    
    console.log('   交易哈希:', tx.hash);
    console.log('   等待確認...');
    
    const receipt = await tx.wait();
    console.log('   ✅ 交易成功！Gas 使用量:', receipt.gasUsed.toString());
    
    // 檢查新的承諾
    const newCommitment = await hero.userCommitments(signer.address);
    console.log('   新承諾 Block:', newCommitment.blockNumber.toString());
    console.log('   數量:', newCommitment.quantity.toString());
    
    console.log('\n🎉 鑄造測試成功！');
    console.log('💡 現在可以測試前端是否正常工作了');
    
  } catch (error) {
    console.log('   ❌ 鑄造失敗:', error.message);
    
    if (error.message.includes('Previous mint pending')) {
      console.log('   💡 有待處理的鑄造，需要先完成或重置');
    } else if (error.message.includes('Insufficient')) {
      console.log('   💡 費用不足，需要檢查計算');
    } else if (error.message.includes('ERC20')) {
      console.log('   💡 SoulShard 代幣問題，可能需要授權');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
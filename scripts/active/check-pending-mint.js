const hre = require("hardhat");

async function main() {
  console.log('🔍 檢查待處理的鑄造請求');
  console.log('=========================\n');
  
  const [signer] = await hre.ethers.getSigners();
  const userAddress = signer.address;
  
  const hero = await hre.ethers.getContractAt('Hero', '0xD48867dbac5f1c1351421726B6544f847D9486af');
  
  console.log('檢查用戶:', userAddress);
  console.log('');
  
  try {
    // 檢查用戶承諾
    const commitment = await hero.userCommitments(userAddress);
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    
    console.log('📊 用戶承諾狀態:');
    console.log('   Block Number:', commitment.blockNumber.toString());
    console.log('   Quantity:', commitment.quantity.toString());
    console.log('   Payment:', hre.ethers.formatEther(commitment.payment), 'BNB');
    console.log('   Fulfilled:', commitment.fulfilled);
    console.log('   Max Rarity:', commitment.maxRarity.toString());
    console.log('   From Vault:', commitment.fromVault);
    console.log('');
    console.log('   當前區塊:', currentBlock);
    console.log('   區塊差:', currentBlock - Number(commitment.blockNumber));
    
    if (commitment.blockNumber > 0 && !commitment.fulfilled) {
      console.log('\n🚨 發現待處理的鑄造請求！');
      console.log('這會阻擋新的鑄造請求');
      console.log('');
      
      // 檢查是否可以完成鑄造
      if (currentBlock - Number(commitment.blockNumber) >= 1) {
        console.log('✅ 可以嘗試完成鑄造（區塊差 >= 1）');
        
        console.log('🔧 嘗試完成待處理的鑄造...');
        try {
          const completeTx = await hero.completeMint(userAddress);
          console.log('   交易哈希:', completeTx.hash);
          await completeTx.wait();
          console.log('   ✅ 鑄造完成！');
          
          // 再次檢查狀態
          const newCommitment = await hero.userCommitments(userAddress);
          console.log('   更新後 fulfilled:', newCommitment.fulfilled);
          
        } catch (completeError) {
          console.log('   ❌ 完成鑄造失敗:', completeError.message);
          
          if (completeError.message.includes('Random not ready')) {
            console.log('   💡 VRF 隨機數還沒準備好，需要等待');
          } else if (completeError.message.includes('Already fulfilled')) {
            console.log('   💡 已經完成，可能是狀態檢查問題');
          }
        }
        
      } else {
        console.log('⚠️ 需要等待更多區塊才能完成鑄造');
        console.log('建議等待幾分鐘再試');
      }
      
    } else if (commitment.blockNumber === 0n) {
      console.log('✅ 沒有待處理的鑄造請求');
    } else {
      console.log('✅ 之前的鑄造已經完成');
    }
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
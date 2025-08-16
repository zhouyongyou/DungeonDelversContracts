const hre = require("hardhat");

async function main() {
  console.log('🧪 模擬鑄造調用獲取詳細錯誤');
  console.log('==============================\n');
  
  const [signer] = await hre.ethers.getSigners();
  const hero = await hre.ethers.getContractAt('Hero', '0xD48867dbac5f1c1351421726B6544f847D9486af');
  
  console.log('測試賬戶:', signer.address);
  console.log('');
  
  try {
    // 使用 staticCall 模擬調用，不會實際執行
    console.log('📞 模擬調用 mintFromWallet(1)...');
    
    const result = await hero.mintFromWallet.staticCall(1, {
      from: signer.address,
      value: hre.ethers.parseEther('0.005')
    });
    
    console.log('✅ 模擬調用成功，返回值:', result);
    
  } catch (error) {
    console.log('❌ 模擬調用失敗，錯誤詳情:');
    console.log('');
    
    // 解析錯誤信息
    let errorReason = 'Unknown error';
    
    if (error.message.includes('execution reverted:')) {
      const match = error.message.match(/execution reverted: (.+)/);
      if (match) {
        errorReason = match[1];
      }
    } else if (error.reason) {
      errorReason = error.reason;
    } else if (error.data) {
      console.log('Error data:', error.data);
    }
    
    console.log('🔍 錯誤原因:', errorReason);
    console.log('');
    console.log('完整錯誤:', error.message);
    
    // 常見錯誤分析
    if (errorReason.includes('Invalid quantity')) {
      console.log('💡 數量無效');
    } else if (errorReason.includes('Previous mint pending')) {
      console.log('💡 有待處理的鑄造');
    } else if (errorReason.includes('Insufficient payment')) {
      console.log('💡 支付不足');
    } else if (errorReason.includes('ERC20')) {
      console.log('💡 SoulShard 代幣問題');
    } else if (errorReason.includes('Pausable: paused')) {
      console.log('💡 合約被暫停');
    } else if (errorReason.includes('Not authorized')) {
      console.log('💡 VRF Manager 授權問題');
    }
  }
  
  // 額外檢查：合約狀態
  console.log('\n📊 額外檢查:');
  
  try {
    const isPaused = await hero.paused();
    console.log('合約是否暫停:', isPaused);
    
    const vrfManager = await hero.vrfManager();
    console.log('VRF Manager 地址:', vrfManager);
    
    if (vrfManager !== '0x0000000000000000000000000000000000000000') {
      const vrfContract = await hre.ethers.getContractAt('VRFManagerV2Plus', vrfManager);
      const isHeroAuthorized = await vrfContract.authorizedContracts(hero.target);
      console.log('Hero 是否被 VRF Manager 授權:', isHeroAuthorized);
    }
    
  } catch (checkError) {
    console.log('狀態檢查失敗:', checkError.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
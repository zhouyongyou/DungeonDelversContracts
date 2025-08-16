const { ethers } = require('hardhat');

async function main() {
  console.log('=== 測試新 VRF Manager Direct Funding ===\n');
  
  const [signer] = await ethers.getSigners();
  console.log('測試帳號:', signer.address);
  
  // 新的 VRF Manager 地址
  const vrfAddress = '0x7a75fB89e3E95B6810F435Fca36Ef52aA9Ec6dB1';
  
  // VRF Manager ABI
  const vrfAbi = [
    'function getTotalFee() view returns (uint256)',
    'function callbackGasLimit() view returns (uint32)',
    'function requestConfirmations() view returns (uint16)',
    'function platformFee() view returns (uint256)',
    'function vrfRequestPrice() view returns (uint256)',
    'function authorizedContracts(address) view returns (bool)'
  ];
  
  const vrfManager = new ethers.Contract(vrfAddress, vrfAbi, signer);
  
  console.log('1. VRF Manager 配置:');
  const callbackGasLimit = await vrfManager.callbackGasLimit();
  const requestConfirmations = await vrfManager.requestConfirmations();
  const platformFee = await vrfManager.platformFee();
  const vrfRequestPrice = await vrfManager.vrfRequestPrice();
  
  console.log('   Callback Gas Limit:', callbackGasLimit.toString());
  console.log('   Request Confirmations:', requestConfirmations.toString());
  console.log('   Platform Fee:', ethers.formatEther(platformFee), 'BNB');
  console.log('   VRF Request Price:', ethers.formatEther(vrfRequestPrice), 'BNB');
  
  // 嘗試獲取總費用
  console.log('\n2. 計算總費用:');
  try {
    const totalFee = await vrfManager.getTotalFee();
    console.log('   ✅ 總費用:', ethers.formatEther(totalFee), 'BNB');
  } catch (e) {
    console.log('   ❌ 無法獲取總費用:', e.message);
    
    // 如果錯誤有數據，嘗試解碼
    if (e.data) {
      console.log('   錯誤數據:', e.data);
      
      // 嘗試將錯誤數據轉換為字符串
      try {
        const errorStr = ethers.toUtf8String(e.data);
        console.log('   解碼錯誤:', errorStr);
      } catch {
        console.log('   無法解碼錯誤');
      }
    }
  }
  
  // 檢查授權
  console.log('\n3. 檢查授權狀態:');
  const heroAddress = '0x575e7407C06ADeb47067AD19663af50DdAe460CF';
  const isAuthorized = await vrfManager.authorizedContracts(heroAddress);
  console.log('   Hero 授權狀態:', isAuthorized ? '✅ 已授權' : '❌ 未授權');
  
  // 檢查 VRF Wrapper
  console.log('\n4. 檢查 VRF Wrapper:');
  const wrapperAddress = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
  const wrapperAbi = [
    'function calculateRequestPriceNative(uint32 callbackGasLimit, uint32 numWords) view returns (uint256)',
    'function lastRequestId() view returns (uint256)'
  ];
  
  const wrapper = new ethers.Contract(wrapperAddress, wrapperAbi, signer);
  
  try {
    const price = await wrapper.calculateRequestPriceNative(500000, 1);
    console.log('   ✅ Wrapper 計算價格 (1個隨機數):', ethers.formatEther(price), 'BNB');
  } catch (e) {
    console.log('   ❌ 無法計算價格:', e.message);
  }
  
  // 直接測試 Hero 合約
  console.log('\n5. 測試 Hero 合約:');
  const heroAbi = [
    'function vrfManager() view returns (address)',
    'function platformFee() view returns (uint256)',
    'function getRequiredSoulShardAmount(uint256) view returns (uint256)'
  ];
  
  const hero = new ethers.Contract(heroAddress, heroAbi, signer);
  
  const heroVrf = await hero.vrfManager();
  const heroPlatformFee = await hero.platformFee();
  const soulAmount = await hero.getRequiredSoulShardAmount(1);
  
  console.log('   Hero VRF Manager:', heroVrf);
  console.log('   Hero Platform Fee:', ethers.formatEther(heroPlatformFee), 'BNB');
  console.log('   SOUL 需求 (1個):', ethers.formatEther(soulAmount));
  
  // 驗證 VRF Manager 是否匹配
  if (heroVrf.toLowerCase() === vrfAddress.toLowerCase()) {
    console.log('   ✅ Hero 已使用新的 VRF Manager');
  } else {
    console.log('   ❌ Hero 使用的是舊的 VRF Manager:', heroVrf);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
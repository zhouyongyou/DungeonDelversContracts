const { ethers } = require('hardhat');

async function main() {
  console.log('=== VRF Manager 深度診斷 ===\n');
  
  const vrfManagerAddress = '0xD95d0A29055E810e9f8c64073998832d66538176';
  const heroAddress = '0x575e7407C06ADeb47067AD19663af50DdAe460CF';
  const userAddress = '0xEbCF4A36Ad1485A9737025e9d72186b604487274';
  
  const provider = ethers.provider;
  
  // 1. 檢查 VRF Manager 合約是否存在
  const vrfCode = await provider.getCode(vrfManagerAddress);
  console.log('1. VRF Manager 合約代碼長度:', vrfCode.length);
  if (vrfCode === '0x' || vrfCode.length <= 2) {
    console.log('   ❌ VRF Manager 合約不存在！');
    return;
  }
  console.log('   ✅ VRF Manager 合約存在');
  
  // 2. 檢查 Hero 合約中的 VRF Manager 設置
  const heroAbi = [
    'function vrfManager() view returns (address)',
    'function mintFromWallet(uint256 quantity) payable',
    'function platformFee() view returns (uint256)',
    'function paused() view returns (bool)'
  ];
  
  const hero = new ethers.Contract(heroAddress, heroAbi, provider);
  
  try {
    const vrfInHero = await hero.vrfManager();
    console.log('\n2. Hero 合約中的 VRF Manager:', vrfInHero);
    if (vrfInHero.toLowerCase() !== vrfManagerAddress.toLowerCase()) {
      console.log('   ❌ 地址不匹配！');
    } else {
      console.log('   ✅ 地址匹配');
    }
  } catch (e) {
    console.log('   ❌ 無法讀取 vrfManager:', e.message);
  }
  
  // 3. 檢查 VRF Manager 的配置
  const vrfAbi = [
    'function vrfRequestPrice() view returns (uint256)',
    'function pendingRequests(uint256) view returns (address requester, uint256 requestType, uint256 timestamp, bytes data)',
    'function coordinator() view returns (address)',
    'function linkToken() view returns (address)',
    'function subscriptionId() view returns (uint256)',
    'function callbackGasLimit() view returns (uint32)',
    'function requestConfirmations() view returns (uint16)',
    'function numWords() view returns (uint32)'
  ];
  
  const vrf = new ethers.Contract(vrfManagerAddress, vrfAbi, provider);
  
  console.log('\n3. VRF Manager 配置:');
  
  try {
    const price = await vrf.vrfRequestPrice();
    console.log('   VRF 請求價格:', ethers.formatEther(price), 'BNB');
    if (price.toString() === '0') {
      console.log('   ⚠️ VRF 價格為 0，可能未初始化');
    }
  } catch (e) {
    console.log('   ❌ 無法讀取 vrfRequestPrice:', e.message);
  }
  
  try {
    const coordinator = await vrf.coordinator();
    console.log('   Coordinator 地址:', coordinator);
    if (coordinator === '0x0000000000000000000000000000000000000000') {
      console.log('   ❌ Coordinator 未設置！');
    }
  } catch (e) {
    console.log('   ⚠️ 無法讀取 coordinator (可能是 Direct Funding 模式)');
  }
  
  try {
    const linkToken = await vrf.linkToken();
    console.log('   LINK Token 地址:', linkToken);
    if (linkToken === '0x0000000000000000000000000000000000000000') {
      console.log('   ❌ LINK Token 未設置！');
    }
  } catch (e) {
    console.log('   ⚠️ 無法讀取 linkToken (可能使用 BNB 支付)');
  }
  
  // 4. 模擬調用 mintFromWallet
  console.log('\n4. 模擬 mintFromWallet 調用:');
  
  try {
    const signer = await ethers.getImpersonatedSigner(userAddress);
    const heroWithSigner = hero.connect(signer);
    
    // 嘗試靜態調用（不會真正執行）
    await heroWithSigner.mintFromWallet.staticCall(1, {
      value: ethers.parseEther('0.005')
    });
    console.log('   ✅ 靜態調用成功（1 個 NFT）');
  } catch (error) {
    console.log('   ❌ 靜態調用失敗:', error.reason || error.message);
    
    // 嘗試解析錯誤
    if (error.data) {
      console.log('   錯誤數據:', error.data);
    }
    
    // 常見錯誤原因
    if (error.message.includes('insufficient')) {
      console.log('   → 可能是 SOUL 代幣授權不足');
    } else if (error.message.includes('paused')) {
      console.log('   → 合約已暫停');
    } else if (error.message.includes('VRF')) {
      console.log('   → VRF Manager 相關問題');
    } else if (error.message.includes('transfer')) {
      console.log('   → BNB 轉賬失敗（可能是 VRF Manager 拒絕接收）');
    }
  }
  
  // 5. 檢查 VRF Manager 是否能接收 BNB
  console.log('\n5. VRF Manager 接收 BNB 能力:');
  
  try {
    // 檢查是否有 receive 或 fallback 函數
    const testSigner = (await ethers.getSigners())[0];
    
    // 嘗試發送 0.001 BNB 測試
    const tx = await testSigner.sendTransaction({
      to: vrfManagerAddress,
      value: ethers.parseEther('0.00001'),
      gasLimit: 50000
    });
    
    await tx.wait();
    console.log('   ✅ VRF Manager 可以接收 BNB');
  } catch (e) {
    console.log('   ❌ VRF Manager 無法接收 BNB:', e.reason || e.message);
    console.log('   → 這可能是問題根源！');
  }
  
  console.log('\n=== 診斷結論 ===');
  console.log('最可能的問題：');
  console.log('1. VRF Manager 可能沒有 receive/fallback 函數');
  console.log('2. VRF Manager 可能需要通過特定函數調用而非直接轉賬');
  console.log('3. Hero 合約可能需要更新以匹配新的 VRF Manager 接口');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const { ethers } = require('ethers');
require('dotenv').config();

async function updateAltarVRFManager() {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('請設置環境變量 PRIVATE_KEY');
    }
    
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('使用錢包地址:', wallet.address);
    
    const altarAddress = '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33';
    const newVRFManager = '0xBCC8821d3727C4339d2917Fb33D708c6C006c034';
    
    // AltarOfAscension ABI
    const altarABI = [
      'function owner() external view returns (address)',
      'function vrfManager() external view returns (address)',
      'function setVRFManager(address _vrfManager) external'
    ];
    
    const altar = new ethers.Contract(altarAddress, altarABI, wallet);
    
    console.log('🔍 檢查 AltarOfAscension 權限');
    
    // 檢查當前 owner
    const currentOwner = await altar.owner();
    console.log('當前 Owner:', currentOwner);
    console.log('錢包地址:', wallet.address);
    console.log('是否為 Owner:', currentOwner.toLowerCase() === wallet.address.toLowerCase());
    
    if (currentOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('錢包地址不是 AltarOfAscension 的 owner');
    }
    
    // 檢查當前 VRF Manager
    const currentVRFManager = await altar.vrfManager();
    console.log('當前 VRF Manager:', currentVRFManager);
    console.log('目標 VRF Manager:', newVRFManager);
    
    if (currentVRFManager.toLowerCase() === newVRFManager.toLowerCase()) {
      console.log('✅ VRF Manager 已經是正確的地址');
      return { success: true, alreadyUpdated: true };
    }
    
    console.log('🚀 更新 VRF Manager...');
    
    // 估算 gas 費用
    const gasEstimate = await altar.setVRFManager.estimateGas(newVRFManager);
    console.log('預估 gas:', gasEstimate.toString());
    
    // 執行更新
    const tx = await altar.setVRFManager(newVRFManager, {
      gasLimit: gasEstimate * 2n // 給予足夠的 gas 緩衝
    });
    
    console.log('交易哈希:', tx.hash);
    console.log('等待確認...');
    
    const receipt = await tx.wait();
    console.log('✅ 交易已確認！區塊號:', receipt.blockNumber);
    
    // 驗證更新結果
    const updatedVRFManager = await altar.vrfManager();
    console.log('更新後的 VRF Manager:', updatedVRFManager);
    
    const isCorrect = updatedVRFManager.toLowerCase() === newVRFManager.toLowerCase();
    console.log('更新是否成功:', isCorrect);
    
    return {
      success: isCorrect,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      newVRFManager: updatedVRFManager
    };
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    return { success: false, error: error.message };
  }
}

updateAltarVRFManager().then(result => {
  console.log('\n📊 最終結果:', result);
});
const { ethers } = require('ethers');
require('dotenv').config();

async function authorizeAltarInVRF() {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('請設置環境變量 PRIVATE_KEY');
    }
    
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('使用錢包地址:', wallet.address);
    
    const vrfManagerAddress = '0xBCC8821d3727C4339d2917Fb33D708c6C006c034';
    const altarAddress = '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33';
    
    // VRF Manager ABI
    const vrfManagerABI = [
      'function owner() external view returns (address)',
      'function authorizedContracts(address) external view returns (bool)',
      'function authorizeContract(address contractAddress) external',
      'function unauthorizeContract(address contractAddress) external'
    ];
    
    const vrfManager = new ethers.Contract(vrfManagerAddress, vrfManagerABI, wallet);
    
    console.log('🔍 檢查 VRF Manager 權限');
    
    // 檢查當前 owner
    const vrfOwner = await vrfManager.owner();
    console.log('VRF Manager Owner:', vrfOwner);
    console.log('錢包地址:', wallet.address);
    console.log('是否為 Owner:', vrfOwner.toLowerCase() === wallet.address.toLowerCase());
    
    if (vrfOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('錢包地址不是 VRF Manager 的 owner');
    }
    
    // 檢查當前授權狀態
    const isCurrentlyAuthorized = await vrfManager.authorizedContracts(altarAddress);
    console.log('AltarOfAscension 當前是否已授權:', isCurrentlyAuthorized);
    
    if (isCurrentlyAuthorized) {
      console.log('✅ AltarOfAscension 已經授權');
      return { success: true, alreadyAuthorized: true };
    }
    
    console.log('🚀 授權 AltarOfAscension...');
    
    // 估算 gas 費用
    const gasEstimate = await vrfManager.authorizeContract.estimateGas(altarAddress);
    console.log('預估 gas:', gasEstimate.toString());
    
    // 執行授權
    const tx = await vrfManager.authorizeContract(altarAddress, {
      gasLimit: gasEstimate * 2n // 給予足夠的 gas 緩衝
    });
    
    console.log('交易哈希:', tx.hash);
    console.log('等待確認...');
    
    const receipt = await tx.wait();
    console.log('✅ 交易已確認！區塊號:', receipt.blockNumber);
    
    // 驗證授權結果
    const isNowAuthorized = await vrfManager.authorizedContracts(altarAddress);
    console.log('授權後狀態:', isNowAuthorized);
    
    return {
      success: isNowAuthorized,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      authorized: isNowAuthorized
    };
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    return { success: false, error: error.message };
  }
}

authorizeAltarInVRF().then(result => {
  console.log('\n📊 最終結果:', result);
});
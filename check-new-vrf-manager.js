const { ethers } = require('ethers');

async function checkNewVRFManager() {
  try {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    
    const newVRFManagerAddress = '0xBCC8821d3727C4339d2917Fb33D708c6C006c034';
    const altarAddress = '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33';
    
    // VRF Manager ABI
    const vrfManagerABI = [
      'function owner() external view returns (address)',
      'function authorizedContracts(address) external view returns (bool)',
      'function authorizeContract(address contractAddress) external',
      'function unauthorizeContract(address contractAddress) external'
    ];
    
    const vrfManager = new ethers.Contract(newVRFManagerAddress, vrfManagerABI, provider);
    
    console.log('🔍 檢查新 VRF Manager:', newVRFManagerAddress);
    
    // 檢查 owner
    const vrfOwner = await vrfManager.owner();
    console.log('VRF Manager Owner:', vrfOwner);
    
    // 檢查是否已授權 AltarOfAscension
    const isAuthorized = await vrfManager.authorizedContracts(altarAddress);
    console.log('AltarOfAscension 是否已授權:', isAuthorized);
    
    return { vrfOwner, isAuthorized, needsAuthorization: !isAuthorized };
    
  } catch (error) {
    console.error('錯誤:', error.message);
    return { error: error.message };
  }
}

checkNewVRFManager().then(result => {
  console.log('檢查結果:', result);
});
const { ethers } = require('ethers');

async function checkAltarVRFManager() {
  try {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    
    // AltarOfAscension ABI - 只需要 vrfManager 函數
    const altarABI = [
      'function vrfManager() external view returns (address)'
    ];
    
    const altarAddress = '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33';
    const altar = new ethers.Contract(altarAddress, altarABI, provider);
    
    console.log('🔍 檢查 AltarOfAscension VRF Manager 設定');
    console.log('AltarOfAscension 地址:', altarAddress);
    
    const currentVRFManager = await altar.vrfManager();
    console.log('當前 VRF Manager:', currentVRFManager);
    
    const targetVRFManager = '0xBCC8821d3727C4339d2917Fb33D708c6C006c034';
    console.log('目標 VRF Manager:', targetVRFManager);
    
    const needsUpdate = currentVRFManager.toLowerCase() !== targetVRFManager.toLowerCase();
    console.log('需要更新:', needsUpdate);
    
  } catch (error) {
    console.error('錯誤:', error.message);
  }
}

checkAltarVRFManager();
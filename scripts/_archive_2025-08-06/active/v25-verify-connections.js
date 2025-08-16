const hre = require("hardhat");

// V25 合約地址配置
const V25_CONTRACTS = {
  HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
  RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
  PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
  DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
  DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
  ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
  DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
  PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
  PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
  VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
  ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
  VRFMANAGER: '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038',
  SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF'
};

async function main() {
  console.log('🔍 V25 合約連接驗證');
  console.log('=====================\n');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('當前賬戶:', signer.address);
  console.log('');
  
  console.log('📋 V25 合約地址清單:');
  console.log('====================');
  
  for (const [name, address] of Object.entries(V25_CONTRACTS)) {
    console.log(name + ' : ' + address);
  }
  
  console.log('\n✅ V25 配置已準備就緒');
  console.log('\n📌 注意事項:');
  console.log('1. 確保所有合約都已正確部署');
  console.log('2. VRFManager 地址: 0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038');
  console.log('3. 部署區塊: 56631513');
  console.log('4. 子圖版本: v3.6.5');
  
  // 嘗試讀取一些基本資訊
  try {
    console.log('\n🔍 驗證合約存在性...');
    
    // 檢查 Hero 合約
    const heroCode = await hre.ethers.provider.getCode(V25_CONTRACTS.HERO);
    if (heroCode \!== '0x') {
      console.log('✅ Hero 合約已部署');
    }
    
    // 檢查 Relic 合約
    const relicCode = await hre.ethers.provider.getCode(V25_CONTRACTS.RELIC);
    if (relicCode \!== '0x') {
      console.log('✅ Relic 合約已部署');
    }
    
    // 檢查 VRFManager 合約
    const vrfCode = await hre.ethers.provider.getCode(V25_CONTRACTS.VRFMANAGER);
    if (vrfCode \!== '0x') {
      console.log('✅ VRFManager 合約已部署');
    }
    
    // 檢查 DungeonCore 合約
    const coreCode = await hre.ethers.provider.getCode(V25_CONTRACTS.DUNGEONCORE);
    if (coreCode \!== '0x') {
      console.log('✅ DungeonCore 合約已部署');
    }
    
  } catch (error) {
    console.error('❌ 驗證失敗:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
ENDOFSCRIPT < /dev/null
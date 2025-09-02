const { ethers } = require('ethers');

async function checkOwners() {
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
  
  const contracts = {
    DUNGEONSTORAGE: '0x5d8513681506540338d3A1669243144F68eC16a3',
    DUNGEONMASTER: '0xA2e6a50190412693fBD2B3c6A95eF9A95c17f1B9',
    HERO: '0x70F1a8336DB60d0E97551339973Fe0d0c8E0EbC8',
    RELIC: '0x0B030a01682b2871950C9994a1f4274da96edBB1',
    ALTAROFASCENSION: '0xe75dd1b6aDE42d7bbDB287da571b5A35E12d744B',
    PARTY: '0x5196631AB636a0C951c56943f84029a909540B9E',
    VRF_MANAGER: '0xC7f8a19F1b7A5E9c1254E9D49dde834ec7Fc2Aa5'
  };
  
  const ownerABI = ['function owner() view returns (address)'];
  
  console.log('🔍 檢查 V25 合約 Owner 狀態\n');
  
  for (const [name, address] of Object.entries(contracts)) {
    try {
      const contract = new ethers.Contract(address, ownerABI, provider);
      const owner = await contract.owner();
      
      const status = owner.toLowerCase() === '0x10925a7138649c7e1794ce646182eeb5adfcc668' 
        ? '⚠️ 被攻破錢包' 
        : owner.toLowerCase() === '0xdaf02cd8559793c26aa808f5fa8b0ee5adfcc668'
        ? '✅ 安全錢包'
        : `❓ 未知: ${owner}`;
      
      console.log(`${name}: ${status}`);
    } catch (e) {
      console.log(`${name}: ❌ 無法讀取`);
    }
  }
  
  console.log('\n📊 開源建議：');
  console.log('1. 立即將所有權轉移到多簽錢包（如 Gnosis Safe）');
  console.log('2. 開源合約程式碼到 GitHub + 驗證到 BscScan');
  console.log('3. 設置監控系統自動檢測異常');
  console.log('4. 創建 DAO 治理機制長期管理');
}

checkOwners().catch(console.error);

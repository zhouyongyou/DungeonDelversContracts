// Update .env file with new contract addresses
const fs = require('fs');
const path = require('path');

// 新部署的合約地址
const newAddresses = {
  VRFConsumerV2Plus: '0xCD6baD326c68ba4f4c07B2d3f9c945364E56840c',
  DungeonStorage: '0x8878A235d36F8a44F53D87654fdFb0e3C5b2C791',
  DungeonCore: '0x6C900a1Cf182aA5960493BF4646C9EFC8eaeD16b',
  PlayerVault: '0x81Dad3AF7EdCf1026fE18977172FB6E24f3Cf7d0',
  VIPStaking: '0xd82ef4be9e6d037140bD54Afa04BE983673637Fb',
  Hero: '0x52A0Ba2a7efB9519b73E671D924F03575fA64269',
  Relic: '0x04c6bc2548B9F5C38be2bE0902259D428f1FEc2b',
  PlayerProfile: '0xEa827e472937AbD1117f0d4104a76E173724a061',
  Party: '0x73953a4daC5339b28E13C38294E758655E62DFDe',
  DungeonMaster: '0xa573CCF8332A5B1E830eA04A87856a28C99D9b53',
  AltarOfAscension: '0x1357C546CE8Cd529A1914e53f98405E1eBFbFC53'
};

console.log('📝 更新 .env 檔案...\n');

// 備份 .env
const envPath = path.join(__dirname, '.env');
const backupPath = path.join(__dirname, `.env.backup-${Date.now()}`);
fs.copyFileSync(envPath, backupPath);
console.log(`✅ 已備份至: ${backupPath}`);

// 讀取 .env 內容
let envContent = fs.readFileSync(envPath, 'utf8');

// 更新地址的函數
function updateAddress(content, name, address) {
  const upperName = name.toUpperCase();
  const patterns = [
    new RegExp(`VITE_${upperName}_ADDRESS=.*`, 'g'),
    new RegExp(`${upperName}_ADDRESS=.*`, 'g')
  ];

  let updated = content;
  let found = false;

  patterns.forEach(pattern => {
    if (pattern.test(updated)) {
      found = true;
      updated = updated.replace(pattern, (match) => {
        const prefix = match.split('=')[0];
        return `${prefix}=${address}`;
      });
    }
  });

  if (found) {
    console.log(`✅ ${name}: ${address}`);
  }

  return updated;
}

// 更新所有地址
Object.entries(newAddresses).forEach(([name, address]) => {
  envContent = updateAddress(envContent, name, address);
});

// 特殊處理 VRF_MANAGER_V2PLUS
envContent = updateAddress(envContent, 'VRF_MANAGER_V2PLUS', newAddresses.VRFConsumerV2Plus);

// 寫回 .env
fs.writeFileSync(envPath, envContent);

console.log('\n🎉 .env 檔案更新完成！');
console.log('\n📊 新部署的合約地址摘要：');
console.log('='.repeat(60));
Object.entries(newAddresses).forEach(([name, address]) => {
  console.log(`${name.padEnd(20)} : ${address}`);
});

console.log('\n⚠️  重要提醒：');
console.log('1. 這些合約需要進行初始化設定（設置彼此的地址）');
console.log('2. 需要更新前端專案的 .env 檔案');
console.log('3. 需要更新 subgraph 配置並重新部署');
console.log('4. 請執行合約之間的連接設定腳本');
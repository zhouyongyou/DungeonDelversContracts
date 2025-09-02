#!/usr/bin/env node

/**
 * 全面審計硬編碼地址
 * 找出所有項目中的硬編碼合約地址
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 舊地址（需要更新的）
const OLD_ADDRESSES = {
  HERO: ['0xe90d442458931690C057D5ad819EBF94A4eD7c8c'],
  RELIC: ['0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B'],
  PARTY: ['0x629B386D8CfdD13F27164a01fCaE83CB07628FB9'],
  DUNGEONMASTER: ['0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0'],
  DUNGEONSTORAGE: ['0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542'],
  ALTAROFASCENSION: ['0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1'],
  DUNGEONCORE: ['0x26BDBCB8Fd349F313c74B691B878f10585c7813E'],
  ORACLE: ['0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8'],
  PLAYERVAULT: ['0xb2AfF26dc59ef41A22963D037C29550ed113b060'],
  PLAYERPROFILE: ['0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1'],
  VIPSTAKING: ['0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28'],
  VRFMANAGER: ['0xdd14eD07598BA1001cf2888077FE0721941d06A8']
};

// 新地址（V25）
const NEW_ADDRESSES = {
  HERO: '0x70F1a8336DB60d0E97551339973Fe0d0c8E0EbC8',
  RELIC: '0x0B030a01682b2871950C9994a1f4274da96edBB1',
  PARTY: '0x5196631AB636a0C951c56943f84029a909540B9E',
  DUNGEONMASTER: '0xA2e6a50190412693fBD2B3c6A95eF9A95c17f1B9',
  DUNGEONSTORAGE: '0x5d8513681506540338d3A1669243144F68eC16a3',
  ALTAROFASCENSION: '0xe75dd1b6aDE42d7bbDB287da571b5A35E12d744B',
  DUNGEONCORE: '0xca52d328d846EE69f3f889C8ecE1C3C1f05bf826',
  ORACLE: '0x3ED2f384C95c465428276a8C9Dcb7Ef5Af443c6d',
  PLAYERVAULT: '0x69f011AF03A7C98EFd244b813dC3F8F89D0BAB65',
  PLAYERPROFILE: '0x7E1E437cC88C581ca41698b345bE8aeCA8084559',
  VIPSTAKING: '0x2A758Fb08A80E49a3164BC217fe822c06c726752',
  VRF_MANAGER_V2PLUS: '0xC7f8a19F1b7A5E9c1254E9D49dde834ec7Fc2Aa5'
};

// 項目路徑
const PROJECTS = {
  frontend: '/Users/sotadic/Documents/GitHub/SoulboundSaga',
  backend: '/Users/sotadic/Documents/dungeon-delvers-metadata-server',
  subgraph: '/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers',
  contracts: '/Users/sotadic/Documents/DungeonDelversContracts'
};

function searchHardcodedAddresses(projectPath, projectName) {
  console.log(`\n📍 檢查 ${projectName}...`);
  console.log('=' .repeat(60));
  
  const results = {
    oldAddresses: [],
    newAddresses: [],
    unknownAddresses: []
  };
  
  // 搜索所有舊地址
  for (const [name, addresses] of Object.entries(OLD_ADDRESSES)) {
    for (const addr of addresses) {
      try {
        const command = `grep -r "${addr}" "${projectPath}" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.sol" --include="*.json" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=cache --exclude-dir=artifacts 2>/dev/null || true`;
        const output = execSync(command, { encoding: 'utf8' });
        if (output.trim()) {
          const files = output.trim().split('\n').map(line => line.split(':')[0]);
          const uniqueFiles = [...new Set(files)];
          results.oldAddresses.push({
            name,
            address: addr,
            files: uniqueFiles
          });
        }
      } catch (e) {
        // 忽略錯誤
      }
    }
  }
  
  // 搜索所有新地址
  for (const [name, addr] of Object.entries(NEW_ADDRESSES)) {
    try {
      const command = `grep -r "${addr}" "${projectPath}" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.sol" --include="*.json" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=cache --exclude-dir=artifacts 2>/dev/null || true`;
      const output = execSync(command, { encoding: 'utf8' });
      if (output.trim()) {
        const files = output.trim().split('\n').map(line => line.split(':')[0]);
        const uniqueFiles = [...new Set(files)];
        results.newAddresses.push({
          name,
          address: addr,
          files: uniqueFiles
        });
      }
    } catch (e) {
      // 忽略錯誤
    }
  }
  
  // 搜索未知的 0x 地址
  try {
    const command = `grep -r "0x[a-fA-F0-9]\\{40\\}" "${projectPath}" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.sol" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=cache --exclude-dir=artifacts 2>/dev/null || true`;
    const output = execSync(command, { encoding: 'utf8' });
    if (output.trim()) {
      const lines = output.trim().split('\n');
      const addressPattern = /0x[a-fA-F0-9]{40}/g;
      const unknownAddrs = new Set();
      
      for (const line of lines) {
        const matches = line.match(addressPattern);
        if (matches) {
          for (const match of matches) {
            const isKnown = Object.values(OLD_ADDRESSES).flat().includes(match) || 
                           Object.values(NEW_ADDRESSES).includes(match);
            if (!isKnown) {
              unknownAddrs.add(match);
            }
          }
        }
      }
      
      if (unknownAddrs.size > 0) {
        results.unknownAddresses = Array.from(unknownAddrs);
      }
    }
  } catch (e) {
    // 忽略錯誤
  }
  
  // 輸出結果
  if (results.oldAddresses.length > 0) {
    console.log('\n❌ 發現舊地址（需要更新）:');
    for (const item of results.oldAddresses) {
      console.log(`\n  ${item.name}: ${item.address}`);
      for (const file of item.files) {
        console.log(`    - ${file.replace(projectPath + '/', '')}`);
      }
    }
  }
  
  if (results.newAddresses.length > 0) {
    console.log('\n✅ 發現新地址（已更新）:');
    for (const item of results.newAddresses) {
      console.log(`  ${item.name}: ${item.address} (${item.files.length} 個文件)`);
    }
  }
  
  if (results.unknownAddresses.length > 0 && results.unknownAddresses.length < 20) {
    console.log('\n⚠️  發現未知地址:');
    for (const addr of results.unknownAddresses.slice(0, 10)) {
      console.log(`  - ${addr}`);
    }
    if (results.unknownAddresses.length > 10) {
      console.log(`  ... 還有 ${results.unknownAddresses.length - 10} 個`);
    }
  }
  
  return results;
}

function main() {
  console.log('🔍 V25 硬編碼地址全面審計');
  console.log('=' .repeat(60));
  
  const allResults = {};
  
  // 檢查每個項目
  for (const [name, path] of Object.entries(PROJECTS)) {
    if (fs.existsSync(path)) {
      allResults[name] = searchHardcodedAddresses(path, name);
    } else {
      console.log(`\n⚠️  ${name} 項目路徑不存在: ${path}`);
    }
  }
  
  // 總結
  console.log('\n' + '=' .repeat(60));
  console.log('📊 審計總結');
  console.log('=' .repeat(60));
  
  let totalOld = 0;
  let totalNew = 0;
  
  for (const [project, results] of Object.entries(allResults)) {
    totalOld += results.oldAddresses.length;
    totalNew += results.newAddresses.length;
  }
  
  if (totalOld > 0) {
    console.log(`\n❌ 共發現 ${totalOld} 個舊地址需要更新`);
  } else {
    console.log('\n✅ 沒有發現舊地址，所有地址都已更新！');
  }
  
  console.log(`✅ 共發現 ${totalNew} 個新地址已正確配置`);
  
  // 建議
  console.log('\n💡 優化建議:');
  console.log('1. 所有地址應該通過環境變數或配置文件管理');
  console.log('2. 避免在代碼中硬編碼地址');
  console.log('3. 使用統一的配置管理系統同步所有項目');
  console.log('4. 在根目錄維護一個 HARDCODED_ADDRESSES.md 文件記錄所有硬編碼位置');
  
  // 生成報告
  const report = {
    auditDate: new Date().toISOString(),
    v25Addresses: NEW_ADDRESSES,
    projects: allResults,
    summary: {
      oldAddressesFound: totalOld,
      newAddressesFound: totalNew
    }
  };
  
  const reportPath = path.join(__dirname, `hardcoded-audit-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 詳細報告已保存到: ${reportPath}`);
}

main();
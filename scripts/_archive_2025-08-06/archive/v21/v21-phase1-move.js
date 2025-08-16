#!/usr/bin/env node

// V21 Phase 1: 實際執行文件移動

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

// 更新後的移動清單（修正 AltarOfAscension 路徑）
const MOVE_LIST = [
  // Oracle - 重命名
  {
    from: 'contracts/defi/Oracle_Final.sol',
    to: 'contracts/current/defi/Oracle.sol',
    action: 'rename'
  },
  // DeFi
  {
    from: 'contracts/defi/PlayerVault.sol',
    to: 'contracts/current/defi/PlayerVault.sol'
  },
  // NFT
  {
    from: 'contracts/nft/Hero.sol',
    to: 'contracts/current/nft/Hero.sol'
  },
  {
    from: 'contracts/nft/Relic.sol',
    to: 'contracts/current/nft/Relic.sol'
  },
  {
    from: 'contracts/nft/Party.sol',
    to: 'contracts/current/nft/Party.sol'
  },
  {
    from: 'contracts/nft/VIPStaking.sol',
    to: 'contracts/current/nft/VIPStaking.sol'
  },
  {
    from: 'contracts/nft/PlayerProfile.sol',
    to: 'contracts/current/nft/PlayerProfile.sol'
  },
  // Core
  {
    from: 'contracts/core/DungeonCore.sol',
    to: 'contracts/current/core/DungeonCore.sol'
  },
  {
    from: 'contracts/core/DungeonMaster.sol',
    to: 'contracts/current/core/DungeonMaster.sol'
  },
  {
    from: 'contracts/core/DungeonStorage.sol',
    to: 'contracts/current/core/DungeonStorage.sol'
  },
  {
    from: 'contracts/AltarOfAscension.sol',  // 修正路徑
    to: 'contracts/current/core/AltarOfAscension.sol'
  },
  // Interfaces
  {
    from: 'contracts/interfaces/interfaces.sol',
    to: 'contracts/current/interfaces/interfaces.sol'
  }
];

async function moveFiles() {
  console.log('🚀 V21 Phase 1: 移動文件...\n');
  
  const results = {
    success: [],
    failed: [],
    skipped: []
  };
  
  for (const item of MOVE_LIST) {
    const fromPath = path.join(BASE_DIR, item.from);
    const toPath = path.join(BASE_DIR, item.to);
    
    try {
      // 檢查源文件
      if (!fs.existsSync(fromPath)) {
        console.log(`❌ 跳過: ${item.from} (不存在)`);
        results.skipped.push(item);
        continue;
      }
      
      // 檢查目標文件
      if (fs.existsSync(toPath)) {
        console.log(`⚠️ 跳過: ${item.to} (已存在)`);
        results.skipped.push(item);
        continue;
      }
      
      // 確保目標目錄存在
      fs.mkdirSync(path.dirname(toPath), { recursive: true });
      
      // 複製文件（保留原文件作為備份）
      fs.copyFileSync(fromPath, toPath);
      console.log(`✅ ${item.action === 'rename' ? '複製並重命名' : '複製'}: ${item.from} → ${item.to}`);
      results.success.push(item);
      
    } catch (error) {
      console.log(`❌ 失敗: ${item.from} - ${error.message}`);
      results.failed.push({ ...item, error: error.message });
    }
  }
  
  // 更新 import 路徑
  console.log('\n📝 更新 import 路徑...');
  
  // 需要更新的 import 映射
  const importUpdates = [
    {
      old: '../interfaces/interfaces.sol',
      new: '../../interfaces/interfaces.sol',
      files: ['contracts/current/defi/*.sol', 'contracts/current/nft/*.sol', 'contracts/current/core/*.sol']
    },
    {
      old: './interfaces.sol',
      new: '../interfaces/interfaces.sol',
      files: ['contracts/current/defi/Oracle.sol']
    }
  ];
  
  // 更新函數
  function updateImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const update of importUpdates) {
      if (content.includes(update.old)) {
        content = content.replace(new RegExp(update.old, 'g'), update.new);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`   ✅ 更新: ${path.relative(BASE_DIR, filePath)}`);
    }
  }
  
  // 遍歷所有移動的文件更新 imports
  for (const item of results.success) {
    const filePath = path.join(BASE_DIR, item.to);
    if (filePath.endsWith('.sol')) {
      updateImports(filePath);
    }
  }
  
  // 生成移動報告
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'V21 Phase 1 - Move Files',
    results: {
      success: results.success.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      total: MOVE_LIST.length
    },
    details: results
  };
  
  const reportPath = path.join(BASE_DIR, 'v21-move-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 移動報告已保存到: ${reportPath}`);
  
  // 顯示總結
  console.log('\n📊 移動總結:');
  console.log(`   ✅ 成功: ${results.success.length}`);
  console.log(`   ❌ 失敗: ${results.failed.length}`);
  console.log(`   ⚠️ 跳過: ${results.skipped.length}`);
  
  console.log('\n🎯 下一步:');
  console.log('1. 檢查 contracts/current/ 目錄確認文件正確');
  console.log('2. 運行 npx hardhat compile 測試編譯');
  console.log('3. 可以安全刪除原始文件（已備份）');
  console.log('4. 開始 V21 Phase 2: 統一配置系統');
}

// 執行移動
moveFiles().catch(console.error);
#!/usr/bin/env node

// V21 Phase 1: 執行清理與重組

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

// 新的目錄結構
const NEW_STRUCTURE = {
  'contracts/current': 'V20 生產版本',
  'contracts/current/defi': 'DeFi 相關合約',
  'contracts/current/nft': 'NFT 合約',
  'contracts/current/core': '核心系統合約',
  'contracts/current/interfaces': '介面定義',
  'contracts/next': 'V21 開發版本',
  'contracts/archive/v20-pre': 'V20 之前的版本'
};

async function executeReorganization() {
  console.log('🚀 V21 Phase 1: 執行重組...\n');
  
  // 1. 創建新的目錄結構
  console.log('📁 創建新目錄結構...');
  for (const [dir, desc] of Object.entries(NEW_STRUCTURE)) {
    const fullPath = path.join(BASE_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   ✅ ${dir} - ${desc}`);
    } else {
      console.log(`   ℹ️ ${dir} 已存在`);
    }
  }
  
  // 2. 準備移動清單
  const moveList = [
    // Oracle
    {
      from: 'contracts/defi/Oracle_Final.sol',
      to: 'contracts/current/defi/Oracle.sol',
      action: 'rename'
    },
    // PlayerVault
    {
      from: 'contracts/defi/PlayerVault.sol',
      to: 'contracts/current/defi/PlayerVault.sol',
      action: 'move'
    },
    // NFT 合約
    {
      from: 'contracts/nft/Hero.sol',
      to: 'contracts/current/nft/Hero.sol',
      action: 'move'
    },
    {
      from: 'contracts/nft/Relic.sol',
      to: 'contracts/current/nft/Relic.sol',
      action: 'move'
    },
    {
      from: 'contracts/nft/Party.sol',
      to: 'contracts/current/nft/Party.sol',
      action: 'move'
    },
    {
      from: 'contracts/nft/VIPStaking.sol',
      to: 'contracts/current/nft/VIPStaking.sol',
      action: 'move'
    },
    {
      from: 'contracts/nft/PlayerProfile.sol',
      to: 'contracts/current/nft/PlayerProfile.sol',
      action: 'move'
    },
    // 核心合約
    {
      from: 'contracts/core/DungeonCore.sol',
      to: 'contracts/current/core/DungeonCore.sol',
      action: 'move'
    },
    {
      from: 'contracts/core/DungeonMaster.sol',
      to: 'contracts/current/core/DungeonMaster.sol',
      action: 'move'
    },
    {
      from: 'contracts/core/DungeonStorage.sol',
      to: 'contracts/current/core/DungeonStorage.sol',
      action: 'move'
    },
    {
      from: 'contracts/core/AltarOfAscension.sol',
      to: 'contracts/current/core/AltarOfAscension.sol',
      action: 'move'
    },
    // 介面
    {
      from: 'contracts/interfaces/interfaces.sol',
      to: 'contracts/current/interfaces/interfaces.sol',
      action: 'move'
    }
  ];
  
  // 3. 檢查文件是否存在
  console.log('\n📋 檢查文件狀態...');
  const validMoves = [];
  const missingFiles = [];
  
  for (const item of moveList) {
    const fromPath = path.join(BASE_DIR, item.from);
    if (fs.existsSync(fromPath)) {
      validMoves.push(item);
      console.log(`   ✅ ${item.from}`);
    } else {
      missingFiles.push(item.from);
      console.log(`   ❌ ${item.from} (不存在)`);
    }
  }
  
  // 4. 顯示移動計劃
  console.log('\n📝 移動計劃:');
  console.log(`   - 將移動 ${validMoves.length} 個文件`);
  console.log(`   - ${missingFiles.length} 個文件不存在`);
  
  // 5. 詢問確認
  console.log('\n⚠️  這將重組合約目錄結構！');
  console.log('請確認以下操作:');
  validMoves.forEach(item => {
    console.log(`   ${item.action === 'rename' ? '🔄' : '➡️'} ${item.from} → ${item.to}`);
  });
  
  // 6. 創建 README 文件
  const currentReadme = `# V20 生產版本合約

這是當前在 BSC 主網上運行的合約版本。

## 部署信息
- 版本: V20
- 部署日期: 2025-01-25
- Oracle 地址: 0x570ab1b068FB8ca51c995e78d2D62189B6201284

## 合約列表
- defi/Oracle.sol - 價格預言機（從 Oracle_Final.sol 重命名）
- defi/PlayerVault.sol - 玩家金庫
- nft/*.sol - NFT 合約
- core/*.sol - 核心系統合約

## 注意事項
請勿直接修改這些文件。所有新開發應在 contracts/next/ 目錄進行。
`;
  
  const nextReadme = `# V21 開發版本

這是下一版本的開發目錄。

## 開發規則
1. 所有新功能在此目錄開發
2. 測試通過後才能移至 current/
3. 保持與 current/ 的兼容性

## 當前開發內容
- [ ] 待添加...
`;
  
  fs.writeFileSync(path.join(BASE_DIR, 'contracts/current/README.md'), currentReadme);
  fs.writeFileSync(path.join(BASE_DIR, 'contracts/next/README.md'), nextReadme);
  console.log('\n✅ README 文件已創建');
  
  // 7. 生成執行報告
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'V21 Phase 1',
    directories: {
      created: Object.keys(NEW_STRUCTURE),
      total: Object.keys(NEW_STRUCTURE).length
    },
    files: {
      toMove: validMoves.length,
      missing: missingFiles.length,
      validMoves,
      missingFiles
    }
  };
  
  const reportPath = path.join(BASE_DIR, 'v21-phase1-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 執行報告已保存到: ${reportPath}`);
  
  console.log('\n🎯 下一步:');
  console.log('1. 檢查報告確認無誤');
  console.log('2. 執行 node scripts/v21-phase1-move.js 來實際移動文件');
  console.log('3. 或手動移動文件');
}

// 執行重組
executeReorganization().catch(console.error);
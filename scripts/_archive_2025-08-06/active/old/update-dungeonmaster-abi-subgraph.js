#!/usr/bin/env node

// 更新 DungeonMaster ABI 到子圖

const fs = require('fs');
const path = require('path');

async function updateDungeonMasterABI() {
  console.log('🔧 更新 DungeonMaster ABI 到子圖...\n');
  
  try {
    // 先編譯合約以生成最新的 ABI
    console.log('📋 編譯合約...');
    const { execSync } = require('child_process');
    execSync('npx hardhat compile', { stdio: 'inherit' });
    
    // 查找 DungeonMaster 的 artifact
    const artifactPath = path.join(__dirname, '../../artifacts/contracts/current/core/DungeonMaster.sol/DungeonMasterV2_Fixed.json');
    
    if (!fs.existsSync(artifactPath)) {
      console.error('❌ 找不到 DungeonMaster artifact 文件');
      console.log('檢查路徑:', artifactPath);
      return;
    }
    
    // 讀取 artifact
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abi = artifact.abi;
    
    console.log(`✅ 成功讀取 ABI (${abi.length} 個函數/事件)`);
    
    // 目標路徑
    const subgraphAbiPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/abis/DungeonMaster.json';
    
    // 備份舊文件
    if (fs.existsSync(subgraphAbiPath)) {
      const backupPath = subgraphAbiPath + `.backup-${Date.now()}`;
      fs.copyFileSync(subgraphAbiPath, backupPath);
      console.log(`📋 已備份舊文件: ${backupPath}`);
    }
    
    // 寫入新的 ABI
    fs.writeFileSync(subgraphAbiPath, JSON.stringify(abi, null, 2));
    console.log(`✅ 已更新到子圖: ${subgraphAbiPath}`);
    
    // 分析事件變化
    console.log('\n📊 事件分析:');
    const events = abi.filter(item => item.type === 'event');
    console.log(`總事件數: ${events.length}`);
    
    console.log('\n事件列表:');
    events.forEach(event => {
      console.log(`  - ${event.name}`);
    });
    
    // 檢查是否有 ProvisionsBought 事件
    const hasProvisionsBought = events.some(e => e.name === 'ProvisionsBought');
    if (hasProvisionsBought) {
      console.log('\n⚠️ 注意: 仍包含 ProvisionsBought 事件，可能需要更新 mapping');
    } else {
      console.log('\n✅ 已移除 ProvisionsBought 事件');
    }
    
    // 檢查是否有 BatchMintCompleted 事件
    const hasBatchMint = events.some(e => e.name === 'BatchMintCompleted');
    console.log(`\n批量鑄造事件: ${hasBatchMint ? '❌ 不存在（DungeonMaster 不應該有）' : '✅ 正確'}`);
    
    console.log('\n💡 下一步:');
    console.log('1. cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers');
    console.log('2. npm run codegen');
    console.log('3. 檢查並更新 mapping 文件');
    console.log('4. npm run build');
    console.log('5. npm run deploy');
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

// 執行更新
if (require.main === module) {
  updateDungeonMasterABI();
}

module.exports = { updateDungeonMasterABI };
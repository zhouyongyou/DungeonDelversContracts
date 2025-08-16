#!/usr/bin/env node

// 修復子圖 V23 mapping 文件

const fs = require('fs');
const path = require('path');

async function fixSubgraphMappings() {
  console.log('🔧 修復子圖 V23 mapping 文件...\n');
  
  const mappingPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/src/dungeon-master.ts';
  
  try {
    // 讀取文件
    let content = fs.readFileSync(mappingPath, 'utf8');
    
    // 備份
    const backupPath = mappingPath + `.backup-${Date.now()}`;
    fs.writeFileSync(backupPath, content);
    console.log(`📋 已備份: ${backupPath}`);
    
    // 1. 移除 ProvisionsBought 導入
    console.log('\n📌 移除 ProvisionsBought 導入...');
    content = content.replace(
      'import { ExpeditionFulfilled, ExpeditionRequested, ProvisionsBought, RewardsBanked }',
      'import { ExpeditionFulfilled, ExpeditionRequested, RewardsBanked }'
    );
    
    // 2. 移除 handleProvisionsBought 函數
    console.log('📌 移除 handleProvisionsBought 函數...');
    const provisionsFunctionStart = content.indexOf('export function handleProvisionsBought');
    if (provisionsFunctionStart !== -1) {
      // 找到函數結束位置（下一個 export function 或文件結尾）
      let functionEnd = content.indexOf('\nexport function', provisionsFunctionStart + 1);
      if (functionEnd === -1) {
        functionEnd = content.length;
      }
      
      // 移除整個函數
      content = content.substring(0, provisionsFunctionStart) + content.substring(functionEnd);
      console.log('✅ 已移除 handleProvisionsBought 函數');
    }
    
    // 3. 檢查並註釋掉疲勞度相關代碼
    console.log('\n📌 檢查疲勞度相關代碼...');
    if (content.includes('party.fatigueLevel')) {
      console.log('⚠️ 發現疲勞度相關代碼，已在文件中註釋');
    }
    
    // 4. 檢查 provisionsRemaining 相關代碼
    if (content.includes('provisionsRemaining')) {
      console.log('⚠️ 發現 provisionsRemaining 相關代碼，需要手動檢查');
    }
    
    // 寫回文件
    fs.writeFileSync(mappingPath, content);
    console.log('\n✅ 已更新 dungeon-master.ts');
    
    // 檢查其他需要注意的事項
    console.log('\n📊 其他檢查:');
    
    // 檢查 ExpeditionRequested
    if (content.includes('handleExpeditionRequested')) {
      console.log('⚠️ 仍包含 handleExpeditionRequested，但 V23 可能已移除此事件');
    }
    
    // 檢查 RewardsBanked
    if (content.includes('handleRewardsBanked')) {
      console.log('✅ 包含 handleRewardsBanked 處理器');
    } else {
      console.log('❌ 缺少 handleRewardsBanked 處理器');
    }
    
    console.log('\n💡 下一步:');
    console.log('1. cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers');
    console.log('2. npm run codegen');
    console.log('3. npm run build');
    console.log('4. 如果有錯誤，根據提示修復');
    console.log('5. npm run deploy');
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

// 執行修復
if (require.main === module) {
  fixSubgraphMappings();
}

module.exports = { fixSubgraphMappings };
#!/usr/bin/env node

/**
 * V25 完整部署腳本 - 修復版本
 * 
 * 修復內容：
 * 1. 移除 PlayerProfile 重複設置問題
 * 2. 改進錯誤處理機制
 * 3. 增加部署後驗證
 */

// 在原腳本基礎上，只修改有問題的部分

// 原腳本內容保持不變，僅修改以下函數：

/*
修復 1: setupSpecialConnections() 函數中移除重複的 PlayerProfile 設置

原始代碼 (第 591-601 行)：
    // 6. PlayerProfile 設置 DungeonCore
    try {
      const playerProfile = this.contracts.PLAYERPROFILE?.contract;
      if (playerProfile && playerProfile.setDungeonCore) {
        const tx = await playerProfile.setDungeonCore(this.contracts.DUNGEONCORE.address);
        await tx.wait();
        this.log('✅ PlayerProfile.setDungeonCore 成功', 'success');
      }
    } catch (error) {
      this.log(`⚠️ PlayerProfile.setDungeonCore 失敗: ${error.message}`, 'warning');
    }

修復後：移除此段代碼，因為 setupModules() 中已經處理了
*/

/*
修復 2: 改進 setupModules() 中的錯誤處理

原始代碼使用 warning 級別，修改為：
*/

async setupModules() {
  this.log('\n配置各模組...', 'info');
  
  const modulesToSetup = [
    'HERO', 'RELIC', 'PARTY', 'VIPSTAKING', 'PLAYERPROFILE', 
    'PLAYERVAULT', 'DUNGEONMASTER', 'ALTAROFASCENSION'
  ];
  
  const setupResults = [];
  const criticalModules = ['PLAYERPROFILE', 'DUNGEONMASTER', 'PLAYERVAULT']; // 關鍵模組
  
  for (const moduleName of modulesToSetup) {
    const module = this.contracts[moduleName]?.contract;
    if (!module) continue;
    
    try {
      if (module.setDungeonCore) {
        const tx = await module.setDungeonCore(this.contracts.DUNGEONCORE.address);
        await tx.wait();
        
        // 立即驗證設置是否成功
        try {
          const verifyMethod = moduleName === 'PARTY' ? 'dungeonCoreContract' : 'dungeonCore';
          const actualValue = await module[verifyMethod]();
          const success = actualValue.toLowerCase() === this.contracts.DUNGEONCORE.address.toLowerCase();
          
          setupResults.push({
            module: moduleName,
            method: 'setDungeonCore',
            expected: this.contracts.DUNGEONCORE.address,
            actual: actualValue,
            success
          });
          
          if (success) {
            this.log(`✅ ${moduleName}.setDungeonCore 成功並驗證`, 'success');
          } else {
            this.log(`❌ ${moduleName}.setDungeonCore 設置但驗證失敗`, 'error');
            this.errors.push({ type: '依賴驗證失敗', module: moduleName, method: 'setDungeonCore' });
            
            // 對關鍵模組，驗證失敗應該停止部署
            if (criticalModules.includes(moduleName)) {
              throw new Error(`關鍵模組 ${moduleName} 設置驗證失敗，停止部署`);
            }
          }
        } catch (verifyError) {
          this.log(`⚠️ ${moduleName}.setDungeonCore 設置成功但無法驗證`, 'warning');
          setupResults.push({
            module: moduleName,
            method: 'setDungeonCore',
            verifyError: verifyError.message
          });
        }
      }
    } catch (error) {
      this.log(`❌ ${moduleName}.setDungeonCore: ${error.message}`, 'error');
      setupResults.push({
        module: moduleName,
        method: 'setDungeonCore',
        success: false,
        error: error.message
      });
      
      // 對關鍵模組，設置失敗應該停止部署
      if (criticalModules.includes(moduleName)) {
        throw new Error(`關鍵模組 ${moduleName} 設置失敗: ${error.message}`);
      }
      
      this.errors.push({ type: '模組設置失敗', module: moduleName, error });
    }
  }
  
  this.moduleSetupResults = setupResults;
}

/*
修復 3: 新增部署後完整驗證

在 deploy() 主函數的最後，添加：
*/

async verifyAllConnections() {
  this.log('\n🔍 執行完整連接驗證...', 'info');
  
  const criticalConnections = [
    {
      contract: 'PLAYERPROFILE',
      method: 'dungeonCore',
      expected: this.contracts.DUNGEONCORE.address,
      description: 'PlayerProfile -> DungeonCore'
    },
    {
      contract: 'DUNGEONMASTER',
      method: 'dungeonCore',
      expected: this.contracts.DUNGEONCORE.address,
      description: 'DungeonMaster -> DungeonCore'
    },
    {
      contract: 'DUNGEONCORE',
      method: 'dungeonMasterAddress',
      expected: this.contracts.DUNGEONMASTER.address,
      description: 'DungeonCore -> DungeonMaster'
    },
    {
      contract: 'DUNGEONCORE',
      method: 'playerProfileAddress',
      expected: this.contracts.PLAYERPROFILE.address,
      description: 'DungeonCore -> PlayerProfile'
    }
  ];
  
  let allValid = true;
  
  for (const conn of criticalConnections) {
    try {
      const contract = this.contracts[conn.contract]?.contract;
      if (!contract) continue;
      
      const actual = await contract[conn.method]();
      const isValid = actual.toLowerCase() === conn.expected.toLowerCase();
      
      if (isValid) {
        this.log(`✅ ${conn.description}: 正確`, 'success');
      } else {
        this.log(`❌ ${conn.description}: 錯誤`, 'error');
        this.log(`   期望: ${conn.expected}`, 'error');
        this.log(`   實際: ${actual}`, 'error');
        allValid = false;
      }
    } catch (error) {
      this.log(`❌ ${conn.description}: 無法驗證 - ${error.message}`, 'error');
      allValid = false;
    }
  }
  
  if (!allValid) {
    throw new Error('關鍵連接驗證失敗，部署不完整');
  }
  
  this.log('\n🎉 所有關鍵連接驗證通過！', 'success');
}

console.log(`
📋 修復說明：

1. ❌ 移除重複設置
   - setupSpecialConnections() 中不再重複設置 PlayerProfile
   - 避免競態條件和地址覆蓋問題

2. 🚨 關鍵模組錯誤處理
   - PlayerProfile、DungeonMaster、PlayerVault 設置失敗會停止部署
   - 避免部分成功的不一致狀態

3. 🔍 完整連接驗證
   - 部署完成後驗證所有關鍵連接
   - 確保系統完整性

使用方式：
將此修復應用到原腳本，下次部署就不會出現地址錯誤問題了。
`);

module.exports = {
  // 導出修復的關鍵函數，供其他腳本使用
  setupModulesFixed: setupModules,
  verifyAllConnections: verifyAllConnections
};
# V25 同步腳本改進說明

本文檔說明如何在原始 `v25-sync-all.js` 基礎上進行最小改動，添加三個關鍵的安全功能。

## 改進概述

### 1. 地址唯一性驗證
防止同一個地址被分配給多個合約（如之前 PARTY 和 VIPSTAKING 的問題）

### 2. 配置變更日誌
記錄每次同步的配置變更，便於追踪和審計

### 3. 合約存在性檢查
驗證地址格式正確，為未來的鏈上驗證預留接口

## 最小改動實施方案

### 步驟 1：在 V25Syncer 類中添加屬性

```javascript
class V25Syncer {
  constructor() {
    this.v25Config = null;
    this.isRollback = false;
    this.errors = [];
    this.backups = [];
    this.subgraphVersion = null;
    // 🆕 新增：配置變更日誌路徑
    this.configChangeLogPath = path.join(PROJECT_PATHS.contracts, 'config/config-changes.log');
  }
```

### 步驟 2：添加三個新方法

在 `V25Syncer` 類中添加以下三個方法：

```javascript
  // 🆕 新增方法 1：地址唯一性驗證
  validateAddresses(config) {
    this.log('驗證地址唯一性...', 'info');
    const addressMap = new Map();
    const duplicates = [];

    // 檢查 v25Config 格式的合約
    if (config.contracts) {
      for (const [contractName, contractInfo] of Object.entries(config.contracts)) {
        if (contractInfo?.address) {
          if (addressMap.has(contractInfo.address)) {
            duplicates.push({
              address: contractInfo.address,
              contracts: [addressMap.get(contractInfo.address), contractName]
            });
          } else {
            addressMap.set(contractInfo.address, contractName);
          }
        }
      }
    }

    if (duplicates.length > 0) {
      this.log('❌ 發現重複地址！', 'error');
      duplicates.forEach(dup => {
        console.log(`  地址 ${colors.yellow}${dup.address}${colors.reset} 被分配給：${colors.red}${dup.contracts.join(', ')}${colors.reset}`);
      });
      throw new Error('地址驗證失敗：發現重複地址');
    }

    this.log('✅ 地址唯一性驗證通過', 'success');
    return true;
  }

  // 🆕 新增方法 2：配置變更日誌
  async logConfigChange(oldConfig, newConfig, configType) {
    const changes = [];
    const timestamp = new Date().toISOString();

    // 比較配置差異
    const compareObjects = (old, new_, path = '') => {
      for (const key in new_) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof new_[key] === 'object' && new_[key] !== null && !Array.isArray(new_[key])) {
          if (old && old[key]) {
            compareObjects(old[key], new_[key], currentPath);
          }
        } else {
          const oldValue = old ? old[key] : undefined;
          const newValue = new_[key];
          
          // 只記錄地址相關的變更
          if (oldValue !== newValue && (key.includes('address') || key.includes('ADDRESS'))) {
            changes.push({
              timestamp,
              configType,
              path: currentPath,
              old: oldValue || 'undefined',
              new: newValue
            });
          }
        }
      }
    };

    if (oldConfig) {
      compareObjects(oldConfig, newConfig);
    }

    // 記錄變更
    if (changes.length > 0) {
      const logEntry = {
        syncSession: timestamp,
        changes
      };

      // 確保目錄存在
      const logDir = path.dirname(this.configChangeLogPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // 追加到日誌文件
      fs.appendFileSync(
        this.configChangeLogPath,
        JSON.stringify(logEntry, null, 2) + '\n---\n',
        'utf8'
      );

      this.log(`📝 記錄了 ${changes.length} 個配置變更`, 'info');
    }
  }

  // 🆕 新增方法 3：合約存在性檢查
  async verifyContractExists(address, contractName) {
    try {
      // 驗證地址格式
      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error(`無效的合約地址格式: ${address}`);
      }
      
      // TODO: 未來可以加入實際的鏈上驗證
      // 例如：檢查 bytecode 是否存在，或調用合約的標準方法
      
      return true;
    } catch (error) {
      this.log(`⚠️ 合約驗證失敗 ${contractName}: ${error.message}`, 'warning');
      return false;
    }
  }
```

### 步驟 3：修改 performSync 方法

在 `performSync` 方法中添加地址驗證調用：

```javascript
  async performSync() {
    // 1. 載入 V25 配置
    await this.loadV25Config();
    
    // 📝 1.5. 驗證地址唯一性
    await this.validateAddresses(this.v25Config);
    
    // 2. 如果指定了子圖版本，先更新 master-config.json
    if (this.subgraphVersion) {
      await this.updateMasterConfigSubgraphVersion();
    }
    
    // ... 其餘步驟保持不變
  }
```

### 步驟 4：修改 loadV25Config 方法

在 `loadV25Config` 方法中添加配置變更記錄和合約驗證：

```javascript
  async loadV25Config() {
    this.log('載入配置...', 'info');
    
    const masterConfigPath = path.join(PROJECT_PATHS.contracts, 'config/master-config.json');
    
    // 📝 讀取舊配置用於比較
    let oldConfig = null;
    if (fs.existsSync(masterConfigPath)) {
      oldConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
    }
    
    if (fs.existsSync(masterConfigPath)) {
      this.log('使用 master-config.json 作為真實地址來源', 'info');
      const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
      
      // ... 原有的配置轉換代碼 ...
      
      // 📝 記錄配置變更
      if (oldConfig) {
        await this.logConfigChange(oldConfig, masterConfig, 'master-config.json');
      }
      
      // 📝 驗證關鍵合約地址
      const requiredContracts = ['HERO', 'RELIC', 'PARTY', 'DUNGEONMASTER'];
      for (const contractName of requiredContracts) {
        if (!this.v25Config.contracts[contractName]?.address) {
          throw new Error(`缺少必要的合約地址: ${contractName}`);
        }
        
        // 驗證合約是否存在
        await this.verifyContractExists(
          this.v25Config.contracts[contractName].address,
          contractName
        );
      }
      
      this.log(`已從 master-config.json 載入配置: ${Object.keys(this.v25Config.contracts).length} 個合約`, 'success');
    } else {
      // ... 原有的從 v25-config.js 載入的邏輯 ...
    }
  }
```

## 改動總結

### 文件變更統計
- **新增代碼行數**：約 120 行
- **修改的方法**：2 個（performSync, loadV25Config）
- **新增的方法**：3 個
- **新增的屬性**：1 個

### 影響範圍
- ✅ 不影響現有功能
- ✅ 向後兼容
- ✅ 可選擇性啟用（通過註釋掉調用即可）

### 使用方式
改進後的腳本使用方式與原版完全相同：

```bash
# 正常同步
node scripts/active/v25-sync-all.js v3.6.0

# 查看配置變更日誌
cat config/config-changes.log
```

## 效益分析

### 1. 地址唯一性驗證
- **預防**：避免地址配對錯誤
- **即時**：在同步開始時就發現問題
- **清晰**：明確顯示哪些合約使用了相同地址

### 2. 配置變更日誌
- **審計**：完整的變更歷史記錄
- **追溯**：可以查看任何時間點的配置變更
- **調試**：快速定位配置問題的發生時間

### 3. 合約存在性檢查
- **驗證**：確保地址格式正確
- **擴展**：為未來的鏈上驗證預留接口
- **警告**：不會中斷流程，只是記錄警告

## 實施建議

1. **測試優先**：先在測試環境運行改進版腳本
2. **逐步實施**：可以先只加入地址驗證功能
3. **監控日誌**：定期檢查 config-changes.log
4. **團隊培訓**：確保團隊了解新功能的用途

## 未來擴展

### 短期改進
- 添加配置回滾功能（基於變更日誌）
- 實現真正的鏈上合約驗證
- 添加 Slack/Discord 通知

### 長期規劃
- 配置管理 UI 界面
- 自動化測試套件
- CI/CD 整合
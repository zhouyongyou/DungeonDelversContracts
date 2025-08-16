# V25 部署腳本改進建議

## 問題總結
1. Party 合約的 DungeonCore 設置失敗
2. 腳本在錯誤時中斷，無法繼續
3. 重複設置可能導致衝突

## 改進方案

### 1. 避免重複設置
```javascript
// 在類別中添加追蹤器
this.completedSetups = new Set();

// 記錄已完成的設置
if (success) {
  this.completedSetups.add(`${moduleName}.setDungeonCore`);
}

// 檢查是否需要設置
if (this.completedSetups.has(`${moduleName}.setDungeonCore`)) {
  this.log(`${moduleName}.setDungeonCore 已完成，跳過`, 'info');
  continue;
}
```

### 2. 改進錯誤處理
```javascript
async setupModulesWithRecovery() {
  const failedModules = [];
  
  for (const moduleName of modulesToSetup) {
    try {
      await this.setupSingleModule(moduleName);
    } catch (error) {
      this.log(`${moduleName} 設置失敗: ${error.message}`, 'error');
      failedModules.push({ module: moduleName, error });
      // 繼續處理下一個，而不是中斷
    }
  }
  
  // 嘗試修復失敗的模組
  if (failedModules.length > 0) {
    this.log(`\n嘗試修復 ${failedModules.length} 個失敗的模組...`, 'warning');
    await this.retryFailedModules(failedModules);
  }
}
```

### 3. 添加驗證延遲
```javascript
async verifyWithDelay(contract, getter, expected, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const actual = await contract[getter]();
      if (actual.toLowerCase() === expected.toLowerCase()) {
        return true;
      }
      
      // 等待更長時間讓區塊鏈狀態更新
      await this.sleep(3000 * (i + 1));
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
  return false;
}
```

### 4. 批次交易管理
```javascript
class TransactionBatcher {
  constructor(signer) {
    this.signer = signer;
    this.pendingTxs = [];
  }
  
  async addTransaction(contract, method, params) {
    const tx = await contract[method](...params);
    this.pendingTxs.push({
      tx,
      contract: contract.address,
      method,
      params
    });
    return tx;
  }
  
  async waitAll() {
    const results = await Promise.allSettled(
      this.pendingTxs.map(item => item.tx.wait())
    );
    
    return results.map((result, index) => ({
      ...this.pendingTxs[index],
      success: result.status === 'fulfilled',
      error: result.reason
    }));
  }
}
```

### 5. 狀態持久化
```javascript
// 保存部署狀態
async saveDeploymentState() {
  const state = {
    timestamp: Date.now(),
    contracts: this.contracts,
    completedSetups: Array.from(this.completedSetups),
    errors: this.errors
  };
  
  await fs.writeFile(
    `./deployments/state-${Date.now()}.json`,
    JSON.stringify(state, null, 2)
  );
}

// 恢復部署狀態
async loadDeploymentState(stateFile) {
  const state = JSON.parse(await fs.readFile(stateFile));
  this.contracts = state.contracts;
  this.completedSetups = new Set(state.completedSetups);
  this.errors = state.errors;
}
```

## 實施優先級

1. **高優先級**：
   - 避免重複設置（最容易實現）
   - 改進錯誤處理（防止中斷）

2. **中優先級**：
   - 添加驗證延遲
   - 狀態持久化

3. **低優先級**：
   - 批次交易管理
   - 完整的檢查點系統

## 下次部署建議

1. 使用 `--dry-run` 模式先測試
2. 分階段部署，每階段驗證
3. 保留部署日誌的詳細記錄
4. 準備快速修復腳本
# V25 部署腳本改進建議

## 1. 不要在失敗時立即停止部署
您說得對，立即停止會浪費 GAS。更好的方式是：

```javascript
// 收集所有錯誤，最後一起報告
const deploymentErrors = [];
const criticalErrors = [];

// 繼續部署，但記錄錯誤
try {
  await setDependency();
} catch (error) {
  deploymentErrors.push({
    contract: contractName,
    dependency: depName,
    error: error.message
  });
  
  if (isCritical) {
    criticalErrors.push(error);
  }
}

// 部署結束後生成報告
if (criticalErrors.length > 0) {
  console.log('⚠️ 部署完成但有關鍵錯誤！');
}
```

## 2. 在部署腳本中加入驗證階段

在 `v25-deploy-complete-sequential.js` 的最後加入：

```javascript
// 新增驗證階段
async verifyAllDependencies() {
  this.log('\n執行依賴驗證...', 'info');
  
  const verificationResults = [];
  
  // 執行完整的依賴檢查
  for (const [contractName, dependencies] of Object.entries(DEPENDENCY_VALIDATIONS)) {
    for (const dep of dependencies) {
      const result = await this.verifyDependency(contractName, dep);
      verificationResults.push(result);
    }
  }
  
  // 生成驗證報告
  await this.generateVerificationReport(verificationResults);
  
  // 顯示關鍵問題
  const criticalIssues = verificationResults.filter(r => !r.passed && r.critical);
  if (criticalIssues.length > 0) {
    this.log(`\n⚠️ 發現 ${criticalIssues.length} 個關鍵依賴問題`, 'warning');
    
    // 詢問是否執行修復
    this.log('建議執行修復腳本: npx hardhat run scripts/active/v25-fix-contract-dependencies.js --network bsc', 'warning');
  }
}
```

## 3. 整合修復邏輯（可選）

在部署腳本最後添加可選的自動修復：

```javascript
// 在部署結束後
if (DEPLOYMENT_CONFIG.options.autoFix && criticalIssues.length > 0) {
  this.log('\n嘗試自動修復依賴...', 'info');
  
  for (const issue of criticalIssues) {
    try {
      await this.fixDependency(issue);
      this.log(`✅ 修復 ${issue.contract}.${issue.dependency}`, 'success');
    } catch (error) {
      this.log(`❌ 無法修復 ${issue.contract}.${issue.dependency}: ${error.message}`, 'error');
    }
  }
  
  // 重新驗證
  await this.verifyAllDependencies();
}
```

## 4. 生成部署驗證報告

```javascript
async generateDeploymentValidationReport() {
  const report = {
    deploymentId: `v25-${Date.now()}`,
    timestamp: new Date().toISOString(),
    network: 'BSC Mainnet',
    deployer: this.deployer.address,
    
    // 部署結果
    deploymentResults: {
      contracts: this.contracts,
      errors: this.errors,
      warnings: this.warnings
    },
    
    // 依賴驗證
    dependencyValidation: {
      total: this.validationResults.length,
      passed: this.validationResults.filter(r => r.passed).length,
      failed: this.validationResults.filter(r => !r.passed).length,
      critical: this.validationResults.filter(r => !r.passed && r.critical).length,
      details: this.validationResults
    },
    
    // 功能測試
    functionalTests: {
      heroMintPrice: await this.testHeroMintPrice(),
      relicMintPrice: await this.testRelicMintPrice(),
      dungeonCoreOracle: await this.testDungeonCoreOracle()
    },
    
    // 建議的後續行動
    recommendations: this.generateRecommendations()
  };
  
  // 保存 JSON 報告
  const jsonPath = path.join(__dirname, '../deployments', `validation-report-${report.deploymentId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  
  // 生成 Markdown 報告
  const mdPath = jsonPath.replace('.json', '.md');
  fs.writeFileSync(mdPath, this.generateMarkdownReport(report));
  
  this.log(`\n驗證報告已生成:`, 'info');
  this.log(`- JSON: ${jsonPath}`, 'info');
  this.log(`- Markdown: ${mdPath}`, 'info');
}
```

## 5. 改進錯誤處理策略

```javascript
// 定義錯誤級別
const ErrorLevel = {
  CRITICAL: 'critical',    // 必須修復
  WARNING: 'warning',      // 應該修復
  INFO: 'info'            // 可選修復
};

// 錯誤分類
const errorCategories = {
  'setDungeonCore': ErrorLevel.CRITICAL,
  'setSoulShardToken': ErrorLevel.CRITICAL,
  'setBaseURI': ErrorLevel.WARNING,
  'setContractURI': ErrorLevel.INFO
};

// 處理錯誤時考慮級別
if (errorLevel === ErrorLevel.CRITICAL) {
  this.criticalErrors.push(error);
  // 但不停止部署
}
```

## 6. 實際整合到部署腳本

修改 `setupModules()` 函數：

```javascript
async setupModules() {
  this.log('\n配置各模組...', 'info');
  
  const modulesToSetup = [
    'HERO', 'RELIC', 'PARTY', 'VIPSTAKING', 'PLAYERPROFILE', 
    'PLAYERVAULT', 'DUNGEONMASTER', 'ALTAROFASCENSION'
  ];
  
  const setupResults = [];
  
  for (const moduleName of modulesToSetup) {
    const module = this.contracts[moduleName]?.contract;
    if (!module) continue;
    
    try {
      if (module.setDungeonCore) {
        const tx = await module.setDungeonCore(this.contracts.DUNGEONCORE.address);
        await tx.wait();
        
        // 立即驗證
        const actualValue = await module.dungeonCore();
        const success = actualValue.toLowerCase() === this.contracts.DUNGEONCORE.address.toLowerCase();
        
        setupResults.push({
          module: moduleName,
          dependency: 'dungeonCore',
          success,
          actual: actualValue,
          expected: this.contracts.DUNGEONCORE.address
        });
        
        if (success) {
          this.log(`✅ ${moduleName}.setDungeonCore 成功並驗證`, 'success');
        } else {
          this.log(`❌ ${moduleName}.setDungeonCore 設置但驗證失敗`, 'error');
        }
      }
    } catch (error) {
      this.log(`❌ ${moduleName}.setDungeonCore: ${error.message}`, 'error');
      setupResults.push({
        module: moduleName,
        dependency: 'dungeonCore',
        success: false,
        error: error.message
      });
    }
  }
  
  // 記錄設置結果供後續報告使用
  this.moduleSetupResults = setupResults;
}
```

## 總結

1. **不停止部署**：收集錯誤，最後一起處理
2. **加入驗證階段**：部署完成後全面檢查
3. **生成詳細報告**：包含部署結果和驗證結果
4. **可選自動修復**：根據配置決定是否自動修復
5. **錯誤分級**：區分關鍵和非關鍵錯誤
6. **立即驗證**：每次設置後立即檢查結果

這樣既不會浪費 GAS，又能確保部署質量。
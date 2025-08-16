# 🏗️ 下一版本部署架構設計

## 核心原則
1. **單一真相來源** - 只有一個配置文件
2. **不可變部署** - 部署後配置鎖定
3. **自動化驗證** - 每步都有驗證
4. **零手動修復** - 問題在部署時解決

## 架構設計

### 1. 配置結構
```
contracts/
├── deployment-manifest.json     # 唯一配置源
├── deployments/
│   ├── bsc-mainnet/
│   │   ├── v26-locked.json     # 部署後鎖定
│   │   └── v26-verified.json   # 驗證結果
│   └── bsc-testnet/
│       └── ...
└── deploy/
    ├── 01_deploy_tokens.js      # 有序部署腳本
    ├── 02_deploy_core.js
    ├── 03_deploy_nfts.js
    ├── 04_setup_connections.js
    └── 05_verify_all.js
```

### 2. 單一配置源 (deployment-manifest.json)
```json
{
  "version": "v26",
  "network": {
    "bsc-mainnet": {
      "rpc": "https://bsc-dataseed.binance.org/",
      "chainId": 56,
      "explorer": "https://bscscan.com"
    }
  },
  "contracts": {
    "tokens": {
      "SoulShard": {
        "artifact": "SoulShard",
        "args": [],
        "verify": true
      }
    },
    "core": {
      "DungeonCore": {
        "artifact": "DungeonCore",
        "args": [],
        "verify": true,
        "dependencies": []
      }
    },
    "nfts": {
      "Hero": {
        "artifact": "Hero",
        "args": ["$DungeonCore.address"],
        "verify": true,
        "dependencies": ["DungeonCore"]
      }
    }
  },
  "connections": [
    {
      "from": "DungeonCore",
      "method": "setHeroContract",
      "to": "Hero"
    },
    {
      "from": "Hero",
      "method": "setDungeonCore",
      "to": "DungeonCore"
    }
  ],
  "validations": [
    {
      "contract": "DungeonCore",
      "method": "heroContractAddress",
      "expected": "$Hero.address"
    }
  ]
}
```

### 3. 部署腳本架構

#### 主部署器 (deploy.js)
```javascript
const { DeploymentManager } = require('./lib/DeploymentManager');

async function deploy() {
  const manager = new DeploymentManager('deployment-manifest.json');
  
  // 階段 1: 部署
  await manager.deployAll();
  
  // 階段 2: 設置連接
  await manager.setupConnections();
  
  // 階段 3: 驗證
  const valid = await manager.validateAll();
  
  if (!valid) {
    throw new Error('部署驗證失敗');
  }
  
  // 階段 4: 鎖定配置
  await manager.lockDeployment();
  
  // 階段 5: 生成所有配置
  await manager.generateConfigs();
  
  console.log('✅ 部署成功並已鎖定');
}
```

#### DeploymentManager 類
```javascript
class DeploymentManager {
  constructor(manifestPath) {
    this.manifest = require(manifestPath);
    this.deployed = {};
    this.locked = false;
  }
  
  async deployAll() {
    // 按依賴順序部署
    const order = this.calculateDeployOrder();
    
    for (const contractName of order) {
      const config = this.manifest.contracts[contractName];
      const args = this.resolveArgs(config.args);
      
      console.log(`部署 ${contractName}...`);
      const contract = await this.deployContract(contractName, args);
      
      this.deployed[contractName] = {
        address: contract.address,
        blockNumber: contract.deployTransaction.blockNumber,
        deployer: contract.deployTransaction.from
      };
      
      // 立即保存進度（防止中斷）
      await this.saveProgress();
    }
  }
  
  async setupConnections() {
    for (const conn of this.manifest.connections) {
      const from = this.getContract(conn.from);
      const toAddress = this.deployed[conn.to].address;
      
      console.log(`設置 ${conn.from}.${conn.method}(${conn.to})`);
      
      const tx = await from[conn.method](toAddress);
      await tx.wait();
      
      // 立即驗證
      await this.verifyConnection(conn);
    }
  }
  
  async validateAll() {
    const results = [];
    
    for (const validation of this.manifest.validations) {
      const contract = this.getContract(validation.contract);
      const actual = await contract[validation.method]();
      const expected = this.resolveValue(validation.expected);
      
      const passed = actual.toLowerCase() === expected.toLowerCase();
      results.push({ ...validation, passed, actual });
      
      if (!passed) {
        console.error(`❌ 驗證失敗: ${validation.contract}.${validation.method}`);
        console.error(`   預期: ${expected}`);
        console.error(`   實際: ${actual}`);
      }
    }
    
    return results.every(r => r.passed);
  }
  
  async lockDeployment() {
    const lockFile = `deployments/${this.network}/${this.manifest.version}-locked.json`;
    
    const lockData = {
      version: this.manifest.version,
      network: this.network,
      timestamp: new Date().toISOString(),
      contracts: this.deployed,
      verified: true,
      locked: true
    };
    
    await fs.writeFile(lockFile, JSON.stringify(lockData, null, 2));
    this.locked = true;
  }
  
  async generateConfigs() {
    // 生成前端配置
    await this.generateFrontendConfig();
    
    // 生成子圖配置
    await this.generateSubgraphConfig();
    
    // 生成後端配置
    await this.generateBackendConfig();
  }
  
  async generateFrontendConfig() {
    const config = {
      version: this.manifest.version,
      contracts: {}
    };
    
    for (const [name, data] of Object.entries(this.deployed)) {
      config.contracts[name] = data.address;
    }
    
    const frontendPath = '../GitHub/DungeonDelvers/src/config/contracts.ts';
    const content = `// 自動生成 - 不要手動修改
// 版本: ${this.manifest.version}
// 時間: ${new Date().toISOString()}

export const CONTRACTS = ${JSON.stringify(config.contracts, null, 2)} as const;

export const CONTRACT_VERSION = '${this.manifest.version}';
`;
    
    await fs.writeFile(frontendPath, content);
  }
}
```

### 4. 防錯機制

#### 部署前檢查
```javascript
class PreDeploymentCheck {
  async check() {
    // 1. 檢查網路
    const chainId = await ethers.provider.getNetwork().chainId;
    if (chainId !== this.expectedChainId) {
      throw new Error(`錯誤網路: ${chainId}`);
    }
    
    // 2. 檢查餘額
    const balance = await signer.getBalance();
    if (balance.lt(MIN_BALANCE)) {
      throw new Error('餘額不足');
    }
    
    // 3. 檢查是否已部署
    const existing = await this.checkExistingDeployment();
    if (existing) {
      const confirm = await prompt('已有部署，是否覆蓋？(y/n)');
      if (confirm !== 'y') {
        process.exit(0);
      }
    }
    
    // 4. 檢查合約編譯
    await this.verifyArtifacts();
  }
}
```

#### 自動回滾
```javascript
class DeploymentRollback {
  constructor(manager) {
    this.manager = manager;
    this.snapshot = null;
  }
  
  async createSnapshot() {
    this.snapshot = { ...this.manager.deployed };
  }
  
  async rollback() {
    console.log('⚠️  部署失敗，執行回滾...');
    
    // 恢復到快照狀態
    this.manager.deployed = this.snapshot;
    
    // 保存失敗記錄
    await this.saveFailureLog();
  }
}
```

### 5. 零配置同步

#### 自動配置傳播
```javascript
// 在部署成功後自動執行
async function propagateConfig() {
  const config = await loadLockedConfig();
  
  // 使用 GitHub Actions 自動創建 PR
  await createConfigUpdatePR({
    frontend: true,
    backend: true,
    subgraph: true
  });
  
  // 通知所有相關服務
  await notifyServices(config);
}
```

### 6. 版本管理

#### 語義化版本
```javascript
class VersionManager {
  getNextVersion(type = 'patch') {
    const current = this.getCurrentVersion(); // v26.1.3
    const [major, minor, patch] = current.split('.');
    
    switch(type) {
      case 'major': // 重大變更
        return `v${parseInt(major)+1}.0.0`;
      case 'minor': // 新功能
        return `v${major}.${parseInt(minor)+1}.0`;
      case 'patch': // 修復
        return `v${major}.${minor}.${parseInt(patch)+1}`;
    }
  }
  
  async tag() {
    const version = this.getNextVersion();
    await exec(`git tag ${version}`);
    await exec(`git push origin ${version}`);
  }
}
```

## 實施計劃

### 第一階段：建立框架（1週）
1. 創建 DeploymentManager 類
2. 實現單一配置源
3. 建立部署順序解析

### 第二階段：整合驗證（1週）
1. 實現連接驗證
2. 加入自動回滾
3. 建立配置鎖定機制

### 第三階段：自動化（1週）
1. CI/CD 整合
2. 自動配置傳播
3. 監控告警系統

## 關鍵改變

### Before (現在的問題)
- 7+ 個配置來源
- 手動修復腳本
- 配置不一致
- 無法追溯變更

### After (新架構)
- 1 個配置源
- 零手動介入
- 自動驗證正確性
- 完整審計軌跡

## 成功標準
1. **部署成功率 > 99%**
2. **零手動修復**
3. **配置同步時間 < 5分鐘**
4. **可完整回滾**

## 風險管理
1. **部署失敗** → 自動回滾
2. **配置錯誤** → 部署時驗證
3. **網路問題** → 斷點續傳
4. **人為錯誤** → 配置鎖定

這個架構將徹底解決你的配置管理問題。
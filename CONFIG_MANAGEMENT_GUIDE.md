# 📚 DungeonDelvers 配置管理指南

## 🚨 當前配置問題總結

### 硬編碼地址分布
| 項目 | 硬編碼數量 | 文件數 | 主要位置 |
|------|-----------|--------|---------|
| 合約項目 | 7412個 | 1063個文件 | scripts/, test/, deployments/ |
| 前端項目 | 603個 | 86個文件 | src/config/, src/contracts/ |
| 後端項目 | 399個 | 34個文件 | config/, test/ |
| 子圖項目 | 89個 | 17個文件 | subgraph.yaml, networks.json |

### 重複配置位置（以 Hero 合約為例）
同一個地址 `0xe90d442458931690C057D5ad819EBF94A4eD7c8c` 出現在 14 個不同文件中！

## 🎯 統一配置管理系統

### 核心原則
1. **單一事實來源 (SSOT)**: 只在一個地方維護配置
2. **自動同步**: 減少人為錯誤
3. **版本控制**: 追蹤配置變更
4. **類型安全**: 防止配置錯誤

### 配置層級結構

```
/Users/sotadic/Documents/DungeonDelversContracts/
├── .env.v25                           # 🔑 主配置文件（唯一手動維護）
├── .env                               # 當前活動配置（從 .env.v25 複製）
├── config/
│   ├── master-config.json            # 統一 JSON 配置（自動生成）
│   └── hardcoded-locations.json      # 硬編碼位置追蹤
├── scripts/
│   └── ultimate-config-system.js     # 同步工具
└── deployments/
    └── abi/                          # ABI 文件統一存放
```

## 🔧 優化建議

### 1. 立即改進項目（低成本，高收益）

#### A. 消除不必要的硬編碼
```javascript
// ❌ 錯誤：硬編碼地址
const HERO_ADDRESS = "0xe90d442458931690C057D5ad819EBF94A4eD7c8c";

// ✅ 正確：從環境變數讀取
const HERO_ADDRESS = process.env.VITE_HERO_ADDRESS;
```

#### B. 統一配置同步流程
```bash
# 更新配置後執行
cd /Users/sotadic/Documents/DungeonDelversContracts
npm run sync-all

# 自動同步到：
# - 前端 .env.local
# - 後端 config/contracts.json
# - 子圖 networks.json
```

#### C. 創建配置驗證腳本
```bash
# 檢查配置一致性
npm run validate-config

# 輸出：
# ✅ 前端配置匹配
# ✅ 後端配置匹配
# ✅ 子圖配置匹配
```

### 2. 中期優化項目

#### A. 配置模板系統
```json
// config/template.json
{
  "{{VERSION}}": "V25",
  "{{HERO_ADDRESS}}": "${env.VITE_HERO_ADDRESS}",
  "{{START_BLOCK}}": "${env.VITE_START_BLOCK}"
}
```

#### B. 智能配置生成
```javascript
// scripts/generate-configs.js
function generateConfigs() {
  // 從 .env.v25 生成所有項目配置
  generateFrontendConfig();
  generateBackendConfig();
  generateSubgraphConfig();
}
```

### 3. 配置使用最佳實踐

#### 前端配置
```typescript
// src/config/contracts.ts
import { getEnvConfig } from './env-loader';

// 統一從環境變數載入
export const contracts = getEnvConfig();

// 類型安全
export interface ContractConfig {
  HERO_ADDRESS: string;
  RELIC_ADDRESS: string;
  // ...
}
```

#### 後端配置
```javascript
// config/index.js
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  contracts: {
    hero: process.env.VITE_HERO_ADDRESS,
    relic: process.env.VITE_RELIC_ADDRESS,
    // ...
  }
};
```

#### 子圖配置
```yaml
# 使用 mustache 模板
# subgraph.template.yaml
dataSources:
  - name: Hero
    address: "{{HERO_ADDRESS}}"
    startBlock: {{START_BLOCK}}
```

## 📍 硬編碼位置追蹤

### 必要的硬編碼（不建議修改）
1. **測試文件中的 Mock 地址** - 用於單元測試
2. **歷史部署記錄** - 用於審計追蹤
3. **第三方合約地址** - 如 Chainlink VRF Coordinator

### 需要消除的硬編碼
1. **腳本中的合約地址** ✅ 應改用環境變數
2. **前端源碼中的地址** ✅ 應改用配置文件
3. **後端 API 中的地址** ✅ 應改用配置模組

## 🚀 實施路線圖

### Phase 1: 清理和標準化（1-2天）
- [ ] 審查所有硬編碼地址
- [ ] 創建統一的 .env.v25 主配置
- [ ] 實現基礎同步腳本

### Phase 2: 自動化（3-5天）
- [ ] 開發完整的配置同步系統
- [ ] 添加配置驗證功能
- [ ] 設置 Git hooks 自動檢查

### Phase 3: 監控和優化（持續）
- [ ] 配置變更追蹤
- [ ] 性能監控
- [ ] 配置 A/B 測試

## 🔍 配置審計工具

```bash
# 查找所有硬編碼地址
npm run audit:hardcoded

# 檢查配置一致性
npm run audit:consistency

# 生成配置報告
npm run audit:report
```

## 📊 當前 V25 配置快照

```javascript
{
  "version": "V25",
  "deployment": {
    "date": "2025-08-17T20:00:00.000Z",
    "block": 57914301
  },
  "contracts": {
    // 新部署
    "HERO": "0xe90d442458931690C057D5ad819EBF94A4eD7c8c",
    "RELIC": "0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B",
    "PARTY": "0x629B386D8CfdD13F27164a01fCaE83CB07628FB9",
    "DUNGEONMASTER": "0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0",
    "DUNGEONSTORAGE": "0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542",
    "ALTAROFASCENSION": "0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1",
    
    // 復用
    "DUNGEONCORE": "0x26BDBCB8Fd349F313c74B691B878f10585c7813E",
    "PLAYERVAULT": "0xb2AfF26dc59ef41A22963D037C29550ed113b060",
    "PLAYERPROFILE": "0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1",
    "VIPSTAKING": "0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28",
    "ORACLE": "0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8",
    "VRFMANAGER": "0xdd14eD07598BA1001cf2888077FE0721941d06A8",
    "SOULSHARD": "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
    "USD": "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE",
    "UNISWAP_POOL": "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82"
  },
  "vrf": {
    "subscriptionId": "88422796721004450630713121079263696788635490871993157345476848872165866246915",
    "coordinator": "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
    "keyHash": "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4"
  }
}
```

## ⚠️ 重要提醒

1. **永遠不要**直接在其他項目修改合約地址
2. **總是**從 `.env.v25` 開始配置更新
3. **必須**在部署前運行配置驗證
4. **建議**使用配置版本標籤追蹤變更

## 🛠️ 工具命令

```bash
# 配置管理命令
npm run config:sync      # 同步所有配置
npm run config:validate  # 驗證配置一致性
npm run config:audit     # 審計硬編碼
npm run config:report    # 生成配置報告
npm run config:rollback  # 回滾到上一版本
```

---

*最後更新: 2025-08-17*
*配置版本: V25*
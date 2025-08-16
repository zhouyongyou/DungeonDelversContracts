# 配置管理系統文檔

## 當前版本: V25

更新時間: 2025-07-28T03:26:57.363Z

## 配置架構

```
v25-config.js (源頭配置)
    ├── master-config.json (自動生成)
    ├── config-reader.js (自動生成)
    ├── public/configs/
    │   ├── v25.json (CDN配置)
    │   └── latest.json (CDN最新版)
    └── .env.example (環境變數範例)
```

## 使用方式

### 1. 在 Node.js 腳本中讀取配置

```javascript
// 方法 1: 使用配置讀取器（推薦）
const config = require('./config/config-reader');

console.log(config.version); // 'V25'
console.log(config.getAddress('HERO')); // Hero 合約地址
console.log(config.getAllAddresses()); // 所有合約地址

// 方法 2: 直接載入源頭配置
const v25Config = require('./config/v25-config');
```

### 2. 在前端讀取配置

```javascript
// 從 CDN 載入
const response = await fetch('/configs/latest.json');
const config = await response.json();
```

### 3. 更新配置

當部署新版本後：

```bash
# 1. 部署會自動生成新的 vXX-config.js
npm run deploy

# 2. 執行統一配置管理器
node scripts/config/unified-config-manager.js

# 3. 所有衍生配置會自動更新
```

## 配置文件說明

| 文件 | 用途 | 格式 |
|------|------|------|
| v25-config.js | 源頭配置（部署自動生成） | JS |
| master-config.json | 主配置（向後相容） | JSON |
| config-reader.js | 配置讀取器 | JS |
| v25.json | CDN 版本配置 | JSON |
| latest.json | CDN 最新配置 | JSON |

## 合約地址

| 合約 | 地址 | 部署區塊 |
|------|------|----------|
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 55514557 |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | 55514557 |
| ORACLE | `0x2350D85e5DF1b6a6d055CD61FeD27d5dC36B6F52` | 55514557 |
| PLAYERVAULT | `0x4d06483c907DB1CfA9C2207D9DC5a1Abad86544b` | 55514557 |
| DUNGEONCORE | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | 55514557 |
| DUNGEONSTORAGE | `0x4b1A9a45d0a1C35CDbae04272814f3daA9b59c47` | 55514557 |
| DUNGEONMASTER | `0x08Bd8E0D85A7F10bEecCBA9a67da9033f9a7C8D9` | 55514557 |
| HERO | `0x162b0b673f38C11732b0bc0B4B026304e563e8e2` | 55514557 |
| RELIC | `0x15c2454A31Abc0063ef4a71d0640057d71847a22` | 55514557 |
| PARTY | `0xab07E90d44c34FB62313C74F3C7b4b343E52a253` | 55514557 |
| VIPSTAKING | `0xdC285539069Fa51b9259bd1F1d66f23f74B96A6c` | 55514557 |
| PLAYERPROFILE | `0x145F19e672a7D53ddb16bcE3fdeAd976bb3ef82f` | 55514557 |
| ALTAROFASCENSION | `0x0148Aff0Dee6D31BA9825e66ED34a66BCeF45845` | 55514557 |


## 注意事項

1. **不要手動編輯** master-config.json 或其他衍生配置
2. 所有配置修改應該在部署時自動生成
3. 使用 config-reader.js 可以確保總是讀取最新配置

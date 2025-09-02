# 配置管理系統文檔

## 當前版本: V25

更新時間: 2025-08-23T17:19:00.106Z

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
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 56317376 |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | 56317376 |
| ORACLE | `0xf8CE896aF39f95a9d5Dd688c35d381062263E25a` | 56317376 |
| PLAYERVAULT | `0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787` | 56317376 |
| DUNGEONCORE | `0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a` | 56317376 |
| DUNGEONSTORAGE | `0x1Fd33E7883FdAC36a49f497440a4E2e95C6fcC77` | 56317376 |
| DUNGEONMASTER | `0xd06470d4C6F62F6747cf02bD2b2De0981489034F` | 56317376 |
| HERO | `0x6DEb5Ade2F6BEe8294A4b7f37cE372152109E2db` | 56317376 |
| RELIC | `0xcfB83d8545D68b796a236290b3C1bc7e4A140B11` | 56317376 |
| PARTY | `0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69` | 56317376 |
| VIPSTAKING | `0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C` | 56317376 |
| PLAYERPROFILE | `0x0f5932e89908400a5AfDC306899A2987b67a3155` | 56317376 |
| ALTAROFASCENSION | `0xE043ef6Ce183C218F8f9d9a144eD4A06cF379686` | 56317376 |


## 注意事項

1. **不要手動編輯** master-config.json 或其他衍生配置
2. 所有配置修改應該在部署時自動生成
3. 使用 config-reader.js 可以確保總是讀取最新配置

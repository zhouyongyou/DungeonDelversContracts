# 🚀 NFT Trinity 部署指南

三個 NFT 合約（VIPStaking, Hero, Relic）的完整部署、驗證和雙向連接腳本。

## 📋 前置要求

### 1. 環境檢查
```bash
# 確認 Hardhat 和依賴已安裝
npm install

# 確認網路配置正確
npx hardhat network

# 確認部署者錢包有足夠 BNB (至少 0.05 BNB)
npx hardhat balance --account 0
```

### 2. DungeonCore 地址配置
**重要**：必須先確保 `.env` 文件中有 DungeonCore 地址：
```bash
# 檢查 .env 文件
grep "VITE_DUNGEONCORE_ADDRESS" .env

# 應該看到類似：
# VITE_DUNGEONCORE_ADDRESS=0x...
```

## 🎯 部署選項

### 選項 1: 完整自動化部署（推薦）
一鍵完成所有任務：部署 → 驗證 → 雙向連接

```bash
npx hardhat run scripts/deploy-and-connect-nft-trinity.js --network bsc
```

**包含功能**：
- ✅ 部署三個 NFT 合約
- ✅ 設置 NFT → DungeonCore 連接  
- ✅ 設置 DungeonCore → NFT 連接
- ✅ BSCScan 合約驗證
- ✅ 雙向連接驗證
- ✅ 完整結果報告

### 選項 2: 分步驟部署
如果需要更細粒度控制：

```bash
# 1. 先部署三個合約（不包含 DungeonCore 設置）
npx hardhat run scripts/deploy-nft-trinity.js --network bsc

# 2. 再設置雙向連接
npx hardhat run scripts/connect-nft-to-core.js --network bsc
```

## 📊 執行過程詳解

### 階段 1: 載入 DungeonCore 地址 🔍
- 從 `.env` 文件讀取 `VITE_DUNGEONCORE_ADDRESS`
- 驗證地址格式正確性

### 階段 2: 部署 NFT 合約 🏗️
```
VIPStaking → Hero → Relic
```
- 使用統一 Gas Price: **0.11 gwei**
- Gas Limit: **3,000,000**
- 等待每個合約部署確認

### 階段 3: 設置 NFT → DungeonCore 連接 🔧
```
VIPStaking.setDungeonCore(dungeonCoreAddress)
Hero.setDungeonCore(dungeonCoreAddress)  
Relic.setDungeonCore(dungeonCoreAddress)
```

### 階段 4: 設置 DungeonCore → NFT 連接 🔄
```
DungeonCore.setVipStaking(vipStakingAddress)
DungeonCore.setHeroContract(heroAddress)
DungeonCore.setRelicContract(relicAddress)
```

### 階段 5: 並行驗證合約 📋
- 等待 30 秒讓 BSCScan 同步
- 並行提交三個合約的驗證請求
- 處理 "Already Verified" 情況

### 階段 6: 驗證雙向連接 🔍
**DungeonCore → NFT 方向**：
- `DungeonCore.vipStakingAddress() == VIPStaking.address`
- `DungeonCore.heroContractAddress() == Hero.address`  
- `DungeonCore.relicContractAddress() == Relic.address`

**NFT → DungeonCore 方向**：
- `VIPStaking.dungeonCore() == DungeonCore.address`
- `Hero.dungeonCore() == DungeonCore.address`
- `Relic.dungeonCore() == DungeonCore.address`

### 階段 7: 保存完整結果 💾
生成詳細的 JSON 報告，包含：
- 所有合約地址
- 部署交易哈希
- 驗證狀態
- 連接狀態
- 摘要統計

## 📁 輸出文件

### 部署結果文件
```bash
deployment-results/
├── nft-trinity-complete-{timestamp}.json    # 完整部署報告
├── nft-trinity-{timestamp}.json             # 簡化部署報告（選項2）
└── connection-report-{timestamp}.md         # 連接狀態報告（選項2）
```

### 完整報告範例
```json
{
  "deployment": {
    "network": "bsc",
    "timestamp": "2025-09-12T12:00:00.000Z",
    "gasPrice": "0.11 gwei",
    "dungeonCore": "0x..."
  },
  "contracts": {
    "VIPStaking": {
      "address": "0x...",
      "deployTxHash": "0x...",
      "verified": true
    },
    "Hero": {
      "address": "0x...",
      "deployTxHash": "0x...",
      "verified": true
    },
    "Relic": {
      "address": "0x...",
      "deployTxHash": "0x...",
      "verified": true
    }
  },
  "connections": [
    {
      "contract": "VIPStaking",
      "direction": "Core→NFT", 
      "success": true
    },
    // ... 更多連接狀態
  ],
  "summary": {
    "totalContracts": 3,
    "successfulDeployments": 3,
    "successfulVerifications": 3,
    "successfulConnections": 6
  }
}
```

## ⚠️ 常見問題與解決

### 1. DungeonCore 地址未找到
```
❌ 未找到 DungeonCore 地址
```
**解決**：
```bash
# 檢查 .env 文件
cat .env | grep DUNGEONCORE

# 或手動添加
echo "VITE_DUNGEONCORE_ADDRESS=0xYourDungeonCoreAddress" >> .env
```

### 2. BNB 餘額不足
```
❌ BNB 餘額不足，至少需要 0.05 BNB
```
**解決**：向部署者錢包轉入足夠的 BNB

### 3. 合約驗證失敗
```
❌ Hero 驗證失敗: Contract source code already verified
```
**說明**：這實際上是成功的，合約已經被驗證過

### 4. 網路連接問題
```
❌ 部署失敗: timeout
```
**解決**：
```bash
# 檢查網路連接
npx hardhat network --network bsc

# 或使用不同的 RPC 端點
```

### 5. Gas Price 過低
```
❌ 交易被拒絕: replacement transaction underpriced
```
**解決**：腳本已使用 0.11 gwei，一般不會有此問題

## 🔧 高級配置

### 修改 Gas 設置
如需調整 Gas Price，編輯腳本中的：
```javascript
const GAS_PRICE = ethers.parseUnits("0.11", "gwei"); // 修改這裡
```

### 修改驗證延遲
如需調整驗證等待時間：
```javascript
const CONFIG = {
  VERIFICATION_DELAY: 30, // 修改秒數
  // ...
};
```

### 添加更多合約
要擴展到更多合約，修改：
```javascript
const CONFIG = {
  CONTRACTS: {
    VIPSTAKING: "VIPStaking",
    HERO: "Hero", 
    RELIC: "Relic",
    NEWCONTRACT: "NewContract" // 添加新合約
  }
};
```

## 🎉 部署成功標誌

看到以下訊息表示完全成功：
```
🎉 NFT Trinity 完整部署流程成功完成！
✅ 所有合約已部署、驗證並建立雙向連接
```

## 📞 技術支援

如果遇到問題：
1. 檢查 BSCScan 上的合約地址
2. 驗證所有交易都已確認
3. 查看生成的 JSON 報告文件
4. 檢查控制台輸出的詳細錯誤信息

---
*最後更新: 2025-09-12*
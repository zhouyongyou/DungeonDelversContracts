# 🔄 V25 合約地址同步指南

> **版本：V25** | **部署時間：2025-08-06 17:00 ~ 2025-08-07 02:00**

## 📋 V25 合約地址清單

### ✅ 新部署的合約（需要更新）
```bash
DUNGEONSTORAGE=0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468
DUNGEONMASTER=0xE391261741Fad5FCC2D298d00e8c684767021253
HERO=0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD
RELIC=0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4
ALTAROFASCENSION=0x095559778C0BAA2d8FA040Ab0f8752cF07779D33
PARTY=0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3
```

### 🔄 重複使用的合約（需要重新配置連接）
```bash
DUNGEONCORE=0x8a2D2b1961135127228EdD71Ff98d6B097915a13
PLAYERVAULT=0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787
PLAYERPROFILE=0x0f5932e89908400a5AfDC306899A2987b67a3155
VIPSTAKING=0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C
ORACLE=0xf8CE896aF39f95a9d5Dd688c35d381062263E25a
```

### 📌 固定使用的合約（無需更新）
```bash
SOULSHARD=0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
UNISWAP_POOL=0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82
USD_TOKEN=0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
VRF_MANAGER=0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1
```

---

# 🎯 子圖 (Subgraph) 更新

## 📊 子圖版本信息
- **版本：** v3.6.8
- **起始區塊：** 56664525
- **更新內容：** V25 合約地址同步

## 🔧 需要更新的檔案

### 1. `subgraph.yaml`
```yaml
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum/contract
    name: DungeonStorage
    network: chapel  # 或 bsc
    source:
      address: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468"  # 🆕 更新
      abi: DungeonStorage
      startBlock: 56664525  # 🆕 更新起始區塊
      
  - kind: ethereum/contract
    name: DungeonMaster
    source:
      address: "0xE391261741Fad5FCC2D298d00e8c684767021253"  # 🆕 更新
      startBlock: 56664525
      
  - kind: ethereum/contract
    name: Hero
    source:
      address: "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD"  # 🆕 更新
      startBlock: 56664525
      
  - kind: ethereum/contract
    name: Relic
    source:
      address: "0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4"  # 🆕 更新
      startBlock: 56664525
      
  - kind: ethereum/contract
    name: AltarOfAscension
    source:
      address: "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33"  # 🆕 更新
      startBlock: 56664525
      
  - kind: ethereum/contract
    name: Party
    source:
      address: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3"  # 🆕 更新
      startBlock: 56664525
```

### 2. 部署命令
```bash
# 更新子圖版本到 v3.6.8
graph deploy --version-label v3.6.8 dungeon-delvers-v25

# 或使用特定的部署命令
npm run deploy:subgraph -- --version v3.6.8
```

---

# 🖥️ 後端 (Backend) 更新

## 🔧 需要更新的檔案

### 1. 環境配置檔案 `.env` 或 `config.js`
```javascript
// V25 合約地址配置
const CONTRACT_ADDRESSES = {
  // 新部署的合約
  DUNGEON_STORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
  DUNGEON_MASTER: "0xE391261741Fad5FCC2D298d00e8c684767021253",
  HERO: "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD",
  RELIC: "0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4",
  ALTAR_OF_ASCENSION: "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33",
  PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
  
  // 重複使用的合約（地址不變）
  DUNGEON_CORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
  PLAYER_VAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
  PLAYER_PROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  VIP_STAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
  
  // 固定使用的合約
  SOUL_SHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  VRF_MANAGER: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"
};
```

### 2. ABI 檔案更新
```bash
# 複製最新的 ABI 檔案
cp contracts/artifacts/contracts/current/nft/Hero.sol/Hero.json backend/abis/
cp contracts/artifacts/contracts/current/nft/Relic.sol/Relic.json backend/abis/
cp contracts/artifacts/contracts/current/core/DungeonMaster.sol/DungeonMaster.json backend/abis/
# ... 其他新部署的合約
```

### 3. 合約實例初始化
```javascript
// 更新合約實例
const heroContract = new ethers.Contract(
  CONTRACT_ADDRESSES.HERO, 
  HeroABI, 
  provider
);

const relicContract = new ethers.Contract(
  CONTRACT_ADDRESSES.RELIC, 
  RelicABI, 
  provider
);

// 注意：Hero 和 Relic 現在支持 VRF 優化
// 鑄造費用計算需要考慮新的費用結構：SOUL + VRF BNB
```

---

# 🌐 前端 (Frontend) 更新

## 🔧 需要更新的檔案

### 1. 合約地址配置 `src/config/contracts.js`
```javascript
export const CONTRACT_ADDRESSES = {
  // V25 新部署的合約
  DUNGEON_STORAGE: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
  DUNGEON_MASTER: "0xE391261741Fad5FCC2D298d00e8c684767021253", 
  HERO: "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD",
  RELIC: "0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4",
  ALTAR_OF_ASCENSION: "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33",
  PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
  
  // 重複使用（地址不變，但需要確認連接）
  DUNGEON_CORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
  PLAYER_VAULT: "0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787",
  PLAYER_PROFILE: "0x0f5932e89908400a5AfDC306899A2987b67a3155",
  VIP_STAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  ORACLE: "0xf8CE896aF39f95a9d5Dd688c35d381062263E25a",
  
  // 固定使用
  SOUL_SHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  VRF_MANAGER: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"
};
```

### 2. ABI 檔案更新
```bash
# 複製最新的 ABI 檔案到前端
cp contracts/artifacts/contracts/current/nft/Hero.sol/Hero.json frontend/src/abis/
cp contracts/artifacts/contracts/current/nft/Relic.sol/Relic.json frontend/src/abis/
```

### 3. 鑄造費用計算更新 
```javascript
// V25 優化：Hero 和 Relic 現在使用單一 VRF 隨機數
const calculateMintingCost = async (quantity) => {
  // SOUL 代幣費用（NFT 價格）
  const soulCost = await heroContract.getRequiredSoulShardAmount(quantity);
  
  // VRF 費用（BNB）- 現在只需要 1 次 VRF 請求，不管鑄造多少個
  const vrfFee = await vrfManagerContract.vrfRequestPrice(); // 只收一次費用
  
  return {
    soulRequired: soulCost,
    bnbRequired: vrfFee,  // 不再 × quantity！
    totalUSD: calculateUSDValue(soulCost, vrfFee)
  };
};
```

### 4. UI 更新建議
```javascript
// 在鑄造頁面顯示優化效果
const MintingCostDisplay = ({ quantity }) => {
  const oldVrfCost = vrfFee * quantity;  // 舊版費用
  const newVrfCost = vrfFee;             // 新版費用（固定）
  const savings = oldVrfCost - newVrfCost;
  
  return (
    <div className="minting-cost">
      <div className="soul-cost">SOUL 費用: {soulCost} SOUL</div>
      <div className="vrf-cost">
        VRF 費用: {newVrfCost} BNB 
        {quantity > 1 && (
          <span className="savings">
            💰 節省: {savings} BNB ({((savings/oldVrfCost)*100).toFixed(0)}%)
          </span>
        )}
      </div>
    </div>
  );
};
```

---

# ⚡ 自動化更新腳本

## 🔧 一鍵更新腳本
```bash
#!/bin/bash
# V25_sync_all.sh

echo "🔄 開始 V25 合約地址同步..."

# 1. 更新子圖
echo "📊 更新子圖..."
cd subgraph/
# 替換合約地址
sed -i 's/OLD_HERO_ADDRESS/0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD/g' subgraph.yaml
sed -i 's/OLD_RELIC_ADDRESS/0x9B36DA9584d8170bAA1693F14E898f44eBFc77F4/g' subgraph.yaml
# 部署子圖
graph deploy --version-label v3.6.8

# 2. 更新後端
echo "🖥️  更新後端..."
cd ../backend/
# 更新配置檔案
cp ../contracts/V25_DEPLOYMENT_RECORD.json config/contracts.json
npm run restart

# 3. 更新前端
echo "🌐 更新前端..."
cd ../frontend/
# 複製 ABI
cp ../contracts/artifacts/contracts/current/nft/Hero.sol/Hero.json src/abis/
cp ../contracts/artifacts/contracts/current/nft/Relic.sol/Relic.json src/abis/
# 更新配置
node scripts/update-contracts.js
npm run build

echo "✅ V25 同步完成！"
```

---

# ⚠️ 重要注意事項

## 🔍 驗證清單
- [ ] 子圖起始區塊設為 56664525
- [ ] Hero 和 Relic 地址更新
- [ ] VRF 費用計算邏輯更新（單次收費）
- [ ] ABI 檔案同步
- [ ] 測試鑄造功能
- [ ] 確認費用優化生效

## 💰 V25 關鍵優化效果
- **VRF 費用優化：** 98% 節省（用 tokenId + 單一隨機數）
- **支付結構：** SOUL 代幣 + VRF BNB 費用
- **起始區塊：** 56664525（重要！）

## 🚨 可能遇到的問題
1. **子圖索引延遲**：新區塊可能需要時間同步
2. **前端快取**：記得清除瀏覽器快取
3. **ABI 不匹配**：確保使用最新的合約 ABI
4. **費用計算錯誤**：注意 VRF 費用現在是固定的，不再乘以數量

---

**📞 如需協助，請參考 V25_DEPLOYMENT_RECORD.json 或聯繫開發團隊**
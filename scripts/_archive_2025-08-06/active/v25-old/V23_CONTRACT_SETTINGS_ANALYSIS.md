# V23 合約設置分析報告

## 合約來源
是的，所有腳本都從 `/contracts/current` 資料夾取得合約。

## 已設置項目 ✅

### 1. DungeonCore
- ✅ setOracle → Oracle 地址
- ✅ setHeroContract → Hero 地址
- ✅ setRelicContract → Relic 地址
- ✅ setPartyContract → Party 地址
- ✅ setDungeonMaster → DungeonMaster 地址
- ✅ setPlayerVault → PlayerVault 地址
- ✅ setPlayerProfile → PlayerProfile 地址
- ✅ setVipStaking → VIPStaking 地址
- ✅ setAltarOfAscension → AltarOfAscension 地址

### 2. Hero NFT
- ✅ setDungeonCore
- ✅ setSoulShardToken
- ✅ setAscensionAltarAddress
- ✅ setBaseURI
- ❌ setContractURI (未設置)
- 🔧 setMintPriceUSD (合約預設 2 USD，無需設置)
- 🔧 setPlatformFee (合約預設值，無需設置)

### 3. Relic NFT
- ✅ setDungeonCore
- ✅ setSoulShardToken
- ✅ setAscensionAltarAddress
- ✅ setBaseURI
- ❌ setContractURI (未設置)
- 🔧 setMintPriceUSD (合約預設 2 USD，無需設置)
- 🔧 setPlatformFee (合約預設值，無需設置)

### 4. Party NFT
- ✅ setHeroContract
- ✅ setRelicContract
- ✅ setDungeonCore
- ✅ setBaseURI
- ❌ setContractURI (未設置)
- ❌ setOperatorApproval (未設置)
- 🔧 setPlatformFee (合約預設值，無需設置)

### 5. VIPStaking
- ✅ setDungeonCore
- ✅ setSoulShardToken
- ✅ setBaseURI
- ❌ setContractURI (未設置)
- 🔧 setUnstakeCooldown (生產環境才需調整)

### 6. PlayerProfile
- ✅ setDungeonCore
- ✅ setBaseURI
- ❌ setContractURI (未設置)

### 7. PlayerVault
- ✅ setDungeonCore
- ✅ setSoulShardToken
- ❌ setTaxParameters (未設置)
- ❌ setWithdrawThresholds (未設置)
- ❌ setCommissionRate (未設置)

### 8. DungeonMaster
- ✅ setDungeonCore
- ✅ setDungeonStorage
- ✅ setSoulShardToken
- ❌ setDungeonMasterWallet (函數不存在！)
- ❌ updateDynamicSeed (未設置)
- ❌ setGlobalRewardMultiplier (未設置)
- 🔧 setProvisionPriceUSD (暫不使用)
- 🔧 setExplorationFee (合約預設值，無需設置)

### 9. DungeonStorage
- ✅ setLogicContract → DungeonMaster

### 10. AltarOfAscension
- ✅ setContracts (Hero, Relic, SoulShard, DungeonCore)
- ❌ setUpgradeRule (未設置，使用預設規則)
- ❌ setVIPBonus (未設置)
- ❌ updateDynamicSeed (未設置)

### 11. Oracle
- 🔧 無需額外設置（構造時已設置）
- ❌ setTwapPeriod (使用預設值)
- ❌ setAdaptivePeriods (V22 特有，使用預設值)

## 潛在問題 ⚠️

### 1. **DungeonMasterWallet 問題**
- 腳本嘗試調用 `setDungeonMasterWallet`，但 DungeonMaster 合約中**沒有這個函數**
- 錢包地址可能是硬編碼在合約中，或通過其他方式設置
- 需要檢查 DungeonMaster 如何處理費用收集

### 2. **ContractURI 未設置**
- 所有 NFT 合約都有 `setContractURI` 函數但未設置
- 這影響 OpenSea 等市場的合約級元數據顯示
- 建議設置為對應的合約信息 URL

### 3. **PlayerVault 稅務參數**
- `setTaxParameters`、`setWithdrawThresholds`、`setCommissionRate` 未設置
- 可能使用合約預設值，需確認是否合適

### 4. **動態種子未更新**
- DungeonMaster 和 AltarOfAscension 的 `updateDynamicSeed` 未調用
- 使用構造時的初始種子，可能需要定期更新以確保隨機性

## 建議新增設置

```javascript
// 1. 設置 ContractURI（所有 NFT）
const CONTRACT_URIS = {
  HERO: 'https://dungeon-delvers-metadata-server.onrender.com/api/contract/hero',
  RELIC: 'https://dungeon-delvers-metadata-server.onrender.com/api/contract/relic',
  PARTY: 'https://dungeon-delvers-metadata-server.onrender.com/api/contract/party',
  VIPSTAKING: 'https://dungeon-delvers-metadata-server.onrender.com/api/contract/vip',
  PLAYERPROFILE: 'https://dungeon-delvers-metadata-server.onrender.com/api/contract/profile'
};

// 2. PlayerVault 稅務設置（如果需要）
{
  name: 'PlayerVault.setTaxParameters',
  method: 'setTaxParameters',
  args: [smallTaxRate, largeTaxRate, taxThresholdUSD]
}

// 3. 動態種子更新（可選）
{
  name: 'DungeonMaster.updateDynamicSeed',
  method: 'updateDynamicSeed',
  args: [generateRandomSeed()]
}
```

## 總結

1. **關鍵設置都已完成**：合約間的地址依賴、BaseURI 等核心功能都已設置
2. **可選設置未完成**：ContractURI、稅務參數、動態種子等
3. **需要確認**：DungeonMasterWallet 的設置方式（可能不需要設置）
4. **建議**：根據實際需求決定是否添加可選設置
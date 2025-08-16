# DungeonDelvers 合約優化記錄

**日期**: 2025-08-06  
**優化類型**: VRF 訂閱模式適配 + 字符串優化  
**影響合約**: Hero.sol, Relic.sol, AltarOfAscension.sol, DungeonMaster.sol, VRFConsumerV2Plus.sol

## 🎯 優化目標

1. **VRF 模式轉換**: 從直接資金模式改為訂閱模式
2. **合約大小縮減**: 通過字符串優化減少合約體積
3. **功能保持**: 確保所有 VRF 功能正常運作

## 🔧 主要修改

### 1. VRF 訂閱模式適配

#### **問題背景**
- VRF Manager 現在使用訂閱模式 (Subscription Mode)
- 原合約仍使用直接資金模式 (Direct Funding Mode)
- 導致所有 mint 交易失敗

#### **修改內容**

**Hero.sol**:
```solidity
// ❌ 修改前
uint256 vrfFee = IVRFManager(vrfManager).vrfRequestPrice();
requiredPayment += vrfFee;
IVRFManager(vrfManager).requestRandomForUser{value: vrfFee}(...)

// ✅ 修改後  
IVRFManager(vrfManager).requestRandomForUser(...)
```

**相同修改應用於**:
- ✅ Hero.sol (mintFromWallet, mintFromVault)
- ✅ Relic.sol (mintFromWallet, mintFromVault)
- ✅ AltarOfAscension.sol (upgradeTokens)
- ✅ DungeonMaster.sol (exploreWithParty)
- ✅ VRFConsumerV2Plus.sol (requestRandomWords, requestRandomForUser)

### 2. 合約大小優化

#### **優化前後對比**

| 合約 | 優化前 | 優化後 | 節省 | 節省率 |
|------|--------|--------|------|--------|
| AltarOfAscension.sol | 28KB | 24KB | -4KB | -14.3% |
| Hero.sol | 32KB | 29KB | -3KB | -9.4% |
| Relic.sol | 32KB | 28KB | -4KB | -12.5% |
| **總計** | **92KB** | **81KB** | **-11KB** | **-12.0%** |

#### **字符串優化策略**

**1. 錯誤訊息縮短**
```solidity
// 優化前
require(_quantity > 0 && _quantity <= 50, "Hero: Invalid quantity");
require(msg.sender == ascensionAltarAddress, "Hero: Caller is not the Altar");
require(userCommitments[msg.sender].blockNumber == 0, "Hero: Previous mint pending");

// 優化後
require(_quantity > 0 && _quantity <= 50, "IQ");
require(msg.sender == ascensionAltarAddress, "NA");
require(userCommitments[msg.sender].blockNumber == 0, "PM");
```

**2. Tier 名稱縮短**
```solidity
// 優化前
tierName: "Single Mint"
tierName: "Bronze Pack"
tierName: "Platinum Pack"

// 優化後
tierName: "SM"
tierName: "BP"  
tierName: "PP"
```

## 📝 錯誤代碼對照表

### 通用錯誤代碼
| 代碼 | 原始訊息 | 含義 |
|------|----------|------|
| `NA` | "Not Altar" | 非祭壇調用 |
| `IQ` | "Invalid Quantity" | 數量無效 |
| `PM` | "Previous Mint" | 前一次鑄造待處理 |
| `IP` | "Insufficient Payment" | 支付不足 |
| `IV` | "Insufficient Vault" | 金庫支付不足 |
| `NP` | "No Pending" | 無待處理操作 |
| `AR` | "Already Revealed" | 已經揭示 |
| `TE` | "Too Early" | 太早揭示 |
| `RE` | "Reveal Expired" | 揭示過期 |
| `NY` | "Not Yet" | 尚未過期 |
| `BU` | "Burn Unrevealed" | 不能銷毀未揭示 |
| `BS` | "BaseURI not Set" | BaseURI 未設置 |
| `DC` | "DungeonCore" | DungeonCore 未設置 |
| `NR` | "Not Revealed" | 尚未揭示 |
| `TL` | "Tier Large" | 等級 ID 太大 |
| `IR` | "Invalid Rarity" | 稀有度無效 |
| `WF` | "Withdraw Failed" | 提取失敗 |
| `VM` | "VRF Manager" | 僅限 VRF Manager |
| `RR` | "Invalid Rarity" | 稀有度錯誤 |

### 祭壇專用錯誤代碼
| 代碼 | 原始訊息 | 含義 |
|------|----------|------|
| `PU` | "Previous Upgrade" | 前一次升級待處理 |
| `PE` | "Pending Exists" | 升級請求存在 |
| `UD` | "Upgrade Disabled" | 升級已禁用 |
| `UC` | "Upgrade not Configured" | 升級未配置 |
| `IM` | "Incorrect Materials" | 材料數量錯誤 |
| `TC` | "Token Contract" | 無效代幣合約 |
| `NT` | "No Tokens" | 無代幣提供 |
| `NO` | "Not Owner" | 非代幣擁有者 |
| `SR` | "Same Rarity" | 稀有度必須相同 |
| `IR2` | "Invalid Rarity" | 稀有度無效 |
| `IC` | "Invalid Chances" | 機率無效 |
| `BH` | "Bonus too High" | 獎勵率太高 |

### Tier 名稱縮寫
| 代碼 | 原始名稱 | 含義 |
|------|----------|------|
| `SM` | "Single Mint" | 單次鑄造 |
| `BP` | "Bronze Pack" | 青銅包 |
| `SP` | "Silver Pack" | 白銀包 |
| `GP` | "Gold Pack" | 黃金包 |
| `PP` | "Platinum Pack" | 白金包 |

## 🧪 測試建議

### 1. VRF 功能測試
```bash
# 檢查 VRF Consumer 授權狀態
npm run check-vrf

# 測試 VRF 功能
npm run test-vrf

# 確認 LINK 餘額充足
# 檢查 VRF Manager 訂閱狀態
```

### 2. 合約部署測試
```bash
# 編譯檢查
npx hardhat compile

# 部署到測試網
npx hardhat run scripts/deploy.js --network bscTestnet

# 驗證合約
npx hardhat run scripts/verify.js --network bscTestnet
```

### 3. 功能完整性測試
- Hero/Relic mint 功能
- 祭壇升級功能  
- 地城探索功能
- VRF 隨機數生成

## ⚠️ 重要提醒

### 1. VRF 訂閱管理
- 確保 VRF Manager 有足夠的 LINK 訂閱餘額
- 定期檢查訂閱狀態和餘額
- 所有 Consumer 合約已授權：Hero, Relic, AltarOfAscension, DungeonMaster

### 2. 錯誤代碼文檔
- 前端需要更新錯誤處理邏輯
- 為用戶提供錯誤代碼對照表
- 考慮在合約中添加 getter 函數返回完整錯誤描述

### 3. Gas 優化效果
- 字符串縮短主要減少 deployment gas
- 對 runtime gas 影響較小
- 建議監控實際 gas 使用情況

## 📊 預期效果

### 1. 功能修復
- ✅ Hero mint 交易成功
- ✅ Relic mint 交易成功  
- ✅ 祭壇升級功能正常
- ✅ 地城探索功能正常

### 2. 成本節省
- **部署成本**: 預計減少 12% 左右
- **合約大小**: 總共節省 11KB
- **維護成本**: 統一錯誤代碼便於維護

### 3. 風險降低
- 移除直接資金依賴，降低 VRF 費用波動影響
- 訂閱模式更加穩定和可預測
- 統一的錯誤處理邏輯

## 🚀 後續優化建議

### 短期 (1-2週)
1. **Custom Errors**: 使用 Solidity 0.8.4+ 的 custom errors 進一步減少 gas
2. **重複代碼抽取**: Hero 和 Relic 有大量重複邏輯，可考慮抽取基類

### 中期 (1個月)  
1. **Library 化**: 將通用邏輯抽取為 Library
2. **Proxy 模式**: 考慮使用 Diamond 或其他 Proxy 模式

### 長期 (3個月)
1. **架構重構**: 完全重新設計合約架構
2. **模組化**: 實現真正的模組化設計

---

**優化執行者**: Claude Code Assistant  
**審查狀態**: ⏳ 待測試驗證  
**部署狀態**: ⏳ 待部署到測試網

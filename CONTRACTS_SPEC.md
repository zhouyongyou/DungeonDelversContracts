# Dungeon Delvers 智能合約 SPEC 文檔

## 1. 文檔資訊
- 專案名稱：Dungeon Delvers Contracts（Soulbound Saga）
- 版本標籤：v1.4.0.3（測試部署 2025-09-09）
- 作者與維護：Core Solidity Squad（合約團隊）
- 更新日期：2025-01-06（依據 repo 內容撰寫）
- 目標讀者：合約開發者、審計員、後端整合與 DevOps 團隊

## 2. 目標與範圍
- 建立一套模組化 GameFi 合約，支援英雄/神器 NFT、隊伍組建、地下城探險、升階、VIP 質押與經濟系統。
- 提供 VRF 隨機、公平的抽卡與探險結果。
- 透過 DungeonCore 進行中心化參數管理與跨合約授權。
- 提供玩家資金金庫（PlayerVault）與推薦人系統，確保資金流與稅制透明。

**非目標**
- 不涵蓋前端遊戲邏輯與鏈下 API。
- 不處理鏈上合約升級流程（另有部署文件說明）。
- 不討論美術資產與元資料伺服器細節。

## 3. 架構總覽
合約分為三大模組：
1. **Core**：`DungeonCore`, `DungeonMaster`, `DungeonStorage`, `AltarOfAscension`, `VRFConsumerV2Plus`。
2. **NFT**：`Hero`, `Relic`, `Party`, `PlayerProfile`, `VIPStaking`。
3. **DeFi / Token**：`PlayerVault`, `Oracle`, `TSOUL`, `TUSD1`。

```
          ┌──────────┐
          │DungeonCore│←全域參數/授權
          └────┬─────┘
               │
    ┌──────────┼───────────┐
    │          │           │
DungeonMaster AltarOfAscension PlayerVault
    │          │           │
    │          │           │
 VRF ↔ Hero/Relic  ←→  Party / PlayerProfile / VIPStaking
```

- **DungeonCore** 為唯一可信控制點，持有各模組地址、代幣指標與 VRF 管理員地址。
- **DungeonStorage** 儲存大型結構（地下城、冷卻），透過 `DungeonMaster` 代理修改。
- **VRF**：所有隨機流程（英雄/神器鑄造、升階、探險）均透過 Chainlink VRF Manager 進行。

## 4. 合約模組詳述

### 4.1 Core 模組
- `DungeonCore.sol`
  - 初始化需要 SoulShard (`TSOUL`) 與 USD 穩定幣 (`TUSD1`) 地址。
  - 暴露 `getSoulShardAmountForUSD` 與 `getUSDValueForSoulShard`，依賴 `Oracle` 將 USD/SOUL 相互轉換。
  - 持有核心合約引用與事件：Hero/Relic/Party/PlayerProfile/VIPStaking、DungeonMaster、AltarOfAscension、PlayerVault、Oracle、VRF Manager、DungeonStorage。
  - 提供批次設定 `setBatchAddresses`，利於部署時一次配置。
  - 所有寫入操作限制 `onlyOwner`，由部署者掌控。

- `DungeonMaster.sol`
  - 提供 `requestExpedition`，驗證：隊伍擁有權、冷卻、戰力、地城存在、探索費（0.0015 BNB）。
  - 探險請求寫入 `DungeonStorage` 的 `PartyStatus`，並透過 VRF 獲取結果。
  - VRF 回調 `onVRFFulfilled` → `_processExpeditionWithVRF`：
    - 計算成功率（基礎成功率 + VIP 等級加成，最高 100%），依結果分發獎勵（透過 PlayerVault `deposit`），再更新經驗（PlayerProfile）。
    - `globalRewardMultiplier` 預設 1000 (=100%)，可調整全球獎勵比例。
    - 冷卻固定 24 小時 (`COOLDOWN_PERIOD`)。

- `DungeonStorage.sol`
  - 保存地下城基本資料與隊伍冷卻。
  - 只有 `DungeonMaster` 可呼叫 `setDungeon`、`setPartyStatus`。
  - 建構子預載 12 個地下城（入門→大師級），詳見第 6 章資料表。

- `AltarOfAscension.sol`
  - 處理英雄/神器升階，鎖定材料 NFT，透過 VRF 決定結果。
  - `upgradeRules` 依基礎稀有度 (1~4) 定義材料數量、原生費（BNB）、成功/大成功/部分失敗機率。
  - `activeUpgradeRequest` 防止重複請求，`lockedTokens` 避免材料在等待期間被轉出。
  - 事件 `UpgradeAttempted`、`UpgradeRevealed`支援子圖索引。

- `VRFConsumerV2Plus.sol`
  - 封裝 Chainlink VRF V2 Plus 功能，允許訂閱模式頁面處理。
  - 本專案內直接由子合約透過 DungeonCore 提供的 VRF Manager地址呼叫。

### 4.2 NFT 模組
- `Hero.sol`
  - ERC721 + ERC4906，記錄 `rarity` (0~5)、`power` (16-bit)。
  - 鑄造流程：
    1. 前置預鑄：`_safeMint` 空白英雄，扣除 `SoulShard` 或 `PlayerVault` 餘額。
    2. 呼叫 VRF 取得實際稀有度、戰力，於回調內批次更新。
    3. 支援單次 1~50 組，`mintPriceUSD` = 2 USD，`platformFee` = 0.0003 BNB/份。
  - VRF 回調為每個 token 計算 `uniqueSeed`（`baseRandomWord` XOR tokenId 等參數），確保同批次仍具獨立性。
  - 稀有度與戰力分佈：

    | 稀有度 | 抽中機率 | 戰力範圍 (`_generateHeroPowerByRarity`) |
    |--------|----------|-----------------------------------------|
    | 1 (N)  | 44%      | 15 – 50 |
    | 2 (R)  | 35%      | 50 – 100 |
    | 3 (SR) | 15%      | 100 – 150 |
    | 4 (SSR)| 5%       | 150 – 200 |
    | 5 (UR) | 1%       | 200 – 255 |
  - 升階鑄造 (`mintFromAltar`) 直接寫入指定稀有度/戰力，用於大成功或成功結果。

- `Relic.sol`
  - 與 Hero 有相同架構，差異在屬性：`rarity` + `capacity` (1~5)。
  - 同步 VRF 流程，決定神器稀有度與容量。
  - 容量等於稀有度；機率分佈與英雄相同（44/35/15/5/1）。
  - 升階鑄造時 `capacity` 固定設為新稀有度，確保容量同步提升。

- `Party.sol`
  - ERC721 + ERC4906 + `ERC721Holder`（暫存英雄與神器）。
  - 玩家支付 `platformFee` (預設 0.001 BNB) 後可建立隊伍：
    - 驗證持有英雄/神器，神器提供總容量，英雄數量不得超過容量且 ≤25。
    - 安全轉移英雄與神器至合約（托管）。
    - 計算總戰力與隊伍稀有度：
      - UR ≥2700、SSR ≥2100、SR ≥1500、R ≥900、其餘 N。
    - DungeonMaster 透過 Party 合約的 `getPartyComposition` 取得戰力（另有 `getPartyPowerQuick` 快捷查詢）；戰力快照同時存入 `partyPowerDirect` 方便查詢。
  - `createParty` 會將所有英雄/神器 `safeTransfer` 至合約內托管；拆隊或返還需配合額外管理流程（本合約未內建）。

- `PlayerProfile.sol`
  - EIP-5192 Soulbound Token，永不可轉移。
  - `addExperience` 可自動鑄造 Profile，經驗依據 `sqrt(exp/100)+1` 計算等級。
  - 事件 `ExperienceAdded`、`LevelUp` 、`Locked` 支援監控。

- `VIPStaking.sol`
  - SBT 表示 VIP 質押位階，`stake` / `requestUnstake` / `claimUnstaked`。
  - `unstakeCooldown` 預設 24h，未領取前金額記錄於 `unstakeQueue`。
  - VIP Level 計算：
    - 將 SoulShard 質押量轉換 USD 後，`level = sqrt(value / 100 USD)`，上限 255。
    - 每級提供 0.5% 稅率折扣（PlayerVault 用）。
  - 所有質押者持有的 VIP NFT 為 SBT（`locked()` 恒回 true），等級變動會觸發 `VipLevelChanged` 與 ERC-4906 事件。

### 4.3 DeFi / Token 模組
- `PlayerVault.sol`
  - 玩家資金金庫，支援：
    - `deposit`：僅 `DungeonMaster` 可執行（探險獎勵入帳）。
    - `spendForGame`：Hero/Relic/Altar 等遊戲合約扣款。
    - `withdraw`：玩家直接提款，系統依提款額度、時間、VIP 等級與玩家等級計算稅率。
  - 稅率參數預設：
    - `standardInitialRate` 25%，`largeWithdrawInitialRate` 40%。
    - `decreaseRatePerPeriod` 5%/天，`periodDuration` 1 天。
    - `smallWithdrawThresholdUSD` 20 USD 以下可走小額免費（單日一次），`largeWithdrawThresholdUSD` 1000 USD 以上使用高起始稅。
  - 提款流程：
    - 轉換提款額為 USD，若符合小額條件且距上一筆免費提款超過 1 天，直接免稅。
    - 否則依 `initialRate` 減去時間衰減、VIP 折扣、玩家等級折扣後計稅，最低 0%。
    - 稅後餘額再提撥 5% 給推薦人 (`commissionRate=500`)，記錄於 `virtualCommissionBalance`。
    - 稅額累積至 `virtualTaxBalance`，可由合約擁有者提領。
  - 推薦系統：
    - 支援以地址或自訂使用者名稱 (`registerUsername`/`updateUsername`) 綁定推薦人。
    - 使用者名稱格式：長度 1–15、英數或底線，禁止以 `0x` 開頭；註冊/更新需支付 `usernameRegistrationFee`（預設 0.01 BNB）。
    - `withdrawCommission` 可一次領出累積佣金，並更新終身統計。
  - 事件提供完整金流統計（Deposited、Withdrawn、CommissionPaid 等）。

- `Oracle.sol`
  - 基於 Uniswap V3 TWAP，提供 SoulShard ↔ USD 價格查詢。
  - 預設 `twapPeriod` 1800 秒，`adaptivePeriods` [1800, 900, 600, 300]，無法取得則逐步縮短窗口。
  - 計算使用 `MulDiv` 精確乘除，避免溢位。

- `TSOUL.sol` / `TUSD1.sol`
  - 標準 ERC20，用於測試環境：
    - 18 decimals，Owner 可 `mint`、`burn`，並保留 `Ownable` 管理權。

## 5. 核心流程與序列

### 5.1 英雄/神器鑄造
1. 玩家前端呼叫 `mintFromWallet` 或 `mintFromVault`。
2. 合約計算所需 SoulShard，扣款、預鑄 NFT，送出 VRF 請求。
3. VRF 回傳後設定稀有度與能力值，觸發 `BatchMintCompleted` 事件。

### 5.2 隊伍建立
1. 玩家提供英雄/神器列表，支付平台費。
2. 合約逐一驗證擁有權與容量，將 NFT 托管於合約並鑄造 Party NFT。
3. DungeonMaster 透過 `getPartyComposition` 取得隊伍戰力並判定是否達標。

### 5.3 地下城探險
1. 玩家以 Party NFT 呼叫 `DungeonMaster.requestExpedition`，支付 0.0015 BNB 探險費。
2. `DungeonStorage` 設定隊伍冷卻，DungeonMaster 送出 VRF。
3. VRF 回調：
   - 計算成功率（基礎值 + VIP 等級加成，最高 100%）。
   - 成功：
     - SoulShard 獎勵 = `getSoulShardAmountForUSD(rewardUSD)` × `globalRewardMultiplier / 1000`；若 Oracle 或 Vault 調用失敗則記錄錯誤並跳過獎勵。
     - 經驗值 = `requiredPower / 10`，透過 `PlayerProfile.addExperience` 發送。
   - 失敗：
     - 不發放 SoulShard，`PlayerProfile` 仍會獲得 `requiredPower / 20` 的經驗值。
   - 所有結果均發出 `ExpeditionFulfilled`，並在 VRF 函式完成後清理請求。

### 5.4 英雄升階
1. 玩家呼叫 `AltarOfAscension.upgradeNFTs`，提供材料清單與費用。
2. 合約鎖定材料並送出 VRF 請求。
3. VRF 回傳：根據 `UpgradeRule` 產生結果（大成功→更高稀有度與鑄造新卡，部分失敗→退還部分）。
4. 更新玩家統計（成功次數、燃燒數量等）。
   - 大成功：燃燒材料後一次鑄造 2 張新 NFT，稀有度 +1，英雄會重新投骰戰力。
   - 成功：燃燒材料後鑄造 1 張稀有度 +1 的新 NFT。
   - 部分失敗：燃燒材料後鑄造「材料數量一半」的同稀有度 NFT。
   - 失敗：僅燃燒材料，不鑄造新 NFT。

### 5.5 VIP 質押與稅率互動
1. 玩家 `stake` SoulShard 至 VIPStaking，鑄造 SBT。
2. PlayerVault 在計算稅率時呼叫 `getVipLevel`，對稅率折扣 (`vipLevel * 50 bp`)。
3. 玩家 `requestUnstake` 需等待冷卻後 `claimUnstaked`。

## 6. 資料模型與常數

### 6.1 地下城設定（`DungeonStorage` 建構子）
| ID | 名稱 | 所需戰力 | 基礎成功率 | 獎勵 (USD) |
|----|------|----------|------------|------------|
| 1 | 新手礦洞 | 300 | 89% | 6 |
| 2 | 哥布林洞穴 | 600 | 84% | 12 |
| 3 | 食人魔山谷 | 900 | 79% | 20 |
| 4 | 蜘蛛巢穴 | 1200 | 74% | 33 |
| 5 | 石化蜥蜴沼澤 | 1500 | 69% | 52 |
| 6 | 巫妖墓穴 | 1800 | 64% | 78 |
| 7 | 奇美拉之巢 | 2100 | 59% | 113 |
| 8 | 惡魔前哨站 | 2400 | 54% | 156 |
| 9 | 巨龍之巔 | 2700 | 49% | 209 |
|10 | 混沌深淵 | 3000 | 44% | 225 |
|11 | 冥界之門 | 3300 | 39% | 320 |
|12 | 虛空裂隙 | 3600 | 34% | 450 |

### 6.2 升階規則（`AltarOfAscension` 建構子）
| 基礎稀有度 | 材料數 | 原生費 (BNB) | 大成功 | 成功 | 部分失敗 | 冷卻 |
|------------|--------|---------------|--------|------|----------|------|
| 1 → 2 | 5 | 0.005 | 8% | 77% | 13% | 10s |
| 2 → 3 | 4 | 0.01 | 6% | 69% | 20% | 10s |
| 3 → 4 | 3 | 0.02 | 5% | 48% | 37% | 10s |
| 4 → 5 | 2 | 0.05 | 6% | 34% | 46% | 10s |

### 6.3 PlayerVault 稅率計算
- `initialRate`：依提款 USD 金額選擇 25% 或 40%。
- `timeDecay`：距離上次提款的天數 × 5%。
- `vipReduction`：VIP 等級 × 0.5%。
- `levelReduction`：玩家等級 / 10 × 1%。
- 最終稅率為 `max(initialRate - (timeDecay + vipReduction + levelReduction), 0)`。
- 推薦佣金：稅後金額的 5%，儲存在虛擬佣金帳戶。

## 7. 權限與安全
- **Owner**（通常為多簽）：
  - DungeonCore 所有設定、Oracle 參數、PlayerVault 稅率與佣金、NFT BaseURI、VIP 冷卻等。
- **DungeonMaster**：唯一可以 `PlayerVault.deposit` 的合約。
- **授權遊戲合約**：在 DungeonCore 註冊後，才能對 Vault 執行扣款。
- **防護措施**：
  - 所有關鍵流程採 `nonReentrant`、`Pausable`。
  - `userRequests` 防止重複 VRF 請求。
  - SBT（PlayerProfile/VIPStaking）覆寫傳輸函數避免二級市場交易。
  - `lockedTokens`、`PartyCooldown` 避免在 VRF 等待期間重複操作。
  - `Oracle` 驗證池上 Token 順序、防溢位。
  - PlayerVault 主要處理 SoulShard 流轉，並另外收取 BNB 使用者名稱註冊費用。

## 8. 外部依賴
- OpenZeppelin Contracts v5 系列（Ownable, ERC721, ERC20, Access, ReentrancyGuard, Pausable 等）。
- Chainlink VRF V2 Plus（`IVRFManager` 介面，訂閱模式無需額外 BNB）。
- Uniswap V3 TWAP（價格預言機）。
- 前端預期使用 Graph 子圖與事件索引器。

## 9. 監控與營運建議
- 建立子圖索引以下事件：
  - `ExpeditionRequested`, `ExpeditionFulfilled`, `PartyCooldownUpdated`。
  - `HeroMinted`, `RelicMinted`, `UpgradeAttempted`, `UpgradeRevealed`。
  - `Deposited`, `Withdrawn`, `CommissionPaid`, `VirtualTaxCollected`。
  - `Staked`, `UnstakeRequested`, `VipLevelChanged`。
- 監控鏈上指標：
  - VRF 回調失敗率與 pending request 數量。
  - PlayerVault 稅收餘額與虛擬佣金餘額。
  - VIP 質押總量、未領取金額。
- 建議結合 Hardhat/Foundry 測試覆蓋關鍵流程：
  - 探險成功/失敗路徑、升階各結果分支、稅率折扣邏輯。

## 10. 未來擴充議題
- VRF Manager 升級流程與多鏈支援。
- PlayerVault 追加穩定幣提款與匯率保護機制。
- DungeonStorage 可考慮改為可迭代列表以支援新地下城。
- VIP 等級與推薦制度的治理化（DAO 控制參數）。

---
本 SPEC 旨在提供合約團隊、審計與營運人員快速理解 Dungeon Delvers v1.4.0.3 智能合約系統之依據，如需部署步驟與驗證流程，請參考 `CONTRACT_DEPLOYMENT_CONFIGURATION.md` 與相關報告檔案。

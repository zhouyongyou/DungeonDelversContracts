# ⛓️ DungeonDelvers 合約速覽（v1.4.0.3）

> 本文件提供模組速查與交互重點。更完整的流程、參數與資料表請參考 `CONTRACTS_SPEC.md`。

## 核心模組
| 模組 | 主要職責 | 關鍵介面 |
|------|----------|----------|
| `DungeonCore` | 中央註冊與授權中心 | `set*Contract`、`getSoulShardAmountForUSD`、`getVRFManager` |
| `DungeonMaster` | 地下城探險協調、VRF 回調 | `requestExpedition`、`onVRFFulfilled` |
| `DungeonStorage` | 地城與冷卻資料存放 | `setDungeon`、`setPartyStatus` |
| `AltarOfAscension` | 升階邏輯、材料鎖定 | `upgradeNFTs`、`onVRFFulfilled` |
| `PlayerVault` | 遊戲內資金、稅率與推薦 | `deposit`、`withdraw`、`setReferrer*` |
| `Oracle` | SoulShard ↔ USD 價格查詢 | `getAmountOut` |

## NFT 模組摘要
- **Hero / Relic**
  - 託管於 `DungeonCore`，VRF 決定稀有度與屬性。
  - 稀有度機率：44% / 35% / 15% / 5% / 1%。英雄戰力、Relic 容量同調。
  - 升階鑄造透過 `AltarOfAscension` 重新生成屬性。
- **Party**
  - 建立時需托管英雄與神器，戰力快照存於 `partyPowerDirect`。
  - `getPartyComposition` 提供戰力計算給 `DungeonMaster`。
- **PlayerProfile / VIPStaking**
  - 皆為 SBT，支援 ERC-4906 事件更新。
  - Profile 記錄經驗，VIP 以 `sqrt(USD/100)` 推導等級（封頂 20）並提供稅率折扣。
  - Owner 可在 `pause()` 後切換緊急模式，協助玩家透過 `emergencyClaimAll` 或 `emergencyForceUnstake` 取回質押。

## 地下城流程
1. `requestExpedition` 檢查隊伍權限、冷卻、戰力後收取 0.0015 BNB 探險費。 
2. VRF 回調 `_processExpeditionWithVRF`，成功率 = 地城基礎值 + VIP 等級（上限 100）。
3. 成功：透過 `PlayerVault.deposit` 發放 SoulShard，並為玩家加經驗 (`requiredPower / 10`)；失敗則給予一半經驗。
4. 所有結果會 emit `ExpeditionFulfilled`，完成後清除 `userRequests` 與 `requestIdToUser`。

| 地下城 | 戰力需求 | 成功率 | 獎勵 (USD) |
|--------|----------|--------|------------|
| 1–12   | 300–3600 | 89%–34%| 6–450 |

## 升階流程
- `upgradeNFTs`：鎖定材料、收取 BNB 費用、呼叫 VRF。
- 結果與 NFT 產出：
  - 大成功：產出 2 張稀有度 +1 NFT。
  - 成功：產出 1 張稀有度 +1 NFT。
  - 部分失敗：產出「材料數量一半」的同稀有度 NFT。
  - 失敗：僅燒毀材料。
- VIP + 額外加成 (`additionalVipBonusRate`) 可提升成功率（最高再加 20）。

## PlayerVault 概覽
- `withdraw`：
  1. 將 SoulShard 換算 USD。
  2. 若符合每日一次小額（≤20 USD）且冷卻結束則免稅。
  3. 其餘情況依初始稅率 25%/40% 減去時間衰減 (5%/日)、VIP 折扣 (0.5%/等級)、玩家等級折扣 (每 10 等減 1%)。
  4. 稅後金額再提撥 5% 作為推薦佣金，剩餘轉給玩家。
- `virtualTaxBalance` 與 `virtualCommissionBalance` 記錄累積值，分別可由 Owner 或推薦人提領。
- 推薦人可透過地址或使用者名稱綁定；名稱須付費註冊 (預設 0.01 BNB)。

## 其他注意事項
- VRF 管理員地址透過 `DungeonCore.setVRFManager` 設定，所有需要隨機的合約皆查詢同一地址。
- 所有對 Vault 有扣款權的合約需在 `DungeonCore` 註冊：Hero、Relic、Altar、DungeonMaster。
- 緊急清理流程（Hero/Relic `EmergencyReset`、Altar `emergencyUnlock`、DungeonMaster `EmergencyCleanup`）紀錄在事件中，利於排查。

---
如需舊版詳細說明，可前往 `archive/docs/` 目錄查看封存資料。

# Contract API Reference (v1.4.0.3)

> 更新日期：2025-09-25 ｜ 對應部署：BSC Mainnet `62385903+`
>
> 本文件彙整 Soulbound Saga 8 個核心合約的外部介面，包含角色定位、關鍵函數、事件與 viem/wagmi 調用範例。合約地址請以 [`README.md`](../README.md#測試合約地址) 為準；開發/測試環境可透過 `update-env-with-new-contracts.js` 自動注入最新地址。

## 目錄
1. [DungeonCore](#dungeoncore)
2. [DungeonMaster](#dungeonmaster)
3. [AltarOfAscension](#altarofascension)
4. [PlayerVault](#playervault)
5. [Hero](#hero)
6. [Relic](#relic)
7. [Party](#party)
8. [VIPStaking](#vipstaking)

---

## DungeonCore
- **型別**: `Ownable`, `ReentrancyGuard`, `Pausable`
- **責任**: 管理所有衛星合約地址、授權跨合約互動、提供 USD ↔ SoulShard 轉換
- **主事件**: `OracleSet`, `PlayerVaultSet`, `VRFManagerSet`, `BatchAddressesSet`

### 讀寫函數
| 函數 | 參數 | 回傳 | 權限 | 說明 |
| --- | --- | --- | --- | --- |
| `getSoulShardAmountForUSD(uint256 usd)` | 18-dec USD 值 | SoulShard 數量 | 公開 | 用於 Hero/Relic Mint、PlayerVault tax 計算 |
| `getUSDValueForSoulShard(uint256 amount)` | SoulShard 數量 | 18-dec USD | 公開 | VIP 等級計算、提款稅率 |
| `spendFromVault(address player, uint256 amount)` | 玩家地址、SoulShard | 無 | `Hero`/`Relic`/`Altar` | 允許授權合約從 Vault 扣款 |
| `isPartyLocked(uint256 partyId)` | 隊伍 ID | bool | 公開 | 查詢冷卻狀態（透過 DungeonMaster） |
| `set*Contract(address)` | 新合約地址 | 無 | `onlyOwner` | 設定子系統合約（Hero/Relic/Party/...） |
| `setVRFManager(address)` | VRF 管理員 | 無 | `onlyOwner` | 建立 VRF 管理員引用 |
| `setBatchAddresses(address soulShard, address vrf, address oracle, address storage)` | 批次設定 | 無 | `onlyOwner` | 初始化階段一次設定主要地址 |

### 調用範例 (viem)
```ts
import { createWalletClient, http } from 'viem';
import { dungeonCoreAbi } from '@/contracts/abi/DungeonCore';

const client = createWalletClient({
  chain: bsc,
  transport: http(process.env.BSC_RPC!)
});

const usdValue = 100n * 10n ** 18n; // 100 USD
const soulAmount = await client.readContract({
  address: addresses.DungeonCore,
  abi: dungeonCoreAbi,
  functionName: 'getSoulShardAmountForUSD',
  args: [usdValue]
});
```

---

## DungeonMaster
- **型別**: `Ownable`, `ReentrancyGuard`, `Pausable`, VRF Callback
- **責任**: 遠征請求、VRF 結果處理、冷卻與獎勵派發
- **主事件**: `ExpeditionRequested`, `ExpeditionFulfilled`, `PartyCooldownUpdated`, `VRFRequestFulfilled`

### 主要函數
| 函數 | 參數 | 權限 | 說明 |
| --- | --- | --- | --- |
| `requestExpedition(uint256 partyId, uint256 dungeonId)` | msg.value 必須等於 `explorationFee` | 玩家 | 驗證隊伍擁有權、戰力後提出遠征，觸發 VRF |
| `onVRFFulfilled(uint256 requestId, uint256[] randomWords)` | VRF 回調 | VRF Manager | 解析結果，更新 Vault、PlayerProfile |
| `setDungeon(uint256 id, Dungeon memory config)` | Owner | `onlyOwner` | 建立或更新地城需求、獎勵 |
| `setExplorationFee(uint256 fee)` | 新費用 | `onlyOwner` | 調整遠征費（預設 0.0015 BNB） |
| `setDungeonCore(address)` / `setDungeonStorage(address)` | 合約地址 | `onlyOwner` | 維護核心依賴 |
| `pause()` / `unpause()` | 無 | `onlyOwner` | 緊急暫停 |
| `setGlobalRewardMultiplier(uint256)` | 例：`1000 = 100%` | `onlyOwner` | 動態調整獎勵倍率 |

### 調用範例 (wagmi)
```ts
const { writeAsync } = useWriteContract({
  address: addresses.DungeonMaster,
  abi: dungeonMasterAbi,
  functionName: 'requestExpedition'
});

await writeAsync({
  args: [partyId, dungeonId],
  value: explorationFee
});
```

---

## AltarOfAscension
- **型別**: `Ownable`, `Pausable`, `ReentrancyGuard`
- **責任**: 升階規則管理、材料鎖定、VRF 結果處理
- **主事件**: `UpgradeRequested`, `UpgradeRevealed`, `UpgradeAttemptFailed`

### 主要函數
| 函數 | 說明 | 備註 |
| --- | --- | --- |
| `upgradeNFTs(UpgradeRequest request)` | 收集材料 NFT、扣除費用、發送 VRF | 材料會被暫存於合約；成功後透過 `Hero/Relic.mintFromAltar` 產出 |
| `setUpgradeRules(uint8 rarity, UpgradeRule rule)` | 更新各稀有度升階規則 | 僅 owner |
| `setDungeonCore(address)` | 設定核心引用 | 僅 owner |
| `pause()` / `unpause()` | 緊急暫停 | |
| `emergencyUnlock(uint256[] tokenIds)` | 救援鎖定材料 | owner |

### 調用範例
```ts
await writeContract(config, {
  address: addresses.AltarOfAscension,
  abi: altarAbi,
  functionName: 'upgradeNFTs',
  args: [{
    tokenType: 0, // 0 = Hero, 1 = Relic
    baseRarity: 2,
    tokens: materialTokenIds,
    useVaultBalance: true
  }]
});
```

---

## PlayerVault
- **型別**: `Ownable`, `Pausable`, `ReentrancyGuard`
- **責任**: 管理玩家 SoulShard 餘額、稅率、推薦佣金、提款流程
- **主事件**: `Deposited`, `Withdrawn`, `CommissionPaid`, `CommissionWithdrawn`, `UsernameRegistered`

### 主要函數
| 函數 | 權限 | 說明 |
| --- | --- | --- |
| `deposit(address player, uint256 amount)` | `onlyAuthorized` (DungeonMaster 等) | 將 SoulShard 存入玩家金庫 |
| `spendForGame(address player, uint256 amount)` | 授權合約 | 英雄/神器鑄造扣款 |
| `withdraw(uint256 amount)` | 玩家 | 根據稅率計算淨額並轉出 SoulShard |
| `setReferrer(address referrer)` / `setReferrerByUsername(string)` | 玩家 | 綁定推薦人 |
| `registerUsername(string name)` | 玩家 | 支付 BNB 註冊用戶名 |
| `withdrawCommission()` | 推薦人 | 領取佣金 |
| `setDailyFreeWithdrawalLimit(uint256 usdAmount)` | Owner | 調整每日免稅額 |
| `setTaxConfig(TaxConfig config)` | Owner | 更新稅率參數 |

### 調用範例
```ts
const vault = getContract({ address: addresses.PlayerVault, abi: playerVaultAbi });
const txHash = await vault.write.withdraw([amountInSoul], { account });
```

---

## Hero
- **型別**: `ERC721`, `ERC4906`, `Ownable`, `Pausable`
- **責任**: 鑄造英雄 NFT、管理稀有度與戰力、支援升階輸出
- **主事件**: `MintRequested`, `HeroMinted`, `HeroBurned`, `ContractsSet`

### 主要函數
| 函數 | 說明 |
| --- | --- |
| `mint(uint256 quantity)` | 直接支付 BNB（透過 Vault 內部換算）鑄造英雄 |
| `mintFromVault(uint256 quantity)` | 使用 PlayerVault 餘額支付 |
| `mintFromAltar(address recipient, uint8 rarity, uint16 power)` | 供祭壇成功後鑄造新英雄 |
| `getRequiredSoulShardAmount(uint256 quantity)` | 查詢鑄造成本（SoulShard） |
| `setDungeonCore(address)` / `setSoulShardToken(address)` | Owner 設定依賴 |
| `withdrawSoulShard()` / `withdrawBNB()` | Owner 提領累積款項 |

### 調用範例
```ts
await writeContract(config, {
  address: addresses.Hero,
  abi: heroAbi,
  functionName: 'mintFromVault',
  args: [5n],
  account: userAccount
});
```

---

## Relic
- **型別**: 與 `Hero` 結構相同
- **差異**: 產出容量 (`capacity`)、影響隊伍可攜英雄數
- **額外事件**: `RelicMinted`, `RelicBurned`

### 主要函數
| 函數 | 說明 |
| --- | --- |
| `mint` / `mintFromVault` | 鑄造神器（容量 = 稀有度） |
| `getRequiredSoulShardAmount` | 查詢 SoulShard 成本 |
| `mintFromAltar` | 升階成功產出新的 Relic |

---

## Party
- **型別**: `ERC721`, `Ownable`
- **責任**: 組建/拆解隊伍、托管英雄與神器
- **主事件**: `PartyCreated`, `PartyDisbanded`

### 主要函數
| 函數 | 說明 |
| --- | --- |
| `createParty(CreatePartyParams params)` | 建立隊伍並托管選定的 Hero/Relic |
| `disband(uint256 partyId)` | 解散隊伍，返還 NFT |
| `getPartyComposition(uint256 partyId)` | 回傳總戰力（供 DungeonMaster 使用） |
| `setDungeonCore(address)` / `setDungeonMaster(address)` | Owner 設定依賴 |
| `setSoulShardVault(address)` | 指定 Vault 扣款地址 |

### 調用範例
```ts
await writeContract(config, {
  address: addresses.Party,
  abi: partyAbi,
  functionName: 'createParty',
  args: [{
    heroIds,
    relicIds,
    feeRecipient: addresses.PlayerVault
  }],
  value: platformFee
});
```

---

## VIPStaking
- **型別**: `ERC721` (SBT via ERC5192), `Ownable`, `Pausable`
- **責任**: 管理 SoulShard 質押、VIP 等級與緊急模式
- **主事件**: `Staked`, `UnstakeRequested`, `UnstakeClaimed`, `VipLevelChanged`

### 主要函數
| 函數 | 說明 | 備註 |
| --- | --- | --- |
| `stake(uint256 amount)` | 將 SoulShard 鎖倉並鑄造 VIP SBT | 立即更新等級 |
| `requestUnstake(uint256 amount)` | 發起解質押 | 經過 `unstakeCooldown` 後可領回 |
| `claimUnstaked()` | 完成解質押提領 | 將 SoulShard 轉回玩家 |
| `getVipLevel(address player)` | 讀取當前等級 | `level = sqrt(USD/100)`，上限 20 |
| `setDungeonCore(address)` | Owner 設定核心 | |
| `enableEmergencyMode()` / `emergencyClaimAll()` | Owner 或使用者 | 緊急狀態下快速救援 |

### 調用範例
```ts
await writeContract(config, {
  address: addresses.VIPStaking,
  abi: vipStakingAbi,
  functionName: 'stake',
  args: [amountInSoul],
  account: userAccount
});
```

---

## 實作建議
1. **型別保護**：透過 `viem` 自動產生的型別或 `wagmi` hook，避免手動拼接 calldata。
2. **Gas 預估**：大部分函數為 `nonReentrant`，若遇到預估失敗建議傳入 `gas` 上限或透過 `estimateGas` 先試算。
3. **事件監控**：前端與後端若需追蹤狀態，請監聽對應事件並同步至子圖（所有事件已於 `subgraph.yaml` 中映射）。
4. **權限控制**：多數管理函數僅合約擁有者可呼叫，外部服務若需操作請透過多簽或治理流程。

---
如需完整 ABI，請參考 `abis/*.json`；若 ABI 更新請重新執行 `node scripts/essential/extract-abis.js` 將檔案同步至前端、後端與子圖專案。

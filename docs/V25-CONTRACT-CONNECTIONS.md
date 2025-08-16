# V25 合約互連完整參考文檔

> 📅 **更新日期**: 2025-08-06  
> ⚡ **版本**: V25  
> 🎯 **狀態**: 100% 完成 (21/21 連接)

## 📋 合約地址總表

| 合約名稱 | 地址 | 部署狀態 |
|---------|------|---------|
| **DungeonCore** | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ♻️ 重複使用 |
| **DungeonMaster** | `0xE391261741Fad5FCC2D298d00e8c684767021253` | 🆕 新部署 |
| **DungeonStorage** | `0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468` | 🆕 新部署 |
| **Hero** | `0xD48867dbac5f1c1351421726B6544f847D9486af` | 🆕 新部署 |
| **Relic** | `0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce` | 🆕 新部署 |
| **Party** | `0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3` | 🆕 新部署 |
| **AltarOfAscension** | `0x095559778C0BAA2d8FA040Ab0f8752cF07779D33` | 🆕 新部署 |
| **PlayerProfile** | `0x0f5932e89908400a5AfDC306899A2987b67a3155` | ♻️ 重複使用 |
| **PlayerVault** | `0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787` | ♻️ 重複使用 |
| **VIPStaking** | `0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C` | ♻️ 重複使用 |
| **Oracle** | `0xf8CE896aF39f95a9d5Dd688c35d381062263E25a` | ♻️ 重複使用 |
| **VRFManager** | `0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038` | 🔧 固定使用 (VRFManagerV2Plus) |
| **SoulShard** | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 🔧 固定使用 |
| **USD** | `0x7C67Af4EBC6651c95dF78De11cfe325660d935FE` | 🔧 固定使用 (測試用) |
| **DungeonMasterWallet** | `0x10925A7138649C7E1794CE646182eeb5BF8ba647` | 👤 錢包地址 |

---

## 🔗 合約互連詳細映射表

### 1️⃣ DungeonCore (總機合約)
> **合約文件**: `DungeonCore.sol`  
> **地址**: `0x8a2D2b1961135127228EdD71Ff98d6B097915a13`

#### 🔍 讀取函數 (View Functions)
| 連接目標 | 讀取函數 | 返回值 | 驗證狀態 |
|---------|---------|-------|---------|
| PlayerProfile | `playerProfileAddress()` | `0x0f5932e89908400a5AfDC306899A2987b67a3155` | ✅ |
| Hero | `heroContractAddress()` | `0xD48867dbac5f1c1351421726B6544f847D9486af` | ✅ |
| Relic | `relicContractAddress()` | `0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce` | ✅ |
| Party | `partyContractAddress()` | `0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3` | ✅ |
| DungeonMaster | `dungeonMasterAddress()` | `0xE391261741Fad5FCC2D298d00e8c684767021253` | ✅ |
| AltarOfAscension | `altarOfAscensionAddress()` | `0x095559778C0BAA2d8FA040Ab0f8752cF07779D33` | ✅ |
| PlayerVault | `playerVaultAddress()` | `0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787` | ✅ |
| VIPStaking | `vipStakingAddress()` | `0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C` | ✅ |
| Oracle | `oracleAddress()` | `0xf8CE896aF39f95a9d5Dd688c35d381062263E25a` | ✅ |
| USD Token | `usdTokenAddress()` | `0x7C67Af4EBC6651c95dF78De11cfe325660d935FE` | ✅ |
| SoulShard Token | `soulShardTokenAddress()` | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | ✅ |

#### ⚙️ 設定函數 (Setter Functions)
| 目標合約 | 設定函數 | 權限 | 事件 |
|---------|---------|------|------|
| PlayerProfile | `setPlayerProfile(address)` | `onlyOwner` | `PlayerProfileSet` |
| Hero | `setHeroContract(address)` | `onlyOwner` | `HeroContractSet` |
| Relic | `setRelicContract(address)` | `onlyOwner` | `RelicContractSet` |
| Party | `setPartyContract(address)` | `onlyOwner` | `PartyContractSet` |
| DungeonMaster | `setDungeonMaster(address)` | `onlyOwner` | `DungeonMasterSet` |
| AltarOfAscension | `setAltarOfAscension(address)` | `onlyOwner` | `AltarOfAscensionSet` |
| PlayerVault | `setPlayerVault(address)` | `onlyOwner` | `PlayerVaultSet` |
| VIPStaking | `setVipStaking(address)` | `onlyOwner` | `VipStakingSet` |
| Oracle | `setOracle(address)` | `onlyOwner` | `OracleSet` |

---

### 2️⃣ DungeonMaster (地城主合約)
> **合約文件**: `DungeonMaster.sol`  
> **地址**: `0xE391261741Fad5FCC2D298d00e8c684767021253`

#### 🔍 讀取函數
| 連接目標 | 讀取函數 | 返回值 | 驗證狀態 |
|---------|---------|-------|---------|
| DungeonCore | `dungeonCore()` | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ✅ |
| DungeonStorage | `dungeonStorage()` | `0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468` | ✅ |
| VRFManager | `vrfManager()` | `0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038` | ✅ |
| Hero | `hero()` | `0xD48867dbac5f1c1351421726B6544f847D9486af` | ✅ |
| Relic | `relic()` | `0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce` | ✅ |

#### ⚙️ 設定函數
| 目標合約 | 設定函數 | 權限 |
|---------|---------|------|
| DungeonCore | `setDungeonCore(address)` | `onlyOwner` |
| DungeonStorage | `setDungeonStorage(address)` | `onlyOwner` |
| VRFManager | `setVRFManager(address)` | `onlyOwner` |
| SoulShard Token | `setSoulShardToken(address)` | `onlyOwner` |

---

### 3️⃣ Hero NFT 合約
> **合約文件**: `Hero.sol`  
> **地址**: `0xD48867dbac5f1c1351421726B6544f847D9486af`

#### 🔍 讀取函數
| 連接目標 | 讀取函數 | 返回值 | 驗證狀態 |
|---------|---------|-------|---------|
| DungeonCore | `dungeonCore()` | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ✅ |
| VRFManager | `vrfManager()` | `0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038` | ✅ |

#### ⚙️ 設定函數
| 目標合約 | 設定函數 | 權限 | 事件 |
|---------|---------|------|------|
| DungeonCore | `setDungeonCore(address)` | `onlyOwner` | - |
| VRFManager | `setVRFManager(address)` | `onlyOwner` | `VRFManagerSet` |

---

### 4️⃣ Relic NFT 合約
> **合約文件**: `Relic.sol`  
> **地址**: `0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce`

#### 🔍 讀取函數
| 連接目標 | 讀取函數 | 返回值 | 驗證狀態 |
|---------|---------|-------|---------|
| DungeonCore | `dungeonCore()` | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ✅ |
| VRFManager | `vrfManager()` | `0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038` | ✅ |

#### ⚙️ 設定函數
| 目標合約 | 設定函數 | 權限 | 事件 |
|---------|---------|------|------|
| DungeonCore | `setDungeonCore(address)` | `onlyOwner` | - |
| VRFManager | `setVRFManager(address)` | `onlyOwner` | `VRFManagerSet` |

---

### 5️⃣ Party NFT 合約
> **合約文件**: `Party.sol` (PartyV3)  
> **地址**: `0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3`

#### 🔍 讀取函數
| 連接目標 | 讀取函數 | 返回值 | 驗證狀態 |
|---------|---------|-------|---------|
| DungeonCore | `dungeonCoreContract()` | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ✅ |

#### ⚙️ 設定函數
| 目標合約 | 設定函數 | 權限 | 事件 |
|---------|---------|------|------|
| DungeonCore | `setDungeonCore(address)` | `onlyOwner` | `DungeonCoreSet` |

> **⚠️ 特別注意**: Party 合約的讀取函數名稱與其他合約不同，使用 `dungeonCoreContract()` 而非 `dungeonCore()`

---

### 6️⃣ AltarOfAscension (升星祭壇)
> **合約文件**: `AltarOfAscension.sol` (AltarOfAscensionVRF)  
> **地址**: `0x095559778C0BAA2d8FA040Ab0f8752cF07779D33`

#### 🔍 讀取函數
| 連接目標 | 讀取函數 | 返回值 | 驗證狀態 |
|---------|---------|-------|---------|
| DungeonCore | `dungeonCore()` | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ✅ |

#### ⚙️ 設定函數
| 目標合約 | 設定函數 | 權限 |
|---------|---------|------|
| DungeonCore | `setDungeonCore(address)` | `onlyOwner` |

---

### 7️⃣ PlayerProfile (玩家檔案)
> **合約文件**: `PlayerProfile.sol`  
> **地址**: `0x0f5932e89908400a5AfDC306899A2987b67a3155`

#### 🔍 讀取函數
| 連接目標 | 讀取函數 | 返回值 | 驗證狀態 |
|---------|---------|-------|---------|
| DungeonCore | `dungeonCore()` | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ✅ |

#### ⚙️ 設定函數
| 目標合約 | 設定函數 | 權限 |
|---------|---------|------|
| DungeonCore | `setDungeonCore(address)` | `onlyOwner` |

---

### 8️⃣ PlayerVault (玩家金庫)
> **合約文件**: `PlayerVault.sol`  
> **地址**: `0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787`

#### 🔍 讀取函數
| 連接目標 | 讀取函數 | 返回值 | 驗證狀態 |
|---------|---------|-------|---------|
| DungeonCore | `dungeonCore()` | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ✅ |

#### ⚙️ 設定函數
| 目標合約 | 設定函數 | 權限 |
|---------|---------|------|
| DungeonCore | `setDungeonCore(address)` | `onlyOwner` |

---

### 9️⃣ VIPStaking (VIP 質押)
> **合約文件**: `VIPStaking.sol`  
> **地址**: `0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C`

#### 🔍 讀取函數
| 連接目標 | 讀取函數 | 返回值 | 驗證狀態 |
|---------|---------|-------|---------|
| DungeonCore | `dungeonCore()` | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ✅ |

#### ⚙️ 設定函數
| 目標合約 | 設定函數 | 權限 |
|---------|---------|------|
| DungeonCore | `setDungeonCore(address)` | `onlyOwner` |

---

## 🔧 設定順序建議

### Phase 1: DungeonCore 設定 (總機設定)
```javascript
// 在 DungeonCore 上設定所有模組地址
await dungeonCore.setPlayerProfile("0x0f5932e89908400a5AfDC306899A2987b67a3155");
await dungeonCore.setHeroContract("0xD48867dbac5f1c1351421726B6544f847D9486af");
await dungeonCore.setRelicContract("0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce");
await dungeonCore.setPartyContract("0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3");
await dungeonCore.setDungeonMaster("0xE391261741Fad5FCC2D298d00e8c684767021253");
await dungeonCore.setAltarOfAscension("0x095559778C0BAA2d8FA040Ab0f8752cF07779D33");
await dungeonCore.setPlayerVault("0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787");
await dungeonCore.setVipStaking("0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C");
await dungeonCore.setOracle("0xf8CE896aF39f95a9d5Dd688c35d381062263E25a");
```

### Phase 2: 各模組回連 DungeonCore
```javascript
// 所有模組都需要連回 DungeonCore
await hero.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13");
await relic.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13");
await party.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13");
await altarOfAscension.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13");
await playerProfile.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13");
await playerVault.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13");
await vipStaking.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13");
```

### Phase 3: DungeonMaster 專屬設定
```javascript
// DungeonMaster 特殊連接
await dungeonMaster.setDungeonCore("0x8a2D2b1961135127228EdD71Ff98d6B097915a13");
await dungeonMaster.setDungeonStorage("0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468");
await dungeonMaster.setVRFManager("0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038");
```

### Phase 4: VRF 連接設定
```javascript
// VRF 相關連接
await hero.setVRFManager("0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038");
await relic.setVRFManager("0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038");
```

---

## 🛠 維護工具腳本

### 設定腳本
- **`v25-setup-connections-fixed.js`** - 完整設定所有合約連接
- **`fix-party-connection.js`** - 修復 Party 合約連接
- **`v25-verify-all-connections.js`** - 驗證所有連接狀態

### 驗證腳本
```bash
# 執行完整驗證
npx hardhat run scripts/active/v25-verify-all-connections.js --network bsc

# 修復單一合約
npx hardhat run scripts/active/fix-party-connection.js --network bsc
```

---

## 📊 連接狀態統計

| 合約 | 連接數 | 狀態 |
|-----|--------|------|
| DungeonCore | 9 | ✅ 100% |
| DungeonMaster | 3 | ✅ 100% |
| Hero | 2 | ✅ 100% |
| Relic | 2 | ✅ 100% |
| Party | 1 | ✅ 100% |
| AltarOfAscension | 1 | ✅ 100% |
| PlayerProfile | 1 | ✅ 100% |
| PlayerVault | 1 | ✅ 100% |
| VIPStaking | 1 | ✅ 100% |
| **總計** | **21** | ✅ **100%** |

---

## 🚨 重要注意事項

### 函數名稱差異
1. **Party 合約特殊性**: 使用 `dungeonCoreContract()` 讀取，而非標準的 `dungeonCore()`
2. **DungeonCore**: 使用 `playerProfileAddress()` 而非 `playerProfile()`

### 權限管理
- 所有設定函數都需要 `onlyOwner` 權限
- 確保使用正確的 Owner 賬戶執行設定
- 建議在測試環境先驗證再部署到主網

### VRF 相關
- VRFManager 地址固定為 `0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038` (VRFManagerV2Plus)
- 只有 Hero、Relic、DungeonMaster 需要連接 VRF

### 部署順序重要性
- 必須先部署 DungeonCore，再部署其他合約
- DungeonStorage 必須在 DungeonMaster 之前準備好
- VRF 連接是最後設定的步驟

---

## 🔍 故障排除

### 常見錯誤
1. **OwnableUnauthorizedAccount**: 賬戶沒有 Owner 權限
2. **函數不存在**: 檢查合約 ABI 和函數名稱
3. **地址錯誤**: 確認合約地址正確且已部署

### 調試命令
```bash
# 檢查合約是否部署
npx hardhat verify --network bsc <CONTRACT_ADDRESS>

# 檢查 Owner
npx hardhat console --network bsc
> const contract = await ethers.getContractAt("ContractName", "ADDRESS");
> await contract.owner();
```

---

**📝 文檔維護者**: Claude AI  
**🔄 最後更新**: 2025-08-06  
**✅ 驗證狀態**: 21/21 連接正常
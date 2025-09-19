# 合約部署分析 v1.3.9.6

## 🎯 部署版本：v1.3.9.6

### 📋 待部署合約清單

| 合約 | 舊地址 (v1.3.9.6) | 新地址 (v1.3.9.6) | 依賴關係 |
|------|------------------|-------------------|----------|
| **HERO** | `0x1723b67ef81c4d2c5dd2027776ae8bdbdd61636b` | 待部署 | 依賴: DungeonCore |
| **RELIC** | `0x7a78a54010b0d201c026ef0f4a9456b464dfce11` | 待部署 | 依賴: DungeonCore |
| **PARTY** | `0xb393e482495bacde5aaf08d25323146cc5b9567f` | 待部署 | 依賴: Hero, Relic |
| **VIPSTAKING** | `0x409d964675235a5a00f375053535fce9f6e79882` | 待部署 | 獨立部署 |
| **PLAYERPROFILE** | `0xd32d3ab232cd2d13a80217c0f05a9f3bdc51b44b` | 待部署 | 獨立部署 |
| **ALTAROFASCENSION** | `0x7f4b3d0ff2994182200fc3b306fb5b035680de3c` | 待部署 | 依賴: DungeonCore, Hero, Relic |
| **DUNGEONMASTER** | `0x924a6d3a90a012ec98ff09de1e9a8ac53b0e46dd` | 待部署 | 依賴: DungeonCore, Party |
| **DUNGEONSTORAGE** | `0x30dcbe703b258fa1e621d22c8ada643da51ceb4c` | 待部署 | 獨立部署 |
| **PLAYERVAULT** | `0x2009102a168880477c72e4c9cbd907d44e5c751c` | 待部署 | 依賴: DungeonCore |

## 🔧 關鍵變更

### 1. Hero 合約優化 (Gas 節省)
- ✅ **power 字段**: `uint256` → `uint16`
- ✅ **存儲優化**: uint8 + uint16 打包到 1 個存儲槽
- ✅ **Gas 節省**: 每個 NFT 節省 ~20,000 gas (50%)

### 2. Interface 更新
- ✅ **IHero.getHeroProperties**: 返回值改為 `uint16 power`
- ✅ **IHero.mintFromAltar**: 參數改為 `uint16 power`

### 3. ERC-4906 支持
- ✅ **Hero 合約**: 添加 MetadataUpdate 事件
- ✅ **Relic 合約**: 添加 MetadataUpdate 事件

## ⚠️ 潛在函數名稱衝突檢查

### 1. DungeonCore 函數檢查
```solidity
// 需要驗證這些 getter 函數存在
function heroContractAddress() external view returns (address);
function relicContractAddress() external view returns (address);
function partyContractAddress() external view returns (address);
function altarOfAscensionAddress() external view returns (address);
function dungeonMasterAddress() external view returns (address);
function playerVaultAddress() external view returns (address);
function playerProfileAddress() external view returns (address);
function vipStakingAddress() external view returns (address);
function dungeonStorageAddress() external view returns (address);
```

### 2. 設置函數檢查
```solidity
// 需要驗證這些 setter 函數存在
function setHeroContract(address _newAddress) external;
function setRelicContract(address _newAddress) external;
function setPartyContract(address _newAddress) external;
function setAltarOfAscension(address _newAddress) external;
function setDungeonMaster(address _newAddress) external;
function setPlayerVault(address _newAddress) external;
function setPlayerProfile(address _newAddress) external;
function setVipStaking(address _newAddress) external;
function setDungeonStorage(address _storage) external;
```

## 📊 部署順序

### 階段 1: 獨立合約
1. **DUNGEONSTORAGE** - 無依賴
2. **PLAYERPROFILE** - 無依賴  
3. **VIPSTAKING** - 無依賴

### 階段 2: 核心 NFT 合約
4. **HERO** - 需要 DungeonCore 地址
5. **RELIC** - 需要 DungeonCore 地址

### 階段 3: 依賴合約
6. **PARTY** - 需要 Hero, Relic 地址
7. **PLAYERVAULT** - 需要 DungeonCore 地址
8. **ALTAROFASCENSION** - 需要 DungeonCore, Hero, Relic 地址
9. **DUNGEONMASTER** - 需要 DungeonCore, Party 地址

### 階段 4: Core 配置更新
10. **更新 DungeonCore** - 設置所有新合約地址

## 🚨 部署前檢查清單

### 合約編譯檢查
- [ ] 所有合約編譯通過
- [ ] Interface 函數簽名一致
- [ ] 依賴關係正確

### Gas 價格設置
- [ ] 確認使用 0.11 gwei
- [ ] 驗證 Gas limit 設置

### 權限檢查
- [ ] 部署錢包有足夠 BNB
- [ ] 私鑰安全存儲在 .env

### 驗證準備
- [ ] 準備開源驗證腳本
- [ ] 準備合約互連腳本

## 💡 建議

1. **分批部署** - 避免一次性部署所有合約
2. **測試網先行** - 在測試網完整驗證流程
3. **備份舊地址** - 保存所有舊合約地址
4. **漸進式升級** - 先部署，後配置，最後切換

---

**下一步：創建自動化部署腳本** 🚀
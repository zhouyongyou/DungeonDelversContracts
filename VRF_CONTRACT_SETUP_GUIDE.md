# VRF 合約設置指南

## 📋 概述
本指南說明如何正確設置和授權 VRF Manager 與 NFT 合約之間的連接。

## 🎯 V25 合約地址

### 核心合約
- **VRF Manager**: `0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1`
- **Hero NFT**: `0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d`
- **Relic NFT**: `0x7a9469587ffd28a69d4420d8893e7a0e92ef6316`
- **Altar of Ascension**: `0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1`

## ⚙️ 設置步驟

### 1. 檢查 VRF Manager 擁有者
```bash
# 運行檢查腳本
npx hardhat run scripts/check-vrf-auth.js --network bsc
```

### 2. 授權 NFT 合約
VRF Manager 必須授權 Hero 和 Relic 合約才能使用 VRF 服務。

```javascript
// 授權腳本 (scripts/check-vrf-auth.js)
const vrfManager = await ethers.getContractAt(vrfManagerAbi, vrfManagerAddress);

// 授權 Hero 合約
await vrfManager.setAuthorizedContract(heroAddress, true);

// 授權 Relic 合約
await vrfManager.setAuthorizedContract(relicAddress, true);
```

### 3. 驗證授權狀態
```bash
# 查詢授權事件
npx hardhat run scripts/check-vrf-events.js --network bsc
```

## 🔍 常見問題

### "Not authorized #1002" 錯誤
**原因**: VRF Manager 未授權 NFT 合約
**解決方案**: 
1. 確認你是 VRF Manager 的 owner
2. 運行授權腳本 `scripts/check-vrf-auth.js`
3. 等待交易確認

### "execution reverted" 錯誤
**原因**: 嘗試讀取未實現的函數
**解決方案**: 使用正確的函數名稱 `setAuthorizedContract` 而非 `setAuthorization`

## 📝 授權狀態確認

### 成功授權的交易
- Hero 授權 TX: `0x344821daffef2ef18a92b5486b6834209f224f444d08db486fae3eb82fd7c586`
- Relic 授權 TX: `0x615e063c34021b8c46028482c2cee694ab887db34bb981e7364c2579467e8cc2`

### 檢查授權狀態的方法
1. 查詢鏈上事件 `AuthorizationUpdated`
2. 嘗試執行 mint 交易
3. 使用 BSCScan 查看合約狀態

## 🚀 測試鑄造

授權完成後，可以測試 NFT 鑄造：

```javascript
// 測試 Hero 鑄造
const hero = await ethers.getContractAt('Hero', heroAddress);
await hero.mintFromWallet(1, { value: platformFee });

// 測試 Relic 鑄造
const relic = await ethers.getContractAt('Relic', relicAddress);
await relic.mintFromWallet(1, { value: platformFee });
```

## 📊 VRF 配置參數

### 當前設置
- **VRF 請求價格**: 0.0001 BNB
- **平台費用**: 0.0003 BNB per NFT
- **回調 Gas 限制**: 預設值
- **確認數**: 預設值

### 調整參數（需要 owner 權限）
```javascript
// 設置 VRF 請求價格
await vrfManager.setVrfRequestPrice(ethers.parseEther("0.0001"));

// 設置平台費用
await vrfManager.setPlatformFee(ethers.parseEther("0.0003"));

// 設置回調 Gas 限制
await vrfManager.setCallbackGasLimit(200000);
```

## 📦 VRFConsumerV2Plus 詳細設置

### VRF 相關設置
```solidity
// 設置 VRF Manager 地址 (第 524 行)
function setVRFManager(address _vrfManager) external onlyOwner
```

### 其他重要設置
```solidity
// 設置 DungeonCore 地址 (第 536 行)
function setDungeonCore(address _address) public onlyOwner

// 設置 SoulShard 代幣地址 (第 541 行)
function setSoulShardToken(address _address) public onlyOwner

// 設置升星祭壇地址 (第 564 行)
function setAscensionAltarAddress(address _address) public onlyOwner

// 設置鑄造價格 USD (第 569 行)
function setMintPriceUSD(uint256 _newPrice) external onlyOwner

// 設置平台費 (第 586 行)
function setPlatformFee(uint256 _newFee) external onlyOwner

// 設置 Base URI (第 546 行)
function setBaseURI(string memory _newBaseURI) external onlyOwner

// 設置未揭示 URI (第 551 行)
function setUnrevealedURI(string memory _newURI) external onlyOwner

// 設置合約 URI (第 559 行)
function setContractURI(string memory newContractURI) external onlyOwner
```

---

## 💎 Relic NFT

### VRF 相關設置
```solidity
// 設置 VRF Manager 地址 (第 556 行)
function setVRFManager(address _vrfManager) external onlyOwner
```

### 其他重要設置
```solidity
// 設置 DungeonCore 地址 (第 568 行)
function setDungeonCore(address _address) public onlyOwner

// 設置 SoulShard 代幣地址 (第 573 行)
function setSoulShardToken(address _address) public onlyOwner

// 設置升星祭壇地址 (第 596 行)
function setAscensionAltarAddress(address _address) public onlyOwner

// 設置鑄造價格 USD (第 601 行)
function setMintPriceUSD(uint256 _newPrice) external onlyOwner

// 設置平台費 (第 618 行)
function setPlatformFee(uint256 _newFee) external onlyOwner

// 設置 Base URI (第 578 行)
function setBaseURI(string memory _newBaseURI) external onlyOwner

// 設置未揭示 URI (第 583 行)
function setUnrevealedURI(string memory _newURI) external onlyOwner

// 設置合約 URI (第 591 行)
function setContractURI(string memory newContractURI) external onlyOwner
```

---

## ⚔️ DungeonMaster

### VRF 相關設置
```solidity
// 設置 VRF Manager 地址 (第 390 行)
function setVRFManager(address _vrfManager) external onlyOwner
```

### 其他重要設置
```solidity
// 設置 DungeonCore 地址 (第 400 行)
function setDungeonCore(address _newAddress) external onlyOwner

// 設置 DungeonStorage 地址 (第 405 行)
function setDungeonStorage(address _newAddress) external onlyOwner

// 設置 SoulShard 代幣地址 (第 410 行)
function setSoulShardToken(address _newAddress) external onlyOwner

// 設置全局獎勵倍數 (第 416 行)
function setGlobalRewardMultiplier(uint256 _newMultiplier) external onlyOwner

// 設置探索費用 (第 420 行)
function setExplorationFee(uint256 _newFee) external onlyOwner

// 設置地城參數 (第 440 行)
function setDungeon(
    uint256 _dungeonId,
    uint256 _requiredPower,
    uint256 _rewardAmountUSD,
    uint8 _baseSuccessRate
) external onlyOwner
```

---

## ⭐ AltarOfAscension

### VRF 相關設置
```solidity
// 設置 VRF Manager 地址 (第 614 行)
function setVRFManager(address _vrfManager) external onlyOwner
```

### 其他重要設置
```solidity
// 設置 DungeonCore 地址 (第 630 行)
function setDungeonCore(address _address) external onlyOwner

// 設置升級規則 (第 636 行)
function setUpgradeRule(uint8 _fromRarity, UpgradeRule calldata _rule) external onlyOwner

// 設置額外 VIP 獎勵 (第 644 行)
function setAdditionalVIPBonus(address _player, uint8 _bonusRate) external onlyOwner
```

---

## 🚀 完整設置流程

### 步驟 1: 設置 VRFConsumerV2Plus
```javascript
// 1. 設置訂閱 ID
await vrfConsumer.setSubscriptionId(29062);

// 2. 授權所有需要使用 VRF 的合約
await vrfConsumer.setAuthorizedContract(HERO_ADDRESS, true);
await vrfConsumer.setAuthorizedContract(RELIC_ADDRESS, true);
await vrfConsumer.setAuthorizedContract(DUNGEONMASTER_ADDRESS, true);
await vrfConsumer.setAuthorizedContract(ALTAROFASCENSION_ADDRESS, true);
```

### 步驟 2: 設置各合約的 VRF Manager
```javascript
// Hero NFT
await hero.setVRFManager(VRF_CONSUMER_ADDRESS);

// Relic NFT
await relic.setVRFManager(VRF_CONSUMER_ADDRESS);

// DungeonMaster
await dungeonMaster.setVRFManager(VRF_CONSUMER_ADDRESS);

// AltarOfAscension
await altarOfAscension.setVRFManager(VRF_CONSUMER_ADDRESS);
```

### 步驟 3: 設置 DungeonCore 連接
```javascript
// 所有合約都需要設置 DungeonCore
await hero.setDungeonCore(DUNGEONCORE_ADDRESS);
await relic.setDungeonCore(DUNGEONCORE_ADDRESS);
await dungeonMaster.setDungeonCore(DUNGEONCORE_ADDRESS);
await altarOfAscension.setDungeonCore(DUNGEONCORE_ADDRESS);
```

### 步驟 4: 設置 SoulShard 代幣
```javascript
// NFT 合約需要 SoulShard 地址
await hero.setSoulShardToken(SOULSHARD_ADDRESS);
await relic.setSoulShardToken(SOULSHARD_ADDRESS);
await dungeonMaster.setSoulShardToken(SOULSHARD_ADDRESS);
```

### 步驟 5: 設置特殊連接
```javascript
// DungeonMaster 需要 DungeonStorage
await dungeonMaster.setDungeonStorage(DUNGEONSTORAGE_ADDRESS);

// NFT 需要升星祭壇
await hero.setAscensionAltarAddress(ALTAROFASCENSION_ADDRESS);
await relic.setAscensionAltarAddress(ALTAROFASCENSION_ADDRESS);
```

---

## 📍 當前合約地址 (V25)

```javascript
const ADDRESSES = {
    VRFConsumer: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1",
    Hero: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d",
    Relic: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316",
    DungeonMaster: "0xE391261741Fad5FCC2D298d00e8c684767021253",
    AltarOfAscension: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1",
    DungeonCore: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
    DungeonStorage: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468",
    SoulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
};
```

---

## ⚠️ 重要提醒

1. **授權無排他性**: VRFConsumerV2Plus 可以同時授權多個合約
2. **雙向設置**: 需要在 VRFConsumer 授權合約，也需要在各合約設置 VRF Manager
3. **Chainlink 訂閱**: 確保在 [Chainlink VRF](https://vrf.chain.link/) 管理頁面添加 VRFConsumer 為消費者
4. **訂閱餘額**: 確保訂閱有足夠的 BNB 餘額

---

## 🔍 快速檢查清單

- [ ] VRFConsumerV2Plus 訂閱 ID 已設置
- [ ] VRFConsumerV2Plus 已授權所有需要的合約
- [ ] Hero 的 vrfManager 已設置
- [ ] Relic 的 vrfManager 已設置
- [ ] DungeonMaster 的 vrfManager 已設置
- [ ] AltarOfAscension 的 vrfManager 已設置
- [ ] 所有合約的 DungeonCore 地址已設置
- [ ] 所有需要的 SoulShard 地址已設置
- [ ] Chainlink 訂閱已添加 VRFConsumer 為消費者
- [ ] 訂閱有足夠餘額

---

*最後更新: 2025-08-07*
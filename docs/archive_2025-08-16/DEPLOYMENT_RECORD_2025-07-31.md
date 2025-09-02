# V25 部署記錄 - 2025年7月31日 19:00

## 📅 部署資訊
- **部署時間**: 2025-07-31 19:00 (7:00 PM)
- **起始區塊**: 55958852
- **網路**: BSC Mainnet
- **子圖版本**: v3.3.6

## ✅ 已部署的合約地址

### 核心合約
- **ORACLE**: `0xf21548F8836d0ddB87293C4bCe2B020D17fF11c1`
- **DUNGEONCORE**: `0xB8A111Ce09beCC7Aac7C4058f990b57ead635c58`
- **SOULSHARD**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`

### 遊戲合約
- **DUNGEONMASTER**: `0x2F78de7Fdc08E95616458038a7A1E2EE28e0fa85`
- **DUNGEONSTORAGE**: `0xB5cf98A61682C4e0bd66124DcbF5fB794B584d8D`
- **PLAYERVAULT**: `0x2746Ce8D6Aa7A885c568530abD9846460cA602f1`
- **PLAYERPROFILE**: `0xF1b836D09A30C433A2479a856c84e0d64DBBD973`

### NFT 合約
- **HERO**: `0x785a8b7d7b2E64c5971D8f548a45B7db3CcA5797`
- **RELIC**: `0xaa7434e77343cd4AaE7dDea2f19Cb86232727D0d`
- **PARTY**: `0x2890F2bFe5ff4655d3096eC5521be58Eba6fAE50`

### 功能合約
- **VIPSTAKING**: `0x58A16F4845BA7Fea4377399d74D50d8aeE58fde4`
- **ALTAROFASCENSION**: `0xbaA5CC63F9d531288e4BD87De64Af05FdA481ED9`

### 管理地址
- **DUNGEONMASTERWALLET**: `0x10925A7138649C7E1794CE646182eeb5BF8ba647`

## 🔄 部署後必須執行的同步

### 1. 子圖同步
```bash
# 更新到 v3.3.6
cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers
npm run codegen
npm run build
# 手動部署並標記為 v3.3.6
```

### 2. 前端同步
```bash
# 執行 V25 同步腳本
node scripts/active/v25-sync-all.js v3.3.6
```

### 3. 後端同步
- 自動從 CDN 配置載入
- 確認 latest.json 已更新

### 4. Marketplace 同步（重要！）
```bash
# 檢查 NFT 地址差異
node scripts/active/marketplace-sync.js --check-only

# 執行同步（如需要）
node scripts/active/marketplace-sync.js

# 審計鏈上狀態
node scripts/active/marketplace-address-audit.js
```

## 🚨 Marketplace 注意事項

### NFT 地址不匹配
Marketplace V2 當前使用舊版 NFT 地址：
- HERO: `0x76C9c7E9a82132739A6E6B04FD87f16801F4EF22` (舊)
- RELIC: `0xe66036839c7E5F8372ADC36da8f0357429a96A34` (舊)
- PARTY: `0x22Ac9b248716FA64eD97025c77112c4c3e0169ab` (舊)

### 需要的操作
1. 執行 `marketplace-sync.js` 更新配置文件
2. 在 Marketplace 合約批准新 NFT 地址（需要 Owner 權限）
3. 測試新 NFT 在 Marketplace 的交易功能

## 📋 驗證清單

- [ ] 主合約功能正常
- [ ] 子圖已更新到 v3.3.6
- [ ] 前端配置已同步
- [ ] 後端配置已同步
- [ ] Marketplace 配置已檢查
- [ ] NFT 可以正常鑄造
- [ ] NFT 可以在 Marketplace 交易（需配置同步後）

## 📊 BSCScan 連結

- [DungeonCore](https://bscscan.com/address/0xB8A111Ce09beCC7Aac7C4058f990b57ead635c58)
- [Hero NFT](https://bscscan.com/address/0x785a8b7d7b2E64c5971D8f548a45B7db3CcA5797)
- [DungeonMaster](https://bscscan.com/address/0x2F78de7Fdc08E95616458038a7A1E2EE28e0fa85)

## 🔍 下一步

1. **立即執行**：同步所有配置
2. **測試**：確認所有功能正常
3. **Marketplace**：更新 NFT 白名單
4. **監控**：觀察交易和使用情況

---

**部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
**時間戳**: 2025-07-31T19:00:00.000Z
**區塊高度**: 55958852
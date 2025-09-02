# V25 合約驗證報告

## 📅 驗證日期
2025年8月7日

## ✅ 驗證成功清單

### 新部署的 V25 合約（已全部驗證）

| 合約名稱 | 地址 | BSCScan 連結 | 狀態 |
|---------|------|-------------|------|
| **DUNGEONMASTER** | `0xE391261741Fad5FCC2D298d00e8c684767021253` | [查看源碼](https://bscscan.com/address/0xE391261741Fad5FCC2D298d00e8c684767021253#code) | ✅ 已驗證 |
| **HERO** | `0xD48867dbac5f1c1351421726B6544f847D9486af` | [查看源碼](https://bscscan.com/address/0xD48867dbac5f1c1351421726B6544f847D9486af#code) | ✅ 已驗證 |
| **RELIC** | `0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce` | [查看源碼](https://bscscan.com/address/0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce#code) | ✅ 已驗證 |
| **ALTAROFASCENSION** | `0x095559778C0BAA2d8FA040Ab0f8752cF07779D33` | [查看源碼](https://bscscan.com/address/0x095559778C0BAA2d8FA040Ab0f8752cF07779D33#code) | ✅ 已驗證 |
| **PARTY** | `0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3` | [查看源碼](https://bscscan.com/address/0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3#code) | ✅ 已驗證 |
| **DUNGEONSTORAGE** | `0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468` | [查看源碼](https://bscscan.com/address/0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468#code) | ✅ 已驗證 |

### VRF Manager（已驗證）

| 合約名稱 | 地址 | BSCScan 連結 | 狀態 |
|---------|------|-------------|------|
| **VRF_MANAGER_V2PLUS** | `0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038` | [查看源碼](https://bscscan.com/address/0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038#code) | ✅ 已驗證 |

### 重複使用的合約（之前已驗證）

| 合約名稱 | 地址 | BSCScan 連結 | 狀態 |
|---------|------|-------------|------|
| **DUNGEONCORE** | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | [查看源碼](https://bscscan.com/address/0x8a2D2b1961135127228EdD71Ff98d6B097915a13#code) | ✅ 已驗證 |
| **PLAYERVAULT** | `0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787` | [查看源碼](https://bscscan.com/address/0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787#code) | ✅ 已驗證 |
| **PLAYERPROFILE** | `0x0f5932e89908400a5AfDC306899A2987b67a3155` | [查看源碼](https://bscscan.com/address/0x0f5932e89908400a5AfDC306899A2987b67a3155#code) | ✅ 已驗證 |
| **VIPSTAKING** | `0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C` | [查看源碼](https://bscscan.com/address/0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C#code) | ✅ 已驗證 |
| **ORACLE** | `0xf8CE896aF39f95a9d5Dd688c35d381062263E25a` | [查看源碼](https://bscscan.com/address/0xf8CE896aF39f95a9d5Dd688c35d381062263E25a#code) | ✅ 已驗證 |

### 代幣合約

| 合約名稱 | 地址 | BSCScan 連結 | 說明 |
|---------|------|-------------|------|
| **SOULSHARD** | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | [查看](https://bscscan.com/address/0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF) | 遊戲代幣 |
| **USD** | `0x7C67Af4EBC6651c95dF78De11cfe325660d935FE` | [查看](https://bscscan.com/address/0x7C67Af4EBC6651c95dF78De11cfe325660d935FE) | 測試用 USD |

## 📊 驗證統計

- **總合約數**: 12
- **已驗證**: 12
- **驗證率**: 100%

## 🔧 編譯器設置

所有合約使用統一的編譯器設置：
- **Solidity 版本**: v0.8.20+commit.a1b79de6
- **優化**: 已啟用
- **優化運行次數**: 200

## 📝 驗證腳本

驗證使用了以下腳本：
- `scripts/v25-check-verification-status.js` - 檢查驗證狀態
- `scripts/v25-verify-with-correct-args.js` - 執行驗證

## ✨ 總結

V25 所有合約已經成功在 BSCScan 上完成驗證和開源。用戶和開發者現在可以：
1. 查看完整的合約源代碼
2. 驗證合約邏輯
3. 直接在 BSCScan 上與合約交互
4. 確認合約的安全性和透明度

## 🔗 重要連結

- [DungeonDelvers 官網](https://dungeondelvers.xyz)
- [BSCScan 合約頁面](https://bscscan.com/address/0x8a2D2b1961135127228EdD71Ff98d6B097915a13)
- [GitHub 儲存庫](https://github.com/DungeonDelvers)

---

*報告生成時間: 2025年8月7日*
*版本: V25 VRF Update*
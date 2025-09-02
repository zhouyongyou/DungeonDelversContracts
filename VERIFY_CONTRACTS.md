# 📝 V25 合約驗證指南

## 🚨 需要驗證的合約

以下所有合約都需要在 BSCScan 上進行源碼驗證：

| 合約名稱 | 地址 | 狀態 |
|---------|------|------|
| **Oracle** | `0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8` | ❌ 未驗證 |
| **DungeonCore** | `0x26BDBCB8Fd349F313c74B691B878f10585c7813E` | ❌ 未驗證 |
| **DungeonStorage** | `0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542` | ❌ 未驗證 |
| **VRFConsumerV2Plus** | `0xdd14eD07598BA1001cf2888077FE0721941d06A8` | ❌ 未驗證 |
| **Hero** | `0xe90d442458931690C057D5ad819EBF94A4eD7c8c` | ❌ 未驗證 |
| **Relic** | `0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B` | ❌ 未驗證 |
| **Party** | `0x629B386D8CfdD13F27164a01fCaE83CB07628FB9` | ❌ 未驗證 |
| **PlayerVault** | `0xb2AfF26dc59ef41A22963D037C29550ed113b060` | ❌ 未驗證 |
| **PlayerProfile** | `0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1` | ❌ 未驗證 |
| **VIPStaking** | `0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28` | ❌ 未驗證 |
| **DungeonMaster** | `0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0` | ❌ 未驗證 |
| **AltarOfAscension** | `0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1` | ❌ 未驗證 |

## 🔧 驗證方法

### 方法 1：自動驗證（推薦）

1. **獲取 BSCScan API Key**
   - 訪問 https://bscscan.com/myapikey
   - 註冊或登錄賬號
   - 創建一個新的 API Key

2. **設置環境變數**
   ```bash
   export BSCSCAN_API_KEY=你的API_KEY
   ```

3. **執行驗證腳本**
   ```bash
   npx hardhat run scripts/verify-v25-contracts.js --network bsc
   ```

### 方法 2：手動驗證

對於每個合約，在 BSCScan 上手動驗證：

1. 訪問合約地址頁面
2. 點擊 "Contract" 標籤
3. 點擊 "Verify and Publish"
4. 填寫驗證信息：

#### Oracle
- **Contract Address**: `0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82
  0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
  0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
  ```

#### DungeonCore
- **Contract Address**: `0x26BDBCB8Fd349F313c74B691B878f10585c7813E`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x10925A7138649C7E1794CE646182eeb5BF8ba647
  0x7C67Af4EBC6651c95dF78De11cfe325660d935FE
  0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF
  ```

#### DungeonStorage
- **Contract Address**: `0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x10925A7138649C7E1794CE646182eeb5BF8ba647
  ```

#### VRFConsumerV2Plus
- **Contract Address**: `0xdd14eD07598BA1001cf2888077FE0721941d06A8`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  29062 (subscription ID)
  0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9 (VRF Coordinator)
  ```

#### Hero
- **Contract Address**: `0xe90d442458931690C057D5ad819EBF94A4eD7c8c`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x10925A7138649C7E1794CE646182eeb5BF8ba647
  ```

#### Relic
- **Contract Address**: `0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x10925A7138649C7E1794CE646182eeb5BF8ba647
  ```

#### Party
- **Contract Address**: `0x629B386D8CfdD13F27164a01fCaE83CB07628FB9`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x10925A7138649C7E1794CE646182eeb5BF8ba647
  ```

#### PlayerVault
- **Contract Address**: `0xb2AfF26dc59ef41A22963D037C29550ed113b060`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x10925A7138649C7E1794CE646182eeb5BF8ba647
  ```

#### PlayerProfile
- **Contract Address**: `0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x10925A7138649C7E1794CE646182eeb5BF8ba647
  ```

#### VIPStaking
- **Contract Address**: `0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x10925A7138649C7E1794CE646182eeb5BF8ba647
  ```

#### DungeonMaster
- **Contract Address**: `0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x10925A7138649C7E1794CE646182eeb5BF8ba647
  ```

#### AltarOfAscension
- **Contract Address**: `0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1`
- **Compiler Version**: v0.8.20+commit.a1b79de6
- **Optimization**: Yes, 200 runs
- **Constructor Arguments**:
  ```
  0x10925A7138649C7E1794CE646182eeb5BF8ba647
  ```

## 📋 驗證檢查清單

- [ ] Oracle 已驗證
- [ ] DungeonCore 已驗證
- [ ] DungeonStorage 已驗證
- [ ] VRFConsumerV2Plus 已驗證
- [ ] Hero 已驗證
- [ ] Relic 已驗證
- [ ] Party 已驗證
- [ ] PlayerVault 已驗證
- [ ] PlayerProfile 已驗證
- [ ] VIPStaking 已驗證
- [ ] DungeonMaster 已驗證
- [ ] AltarOfAscension 已驗證

## 🔗 快速鏈接

查看合約驗證狀態：
- [Oracle](https://bscscan.com/address/0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8#code)
- [DungeonCore](https://bscscan.com/address/0x26BDBCB8Fd349F313c74B691B878f10585c7813E#code)
- [DungeonStorage](https://bscscan.com/address/0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542#code)
- [VRFConsumerV2Plus](https://bscscan.com/address/0xdd14eD07598BA1001cf2888077FE0721941d06A8#code)
- [Hero](https://bscscan.com/address/0xe90d442458931690C057D5ad819EBF94A4eD7c8c#code)
- [Relic](https://bscscan.com/address/0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B#code)
- [Party](https://bscscan.com/address/0x629B386D8CfdD13F27164a01fCaE83CB07628FB9#code)
- [PlayerVault](https://bscscan.com/address/0xb2AfF26dc59ef41A22963D037C29550ed113b060#code)
- [PlayerProfile](https://bscscan.com/address/0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1#code)
- [VIPStaking](https://bscscan.com/address/0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28#code)
- [DungeonMaster](https://bscscan.com/address/0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0#code)
- [AltarOfAscension](https://bscscan.com/address/0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1#code)

## ⚠️ 重要提醒

1. 驗證時確保選擇正確的編譯器版本 `v0.8.20`
2. 優化設置必須是 `Yes` 並且 runs 為 `200`
3. Constructor Arguments 必須完全匹配
4. 如果驗證失敗，檢查是否有 library 需要單獨驗證

---
更新時間: 2025-08-17
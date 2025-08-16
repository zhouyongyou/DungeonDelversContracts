# V25 同步驗證報告
生成時間：2025-08-07
版本：V25 (PM6 部署)

## 📊 同步狀態總覽

| 平台 | 狀態 | 最後更新 | 備註 |
|------|------|----------|------|
| 前端 | ✅ 完全同步 | 2025-08-07 | 所有地址已更新 |
| 子圖 | ✅ 完全同步 | 2025-08-07 | 地址和起始區塊已更新 |
| 後端 | ✅ 已修復 | 2025-08-07 | 清理重複地址，已更新到 V25 |

## 🎯 V25 合約地址驗證

### 新部署合約 (2025-08-07 PM6)
| 合約 | 地址 | 前端 | 子圖 | 後端 |
|------|------|------|------|------|
| HERO | `0x671d937b171e2ba2c4dc23c133b07e4449f283ef` | ✅ | ✅ | ✅ |
| RELIC | `0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da` | ✅ | ✅ | ✅ |
| DUNGEONMASTER | `0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a` | ✅ | ✅ | ✅ |
| ALTAROFASCENSION | `0xa86749237d4631ad92ba859d0b0df4770f6147ba` | ✅ | ✅ | ✅ |
| DUNGEONSTORAGE | `0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468` | ✅ | ✅ | ✅ |
| PARTY | `0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3` | ✅ | ✅ | ✅ |

### 重複使用合約
| 合約 | 地址 | 前端 | 子圖 | 後端 |
|------|------|------|------|------|
| DUNGEONCORE | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ✅ | N/A | ✅ |
| PLAYERVAULT | `0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787` | ✅ | ✅ | ✅ |
| PLAYERPROFILE | `0x0f5932e89908400a5AfDC306899A2987b67a3155` | ✅ | ✅ | ✅ |
| VIPSTAKING | `0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C` | ✅ | ✅ | ✅ |
| ORACLE | `0xf8CE896aF39f95a9d5Dd688c35d381062263E25a` | ✅ | N/A | ✅ |

### 代幣和其他
| 合約 | 地址 | 前端 | 子圖 | 後端 |
|------|------|------|------|------|
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | ✅ | N/A | ✅ |
| USD_TOKEN | `0x7C67Af4EBC6651c95dF78De11cfe325660d935FE` | ✅ | N/A | ✅ |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | ✅ | N/A | ✅ |
| VRFMANAGER | `0x980d224ec4d198d94f34a8af76a19c00dabe2436` | ✅ | ✅ | ✅ |

## 📈 子圖配置驗證

- **版本**: v3.8.0 ✅
- **起始區塊**: 56757876 ✅
- **網路**: BSC ✅
- **Studio URL**: https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.8.0 ✅

## 🔧 後端配置修復

### 已解決的問題：
1. ✅ 移除重複的 `*_CONTRACT_ADDRESS` 舊地址
2. ✅ 更新 The Graph Studio URL 到 v3.8.0
3. ✅ 統一使用 `*_ADDRESS` 格式
4. ✅ 更新 VRF_REQUEST_PRICE 從 0.005 到 0.0001

### 已棄用的舊地址（已註釋）：
```env
# HERO_CONTRACT_ADDRESS=0xcaF37D9D8356eE18938466F4590A69Bf84C35E15 # OLD V15
# RELIC_CONTRACT_ADDRESS=0xfA0F9E7bb19761A731be73FD04d6FF38ebF0555A # OLD V15
# DUNGEONMASTER_CONTRACT_ADDRESS=0x8DcE0E0b3063e84f85A419833e72D044d9Cdc816 # OLD V15
# ALTAROFASCENSION_CONTRACT_ADDRESS=0x21EB6D4EE01aA881539d6aeA275618EDAE9cB3E1 # OLD V15
# VRFMANAGER_CONTRACT_ADDRESS=0xD062785C376560A392e1a5F1b25ffb35dB5b67bD # OLD
```

## 📦 ABI 文件狀態

| 文件 | 路徑 | 最後更新 | 狀態 |
|------|------|----------|------|
| Hero.json | `abis/Hero/Hero.json` | 2025-08-07 07:07 | ✅ |
| Relic.json | `abis/Relic/Relic.json` | 2025-08-07 07:07 | ✅ |
| AltarOfAscensionVRF.json | `abis/AltarOfAscension/AltarOfAscensionVRF.json` | 2025-08-07 07:08 | ✅ |
| DungeonMaster.json | `abis/DungeonMaster/DungeonMaster.json` | 2025-08-07 01:55 | ✅ |
| VRFManagerV2Plus.json | `abis/VRFManagerV2Plus/VRFManagerV2Plus.json` | 2025-08-07 01:55 | ✅ |
| PartyV3.json | `abis/PartyV3/PartyV3.json` | 2025-08-02 10:10 | ⚠️ 需要確認 |

## ⚠️ 需要注意的事項

1. **PartyV3 ABI**：最後更新是 8/2，可能需要重新生成以確保與 V25 合約匹配
2. **後端環境變數**：已創建備份文件 `.env.backup-20250807`
3. **子圖部署**：需要執行以下命令來部署新版本：
   ```bash
   cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers
   npm run codegen
   npm run build
   graph deploy --studio dungeon-delvers
   ```

## ✅ 下一步行動

1. **子圖部署**
   - [ ] 執行 `npm run codegen` 生成代碼
   - [ ] 執行 `npm run build` 構建子圖
   - [ ] 執行 `graph deploy` 部署到 Studio

2. **後端重啟**
   - [ ] 在 Render 控制台重啟服務
   - [ ] 驗證健康檢查端點 `/health`
   - [ ] 確認配置載入正確

3. **前端驗證**
   - [ ] 清除瀏覽器緩存
   - [ ] 測試 NFT 鑄造功能
   - [ ] 驗證合約調用正常

4. **合約互連設置**
   - [ ] 設置 DungeonCore 在各合約中
   - [ ] 設置 DungeonStorage 在 DungeonMaster 中
   - [ ] 設置 VRF Manager 授權
   - [ ] 設置 AltarOfAscension 在 NFT 合約中

## 📝 總結

V25 配置同步已完成，所有平台（前端、子圖、後端）的合約地址和配置都已更新到最新版本。後端的重複地址問題已解決，舊地址已被註釋保留作為參考。

---

*報告生成時間：2025-08-07*
*版本：V25 (PM6 部署)*
*起始區塊：56757876*
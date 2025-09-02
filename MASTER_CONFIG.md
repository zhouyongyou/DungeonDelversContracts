# 🎯 DungeonDelvers 統一配置管理系統

> 最後更新：2025-08-17 20:00 (V25)

## 📍 配置管理架構

### 單一真實來源 (Single Source of Truth)
**主配置文件**：`/Users/sotadic/Documents/DungeonDelversContracts/.env.master`

### 配置同步流程
```bash
# 從主配置同步到所有專案
cd /Users/sotadic/Documents/DungeonDelversContracts
npm run sync:config:all
```

## 🔴 硬編碼位置追蹤

### 需要手動更新的硬編碼位置
> ⚠️ 以下位置無法通過 ENV 配置，需要手動更新

#### 前端專案
- `src/pages/archived/admin-versions/AdminPageOptimized.tsx:41` - 開發者地址
- `public/config/latest.json` - CDN 配置（自動生成）

#### 後端專案
- `src/index.js:2533-2573` - fee_recipient 地址（需重構）

#### 子圖專案
- `subgraph.yaml` - 合約地址和起始區塊（需手動更新）
- `src/config.ts` - 合約地址常量（考慮移除）

## 📊 V25 配置清單

### 核心合約地址
| 合約 | 地址 | 狀態 |
|------|------|------|
| HERO | 0xe90d442458931690C057D5ad819EBF94A4eD7c8c | 新部署 |
| RELIC | 0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B | 新部署 |
| PARTY | 0x629B386D8CfdD13F27164a01fCaE83CB07628FB9 | 新部署 |
| DUNGEONMASTER | 0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0 | 新部署 |
| DUNGEONSTORAGE | 0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542 | 新部署 |
| ALTAROFASCENSION | 0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1 | 新部署 |
| DUNGEONCORE | 0x26BDBCB8Fd349F313c74B691B878f10585c7813E | 復用 |
| PLAYERVAULT | 0xb2AfF26dc59ef41A22963D037C29550ed113b060 | 復用 |
| PLAYERPROFILE | 0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1 | 復用 |
| VIPSTAKING | 0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28 | 復用 |
| ORACLE | 0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8 | 復用 |
| VRF_MANAGER_V2PLUS | 0xdd14eD07598BA1001cf2888077FE0721941d06A8 | 固定 |

### 代幣合約（測試用）
| 代幣 | 地址 |
|------|------|
| SOULSHARD | 0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF |
| USD | 0x7C67Af4EBC6651c95dF78De11cfe325660d935FE |
| UNISWAP_POOL | 0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82 |

### VRF 配置
```json
{
  "subscriptionId": "88422796721004450630713121079263696788635490871993157345476848872165866246915",
  "coordinator": "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
  "keyHash": "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4",
  "confirmations": 6,
  "gasLimit": 2500000
}
```

### 網路配置
- **Chain ID**: 56 (BSC Mainnet)
- **RPC URL**: https://bsc-dataseed1.binance.org/
- **Explorer**: https://bscscan.com
- **起始區塊**: 57914301

### 服務端點
- **子圖 Studio**: https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.9.0
- **子圖 Gateway**: https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs
- **後端 API**: https://dungeon-delvers-metadata-server.onrender.com

### 管理員資訊
- **錢包地址**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **BSCScan API**: 2SCSJI4VS27T3M2HGYTGEN5WJAJEMEJ2IC

## 🔄 配置同步檢查清單

### 部署後必須執行
- [ ] 更新主配置文件 `.env.master`
- [ ] 執行 `npm run sync:config:all`
- [ ] 更新子圖 `subgraph.yaml` 的起始區塊
- [ ] 編譯並部署子圖
- [ ] 重啟前端開發服務器
- [ ] 重啟後端服務器
- [ ] 驗證所有服務運作正常

### 配置驗證指令
```bash
# 驗證所有配置一致性
npm run verify:config

# 檢查硬編碼位置
npm run check:hardcoded

# 生成配置報告
npm run config:report
```

## ⚠️ 重要提醒

1. **永不直接編輯**其他專案的配置文件
2. **所有變更**從主配置文件開始
3. **版本更新**時更新此文檔的版本號
4. **硬編碼變更**需要手動追蹤並更新
5. **子圖部署**由管理員手動執行

## 📝 版本歷史

| 版本 | 日期 | 主要變更 |
|------|------|---------|
| V25 | 2025-08-17 20:00 | 統一地址管理架構，12個合約重新部署 |
| V24 | 2025-08-17 13:00 | 測試版本 |

## 🚀 未來優化計劃

1. **短期**（1個月內）
   - 實現自動化配置同步腳本
   - 移除所有不必要的硬編碼
   - 建立配置版本控制系統

2. **中期**（3個月內）
   - 實現配置熱更新機制
   - 建立多環境配置管理
   - 實現配置變更通知系統

3. **長期**（6個月內）
   - 探索配置上鏈方案
   - 實現去中心化配置管理
   - 建立配置治理機制

---

**維護者**：@sotadic
**最後檢查**：2025-08-17 20:00
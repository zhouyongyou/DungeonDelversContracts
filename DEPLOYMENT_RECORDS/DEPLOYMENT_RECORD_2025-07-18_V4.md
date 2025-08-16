# 部署記錄 - 2025年7月18日 V4

## 部署摘要

### 部署資訊
- **日期**: 2025年7月18日
- **網路**: BSC Mainnet
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **版本**: DungeonMaster V4 (實際合約程式碼基於 V3)

### 新部署的合約
| 合約名稱 | 地址 | 驗證狀態 |
|---------|------|---------|
| DungeonMasterV4 | 0xa2aC41f768CC9f4E59F941f72dC59e79665889de | ✅ [已驗證](https://bscscan.com/address/0xa2aC41f768CC9f4E59F941f72dC59e79665889de#code) |

### 更新的合約連接
1. **DungeonCore** - 已更新 DungeonMaster 地址指向新合約
2. **DungeonStorage** - 已授權新的 DungeonMaster 為邏輯合約

## 執行的操作

### 1. 合約部署與初始化
- ✅ 編譯所有合約
- ✅ 部署 DungeonMasterV4 合約
- ✅ 設定 DungeonCore 連接
- ✅ 設定 DungeonStorage 連接
- ✅ 設定 SoulShard Token 地址
- ✅ 合約驗證成功

### 2. 系統配置更新
- ✅ 更新 DungeonCore 的 DungeonMaster 地址
- ✅ 授權 DungeonMaster 到 DungeonStorage
- ✅ 初始化所有 10 個地下城配置
- ✅ 設定探索費用: 0.0015 BNB
- ✅ 設定儲備價格: $5 USD
- ✅ 全局獎勵倍數: 1000 (100%)

### 3. ABI 和配置更新
- ✅ 提取所有合約 ABI
- ✅ 生成 deployed-addresses.json
- ✅ 生成前端環境變數配置
- ✅ 生成後端配置檔案
- ✅ 生成子圖更新指南

## 地下城配置

| ID | 名稱 | 需求戰力 | 獎勵 (USD) | 基礎成功率 |
|----|------|---------|------------|-----------|
| 1 | 新手礦洞 | 300 | $29.3 | 89% |
| 2 | 哥布林洞穴 | 600 | $62.0 | 83% |
| 3 | 食人魔山谷 | 900 | $97.5 | 78% |
| 4 | 蜘蛛巢穴 | 1200 | $135.0 | 74% |
| 5 | 石化蜥蜴沼澤 | 1500 | $175.6 | 70% |
| 6 | 巫妖墓穴 | 1800 | $300.0 | 66% |
| 7 | 奇美拉之巢 | 2100 | $410.0 | 62% |
| 8 | 惡魔前哨站 | 2400 | $515.0 | 58% |
| 9 | 巨龍之巔 | 2700 | $680.0 | 54% |
| 10 | 混沌深淵 | 3000 | $850.0 | 50% |

## 生成的檔案

1. **ABI 檔案** - `/abi/` 目錄
2. **地址配置** - `deployed-addresses.json`
3. **前端環境變數** - `frontend-env-update.txt`
4. **後端配置** - `backend-config-update.json`
5. **子圖更新指南** - `subgraph-update-guide.md`

## 需要手動執行的操作

### 1. 前端更新
```bash
# 1. 複製環境變數
cp frontend-env-update.txt ../DungeonDelversFrontend/.env

# 2. 複製 ABI 檔案（如果沒有自動複製）
cp abi/*.json ../DungeonDelversFrontend/src/abi/

# 3. 重新部署前端
cd ../DungeonDelversFrontend
npm run build
# 部署到您的託管服務
```

### 2. 後端更新
```bash
# 1. 更新配置檔案
# 將 backend-config-update.json 的內容合併到後端配置

# 2. 複製 ABI 檔案（如果沒有自動複製）
cp abi/*.json ../DungeonDelversBackend/abi/

# 3. 重新啟動後端服務
```

### 3. 子圖更新
```bash
# 1. 更新 subgraph.yaml 中的合約地址
# 2. 複製新的 ABI 檔案
cp abi/DungeonMasterV4.json ../dungeon-delvers-subgraph/abis/DungeonMaster.json

# 3. 重新部署子圖
cd ../dungeon-delvers-subgraph
npm run codegen
npm run build
npm run deploy
```

### 4. 測試驗證
- [ ] 前端能正確連接新合約
- [ ] 能成功創建隊伍
- [ ] 能成功進行探險
- [ ] 能成功領取獎勵
- [ ] 後端 API 正常運作
- [ ] 子圖正確索引新事件

## 重要提醒

1. **合約版本說明**: 雖然檔名為 V4，但實際合約程式碼基於 V3 版本，主要修復了戰力讀取錯誤
2. **疲勞度系統**: 已移除疲勞度系統，直接使用原始戰力
3. **儲備系統**: 已改為直接付費模式，出征時付費而非預購儲備
4. **舊合約地址**: 原 DungeonMaster V3 地址已備份為註解

## 交易哈希

- 部署 DungeonMasterV4: [查看部署交易]
- 更新 DungeonCore: 0x6f4da0b9e074d428cc8c01812d976ec40fedab370b0dbd6c5f049ddd34eb6b0a
- 授權 DungeonStorage: 0x4e0ad93887e2221f7acee57d57aef6a4fed5495f6845af6c61be9b7b63797db7
- 初始化地下城: [多筆交易]

---

部署完成時間: 2025年7月18日
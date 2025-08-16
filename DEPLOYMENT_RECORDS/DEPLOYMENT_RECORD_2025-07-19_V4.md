# DungeonMaster V4 部署記錄

**日期**: 2025-07-19
**版本**: V4 (支援 ExpeditionFulfilled 事件包含 dungeonId)

## 部署總結

### 合約地址
- **DungeonMaster V4**: `0xff99a6319Ed8D9832c8Bdc89eB5fc6Cb652F71b1`
- **BSCScan**: https://bscscan.com/address/0xff99a6319Ed8D9832c8Bdc89eB5fc6Cb652F71b1#code

### 主要改動
1. **ExpeditionFulfilled 事件更新**
   - 新增 `dungeonId` 參數
   - 新格式：`ExpeditionFulfilled(address indexed, uint256 indexed, uint256, bool, uint256, uint256)`
   - 第三個參數是 dungeonId

2. **子圖更新要求**
   - 更新事件簽名
   - 直接從事件獲取 dungeonId（不再需要推測）

### 部署步驟執行記錄
1. ✅ 編譯合約
2. ✅ 部署 DungeonMaster V4
3. ✅ 更新 DungeonCore 指向新合約
4. ✅ 授權 DungeonStorage 接受新合約
5. ✅ 初始化所有 10 個地下城
6. ✅ 提取所有 ABI
7. ✅ 生成配置更新檔案

### 交易記錄
- 部署合約：[待填寫]
- 更新 DungeonCore：`0x48c8afeaf822d8333b8485fa86071e1875bef7a7e6615cbbd0fd598f5f6d8727`
- 授權 DungeonStorage：`0xd27474374882df64ad66336cbdf6c2c9fad0712af4a3ae1e503ebc115df87c08`

### 需要手動更新的項目
1. **前端**
   - 複製 `frontend-env-update.txt` 到前端 `.env`
   - 複製 `/abi/DungeonMasterV4.json` 到前端
   - 更新合約地址

2. **後端**
   - 使用 `backend-config-update.json` 更新配置
   - 複製新的 ABI

3. **子圖**
   - 根據 `subgraph-update-guide.md` 更新
   - 更新 DungeonMaster 地址和 ABI
   - 更新事件簽名

### 備註
- 舊的 DungeonMaster V3 地址：`0xa2aC41f768CC9f4E59F941f72dC59e79665889de`
- 本次部署主要為了支援準確的出征歷史記錄功能
# V23 部署檢查清單

## 部署前準備
- [ ] 確認 PRIVATE_KEY 已設置
- [ ] 確認 BSC_MAINNET_RPC_URL 已設置（或使用預設）
- [ ] 確認部署者錢包有足夠 BNB（建議 0.5 BNB 以上）
- [ ] 確認所有合約已編譯（`npx hardhat compile`）

## 執行部署流程

### 1. 部署合約
```bash
node scripts/active/deploy-v23-complete.js
```
預期結果：
- 所有合約成功部署
- 生成 `deployments/v23-deployment-{timestamp}.json`
- 生成 `config/v23-config.js`

### 2. 設置合約連接
```bash
node scripts/active/setup-v23-complete.js
```
預期設置內容：
- [x] DungeonStorage 設置 LogicContract → DungeonMaster
- [x] DungeonCore 設置所有模組地址
- [x] 所有模組設置 DungeonCore 地址
- [x] Hero/Relic 設置 SoulShardToken 和 AltarOfAscension
- [x] Party 設置 Hero 和 Relic 合約
- [x] VIPStaking 設置 SoulShardToken
- [x] PlayerVault 設置 SoulShardToken
- [x] DungeonMaster 設置 DungeonStorage、SoulShardToken、DungeonMasterWallet
- [x] AltarOfAscension 設置所有相關合約
- [x] 所有 NFT 設置正確的 BaseURI

### 3. 驗證設置
```bash
node scripts/active/verify-v23-setup.js
```
應該檢查：
- 所有合約地址連接正確
- BaseURI 設置正確
- Oracle 功能正常
- PlayerVault 就緒狀態

### 4. 初始化地城數據
```bash
node scripts/active/init-v23-dungeons.js
```
預期結果：
- 10 個地城全部初始化
- 每個地城設置正確的 USD 獎勵值（注意 wei 轉換）
- 驗證獎勵值正確顯示

### 5. 同步配置到其他專案
```bash
node scripts/active/v23-sync-config.js
```
將更新：
- 前端 contracts.ts
- 後端 contracts.js
- 子圖 networks.json

### 6. 在 BSCScan 驗證合約（可選）
```bash
npx hardhat verify --network bsc <合約地址> <構造參數>
```

## 部署後檢查

### 基礎功能檢查
- [ ] Oracle 能正確返回價格
- [ ] Hero/Relic 能正常鑄造
- [ ] Party 能正常創建
- [ ] VIPStaking 能正常質押/解質押
- [ ] PlayerVault 能正常存取代幣

### 合約狀態檢查
- [ ] 所有 NFT 的 baseURI 正確返回
- [ ] mintPriceUSD 為 2 USD（Hero 和 Relic）
- [ ] 所有合約的 owner 正確
- [ ] PlayerVault 的 isReadyToOperate 返回 true
- [ ] 所有地城的 rewardAmountUSD 正確設置（檢查 wei 值）
- [ ] 地城獎勵在前端正確顯示（SOUL 和 USD）

### 前端整合檢查
- [ ] 前端能連接所有合約
- [ ] NFT 圖片和元數據正常顯示
- [ ] 交易功能正常

## 常見問題

### 問題：合約地址未設置
原因：設置腳本未完整執行
解決：重新執行 `setup-v23-complete.js`

### 問題：NFT 元數據無法顯示
原因：BaseURI 未正確設置
解決：檢查並重新設置 BaseURI

### 問題：VIPStaking "Token address not set"
原因：SoulShardToken 地址未設置
解決：執行設置腳本中的 VIPStaking.setSoulShardToken

### 問題：PlayerVault 未就緒
原因：DungeonCore 或 SoulShardToken 未設置
解決：檢查並設置相關地址

### 問題：地城獎勵顯示為 0 USD
原因：初始化時未正確轉換 USD 到 wei
解決：執行 `init-v23-dungeons.js` 腳本

## 重要提醒

1. **生產環境設置**：
   - VIPStaking 冷卻時間需要在生產環境手動調整（目前預設 15 秒）
   - 確保 DungeonMasterWallet 地址正確

2. **配置備份**：
   - 所有同步操作都會自動備份原文件
   - 備份文件格式：`{原文件名}.backup-{timestamp}`

3. **版本管理**：
   - 每次部署都會生成唯一的部署記錄
   - 配置文件包含版本和時間戳信息

## 完整執行命令序列
```bash
# 1. 編譯
npx hardhat compile

# 2. 部署
node scripts/active/deploy-v23-complete.js

# 3. 設置
node scripts/active/setup-v23-complete.js

# 4. 驗證
node scripts/active/verify-v23-setup.js

# 5. 同步
node scripts/active/v23-sync-config.js
```
# V25 部署記錄

## 部署時間
2025-08-03 18:28:00 - 18:35:33

## 部署地址

### 核心合約
- **SOULSHARD**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` (使用現有)
- **ORACLE**: `0xdbf49cd5708C56b8b0848233b754b418806D7018`
- **DUNGEONCORE**: `0x2953ed03825b40e9c1EBa1cAe5FBD47f20A4823d`

### 遊戲機制合約
- **PLAYERVAULT**: `0x7085b353f553225B6001Ba23ECCb39611fBa31Bf`
- **PLAYERPROFILE**: `0x481ABDF19E41Bf2cE84075174675626aa027fE82`
- **VIPSTAKING**: `0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C`
- **DUNGEONSTORAGE**: `0x22bbcF5411c991A5DE7774Ace435DcBF69EF0a8a`
- **DUNGEONMASTER**: `0x9e17c01A610618223d49D64E322DC1b6360E4E8D`
- **ALTAROFASCENSION**: `0xB102a57eD4697f7A721541fd7B0bba8D6bdF63a5`

### NFT 合約
- **HERO**: `0x001b7462B0f1Ab832c017a6f09133932Be140b18`
- **RELIC**: `0xdd8E52cD1d248D04C306c038780315a03866B402`
- **PARTY**: `0x382024850E08AB37E290315fc5f3692b8D6646EB`

### 其他
- **UNISWAP_POOL**: `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` (使用現有)
- **部署錢包**: `0x10925A7138649C7E1794CE646182eeb5BF8ba647`

## 部署狀態
- ✅ 所有合約部署成功
- ✅ 合約間連接設置完成
- ✅ 模組設置修復完成（通過 v25-fix-module-setup.js）
- ⏳ 合約驗證待完成
- ⏳ 子圖部署待完成 (v3.5.6)

## 關鍵變更
1. **Hero/Relic 合約**：
   - 實施了 Commit-Reveal 機制
   - 統一機率系統（所有數量使用 50 抽機率）
   - 稀有度上限控制
   - 強制揭示固定分布（非全一星懲罰）

2. **AltarOfAscension 合約**：
   - 立即燃燒材料
   - 強制揭示返回一半材料

3. **DungeonMaster 合約**：
   - 移除 emergencyRefund
   - 強制揭示顯示失敗結果

## 修復記錄
- 18:35:32 - 修復 PARTY 合約的 DungeonCore 設置
- 交易 Hash: `0x9b2985e5ff03f8af9c6e5d57e855870a3279980019e652b29310ccf14040c060`

## 下一步
1. 完成合約驗證
2. 部署子圖 v3.5.6
3. 部署自動揭示服務
4. 更新前端配置
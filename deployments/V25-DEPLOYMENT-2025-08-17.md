# V25 部署記錄 - 2025-08-17 PM8:00

## 部署信息
- **版本**: V25
- **部署時間**: 2025-08-17T20:00:00.000Z
- **起始區塊**: 57914301
- **網路**: BSC Mainnet (Chain ID: 56)
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647

## 新部署的合約地址

### NFT 合約
- **HERO**: `0xe90d442458931690C057D5ad819EBF94A4eD7c8c`
- **RELIC**: `0x5e1006E8C7568334F2f56F1C9900CEe85d7faC2B`
- **PARTY**: `0x629B386D8CfdD13F27164a01fCaE83CB07628FB9`

### 遊戲邏輯合約
- **DUNGEONMASTER**: `0xe3dC6c39087c3cbA02f97B993F7d1FbcEDfdF3B0`
- **DUNGEONSTORAGE**: `0x449da0DAAB3D338B2494d8aEBC49B7f04AFAf542`
- **ALTAROFASCENSION**: `0xA6E2F6505878F9d297d77b8Ac8C70c21648fDDF1`

## 復用的合約地址

### 核心系統合約
- **DUNGEONCORE**: `0x26BDBCB8Fd349F313c74B691B878f10585c7813E`
- **PLAYERVAULT**: `0xb2AfF26dc59ef41A22963D037C29550ed113b060`
- **PLAYERPROFILE**: `0xeCdc17654f4df540704Ff090c23B0F762BF3f8f1`
- **VIPSTAKING**: `0x7857d5b1E86799EcE848037Cc37053Fe4c8e2F28`
- **ORACLE**: `0xCbC34F23D7d9892C13322D0deD75bAd8Cf35FaD8`

### 代幣合約
- **SOULSHARD**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`
- **USD (測試用)**: `0x7C67Af4EBC6651c95dF78De11cfe325660d935FE`
- **UNISWAP_POOL**: `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82`

### VRF 合約
- **VRF_MANAGER_V2PLUS**: `0xdd14eD07598BA1001cf2888077FE0721941d06A8`

## VRF 配置
- **Coordinator**: `0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9`
- **Key Hash**: `0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4` (200 gwei)
- **Subscription ID**: `88422796721004450630713121079263696788635490871993157345476848872165866246915`
- **VRF 價格**: 0.0001 BNB
- **平台費用**: 0

## 服務端點

### 子圖
- **Studio版本**: https://api.studio.thegraph.com/query/115633/dungeon-delvers---bsc/v3.9.0
- **去中心化版本**: https://gateway.thegraph.com/api/f6c1aba78203cfdf0cc732eafe677bdd/subgraphs/id/Hmwr7XYgzVzsUb9dw95gSGJ1Vof6qYypuvCxynzinCjs

### 後端
- **Metadata Server**: https://dungeon-delvers-metadata-server.onrender.com

## 同步狀態
- ✅ 主配置文件 (.env.v25) 已更新
- ✅ 前端配置已同步
- ✅ 後端配置已同步  
- ✅ 子圖配置已更新 (v3.9.0)
- ✅ ABI 文件已同步 (13個合約)
- ✅ 合約之間的連接已設置

## 合約連接設置
1. **DungeonCore 連接**
   - Hero: ✅
   - Relic: ✅
   - Party: ✅
   - DungeonMaster: ✅
   - AltarOfAscension: ✅

2. **各合約的 DungeonCore 連接**
   - Hero → DungeonCore: ✅
   - Relic → DungeonCore: ✅
   - Party → DungeonCore: ✅
   - DungeonMaster → DungeonCore: ✅
   - AltarOfAscension → DungeonCore: ✅
   - DungeonStorage → DungeonCore: ✅

3. **DungeonMaster 特殊連接**
   - DungeonStorage: ✅
   - SoulShard Token: ✅

4. **VRF Manager 連接**
   - Hero → VRF Manager: ✅
   - Relic → VRF Manager: ✅
   - DungeonMaster → VRF Manager: ✅
   - AltarOfAscension → VRF Manager: ✅

## 執行的命令
```bash
# 1. 更新主配置
cp .env.v25 .env

# 2. 同步所有系統
node scripts/ultimate-config-system.js sync

# 3. 更新子圖
cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers
npm run codegen
npm run build
npx graph deploy dungeon-delvers---bsc --node https://api.studio.thegraph.com/deploy/ --version-label="v3.9.0"

# 4. 設置合約連接
cd /Users/sotadic/Documents/DungeonDelversContracts
node scripts/active/setup-v25-contract-connections.js

# 5. 驗證配置
node scripts/ultimate-config-system.js validate
```

## 注意事項
- 此次部署使用 VRF V2.5 (V2Plus) 訂閱模式
- USD 合約仍使用測試版本 (USD1)
- 所有系統配置已同步並驗證
- 合約之間的連接已正確設置

## 下一步行動
1. 監控子圖同步進度
2. 測試前端與新合約的交互
3. 驗證 VRF 功能是否正常運作
4. 檢查後端 metadata 生成是否正確
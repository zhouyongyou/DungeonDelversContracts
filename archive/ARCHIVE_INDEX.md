# DungeonDelvers 檔案歸檔索引

歸檔日期：2025-01-18
歸檔原因：V3 合約部署完成，清理過期測試檔案和舊部署腳本

## 📁 歸檔結構

```
archive/2025-01-18-v3-cleanup/
├── scripts/
│   ├── tests/          # 測試和診斷腳本
│   ├── deployments/    # 舊部署腳本
│   └── diagnostics/    # 診斷工具
├── configs/            # 舊配置文件
└── deployment-records/ # 部署記錄
```

## 📋 歸檔檔案清單

### 測試腳本 (scripts/tests/)
- `test-*.ts/js` - 各種功能測試腳本
- `check-*.ts/js` - 合約檢查腳本
- `debug-*.js` - 調試腳本
- `diagnose-*.ts` - 診斷腳本
- `simulate-*.ts/js` - 模擬腳本
- `trace-*.ts/js` - 追踪腳本

### 部署腳本 (scripts/deployments/)
- `deploy-0711.ts` - 7月11日版本部署
- `deploy-final.ts` - 舊的最終版本
- `deploy-and-sync-all.ts` - 包含同步功能的部署
- `deploy-with-auto-config.ts` - 自動配置版本
- `deploy-v1-no-altar.ts` - V1版本（包含疲勞系統）
- `deploy-party-fix.ts` - Party合約修復部署
- `deploy-dungeonmaster-fix.ts` - DungeonMaster修復部署

### 部署記錄 (deployment-records/)
- `DEPLOYMENT_RECORD_2025-07-14.md`
- `DEPLOYMENT_RECORD_2025-07-17.md`
- `DEPLOYMENT_RECORD_2025-01-17_V2.md`

## ⚠️ 重要說明

1. **保留的檔案**：
   - `deploy-v3-complete.ts` - 當前使用的部署腳本
   - 所有 V3 相關的配置和 ABI

2. **疲勞系統相關**：
   所有包含疲勞系統（fatigue）的檔案已被標記，合約中的相關代碼已註釋但保留以供參考。

3. **合約地址**：
   V3 部署的新合約地址請參考 `deployments/deployment-v3-bsc-*.json`

## 🔄 最新合約地址 (V3)

```
Oracle: 0x367f832fDAEFB8Bc038637a8c2E0F87521121a98
DungeonStorage: 0x6FF605478fea3C3270f2eeD550129c58Dea81403
PlayerVault: 0xFF7642E66DF4cc240B218b361C3e5fB14573Cf0B
AltarOfAscension: 0xB868842b8F4f35F6f8996aA741Fdf8a34fBBe7ED
DungeonMaster: 0x311730fa5459fa099976B139f7007d98C2F1E7A7
Hero: 0x99658b9Aa55BFD3a8bd465c77DcCa6b1E7741dA3
Relic: 0xF3e8546216cFdB2F0A1E886291385785177ba773
Party: 0xddCFa681Cee80D3a0F23834cC07D371792207C85
VIPStaking: 0x39f13d0ac5EFF88544e51bdf7c338fF881E311eD
PlayerProfile: 0xA65334a4F4aF2f344558094bD631e75A6A7617B6
DungeonCore: 0xd1F14243c42AF58E69ea7eA58570DC2d9A908D21
```
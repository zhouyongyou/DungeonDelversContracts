# V25 部署報告

生成時間: 2025/7/28 上午12:35:11

## 部署概況

- **網路**: BSC Mainnet
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **起始區塊**: 55514557
- **錯誤數量**: 0

## 合約地址

| 合約 | 地址 | 狀態 |
|------|------|------|
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 📌 使用現有 |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | 📌 使用現有 |
| ORACLE | `0x2350D85e5DF1b6a6d055CD61FeD27d5dC36B6F52` | ✅ 已部署 |
| PLAYERVAULT | `0x4d06483c907DB1CfA9C2207D9DC5a1Abad86544b` | ✅ 已部署 |
| DUNGEONCORE | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | ✅ 已部署 |
| DUNGEONSTORAGE | `0x4b1A9a45d0a1C35CDbae04272814f3daA9b59c47` | ✅ 已部署 |
| DUNGEONMASTER | `0x08Bd8E0D85A7F10bEecCBA9a67da9033f9a7C8D9` | ✅ 已部署 |
| HERO | `0x162b0b673f38C11732b0bc0B4B026304e563e8e2` | ✅ 已部署 |
| RELIC | `0x15c2454A31Abc0063ef4a71d0640057d71847a22` | ✅ 已部署 |
| PARTY | `0xab07E90d44c34FB62313C74F3C7b4b343E52a253` | ✅ 已部署 |
| VIPSTAKING | `0xdC285539069Fa51b9259bd1F1d66f23f74B96A6c` | ✅ 已部署 |
| PLAYERPROFILE | `0x145F19e672a7D53ddb16bcE3fdeAd976bb3ef82f` | ✅ 已部署 |
| ALTAROFASCENSION | `0x0148Aff0Dee6D31BA9825e66ED34a66BCeF45845` | ✅ 已部署 |

### 地城配置
- 1. 新手礦洞: 300 力量, $6 獎勵, 89% 成功率
- 2. 哥布林洞穴: 600 力量, $12 獎勵, 84% 成功率
- 3. 食人魔山谷: 900 力量, $20 獎勵, 79% 成功率
- 4. 蜘蛛巢穴: 1200 力量, $33 獎勵, 74% 成功率
- 5. 石化蜥蜴沼澤: 1500 力量, $52 獎勵, 69% 成功率
- 6. 巫妖墓穴: 1800 力量, $78 獎勵, 64% 成功率
- 7. 奇美拉之巢: 2100 力量, $113 獎勵, 59% 成功率
- 8. 惡魔前哨站: 2400 力量, $156 獎勵, 54% 成功率
- 9. 巨龍之巔: 2700 力量, $209 獎勵, 49% 成功率
- 10. 混沌深淵: 3000 力量, $225 獎勵, 44% 成功率

## 下一步行動

1. 執行合約驗證: `npx hardhat run scripts/active/v25-verify-contracts.js --network bsc`
2. 同步配置到各項目: `node scripts/active/v25-sync-all.js`
3. 部署子圖: `cd DDgraphql/dungeon-delvers && npm run deploy`
4. 在前端測試功能

## 重要地址

- **DungeonCore**: `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E`
- **Hero**: `0x162b0b673f38C11732b0bc0B4B026304e563e8e2`
- **Relic**: `0x15c2454A31Abc0063ef4a71d0640057d71847a22`
- **SoulShard**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`

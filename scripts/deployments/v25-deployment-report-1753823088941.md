# V25 部署報告

生成時間: 2025/7/30 上午5:04:48

## 部署概況

- **網路**: BSC Mainnet
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **起始區塊**: 55766570
- **錯誤數量**: 0

## 合約地址

| 合約 | 地址 | 狀態 |
|------|------|------|
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 📌 使用現有 |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | 📌 使用現有 |
| ORACLE | `0xF38e98A9d3EcBC04E6049997aBFC939F1DCCD470` | ✅ 已部署 |
| PLAYERVAULT | `0x77d58a567865c225C270A299B9AA8C869223B9B2` | ✅ 已部署 |
| DUNGEONCORE | `0x69Ef62C83E992b7285CFce4345DB26099575dA62` | ✅ 已部署 |
| DUNGEONSTORAGE | `0xB717bCed3e53b2657F6736042782eb3c412D1B2d` | ✅ 已部署 |
| DUNGEONMASTER | `0x6503a51b7452Fd9c8D17CC447C357Eb2c7145789` | ✅ 已部署 |
| HERO | `0x2F9c6EF3B2447417E633fD9e05E30B152dC691EE` | ✅ 已部署 |
| RELIC | `0x9f367175c88394A3A924bd3778B09F98b9F1587a` | ✅ 已部署 |
| PARTY | `0x4d058545FCe6d3511960B2706b9D529E9aBb78D3` | ✅ 已部署 |
| VIPSTAKING | `0xF503872475bf07048755AA9FAC8B5A9312C91D89` | ✅ 已部署 |
| PLAYERPROFILE | `0x64e8A1F68BFB14cFC8444786F240616068a51b5E` | ✅ 已部署 |
| ALTAROFASCENSION | `0xa1F4EF2C5A6078c8D14f0D588cd75497da68Fe3a` | ✅ 已部署 |

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
- 11. 冥界之門: 3300 力量, $320 獎勵, 39% 成功率
- 12. 虛空裂隙: 3600 力量, $450 獎勵, 34% 成功率

## 下一步行動

1. 執行合約驗證: `npx hardhat run scripts/active/v25-verify-contracts.js --network bsc`
2. 同步配置到各項目: `node scripts/active/v25-sync-all.js`
3. 部署子圖: `cd DDgraphql/dungeon-delvers && npm run deploy`
4. 在前端測試功能

## 重要地址

- **DungeonCore**: `0x69Ef62C83E992b7285CFce4345DB26099575dA62`
- **Hero**: `0x2F9c6EF3B2447417E633fD9e05E30B152dC691EE`
- **Relic**: `0x9f367175c88394A3A924bd3778B09F98b9F1587a`
- **SoulShard**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`

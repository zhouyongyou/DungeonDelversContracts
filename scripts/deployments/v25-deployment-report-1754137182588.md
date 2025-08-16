# V25 部署報告

生成時間: 2025/8/2 下午8:19:42

## 部署概況

- **網路**: BSC Mainnet
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **起始區塊**: 56184733
- **錯誤數量**: 0

## 合約地址

| 合約 | 地址 | 狀態 |
|------|------|------|
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 📌 使用現有 |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | 📌 使用現有 |
| ORACLE | `0x67989939163bCFC57302767722E1988FFac46d64` | ✅ 已部署 |
| PLAYERVAULT | `0x39523e8eeB6c54fCe65D62ec696cA5ad888eF25c` | ✅ 已部署 |
| DUNGEONCORE | `0x8a2D2b1961135127228EdD71Ff98d6B097915a13` | ✅ 已部署 |
| DUNGEONSTORAGE | `0x88EF98E7F9095610d7762C30165854f271525B97` | ✅ 已部署 |
| DUNGEONMASTER | `0x446f80c6562a9b0A33b48F74F7Dbf10b53Fe2703` | ✅ 已部署 |
| HERO | `0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0` | ✅ 已部署 |
| RELIC | `0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366` | ✅ 已部署 |
| PARTY | `0x6B32c2EEaB24C04bF97A022B1e55943FE1E772a5` | ✅ 已部署 |
| VIPSTAKING | `0x186a89e5418645459ed0a469FF97C9d4B2ca5355` | ✅ 已部署 |
| PLAYERPROFILE | `0xCf352E394fD2Ff27D65bB525C032a2c03Bd79AC7` | ✅ 已部署 |
| ALTAROFASCENSION | `0xaA4f3D3ed21599F501773F83a1A2B4d65b1d0AE3` | ✅ 已部署 |

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

- **DungeonCore**: `0x8a2D2b1961135127228EdD71Ff98d6B097915a13`
- **Hero**: `0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0`
- **Relic**: `0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366`
- **SoulShard**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`

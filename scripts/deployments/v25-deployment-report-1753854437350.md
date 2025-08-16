# V25 部署報告

生成時間: 2025/7/30 下午1:47:17

## 部署概況

- **網路**: BSC Mainnet
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **起始區塊**: 55808316
- **錯誤數量**: 0

## 合約地址

| 合約 | 地址 | 狀態 |
|------|------|------|
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 📌 使用現有 |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | 📌 使用現有 |
| ORACLE | `0xd5A7E1F84D4E3032b9217f8Bf60f532088999158` | ✅ 已部署 |
| PLAYERVAULT | `0x663b5F27f406A84C4Fe70041638Ed0fCD732a658` | ✅ 已部署 |
| DUNGEONCORE | `0xA1c1e58fB2077b5Db861902B4A15F50b54F3f7e4` | ✅ 已部署 |
| DUNGEONSTORAGE | `0xaF4e4d129c2F1EDBA7d3419075D9e96bd7705be9` | ✅ 已部署 |
| DUNGEONMASTER | `0x2E2F5569192526B4b4B51D51BcB6d9290492078d` | ✅ 已部署 |
| HERO | `0xF6A318568CFF7704c24C1Ab81B34de26Cd473d40` | ✅ 已部署 |
| RELIC | `0xA9bfc01562d168644E07afA704Ca2b6764E36C66` | ✅ 已部署 |
| PARTY | `0xA4BA997d806FeAde847Cf82a070a694a9e51fAf2` | ✅ 已部署 |
| VIPSTAKING | `0x17D2BF72720d0E6BE6658e92729820350F6B4080` | ✅ 已部署 |
| PLAYERPROFILE | `0x96e245735b92a493B29887a29b8c6cECa4f65Fc5` | ✅ 已部署 |
| ALTAROFASCENSION | `0x55548065bFF30EEaBb717149bE72b17AdA8dC4f1` | ✅ 已部署 |

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

- **DungeonCore**: `0xA1c1e58fB2077b5Db861902B4A15F50b54F3f7e4`
- **Hero**: `0xF6A318568CFF7704c24C1Ab81B34de26Cd473d40`
- **Relic**: `0xA9bfc01562d168644E07afA704Ca2b6764E36C66`
- **SoulShard**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`

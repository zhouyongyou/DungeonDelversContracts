# V25 部署報告

生成時間: 2025/7/29 下午6:18:04

## 部署概況

- **網路**: BSC Mainnet
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **起始區塊**: 55714687
- **錯誤數量**: 0

## 合約地址

| 合約 | 地址 | 狀態 |
|------|------|------|
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 📌 使用現有 |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | 📌 使用現有 |
| ORACLE | `0xFd6bEF32C48B2F97fBe3ec113AFC344b2dEE7f81` | ✅ 已部署 |
| PLAYERVAULT | `0xfCC9B70840754F38e7d1a8609BB12C04776BBb5a` | ✅ 已部署 |
| DUNGEONCORE | `0x2B5A79C9B4586219Beac988f0c2ff6b3f30E573c` | ✅ 已部署 |
| DUNGEONSTORAGE | `0xf8B2c73fe5d8A7c6B11C4d8e67673258F4D8af36` | ✅ 已部署 |
| DUNGEONMASTER | `0xf7143B7644219e896D2013Fc01bc9e9e006C6Dca` | ✅ 已部署 |
| HERO | `0x76C9c7E9a82132739A6E6B04FD87f16801F4EF22` | ✅ 已部署 |
| RELIC | `0xe66036839c7E5F8372ADC36da8f0357429a96A34` | ✅ 已部署 |
| PARTY | `0x22Ac9b248716FA64eD97025c77112c4c3e0169ab` | ✅ 已部署 |
| VIPSTAKING | `0xf8D77F5588d1F93a18CFe36e3aad4037Cc81038C` | ✅ 已部署 |
| PLAYERPROFILE | `0x90e86Dc3c536B63AF5Df93F29df61Ce3961fcbb4` | ✅ 已部署 |
| ALTAROFASCENSION | `0x462fdBAdEc00895ddF168197Be16fff9ed786DC8` | ✅ 已部署 |

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

- **DungeonCore**: `0x2B5A79C9B4586219Beac988f0c2ff6b3f30E573c`
- **Hero**: `0x76C9c7E9a82132739A6E6B04FD87f16801F4EF22`
- **Relic**: `0xe66036839c7E5F8372ADC36da8f0357429a96A34`
- **SoulShard**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`

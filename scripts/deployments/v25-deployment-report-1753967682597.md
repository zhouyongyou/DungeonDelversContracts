# V25 部署報告

生成時間: 2025/7/31 下午9:14:42

## 部署概況

- **網路**: BSC Mainnet
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **起始區塊**: 55958852
- **錯誤數量**: 0

## 合約地址

| 合約 | 地址 | 狀態 |
|------|------|------|
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 📌 使用現有 |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | 📌 使用現有 |
| ORACLE | `0xf21548F8836d0ddB87293C4bCe2B020D17fF11c1` | ✅ 已部署 |
| PLAYERVAULT | `0x2746Ce8D6Aa7A885c568530abD9846460cA602f1` | ✅ 已部署 |
| DUNGEONCORE | `0xB8A111Ce09beCC7Aac7C4058f990b57ead635c58` | ✅ 已部署 |
| DUNGEONSTORAGE | `0xB5cf98A61682C4e0bd66124DcbF5fB794B584d8D` | ✅ 已部署 |
| DUNGEONMASTER | `0x2F78de7Fdc08E95616458038a7A1E2EE28e0fa85` | ✅ 已部署 |
| HERO | `0x785a8b7d7b2E64c5971D8f548a45B7db3CcA5797` | ✅ 已部署 |
| RELIC | `0xaa7434e77343cd4AaE7dDea2f19Cb86232727D0d` | ✅ 已部署 |
| PARTY | `0x2890F2bFe5ff4655d3096eC5521be58Eba6fAE50` | ✅ 已部署 |
| VIPSTAKING | `0x58A16F4845BA7Fea4377399d74D50d8aeE58fde4` | ✅ 已部署 |
| PLAYERPROFILE | `0xF1b836D09A30C433A2479a856c84e0d64DBBD973` | ✅ 已部署 |
| ALTAROFASCENSION | `0xbaA5CC63F9d531288e4BD87De64Af05FdA481ED9` | ✅ 已部署 |

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

- **DungeonCore**: `0xB8A111Ce09beCC7Aac7C4058f990b57ead635c58`
- **Hero**: `0x785a8b7d7b2E64c5971D8f548a45B7db3CcA5797`
- **Relic**: `0xaa7434e77343cd4AaE7dDea2f19Cb86232727D0d`
- **SoulShard**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`

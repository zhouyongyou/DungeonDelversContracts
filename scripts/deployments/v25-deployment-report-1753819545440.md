# V25 部署報告

生成時間: 2025/7/30 上午4:05:45

## 部署概況

- **網路**: BSC Mainnet
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **起始區塊**: 55761797
- **錯誤數量**: 0

## 合約地址

| 合約 | 地址 | 狀態 |
|------|------|------|
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 📌 使用現有 |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | 📌 使用現有 |
| ORACLE | `0xc0BF0Eb9907E0E3e36C41db3267BD0C393000b03` | ✅ 已部署 |
| PLAYERVAULT | `0xCA0c4F5DbC250F71f200243eb6a3850Cc5B96c37` | ✅ 已部署 |
| DUNGEONCORE | `0x8D231b151282Dbc15F1d8A930216D9b6BB502560` | ✅ 已部署 |
| DUNGEONSTORAGE | `0xF7BAb4BCD86CB09Ed7490918655caA89817Ba699` | ✅ 已部署 |
| DUNGEONMASTER | `0xC1efB792496265fe9a4205af2360BCDAf0424825` | ✅ 已部署 |
| HERO | `0xC2e1C9670Dc5ea1ec2FB39018426B84b0d3Fa09E` | ✅ 已部署 |
| RELIC | `0xf25cb80cc6a9a83783F88f6AF4F6CB33dba312E4` | ✅ 已部署 |
| PARTY | `0xcc5Ea0ab61009317381CAFbBFA0D4164051C80ab` | ✅ 已部署 |
| VIPSTAKING | `0xd7E805b398dE47b0cE1f0C26422C935b27bff3e4` | ✅ 已部署 |
| PLAYERPROFILE | `0xEf3b95aE52B2192f467fC0545980EAce68C506a2` | ✅ 已部署 |
| ALTAROFASCENSION | `0xdA17FdeAf7B5bBc3848e41F35EbaDAFF2c673E10` | ✅ 已部署 |

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

- **DungeonCore**: `0x8D231b151282Dbc15F1d8A930216D9b6BB502560`
- **Hero**: `0xC2e1C9670Dc5ea1ec2FB39018426B84b0d3Fa09E`
- **Relic**: `0xf25cb80cc6a9a83783F88f6AF4F6CB33dba312E4`
- **SoulShard**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`

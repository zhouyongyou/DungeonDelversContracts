# V25 部署報告

生成時間: 2025/8/3 下午11:57:38

## 部署概況

- **網路**: BSC Mainnet
- **部署者**: 0x10925A7138649C7E1794CE646182eeb5BF8ba647
- **起始區塊**: 56317376
- **錯誤數量**: 1

## 合約地址

| 合約 | 地址 | 狀態 |
|------|------|------|
| SOULSHARD | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | 📌 使用現有 |
| UNISWAP_POOL | `0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82` | 📌 使用現有 |
| ORACLE | `0xf8CE896aF39f95a9d5Dd688c35d381062263E25a` | ✅ 已部署 |
| PLAYERVAULT | `0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787` | ✅ 已部署 |
| DUNGEONCORE | `0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a` | ✅ 已部署 |
| DUNGEONSTORAGE | `0x1Fd33E7883FdAC36a49f497440a4E2e95C6fcC77` | ✅ 已部署 |
| DUNGEONMASTER | `0xd06470d4C6F62F6747cf02bD2b2De0981489034F` | ✅ 已部署 |
| HERO | `0x6DEb5Ade2F6BEe8294A4b7f37cE372152109E2db` | ✅ 已部署 |
| RELIC | `0xcfB83d8545D68b796a236290b3C1bc7e4A140B11` | ✅ 已部署 |
| PARTY | `0xabCD5DDa5bd9D73CD70D4F316827383e92f7b551` | ✅ 已部署 |
| VIPSTAKING | `0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69` | ✅ 已部署 |
| PLAYERPROFILE | `0x0f5932e89908400a5AfDC306899A2987b67a3155` | ✅ 已部署 |
| ALTAROFASCENSION | `0xE043ef6Ce183C218F8f9d9a144eD4A06cF379686` | ✅ 已部署 |

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

## 錯誤報告
- **DungeonMaster連接設置**: nonce has already been used (transaction="0xf88a82111d8405f5e10082baa494d06470d4c6f62f6747cf02bd2b2de0981489034f80a46ab1b29b0000000000000000000000001a959accb898add61c959f2c93abe502d0e1d34a8194a0bfe5f6ccd06c83aa0c0a1c93fd076f934dc66ecf8570b71882256943717b3900a059bf7eaddd432612555d63a8c02a5448a0bc062737934a9c26c8e0acd65c749a", info={ "error": { "code": -32000, "message": "nonce too low" } }, code=NONCE_EXPIRED, version=6.15.0)

## 下一步行動

1. 執行合約驗證: `npx hardhat run scripts/active/v25-verify-contracts.js --network bsc`
2. 同步配置到各項目: `node scripts/active/v25-sync-all.js`
3. 部署子圖: `cd DDgraphql/dungeon-delvers && npm run deploy`
4. 在前端測試功能

## 重要地址

- **DungeonCore**: `0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a`
- **Hero**: `0x6DEb5Ade2F6BEe8294A4b7f37cE372152109E2db`
- **Relic**: `0xcfB83d8545D68b796a236290b3C1bc7e4A140B11`
- **SoulShard**: `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF`

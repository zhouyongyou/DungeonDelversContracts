# V25 合約依賴關係檢查報告

生成時間: 2025-07-28T18:29:30.156Z

## 總結

- 總檢查項目: 29
- 通過: 19
- 失敗: 10
- 關鍵失敗: 9

## 詳細結果

### HERO

地址: `0x162b0b673f38C11732b0bc0B4B026304e563e8e2`

#### 依賴檢查

| 依賴 | 期望值 | 實際值 | 狀態 | 關鍵 |
|------|--------|--------|------|------|
| dungeonCore | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | ✅ | 是 |
| soulShardToken | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | ✅ | 是 |
| ascensionAltarAddress | `0x0148Aff0Dee6D31BA9825e66ED34a66BCeF45845` | `0x0148Aff0Dee6D31BA9825e66ED34a66BCeF45845` | ✅ | 是 |

#### 函數測試

| 函數 | 描述 | 結果 |
|------|------|------|
| getRequiredSoulShardAmount | 獲取鑄造價格 | ✅ 34086613255343865556465 |

### RELIC

地址: `0x15c2454A31Abc0063ef4a71d0640057d71847a22`

#### 依賴檢查

| 依賴 | 期望值 | 實際值 | 狀態 | 關鍵 |
|------|--------|--------|------|------|
| dungeonCore | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | ✅ | 是 |
| soulShardToken | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | ✅ | 是 |
| ascensionAltarAddress | `0x0148Aff0Dee6D31BA9825e66ED34a66BCeF45845` | `0x0148Aff0Dee6D31BA9825e66ED34a66BCeF45845` | ✅ | 是 |

#### 函數測試

| 函數 | 描述 | 結果 |
|------|------|------|
| getRequiredSoulShardAmount | 獲取鑄造價格 | ✅ 34086613255343865556465 |

### PARTY

地址: `0xab07E90d44c34FB62313C74F3C7b4b343E52a253`

#### 依賴檢查

| 依賴 | 期望值 | 實際值 | 狀態 | 關鍵 |
|------|--------|--------|------|------|
| heroContract | `0x162b0b673f38C11732b0bc0B4B026304e563e8e2` | `0x162b0b673f38C11732b0bc0B4B026304e563e8e2` | ✅ | 是 |
| relicContract | `0x15c2454A31Abc0063ef4a71d0640057d71847a22` | `0x15c2454A31Abc0063ef4a71d0640057d71847a22` | ✅ | 是 |
| dungeonCore | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | `ERROR` | ❌ | 否 |

### DUNGEONCORE

地址: `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E`

#### 依賴檢查

| 依賴 | 期望值 | 實際值 | 狀態 | 關鍵 |
|------|--------|--------|------|------|
| oracle | `0x2350D85e5DF1b6a6d055CD61FeD27d5dC36B6F52` | `ERROR` | ❌ | 是 |
| heroContract | `0x162b0b673f38C11732b0bc0B4B026304e563e8e2` | `ERROR` | ❌ | 是 |
| relicContract | `0x15c2454A31Abc0063ef4a71d0640057d71847a22` | `ERROR` | ❌ | 是 |
| partyContract | `0xab07E90d44c34FB62313C74F3C7b4b343E52a253` | `ERROR` | ❌ | 是 |
| dungeonMaster | `0x08Bd8E0D85A7F10bEecCBA9a67da9033f9a7C8D9` | `ERROR` | ❌ | 是 |
| playerVault | `0x4d06483c907DB1CfA9C2207D9DC5a1Abad86544b` | `ERROR` | ❌ | 是 |
| playerProfile | `0x145F19e672a7D53ddb16bcE3fdeAd976bb3ef82f` | `ERROR` | ❌ | 是 |
| vipStaking | `0xdC285539069Fa51b9259bd1F1d66f23f74B96A6c` | `ERROR` | ❌ | 是 |
| altarOfAscension | `0x0148Aff0Dee6D31BA9825e66ED34a66BCeF45845` | `ERROR` | ❌ | 是 |

#### 函數測試

| 函數 | 描述 | 結果 |
|------|------|------|
| getSoulShardAmountForUSD | USD 轉 SoulShard | ✅ 17043306627671932778232 |

### DUNGEONMASTER

地址: `0x08Bd8E0D85A7F10bEecCBA9a67da9033f9a7C8D9`

#### 依賴檢查

| 依賴 | 期望值 | 實際值 | 狀態 | 關鍵 |
|------|--------|--------|------|------|
| dungeonCore | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | ✅ | 是 |
| dungeonStorage | `0x4b1A9a45d0a1C35CDbae04272814f3daA9b59c47` | `0x4b1A9a45d0a1C35CDbae04272814f3daA9b59c47` | ✅ | 是 |
| soulShardToken | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | ✅ | 是 |

### PLAYERVAULT

地址: `0x4d06483c907DB1CfA9C2207D9DC5a1Abad86544b`

#### 依賴檢查

| 依賴 | 期望值 | 實際值 | 狀態 | 關鍵 |
|------|--------|--------|------|------|
| dungeonCore | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | ✅ | 是 |
| soulShardToken | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | ✅ | 是 |

### ALTAROFASCENSION

地址: `0x0148Aff0Dee6D31BA9825e66ED34a66BCeF45845`

#### 依賴檢查

| 依賴 | 期望值 | 實際值 | 狀態 | 關鍵 |
|------|--------|--------|------|------|
| dungeonCore | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | ✅ | 是 |
| heroContract | `0x162b0b673f38C11732b0bc0B4B026304e563e8e2` | `0x162b0b673f38C11732b0bc0B4B026304e563e8e2` | ✅ | 是 |
| relicContract | `0x15c2454A31Abc0063ef4a71d0640057d71847a22` | `0x15c2454A31Abc0063ef4a71d0640057d71847a22` | ✅ | 是 |

### VIPSTAKING

地址: `0xdC285539069Fa51b9259bd1F1d66f23f74B96A6c`

#### 依賴檢查

| 依賴 | 期望值 | 實際值 | 狀態 | 關鍵 |
|------|--------|--------|------|------|
| dungeonCore | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | ✅ | 是 |
| soulShardToken | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | `0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF` | ✅ | 是 |

### PLAYERPROFILE

地址: `0x145F19e672a7D53ddb16bcE3fdeAd976bb3ef82f`

#### 依賴檢查

| 依賴 | 期望值 | 實際值 | 狀態 | 關鍵 |
|------|--------|--------|------|------|
| dungeonCore | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | `0x04b33eEB6Da358ea9Dd002a1E1c28AC90A25881E` | ✅ | 是 |


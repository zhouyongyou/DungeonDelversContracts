# Contract URI 設置指南

## BaseURI vs ContractURI 的差異

### BaseURI
- **用途**：用於構建每個 NFT 的 tokenURI
- **格式**：`baseURI + tokenId`
- **例子**：`https://dungeon-delvers-metadata-server.onrender.com/api/hero/` + `123` = `https://dungeon-delvers-metadata-server.onrender.com/api/hero/123`
- **返回內容**：單個 NFT 的元數據
```json
{
  "name": "Hero #123",
  "description": "A brave hero...",
  "image": "https://dungeon-delvers-metadata-server.onrender.com/images/hero/123.png",
  "attributes": [...]
}
```

### ContractURI
- **用途**：整個合約的元數據（在 OpenSea 等市場顯示）
- **格式**：固定的 URL
- **例子**：`https://dungeon-delvers-metadata-server.onrender.com/api/contract/hero`
- **返回內容**：合約級別的信息
```json
{
  "name": "Dungeon Delvers Hero",
  "description": "Heroes are the main characters in Dungeon Delvers, a blockchain-based dungeon exploration game.",
  "image": "https://dungeon-delvers-metadata-server.onrender.com/images/hero-collection.png",
  "external_link": "https://dungeondelvers.com",
  "seller_fee_basis_points": 500,  // 5% 版稅
  "fee_recipient": "0x10925A7138649C7E1794CE646182eeb5BF8ba647"
}
```

## 建議的 Contract URI 設置

### Hero Collection
```json
{
  "name": "Dungeon Delvers Hero",
  "description": "Heroes are brave adventurers exploring dangerous dungeons in the Dungeon Delvers universe.",
  "image": "https://dungeon-delvers-metadata-server.onrender.com/images/hero-collection.png",
  "banner_image": "https://dungeon-delvers-metadata-server.onrender.com/images/hero-banner.png",
  "external_link": "https://dungeondelvers.com",
  "seller_fee_basis_points": 500,
  "fee_recipient": "0x10925A7138649C7E1794CE646182eeb5BF8ba647"
}
```

### Relic Collection
```json
{
  "name": "Dungeon Delvers Relic",
  "description": "Relics are powerful artifacts discovered in the depths of dungeons.",
  "image": "https://dungeon-delvers-metadata-server.onrender.com/images/relic-collection.png",
  "banner_image": "https://dungeon-delvers-metadata-server.onrender.com/images/relic-banner.png",
  "external_link": "https://dungeondelvers.com",
  "seller_fee_basis_points": 500,
  "fee_recipient": "0x10925A7138649C7E1794CE646182eeb5BF8ba647"
}
```

### Party Collection
```json
{
  "name": "Dungeon Delvers Party",
  "description": "Parties are groups of heroes and relics ready to explore dungeons together.",
  "image": "https://dungeon-delvers-metadata-server.onrender.com/images/party-collection.png",
  "banner_image": "https://dungeon-delvers-metadata-server.onrender.com/images/party-banner.png",
  "external_link": "https://dungeondelvers.com",
  "seller_fee_basis_points": 500,
  "fee_recipient": "0x10925A7138649C7E1794CE646182eeb5BF8ba647"
}
```

### VIP Collection
```json
{
  "name": "Dungeon Delvers VIP",
  "description": "VIP NFTs represent staked positions in the Dungeon Delvers ecosystem.",
  "image": "https://dungeon-delvers-metadata-server.onrender.com/images/vip-collection.png",
  "banner_image": "https://dungeon-delvers-metadata-server.onrender.com/images/vip-banner.png",
  "external_link": "https://dungeondelvers.com",
  "seller_fee_basis_points": 0,  // VIP 不可轉移，無版稅
  "fee_recipient": "0x10925A7138649C7E1794CE646182eeb5BF8ba647"
}
```

### Player Profile Collection
```json
{
  "name": "Dungeon Delvers Profile",
  "description": "Player profiles track achievements and progress in Dungeon Delvers.",
  "image": "https://dungeon-delvers-metadata-server.onrender.com/images/profile-collection.png",
  "banner_image": "https://dungeon-delvers-metadata-server.onrender.com/images/profile-banner.png",
  "external_link": "https://dungeondelvers.com",
  "seller_fee_basis_points": 0,  // Profile 通常不交易
  "fee_recipient": "0x10925A7138649C7E1794CE646182eeb5BF8ba647"
}
```

## 實施步驟

### 1. 後端實現
需要在 metadata server 添加這些端點：
- `/api/contract/hero`
- `/api/contract/relic`
- `/api/contract/party`
- `/api/contract/vip`
- `/api/contract/profile`

### 2. 設置合約
執行增強版設置腳本：
```bash
node scripts/active/setup-v23-complete-enhanced.js
```

### 3. 驗證
- 在 BSCScan 查看合約的 `contractURI()` 函數
- 訪問返回的 URL 確認 JSON 格式正確
- 等待 OpenSea 更新（可能需要刷新元數據）

## 注意事項

1. **圖片要求**：
   - collection image: 350x350px
   - banner image: 1400x350px
   - 格式：PNG 或 JPG

2. **版稅設置**：
   - `seller_fee_basis_points`: 10000 = 100%
   - 500 = 5% 版稅
   - VIP 和 Profile 通常設為 0

3. **更新頻率**：
   - OpenSea 會緩存 contractURI
   - 更改後可能需要手動刷新

## 之前的設置記錄

根據代碼歷史，之前使用過兩種方式：

1. **指向前端的 JSON 文件**：
   ```
   ${FRONTEND_BASE_URL}/metadata/hero-collection.json
   ```

2. **指向後端 API**：
   ```
   ${METADATA_SERVER_BASE_URL}/api/contract/hero
   ```

建議使用後端 API 方式，因為：
- 更容易更新和維護
- 可以動態生成內容
- 與 NFT 元數據 API 保持一致
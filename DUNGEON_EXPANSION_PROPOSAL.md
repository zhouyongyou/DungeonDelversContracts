# 地城擴展提案 - 新增 3300+ 戰力地城

## 現有地城配置（ID 1-10）
```javascript
{ id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: 6, successRate: 89 },
{ id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: 12, successRate: 84 },
{ id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: 20, successRate: 79 },
{ id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: 33, successRate: 74 },
{ id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: 52, successRate: 69 },
{ id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: 78, successRate: 64 },
{ id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: 113, successRate: 59 },
{ id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: 156, successRate: 54 },
{ id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: 209, successRate: 49 },
{ id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: 225, successRate: 44 }
```

## 建議新增地城（ID 11-14）

### 選項 A：保守方案（穩定遞增）
```javascript
{ id: 11, name: "冥界之門", requiredPower: 3300, rewardUSD: 243, successRate: 39 },
{ id: 12, name: "虛空裂隙", requiredPower: 3600, rewardUSD: 262, successRate: 34 },
{ id: 13, name: "深淵核心", requiredPower: 3900, rewardUSD: 280, successRate: 29 },
{ id: 14, name: "終焉之境", requiredPower: 4200, rewardUSD: 300, successRate: 24 }
```

### 選項 B：激進方案（高風險高回報）
```javascript
{ id: 11, name: "冥界之門", requiredPower: 3300, rewardUSD: 275, successRate: 38 },
{ id: 12, name: "虛空裂隙", requiredPower: 3600, rewardUSD: 350, successRate: 32 },
{ id: 13, name: "深淵核心", requiredPower: 3900, rewardUSD: 450, successRate: 26 },
{ id: 14, name: "終焉之境", requiredPower: 4200, rewardUSD: 600, successRate: 20 }
```

### 選項 C：平衡方案（推薦）
```javascript
{ id: 11, name: "冥界之門", requiredPower: 3300, rewardUSD: 260, successRate: 39 },
{ id: 12, name: "虛空裂隙", requiredPower: 3600, rewardUSD: 300, successRate: 34 },
{ id: 13, name: "深淵核心", requiredPower: 3900, rewardUSD: 350, successRate: 29 },
{ id: 14, name: "終焉之境", requiredPower: 4200, rewardUSD: 420, successRate: 24 }
```

## 獎勵增長分析

### 現有模式分析
- 300 → 600：獎勵 x2.0（6 → 12）
- 2400 → 2700：獎勵 x1.34（156 → 209）
- 2700 → 3000：獎勵 x1.08（209 → 225）

觀察：高等級地城的獎勵增長率逐漸放緩

### 建議增長模式
- 3000 → 3300：獎勵 x1.16（225 → 260）
- 3300 → 3600：獎勵 x1.15（260 → 300）
- 3600 → 3900：獎勵 x1.17（300 → 350）
- 3900 → 4200：獎勵 x1.20（350 → 420）

## 成功率設計理念

### 現有遞減模式
每增加 300 戰力，成功率約降低 5%

### 建議延續此模式
- 3300：39%（-5%）
- 3600：34%（-5%）
- 3900：29%（-5%）
- 4200：24%（-5%）

## 實施考量

### 1. 玩家分布
- 預估只有 5-10% 的玩家能達到 3300+ 戰力
- 這些是最核心、最活躍的玩家群體
- 需要給他們持續的挑戰和目標

### 2. 經濟平衡
- 高難度地城應該有相應的高回報
- 但不能過高導致經濟失衡
- 建議獎勵增長率保持在 15-20% 之間

### 3. 未來擴展性
- 保留 ID 15+ 給未來更高等級地城
- 當有玩家達到 5000+ 戰力時可以繼續擴展

## 實施代碼

```javascript
// 在 v25-deploy-complete-sequential.js 中更新地城配置
dungeons: [
  { id: 1, name: "新手礦洞", requiredPower: 300, rewardUSD: 6, successRate: 89 },
  { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardUSD: 12, successRate: 84 },
  { id: 3, name: "食人魔山谷", requiredPower: 900, rewardUSD: 20, successRate: 79 },
  { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardUSD: 33, successRate: 74 },
  { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardUSD: 52, successRate: 69 },
  { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardUSD: 78, successRate: 64 },
  { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardUSD: 113, successRate: 59 },
  { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardUSD: 156, successRate: 54 },
  { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardUSD: 209, successRate: 49 },
  { id: 10, name: "混沌深淵", requiredPower: 3000, rewardUSD: 225, successRate: 44 },
  // 新增高等級地城
  { id: 11, name: "冥界之門", requiredPower: 3300, rewardUSD: 260, successRate: 39 },
  { id: 12, name: "虛空裂隙", requiredPower: 3600, rewardUSD: 300, successRate: 34 },
  { id: 13, name: "深淵核心", requiredPower: 3900, rewardUSD: 350, successRate: 29 },
  { id: 14, name: "終焉之境", requiredPower: 4200, rewardUSD: 420, successRate: 24 }
],
```

## 部署注意事項

1. **合約更新**
   - 需要通過 DungeonMaster 合約的 `setDungeon` 函數添加新地城
   - 確保合約 owner 權限

2. **前端更新**
   - 更新前端的地城列表顯示
   - 確保 UI 能正確顯示新地城

3. **測試建議**
   - 先在測試網部署測試
   - 驗證獎勵計算正確
   - 確認成功率機制正常

## 結論

強烈建議添加 3300-4200 戰力範圍的地城，原因：
1. 為頂級玩家提供持續挑戰
2. 充分利用已設計的戰力分級系統
3. 延長遊戲生命週期
4. 增加高端玩家的參與度

推薦使用「平衡方案」，既提供足夠的挑戰和回報，又不會破壞遊戲經濟平衡。
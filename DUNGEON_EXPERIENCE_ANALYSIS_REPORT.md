# DungeonDelvers 地下城經驗值詳細分析報告

## 📊 合約配置分析

### 🔴 **關鍵問題發現**

#### 1. **地城數量不匹配**
- **DungeonStorage.sol**: `NUM_DUNGEONS = 10` (第16行)
- **部署腳本**: 配置了 **12 個地城** (ID 1-12)

```solidity
// DungeonStorage.sol
uint256 public constant NUM_DUNGEONS = 10; // ❌ 需要更新為 12
```

```javascript
// v25-deploy-complete-sequential.js - GAME_PARAMS.dungeons
dungeons: [
  // 原有 10 個地城
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
  
  // 新增的高階地城
  { id: 11, name: "冥界之門", requiredPower: 3300, rewardUSD: 320, successRate: 39 },
  { id: 12, name: "虛空裂隙", requiredPower: 3600, rewardUSD: 450, successRate: 34 }
]
```

## 🧮 **經驗值計算機制**

### **合約中的經驗值公式** (DungeonMaster.sol 第119-122行)
```solidity
function _handleExpeditionOutcome(address _player, uint256 _dungeonId, bool _success) private returns (uint256 reward, uint256 expGained) {
    Dungeon memory dungeon = _getDungeon(_dungeonId);
    
    if (_success) {
        expGained = dungeon.requiredPower / 10;  // 成功：需求戰力 ÷ 10
    } else {
        expGained = dungeon.requiredPower / 20;  // 失敗：需求戰力 ÷ 20
    }
    
    // 自動調用 PlayerProfile 添加經驗值
    try IPlayerProfile(dungeonCore.playerProfileAddress()).addExperience(_player, expGained) {} catch {}
}
```

### **經驗值計算表**

| 地城ID | 地城名稱 | 需求戰力 | 成功經驗值 | 失敗經驗值 | 獎勵USD | 成功率 |
|-------|---------|---------|-----------|-----------|----------|--------|
| 1 | 新手礦洞 | 300 | **30** | **15** | $6 | 89% |
| 2 | 哥布林洞穴 | 600 | **60** | **30** | $12 | 84% |
| 3 | 食人魔山谷 | 900 | **90** | **45** | $20 | 79% |
| 4 | 蜘蛛巢穴 | 1200 | **120** | **60** | $33 | 74% |
| 5 | 石化蜥蜴沼澤 | 1500 | **150** | **75** | $52 | 69% |
| 6 | 巫妖墓穴 | 1800 | **180** | **90** | $78 | 64% |
| 7 | 奇美拉之巢 | 2100 | **210** | **105** | $113 | 59% |
| 8 | 惡魔前哨站 | 2400 | **240** | **120** | $156 | 54% |
| 9 | 巨龍之巔 | 2700 | **270** | **135** | $209 | 49% |
| 10 | 混沌深淵 | 3000 | **300** | **150** | $225 | 44% |
| 11 | 冥界之門 | 3300 | **330** | **165** | $320 | 39% |
| 12 | 虛空裂隙 | 3600 | **360** | **180** | $450 | 34% |

## 📈 **經驗值效率分析**

### **每美元獎勵的經驗值效率** (成功時)
| 地城 | 經驗值/美元 | 排名 | 評價 |
|-----|------------|------|------|
| 新手礦洞 | 5.00 | 1 | 🥇 最高效率 |
| 哥布林洞穴 | 5.00 | 1 | 🥇 最高效率 |
| 食人魔山谷 | 4.50 | 3 | 🥈 高效率 |
| 蜘蛛巢穴 | 3.64 | 4 | 🥉 中高效率 |
| 石化蜥蜴沼澤 | 2.88 | 5 | 中效率 |
| 巫妖墓穴 | 2.31 | 6 | 中效率 |
| 奇美拉之巢 | 1.86 | 7 | 低效率 |
| 惡魔前哨站 | 1.54 | 8 | 低效率 |
| 巨龍之巔 | 1.29 | 9 | 較低效率 |
| 混沌深淵 | 1.33 | 10 | 較低效率 |
| 冥界之門 | 1.03 | 11 | 最低效率 |
| 虛空裂隙 | 0.80 | 12 | 最低效率 |

### **期望經驗值** (考慮成功率)
| 地城 | 期望經驗值 | 排名 | 評價 |
|-----|-----------|------|------|
| 新手礦洞 | 28.35 | 1 | 🥇 最佳期望 |
| 哥布林洞穴 | 54.00 | 2 | 🥈 第二最佳 |
| 食人魔山谷 | 80.55 | 3 | 🥉 第三最佳 |
| 蜘蛛巢穴 | 104.40 | 4 | 優秀 |
| 石化蜥蜴沼澤 | 126.75 | 5 | 良好 |
| 巫妖墓穴 | 147.60 | 6 | 良好 |
| 奇美拉之巢 | 167.85 | 7 | 中等 |
| 惡魔前哨站 | 185.20 | 8 | 中等 |
| 巨龍之巔 | 200.55 | 9 | 中等 |
| 混沌深淵 | 216.00 | 10 | 中等 |
| 冥界之門 | 246.15 | 11 | 最高期望 |
| 虛空裂隙 | 284.40 | 12 | 🏆 **最高期望** |

## 💡 **經驗值記錄機制**

### **合約層面**
1. **ExpeditionFulfilled 事件**:
```solidity
event ExpeditionFulfilled(address indexed player, uint256 indexed partyId, bool success, uint256 reward, uint256 expGained);
```

2. **PlayerProfile.addExperience()**:
```solidity
// 自動調用玩家檔案合約添加經驗值
try IPlayerProfile(dungeonCore.playerProfileAddress()).addExperience(_player, expGained) {} catch {}
```

3. **等級計算**: 基於總經驗值開平方根 + 1
```solidity
// 等級 = sqrt(總經驗值/100) + 1
```

## 🔧 **需要修復的問題**

### 1. **DungeonStorage.sol 更新**
```diff
- uint256 public constant NUM_DUNGEONS = 10;
+ uint256 public constant NUM_DUNGEONS = 12;
```

### 2. **子圖硬編碼問題**
- 目前子圖中地城戰力需求只到 ID 10 (3000戰力)
- 需要更新到 ID 12 (3600戰力)

### 3. **部署腳本執行**
確保所有 12 個地城都被正確初始化到 DungeonStorage。

## 📊 **總結**

- **低階地城** (1-4): 經驗值效率最高，適合新手快速升級
- **中階地城** (5-8): 平衡的經驗值和獎勵比例
- **高階地城** (9-12): 雖然效率較低，但提供最高的絕對經驗值和獎勵

**建議策略**: 新手專注前4個地城快速升級，高等級玩家挑戰後面的地城獲得最大收益。

---

## 🔴 **子圖層面的重大問題**

### **問題1: ExpeditionFulfilled 事件缺少 dungeonId**
```solidity
// DungeonMaster.sol 第40行 - 當前事件定義
event ExpeditionFulfilled(address indexed player, uint256 indexed partyId, bool success, uint256 reward, uint256 expGained);

// ❌ 缺少 dungeonId 參數！
```

**影響**:
- 子圖無法知道玩家探索了哪個地城
- 目前子圖硬編碼為地城 ID 1 (dungeon-master.ts:58)
- 無法統計不同地城的使用情況和成功率

### **問題2: 子圖硬編碼 dungeonId = 1**
```typescript
// dungeon-master.ts 第58行
const dungeonId = BigInt.fromI32(1)  // ❌ 所有遠征都記錄為地城1
```

### **問題3: 子圖地城配置不完整**
```typescript
// dungeon-master.ts 第32-44行 - 只有10個地城
const powerRequirements = [
  BigInt.fromI32(0),    // 0 - 無效
  BigInt.fromI32(300),  // 1 - 新手礦洞
  // ...
  BigInt.fromI32(3000)  // 10 - 混沌深淵
]
// ❌ 缺少地城11和12
```

## 🔧 **修復方案**

### **方案1: 合約修復 (推薦)**
```solidity
// 修改 ExpeditionFulfilled 事件
event ExpeditionFulfilled(
    address indexed player, 
    uint256 indexed partyId, 
    uint256 indexed dungeonId,  // ✅ 新增 dungeonId
    bool success, 
    uint256 reward, 
    uint256 expGained
);

// 更新 emit 調用
emit ExpeditionFulfilled(_requester, _partyId, _dungeonId, success, reward, expGained);
```

### **方案2: 子圖修復 (臨時解決)**
通過分析 `expGained` 反推 dungeonId：
```typescript
function getDungeonIdFromExp(expGained: BigInt, success: boolean): i32 {
  const requiredPower = success ? expGained.times(BigInt.fromI32(10)) : expGained.times(BigInt.fromI32(20));
  
  // 根據戰力需求匹配地城ID
  if (requiredPower.equals(BigInt.fromI32(300))) return 1;   // 新手礦洞
  if (requiredPower.equals(BigInt.fromI32(600))) return 2;   // 哥布林洞穴
  // ... 其他地城
  if (requiredPower.equals(BigInt.fromI32(3600))) return 12; // 虛空裂隙
  
  return 1; // 默認值
}
```

### **方案3: DungeonStorage 更新**
```diff
// DungeonStorage.sol 第16行
- uint256 public constant NUM_DUNGEONS = 10;
+ uint256 public constant NUM_DUNGEONS = 12;
```

## 📊 **優先級建議**

1. **高優先級**: 修復子圖 PlayerProfile 地址 (已完成)
2. **中優先級**: 實施方案2臨時修復子圖記錄問題
3. **低優先級**: 更新 DungeonStorage 常量
4. **未來版本**: 實施方案1合約級修復

## 💡 **總結**

- **經驗值計算**: 基於戰力需求的簡單公式 (÷10或÷20)
- **主要問題**: 合約事件缺少 dungeonId，導致子圖無法正確追踪
- **臨時解決**: 可通過經驗值反推地城ID
- **長期方案**: 需要合約升級添加 dungeonId 到事件中
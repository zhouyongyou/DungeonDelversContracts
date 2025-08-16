# DungeonMaster PlayerVault 整合改動說明

## 合約改動

### 原始設計（兩階段領取）
1. 探險成功 → 獎勵累積在 `party.unclaimedRewards`
2. 玩家手動調用 `claimRewards()` → SOUL 轉給玩家

### 新設計（自動存入金庫）
1. 探險成功 → SOUL 自動轉入 PlayerVault 合約
2. PlayerVault 記錄玩家餘額（`withdrawableBalance`）
3. 玩家從金庫提取時享受稅率優惠

## 技術細節

### SOUL 代幣流轉
```solidity
// 舊版本
soulShardToken.safeTransfer(_player, soulShardReward);

// 新版本
IPlayerVault playerVault = IPlayerVault(dungeonCore.playerVaultAddress());
soulShardToken.safeTransfer(address(playerVault), soulShardReward);
playerVault.deposit(_player, soulShardReward);
```

### 關鍵差異
- **不是直接轉給玩家**：SOUL 進入 PlayerVault 託管
- **需要實際轉帳**：SOUL 必須從 DungeonMaster 轉到 PlayerVault
- **記帳式管理**：PlayerVault 內部記錄每個玩家的餘額

## 前端修改清單

### 1. 移除領取獎勵功能
- [ ] 刪除或隱藏 `RewardClaimSection` 組件
- [ ] 移除 `useRewardManager` hook 中的 claim 邏輯
- [ ] 更新 DungeonPage 不顯示未領取獎勵

### 2. 更新顯示邏輯
- [ ] 在探險成功後顯示「獎勵已存入金庫」提示
- [ ] 引導玩家到金庫頁面查看餘額
- [ ] 移除所有 `unclaimedRewards` 相關顯示

### 3. 修改的檔案
```
src/components/RewardClaimSection.tsx - 刪除或改為提示組件
src/pages/DungeonPage.tsx - 移除獎勵領取區塊
src/hooks/useRewardManager.ts - 移除 claim 功能
src/pages/OverviewPage.tsx - 更新統計顯示
```

### 4. 新增提示組件（建議）
```tsx
// RewardNotification.tsx
export const RewardNotification = ({ reward }) => {
  return (
    <div className="bg-green-900/20 border border-green-600 rounded-lg p-3">
      <p className="text-green-400">
        ✓ {reward} SOUL 已自動存入您的金庫
      </p>
      <Link to="/vault" className="text-sm text-blue-400 hover:underline">
        前往金庫查看 →
      </Link>
    </div>
  );
};
```

## 部署步驟

1. **部署新版 DungeonMaster 合約**
2. **確保 DungeonMaster 有足夠 SOUL 餘額**
3. **設置正確的 PlayerVault 地址在 DungeonCore**
4. **更新前端移除領取功能**
5. **測試完整流程**

## 注意事項

- 子圖不需要更新（ExpeditionFulfilled 事件沒變）
- ABI 需要更新（claimRewards 函數簽名改變）
- 出征歷史記錄功能完全正常
- RewardsBanked 事件不再觸發（不影響功能）
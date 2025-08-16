# PlayerVault 虛擬記帳修改說明

## 📋 版本對比
- **原版本**: v3.2 - 混合模式（虛擬記帳 + 實際轉帳）
- **新版本**: v4.0 - 完全虛擬記帳模式

## 🔴 核心問題
原版本在 `spendForGame` 函數中嘗試實際轉移 SoulShard，但資金是通過虛擬記帳方式存入的，導致合約沒有足夠的代幣餘額。

## ✅ 主要修改

### 1. 新增狀態變數
```solidity
// 原版本
struct PlayerInfo {
    uint256 withdrawableBalance;
    uint256 lastWithdrawTimestamp;
    uint256 lastFreeWithdrawTimestamp;
}

// 新版本
struct PlayerInfo {
    uint256 withdrawableBalance;
    uint256 virtualSpentBalance;     // ✨ 新增：追蹤虛擬支出
    uint256 lastWithdrawTimestamp;
    uint256 lastFreeWithdrawTimestamp;
}

// ✨ 新增：追蹤每個遊戲合約的虛擬餘額
mapping(address => uint256) public gameContractBalances;
```

### 2. 修改 spendForGame 函數
```solidity
// 原版本 - 實際轉帳
function spendForGame(address _player, uint256 _amount) external onlyAuthorizedGameContracts {
    PlayerInfo storage player = playerInfo[_player];
    require(player.withdrawableBalance >= _amount, "Vault: Insufficient balance for game spending");
    player.withdrawableBalance -= _amount;
    soulShardToken.safeTransfer(msg.sender, _amount);  // ❌ 實際轉帳
    emit GameSpending(_player, msg.sender, _amount);
}

// 新版本 - 純虛擬記帳
function spendForGame(address _player, uint256 _amount) external onlyAuthorizedGameContracts {
    PlayerInfo storage player = playerInfo[_player];
    require(player.withdrawableBalance >= _amount, "Vault: Insufficient balance for game spending");
    
    // 虛擬扣款
    player.withdrawableBalance -= _amount;
    player.virtualSpentBalance += _amount;      // ✨ 記錄虛擬支出
    
    // 記錄遊戲合約的虛擬餘額
    gameContractBalances[msg.sender] += _amount;  // ✨ 遊戲合約記帳
    
    // 發出虛擬消費事件
    emit VirtualGameSpending(_player, msg.sender, _amount);  // ✨ 新事件
}
```

### 3. 提款邏輯調整
```solidity
// 新增內部函數處理代幣鑄造
function _mintSoulShard(address _to, uint256 _amount) private {
    // 方案 1：如果 SoulShard 有 mint 功能
    // ISoulShard(address(soulShardToken)).mint(_to, _amount);
    
    // 方案 2：通過 DungeonCore 的特殊機制鑄造
    // IDungeonCore(dungeonCore).mintSoulShardFor(_to, _amount);
    
    // 臨時方案：需要合約有預充值的 SoulShard
    soulShardToken.safeTransfer(_to, _amount);
}
```

### 4. 新增查詢功能
```solidity
// 查詢玩家完整信息（包含虛擬支出）
function getPlayerInfo(address _player) external view returns (
    uint256 withdrawableBalance,
    uint256 virtualSpentBalance,    // ✨ 新增
    uint256 lastWithdrawTimestamp,
    uint256 lastFreeWithdrawTimestamp,
    address referrer
)

// 查詢遊戲合約的虛擬餘額
function getGameContractBalance(address _gameContract) external view returns (uint256)
```

## 🚀 部署建議

### 方案一：直接替換（需要遷移數據）
1. 部署新的 PlayerVault_VirtualAccounting
2. 暫停舊合約
3. 遷移所有玩家餘額數據
4. 更新 DungeonCore 中的地址
5. 恢復服務

### 方案二：漸進式升級（推薦）
1. 先給現有 PlayerVault 充值足夠的 SoulShard 解決當前問題
2. 部署新版本進行測試
3. 新玩家使用新版本
4. 逐步遷移舊玩家

## ⚠️ 注意事項

1. **代幣鑄造權限**：需要決定如何處理提款時的代幣鑄造
   - 選項 A：給 PlayerVault mint 權限
   - 選項 B：通過 DungeonCore 中轉
   - 選項 C：預充值模式（短期方案）

2. **數據遷移**：需要遷移所有玩家的 `withdrawableBalance`

3. **前端更新**：
   - 新增顯示 `virtualSpentBalance`
   - 更新相關查詢邏輯

4. **審計建議**：虛擬記帳系統需要額外的審計確保帳目平衡

## 📊 影響分析

### 優點
- ✅ 完全解決餘額不足問題
- ✅ 減少實際代幣轉移，節省 gas
- ✅ 更清晰的資金流向追蹤
- ✅ 支援更複雜的遊戲經濟模型

### 潛在風險
- ⚠️ 需要確保虛擬帳本的準確性
- ⚠️ 提款時需要鑄造機制
- ⚠️ 增加了系統複雜度

## 🔧 測試建議

1. 單元測試所有虛擬記帳邏輯
2. 模擬大量交易測試帳本準確性
3. 測試極端情況（如超大金額）
4. 驗證事件日誌的完整性

## 💡 未來優化

1. 實施批量結算機制
2. 添加虛擬餘額快照功能
3. 實現跨遊戲合約的虛擬轉帳
4. 建立完整的審計追蹤系統
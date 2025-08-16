# 🎲 改進揭示機制設計

## 當前問題
1. **技術故障風險**：RPC 故障、前端崩潰導致用戶錯過揭示
2. **公平性問題**：過期懲罰太嚴苛
3. **用戶體驗**：需要精準計時，壓力大
4. **防撞庫需求**：不能讓用戶無限重試

## 建議方案

### 🏆 推薦：漸進式懲罰系統

```solidity
pragma solidity ^0.8.19;

contract ImprovedRevealSystem {
    // 時間窗口定義（以區塊計）
    uint256 constant OPTIMAL_WINDOW = 255;      // 最佳窗口：12分鐘
    uint256 constant GRACE_WINDOW = 500;        // 寬限窗口：25分鐘  
    uint256 constant RESCUE_WINDOW = 1000;      // 救援窗口：50分鐘
    
    // 品質保證
    uint256 constant MIN_QUALITY = 70;          // 最低保證 70% 品質
    uint256 constant GRACE_QUALITY = 85;        // 寬限期 85% 品質
    
    function revealWithGrace(address user) external {
        Commitment memory c = commitments[user];
        require(c.blockNumber > 0, "No commitment");
        
        uint256 elapsed = block.number - c.blockNumber;
        
        if (elapsed < 3) {
            revert("Too early");
        } else if (elapsed <= OPTIMAL_WINDOW) {
            // 🎯 最佳時機：100% 品質
            _mintFullQuality(user, c);
            emit RevealSuccess(user, 100);
            
        } else if (elapsed <= GRACE_WINDOW) {
            // ⏰ 寬限期：85% 品質 + 部分退款
            uint256 qualityRate = 85 + (15 * (GRACE_WINDOW - elapsed) / (GRACE_WINDOW - OPTIMAL_WINDOW));
            _mintWithQuality(user, c, qualityRate);
            
            // 退還 10% 費用作為補償
            uint256 refund = c.payment / 10;
            payable(user).transfer(refund);
            emit GracePeriodReveal(user, qualityRate, refund);
            
        } else if (elapsed <= RESCUE_WINDOW) {
            // 🆘 救援期：70% 保底 + 補救代幣
            _mintWithQuality(user, c, MIN_QUALITY);
            
            // 發放補救代幣（可用於未來優惠）
            rescueTokens[user] += 1;
            emit RescueReveal(user, MIN_QUALITY, 1);
            
        } else {
            // 💔 完全過期：退還 50% 費用
            uint256 refund = c.payment / 2;
            payable(user).transfer(refund);
            delete commitments[user];
            emit ExpiredRefund(user, refund);
        }
    }
    
    // 緊急救援功能（需要管理員批准）
    mapping(address => bool) public emergencyApprovals;
    
    function requestEmergencyReveal() external {
        require(commitments[msg.sender].blockNumber > 0, "No commitment");
        require(!emergencyRequests[msg.sender], "Already requested");
        
        emergencyRequests[msg.sender] = true;
        emit EmergencyRevealRequested(msg.sender);
    }
    
    function approveEmergencyReveal(address user) external onlyAdmin {
        require(emergencyRequests[user], "No request");
        emergencyApprovals[user] = true;
    }
    
    function executeEmergencyReveal() external {
        require(emergencyApprovals[msg.sender], "Not approved");
        
        // 給予 90% 品質作為技術問題補償
        _mintWithQuality(msg.sender, commitments[msg.sender], 90);
        delete emergencyApprovals[msg.sender];
        delete emergencyRequests[msg.sender];
    }
}
```

### 🛡️ 前端保護機制

```typescript
// 前端自動揭示保護
class AutoRevealProtection {
    private revealQueue: Map<string, RevealTask> = new Map();
    
    async protectReveal(commitment: Commitment) {
        const task = {
            address: commitment.user,
            optimalBlock: commitment.blockNumber + 3n,
            graceBlock: commitment.blockNumber + 255n,
            rescueBlock: commitment.blockNumber + 500n,
        };
        
        // 1. 本地存儲備份
        localStorage.setItem(
            `reveal_${commitment.user}`, 
            JSON.stringify(task)
        );
        
        // 2. 設置多重提醒
        this.scheduleReveal(task, 'optimal');
        this.scheduleReveal(task, 'grace'); 
        this.scheduleReveal(task, 'rescue');
        
        // 3. 後端備份（可選）
        await this.backupToServer(task);
    }
    
    private async scheduleReveal(task: RevealTask, priority: string) {
        // 瀏覽器通知
        if (Notification.permission === 'granted') {
            setTimeout(() => {
                new Notification('🎲 揭示提醒', {
                    body: `您的 NFT 可以揭示了 (${priority})`,
                    icon: '/logo.png',
                    requireInteraction: true
                });
            }, this.calculateDelay(task, priority));
        }
        
        // 自動執行（如果用戶授權）
        if (this.hasAutoRevealPermission()) {
            setTimeout(async () => {
                try {
                    await this.autoReveal(task.address);
                } catch (error) {
                    console.error('Auto reveal failed:', error);
                    // 發送緊急通知
                    this.sendEmergencyAlert(task.address);
                }
            }, this.calculateDelay(task, priority));
        }
    }
}
```

### 📊 經濟模型平衡

| 揭示時機 | 區塊範圍 | 品質 | 補償 | 說明 |
|---------|----------|------|------|------|
| 最佳 | 3-255 | 100% | 無 | 正常流程 |
| 寬限 | 256-500 | 85-99% | 10% 退款 | 輕微懲罰 |
| 救援 | 501-1000 | 70% | 補救代幣 | 保底機制 |
| 過期 | >1000 | 0% | 50% 退款 | 失敗保護 |

### 🔐 防撞庫機制

```solidity
// 防止濫用的機制
modifier preventAbuse(address user) {
    // 1. 限制重試頻率
    require(
        block.number > lastRevealAttempt[user] + 10,
        "Too frequent"
    );
    
    // 2. 累進成本
    uint256 attempts = revealAttempts[user];
    if (attempts > 0) {
        uint256 penaltyFee = BASE_FEE * (2 ** attempts);
        require(msg.value >= penaltyFee, "Penalty fee required");
    }
    
    // 3. 信譽系統
    require(
        userReputation[user] > MIN_REPUTATION,
        "Reputation too low"
    );
    
    _;
}
```

## 實施建議

### 第一階段：合約升級
1. 部署新的揭示合約（可升級代理）
2. 添加寬限期和救援期邏輯
3. 實現品質漸變算法

### 第二階段：前端強化
1. 實現自動揭示隊列
2. 添加瀏覽器通知
3. 本地存儲備份機制

### 第三階段：後端支援
1. 建立揭示任務調度器
2. WebSocket 實時提醒
3. Email/SMS 備用通知

### 第四階段：社區保護
1. 建立互助揭示機制
2. 委託揭示功能
3. 保險基金池

## 關鍵指標監控

```typescript
interface RevealMetrics {
    totalReveals: number;
    onTimeRate: number;      // 最佳時機揭示率
    graceUsageRate: number;   // 寬限期使用率
    rescueRate: number;       // 救援率
    failureRate: number;      // 完全失敗率
    avgQuality: number;       // 平均品質
    userSatisfaction: number; // 用戶滿意度
}
```

## 總結

這個改進方案平衡了：
- ✅ **用戶體驗**：多重保護機制
- ✅ **公平性**：漸進式懲罰而非cliff
- ✅ **防撞庫**：累進成本 + 信譽系統
- ✅ **技術容錯**：多層備份和救援機制
- ✅ **經濟平衡**：部分退款降低損失

建議先在測試網試行，收集數據後微調參數。
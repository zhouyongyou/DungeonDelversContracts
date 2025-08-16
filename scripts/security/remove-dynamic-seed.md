# 🔒 移除動態種子 - 安全性改進

## 🚨 安全問題

在 Commit-Reveal 機制下，動態種子成為安全隱患：

1. **可預測性攻擊**：科學家可以模擬交易預測種子變化
2. **搶跑攻擊**：攻擊者可以在用戶揭示前操縱種子
3. **MEV 操縱**：機器人可以重排交易影響隨機結果

## 🔧 需要移除的代碼

### Hero.sol
```solidity
// 移除建構函數中的初始化
// dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.chainid)));

// 移除 _revealHero 中的更新
// dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, pseudoRandom, power)));
// emit DynamicSeedUpdated(dynamicSeed);

// 移除 _revealHeroForced 中的更新
// dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, _tokenId, power)));
// emit DynamicSeedUpdated(dynamicSeed);
```

### Relic.sol
```solidity
// 移除建構函數中的初始化
// dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.chainid)));

// 移除 _revealRelic 中的更新
// dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, pseudoRandom, uint256(capacity))));
// emit DynamicSeedUpdated(dynamicSeed);

// 移除 _revealRelicForced 中的更新
// dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, _tokenId, capacity)));
// emit DynamicSeedUpdated(dynamicSeed);
```

### AltarOfAscension.sol
```solidity
// 移除建構函數中的初始化
// dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao)));

// 移除升級結果中的更新
// dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, randomValue, outcome)));
// emit DynamicSeedUpdated(dynamicSeed);

// 移除強制升級中的更新
// dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, block.timestamp, outcome)));
// emit DynamicSeedUpdated(dynamicSeed);
```

### DungeonMaster.sol
```solidity
// 移除建構函數中的初始化
// dynamicSeed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));

// 移除探險結果中的更新
// dynamicSeed = uint256(keccak256(abi.encodePacked(dynamicSeed, _blockHash)));
// emit DynamicSeedUpdated(dynamicSeed);
```

## 🎯 新的隨機性策略

**Commit-Reveal 提供的隨機性**已經足夠安全：
```solidity
// commit 時鎖定的隨機性
bytes32 blockHash = blockhash(commitment.blockNumber + REVEAL_BLOCK_DELAY);
uint256 pseudoRandom = uint256(keccak256(abi.encodePacked(
    blockHash,
    user,
    commitment.quantity,
    _salt
)));
```

## ✅ 安全優勢

1. **無法預測**：commit 時的區塊雜湊無法提前知道
2. **無法操縱**：reveal 時結果已確定
3. **無依賴性**：每次鑄造完全獨立
4. **去中心化**：依靠區塊鏈本身的隨機性

## 📋 行動計劃

1. **移除所有動態種子更新**
2. **保留 dynamicSeed 變量**（避免存儲槽變化）
3. **移除 DynamicSeedUpdated 事件發射**
4. **保留 updateDynamicSeed 函數**（管理員工具）
5. **更新測試案例**

## 🚀 部署注意事項

- **升級友好**：只是停止使用，不改變存儲布局
- **向後兼容**：現有合約介面不變
- **Gas 優化**：減少不必要的雜湊計算和事件發射
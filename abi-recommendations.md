# V25 ABI 配置建議

## 必需的 ABI

### 1. SOULSHARD (完整 ABI)
```json
// 已提供的完整 ABI，包含自定義功能：
- MODE_* 常數（轉帳控制）
- _mode() 查詢
- setMode() 管理
```

### 2. USD1 (簡化 ERC20 ABI)
```json
// 代理合約的實際實現 ABI，包含：
- 標準 ERC20 功能
- freeze/unfreeze 功能
- pause/unpause 功能
- 管理員功能
```

## 可選的 ABI

### 3. PancakeV3Pool (僅用於高級功能)
```json
// 提供的 Pool ABI，主要用於：
- observe() - 歷史價格查詢
- token0/token1() - 池子代幣信息
- slot0() - 當前價格信息
```

## 配置優先級

1. **高優先級**：SOULSHARD（用戶直接交互）
2. **中優先級**：USD1（管理功能需要）
3. **低優先級**：PancakeV3Pool（僅分析工具需要）

## 實施建議

- 先確保 SOULSHARD ABI 完整正確
- USD1 使用提供的代理實現 ABI
- PancakeV3Pool 可暫時保持空數組，不影響核心功能
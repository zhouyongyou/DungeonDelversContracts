# ERC-4906 元數據更新事件升級說明

## 升級背景

**問題**：NFT 市場（如 OKX）在 VRF 揭示完成後無法及時刷新元數據，因為缺少標準的元數據更新事件通知。

**解決方案**：添加 ERC-4906 `MetadataUpdate` 和 `BatchMetadataUpdate` 事件，讓 NFT 市場能夠自動檢測到元數據變更。

## 最小化改動

### 1. Hero 合約升級（Hero_with_ERC4906.sol）

**新增內容：**
```solidity
import "@openzeppelin/contracts/interfaces/IERC4906.sol"; // 新增
contract Hero is ERC721, Ownable, ReentrancyGuard, Pausable, IVRFCallback, IERC4906 { // 新增 IERC4906

// 新增 ERC-4906 支持
function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
    return interfaceId == bytes4(0x49064906) || super.supportsInterface(interfaceId);
}
```

**修改的函數：**
1. `_processHeroMintWithVRF()` - 添加 `emit MetadataUpdate(tokenId)`
2. `_mintHero()` - 添加 `emit MetadataUpdate(tokenId)`
3. 批量處理完成後添加 `emit BatchMetadataUpdate(from, to)`

### 2. Relic 合約升級（Relic_with_ERC4906.sol）

**相同的改動模式：**
- 添加 IERC4906 接口
- 在 VRF 完成後觸發 MetadataUpdate 事件
- 支持批量更新事件

## 升級效果

### ✅ 優點
1. **自動緩存刷新**：NFT 市場會立即檢測到元數據變更
2. **標準兼容**：符合 ERC-4906 標準，提高互操作性
3. **最小改動**：只添加事件，不改變核心邏輯
4. **向後兼容**：不影響現有功能

### ⚠️ 注意事項
1. **需要重新部署**：這是合約升級，需要新的合約地址
2. **Gas 成本略增**：每次揭示會額外觸發事件（成本很小）
3. **測試驗證**：需要在測試網驗證事件正確觸發

## 部署建議

### 階段 1：測試網驗證
1. 在 BSC 測試網部署升級版合約
2. 測試 VRF 揭示流程
3. 驗證事件正確觸發

### 階段 2：主網升級
1. 選擇合適時機（低活躍度時段）
2. 部署新合約
3. 更新前端合約地址
4. 更新子圖配置

### 階段 3：驗證效果
1. 測試新鑄造的 NFT
2. 確認 NFT 市場能夠及時更新
3. 監控 Gas 消耗變化

## 文件位置

```
/contracts/upgrades/
├── Hero_with_ERC4906.sol      # 升級版 Hero 合約
├── Relic_with_ERC4906.sol     # 升級版 Relic 合約  
└── UPGRADE_ERC4906.md         # 本升級說明
```

## ERC-4906 事件說明

```solidity
// 單個 NFT 元數據更新
event MetadataUpdate(uint256 _tokenId);

// 批量 NFT 元數據更新
event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);
```

這些事件會被 NFT 市場的索引器監聽，一旦檢測到就會自動刷新對應 NFT 的元數據緩存。

---

**總結**：這個升級解決了 OKX 等 NFT 市場的元數據緩存問題，使用最小化改動實現最大化效果。
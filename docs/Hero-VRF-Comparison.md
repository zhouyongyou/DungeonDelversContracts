# Hero.sol vs HeroWithVRF.sol 對比分析

## 📋 主要差異總覽

| 功能 | Hero.sol (原版) | HeroWithVRF.sol (VRF版) |
|------|----------------|-------------------------|
| 隨機數生成 | 僅偽隨機 | 智能選擇 VRF/偽隨機 |
| 安全性 | 中等（可預測風險） | 高（真隨機保證） |
| 成本 | ~$0.50/次 | ~$0.605/次 (+$0.105 VRF) |
| 響應時間 | 立即 | VRF: 30-60秒，偽隨機: 立即 |
| 依賴項 | 無額外依賴 | 需要 API3 協議 |

## 🔍 詳細代碼差異

### 1. 新增依賴項

**HeroWithVRF.sol 新增：**
```solidity
// ★ 新增：API3 VRF 依賴
import "@api3/airnode-protocol/contracts/rrp/requesters/RrpRequesterV0.sol";

contract HeroWithVRF is ERC721, Ownable, ReentrancyGuard, Pausable, RrpRequesterV0 {
```

**Hero.sol：**
```solidity
contract Hero is ERC721, Ownable, ReentrancyGuard, Pausable {
```

### 2. 新增狀態變數

**HeroWithVRF.sol 新增：**
```solidity
// ★ 新增：API3 VRF 配置
address public airnode;
bytes32 public endpointIdUint256;
address public sponsorWallet;

// ★ 新增：VRF 請求追蹤
struct PendingMint {
    address recipient;
    uint256 quantity;
    uint8 maxRarity;
    uint256 timestamp;
    bool fulfilled;
    bool useVRF; // 標記是否使用 VRF
}

mapping(bytes32 => PendingMint) public pendingMints;
mapping(bytes32 => bool) public requestIdToWaiting;

// ★ 新增：VRF 配置
uint256 public vrfThreshold = 10; // 超過此數量自動使用 VRF
bool public vrfEnabled = true;    // VRF 功能開關
```

**Hero.sol：**
```solidity
// 沒有這些變數
```

### 3. 構造函數差異

**HeroWithVRF.sol：**
```solidity
constructor(
    address initialOwner,
    address _airnodeRrp,        // ★ 新增
    address _airnode,           // ★ 新增
    bytes32 _endpointIdUint256, // ★ 新增
    address _sponsorWallet      // ★ 新增
) ERC721("Dungeon Delvers Hero", "DDH") 
  Ownable(initialOwner) 
  RrpRequesterV0(_airnodeRrp) { // ★ 新增

    // ★ API3 VRF 設定
    airnode = _airnode;
    endpointIdUint256 = _endpointIdUint256;
    sponsorWallet = _sponsorWallet;
```

**Hero.sol：**
```solidity
constructor(
    address initialOwner
) ERC721("Dungeon Delvers Hero", "DDH") Ownable(initialOwner) {
```

### 4. 鑄造函數升級

**HeroWithVRF.sol - 智能選擇：**
```solidity
function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
    // ... 驗證邏輯相同 ...
    
    // ★ 智能選擇：高價值包使用 VRF，低價值包使用偽隨機
    if (vrfEnabled && _quantity >= vrfThreshold) {
        _requestVRFMint(msg.sender, _quantity, maxRarity);
    } else {
        _executePseudoRandomMint(msg.sender, _quantity, maxRarity);
    }
}
```

**Hero.sol - 僅偽隨機：**
```solidity
function mintFromWallet(uint256 _quantity) external payable nonReentrant whenNotPaused {
    // ... 驗證邏輯相同 ...
    
    uint256[] memory tokenIds = new uint256[](_quantity);
    for (uint256 i = 0; i < _quantity; i++) {
        tokenIds[i] = _generateAndMintOnChain(msg.sender, i, maxRarity);
    }
    
    emit BatchMintCompleted(msg.sender, _quantity, maxRarity, tokenIds);
}
```

### 5. 新增 VRF 相關函數

**HeroWithVRF.sol 新增的核心函數：**

```solidity
// 1. 強制使用 VRF
function mintFromWalletWithVRF(uint256 _quantity) external payable

// 2. 強制使用偽隨機（緊急備用）
function mintFromWalletInstant(uint256 _quantity) external payable

// 3. VRF 請求處理
function _requestVRFMint(address recipient, uint256 quantity, uint8 maxRarity) private

// 4. VRF 回調
function fulfillUint256(bytes32 requestId, bytes calldata data) external

// 5. VRF 鑄造執行
function _executeVRFMint(bytes32 requestId, uint256 baseRandomness) private

// 6. 取消過期請求
function cancelExpiredRequest(bytes32 requestId) external

// 7. 查詢待處理請求
function getPendingMint(bytes32 requestId) external view returns (...)

// 8. 緊急鑄造
function emergencyMint(address recipient, uint256 quantity, uint8 maxRarity) external onlyOwner
```

**Hero.sol：**
```solidity
// 沒有這些函數
```

### 6. 管理函數新增

**HeroWithVRF.sol 新增：**
```solidity
// VRF 配置管理
function setVRFConfig(address _airnode, bytes32 _endpointIdUint256, address _sponsorWallet) external onlyOwner

// VRF 閾值設定
function setVRFThreshold(uint256 _threshold) external onlyOwner

// VRF 開關
function setVRFEnabled(bool _enabled) external onlyOwner
```

### 7. 查詢函數升級

**HeroWithVRF.sol - 增強版：**
```solidity
function getBatchTierInfo(uint256 _quantity) external view returns (
    uint8 maxRarity,
    string memory tierName,
    uint256 exactTierQuantity,
    uint256 totalCost,
    bool willUseVRF  // ★ 新增：告訴用戶是否使用 VRF
) {
    // ... 原有邏輯 ...
    willUseVRF = vrfEnabled && _quantity >= vrfThreshold;
}
```

**Hero.sol - 原版：**
```solidity
function getBatchTierInfo(uint256 _quantity) external view returns (
    uint8 maxRarity,
    string memory tierName,
    uint256 exactTierQuantity,
    uint256 totalCost
    // 沒有 willUseVRF
) {
```

### 8. 新增事件

**HeroWithVRF.sol 新增：**
```solidity
event RandomnessRequested(bytes32 indexed requestId, address indexed sender, uint256 quantity);
event RandomnessFulfilled(bytes32 indexed requestId, uint256 randomness);
event BatchMintPending(address indexed player, bytes32 indexed requestId, uint256 quantity, uint8 maxRarity);
event VRFConfigUpdated(address airnode, bytes32 endpointId, address sponsorWallet);
event VRFThresholdUpdated(uint256 newThreshold);
```

## 🚀 使用場景對比

### Hero.sol（原版）適用於：
- ✅ 測試環境
- ✅ 低價值 NFT（< $10）
- ✅ 對響應時間要求極高的場景
- ✅ 成本極度敏感的項目

### HeroWithVRF.sol（VRF版）適用於：
- ✅ 生產環境
- ✅ 高價值 NFT（> $50）
- ✅ 需要用戶信任的場景
- ✅ 長期運營的項目
- ✅ 需要可證明公平性的遊戲

## 📊 成本分析

| 場景 | Hero.sol 成本 | HeroWithVRF.sol 成本 | 差異 |
|------|-------------|-------------------|------|
| 1個 NFT | $0.50 | $0.50（偽隨機）| $0 |
| 5個 NFT | $2.50 | $2.50（偽隨機）| $0 |
| 10個 NFT | $5.00 | $5.605（VRF）| +$0.605 |
| 20個 NFT | $10.00 | $10.105（VRF）| +$0.105 |
| 50個 NFT | $25.00 | $25.105（VRF）| +$0.105 |

## 🔄 遷移建議

### 階段 1：測試部署
```bash
# 部署到測試網
npx hardhat run scripts/deploy-hero-vrf.js --network bsctestnet

# 設定 VRF 閾值為 5（測試用）
npx hardhat run scripts/setup-vrf-config.js --network bsctestnet
```

### 階段 2：生產部署
```bash
# 部署到主網
npx hardhat run scripts/deploy-hero-vrf.js --network bsc

# 設定 VRF 閾值為 10（生產環境）
# 設定 API3 配置
```

### 階段 3：前端整合
```typescript
// 檢查是否使用 VRF
const { willUseVRF } = await heroContract.getBatchTierInfo(quantity);

if (willUseVRF) {
    // 顯示 VRF 等待提示
    showVRFPendingUI();
} else {
    // 立即顯示結果
    showInstantResult();
}
```

## 🎯 總結

**HeroWithVRF.sol 提供了向後兼容的升級路徑：**
- 保持所有原有功能
- 新增 VRF 安全性選項
- 智能成本控制
- 靈活的配置選項

**建議立即開始使用 HeroWithVRF.sol 進行測試，驗證 VRF 集成後部署到生產環境。**
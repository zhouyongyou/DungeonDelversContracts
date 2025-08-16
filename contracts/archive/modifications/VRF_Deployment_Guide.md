# VRF 系統部署指南

## 問題回答：VRFManager 只需要部署一次嗎？

**是的！** VRFManager 是**單例合約**，整個系統只需要部署一次。所有 NFT 合約（Hero、Relic、AltarOfAscension、DungeonMaster）都會連接到同一個 VRFManager 實例。

## 部署順序

### 1. 部署 VRFManager（只部署一次）
```javascript
// scripts/deploy-vrf.js
const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying VRFManager...");
    
    // BSC Mainnet VRF Coordinator
    const VRF_COORDINATOR = "0x9e1b9d9d867bbC5e1FEE8E64e8b3E41d9d9B9F9F"; // 更新為正確地址
    
    const VRFManager = await ethers.getContractFactory("VRFManagerV2");
    const vrfManager = await VRFManager.deploy(VRF_COORDINATOR);
    
    await vrfManager.waitForDeployment();
    const vrfManagerAddress = await vrfManager.getAddress();
    
    console.log("VRFManager deployed to:", vrfManagerAddress);
    
    // 驗證合約
    console.log("Verifying contract...");
    await run("verify:verify", {
        address: vrfManagerAddress,
        constructorArguments: [VRF_COORDINATOR]
    });
    
    return vrfManagerAddress;
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = main;
```

### 2. 更新現有合約（逐個進行）

#### 選項 A：原地升級（推薦）
使用最小改動方案，直接修改現有合約：

```javascript
// scripts/upgrade-to-vrf.js
const { ethers } = require("hardhat");

async function upgradeHeroToVRF() {
    const VRF_MANAGER_ADDRESS = "0x..."; // 步驟1得到的地址
    const HERO_ADDRESS = "0x5d71d62fAFd07C92ec677C3Ae57984576f5955f0";
    
    const hero = await ethers.getContractAt("Hero", HERO_ADDRESS);
    
    // 1. 設定 VRFManager
    console.log("Setting VRFManager for Hero...");
    await hero.setVRFManager(VRF_MANAGER_ADDRESS);
    
    // 2. 授權 Hero 合約
    const vrfManager = await ethers.getContractAt("VRFManagerV2", VRF_MANAGER_ADDRESS);
    await vrfManager.authorizeContract(HERO_ADDRESS);
    
    console.log("Hero upgraded to use VRF!");
}

async function upgradeRelicToVRF() {
    // 同樣流程
    const VRF_MANAGER_ADDRESS = "0x...";
    const RELIC_ADDRESS = "0x5f93fCdb2ecd1A0eB758E554bfeB3A2B95581366";
    
    const relic = await ethers.getContractAt("Relic", RELIC_ADDRESS);
    await relic.setVRFManager(VRF_MANAGER_ADDRESS);
    
    const vrfManager = await ethers.getContractAt("VRFManagerV2", VRF_MANAGER_ADDRESS);
    await vrfManager.authorizeContract(RELIC_ADDRESS);
    
    console.log("Relic upgraded to use VRF!");
}

// 同樣的邏輯應用到 AltarOfAscension 和 DungeonMaster
```

#### 選項 B：全新部署
如果需要部署全新的 VRF 版本：

```javascript
// scripts/deploy-vrf-versions.js
async function deployVRFVersions() {
    const VRF_MANAGER_ADDRESS = "0x..."; // 步驟1得到的地址
    
    // 部署 HeroVRF
    const HeroVRF = await ethers.getContractFactory("HeroVRF");
    const heroVRF = await HeroVRF.deploy(
        "DungeonDelvers Hero VRF",
        "DDHVRF",
        "0x9e1b9d9d867bbC5e1FEE8E64e8b3E41d9d9B9F9F" // VRF Coordinator
    );
    
    console.log("HeroVRF deployed to:", await heroVRF.getAddress());
    
    // 部署 RelicVRF
    const RelicVRF = await ethers.getContractFactory("RelicVRF");
    const relicVRF = await RelicVRF.deploy(
        "DungeonDelvers Relic VRF",
        "DDRVRF",
        "0x9e1b9d9d867bbC5e1FEE8E64e8b3E41d9d9B9F9F"
    );
    
    console.log("RelicVRF deployed to:", await relicVRF.getAddress());
    
    // 授權所有合約
    const vrfManager = await ethers.getContractAt("VRFManagerV2", VRF_MANAGER_ADDRESS);
    await vrfManager.authorizeContract(await heroVRF.getAddress());
    await vrfManager.authorizeContract(await relicVRF.getAddress());
}
```

## 配置管理

### 更新 .env 文件
```bash
# VRF 系統地址
VRF_MANAGER_ADDRESS=0x...
VRF_COORDINATOR_ADDRESS=0x9e1b9d9d867bbC5e1FEE8E64e8b3E41d9d9B9F9F

# 如果使用新版本
HERO_VRF_ADDRESS=0x...
RELIC_VRF_ADDRESS=0x...
```

### VRF 配置參數
```javascript
// BSC Mainnet 配置
const VRF_CONFIG = {
    keyHash: "0xba6e730de88d94a5510ae6613898bfb0c3de5d16e609c5b7da808747125506f7",
    callbackGasLimit: 500000,
    requestConfirmations: 3,
    vrfRequestPrice: ethers.parseEther("0.005")
};
```

## 費用說明

### VRF 使用費用
- **每次請求**: ~0.005 BNB (~$1.5)
- **誰支付**: 用戶在鑄造/升級/探索時額外支付
- **退款機制**: 多餘費用自動退還

### 用戶體驗變化
```javascript
// 之前：鑄造 10 個英雄
const oldPrice = mintPrice + platformFee; // 例如 0.01 BNB

// 現在：鑄造 10 個英雄（使用 VRF）
const newPrice = mintPrice + platformFee + vrfFee; // 例如 0.015 BNB
```

## 測試流程

### 1. 測試網測試
```bash
# 部署到 BSC 測試網
npx hardhat run scripts/deploy-vrf.js --network bscTestnet

# 測試鑄造
npx hardhat run scripts/test-vrf-mint.js --network bscTestnet
```

### 2. 監控 VRF 回調
```javascript
// 監聽 VRF 事件
vrfManager.on("VRFRequested", (requestId, contract, user, quantity) => {
    console.log(`VRF Requested: ${requestId} for ${user}`);
});

vrfManager.on("VRFFulfilled", (requestId, contract, user, randomWords) => {
    console.log(`VRF Fulfilled: ${requestId} with ${randomWords.length} random words`);
});
```

## 風險管控

### 1. 緊急備用機制
- VRF 失敗 > 1 小時自動降級到區塊哈希
- 管理員可手動切換回傳統模式
- 所有改動都向後兼容

### 2. 漸進式遷移
```javascript
// 階段1：只有新用戶使用 VRF
if (isNewUser(msg.sender)) {
    useVRF = true;
}

// 階段2：全面啟用 VRF
useVRF = (vrfManager != address(0));
```

## 總結

✅ **VRFManager 只部署一次**  
✅ **所有合約共享同一個 VRFManager**  
✅ **最小改動，完全向後兼容**  
✅ **可隨時開關 VRF 功能**  
✅ **用戶只需支付小額 VRF 費用**

這個方案讓你能夠：
1. 最小風險升級現有系統
2. 保持所有功能完整性
3. 提供真正公平的隨機性
4. 隨時可以回滾到原始模式
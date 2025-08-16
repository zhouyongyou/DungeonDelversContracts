# 🏪 DungeonDelvers 市場合約操作指南

## 📋 概述

DungeonDelvers P2P Marketplace 是一個支援多幣種的 NFT 市場系統，包含兩個主要合約：
- **DungeonMarketplaceV2**: 主要的 NFT 交易市場
- **OfferSystemV2**: 出價與議價系統

## 🔧 合約地址 (BSC Mainnet)

```javascript
const MARKETPLACE_V2 = "0xCd2Dc43ddB5f628f98CDAA273bd74605cBDF21F8";
const OFFER_SYSTEM_V2 = "0xE072DC1Ea6243aEaD9c794aFe2585A8b6A5350EF";
```

## 💰 支援的代幣

### 生產環境
- **USDT**: `0x55d398326f99059fF775485246999027B3197955`
- **BUSD**: `0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56`
- **SoulShard**: `0x8D0d000EE44948fc98C9B98A4fA4921476F08B0D`

### 測試環境
- **TUSD1**: `0x7C67Af4EBC6651c95dF78De11cfe325660d935FE`

## 🎯 管理員功能

### 1. 支付代幣管理

#### 添加支付代幣
```javascript
// 添加 TUSD1 作為支付代幣
await marketplaceV2.addPaymentToken("0x7C67Af4EBC6651c95dF78De11cfe325660d935FE");

// 事件: PaymentTokenAdded(address token)
```

#### 移除支付代幣
```javascript
await marketplaceV2.removePaymentToken("0x7C67Af4EBC6651c95dF78De11cfe325660d935FE");

// 事件: PaymentTokenRemoved(address token)
```

#### 查詢支援的代幣
```javascript
const supportedTokens = await marketplaceV2.getSupportedTokens();
console.log("Supported tokens:", supportedTokens);
```

### 2. NFT 合約管理

#### 批准 NFT 合約
```javascript
// 批准 Hero 合約
await marketplaceV2.approveNFTContract("0x162b0b673f38C11732b0bc0B4B026304e563e8e2");

// 批准 Relic 合約
await marketplaceV2.approveNFTContract("0x15c2454A31Abc0063ef4a71d0640057d71847a22");

// 事件: NFTContractApproved(address nftContract)
```

#### 撤銷 NFT 合約
```javascript
await marketplaceV2.revokeNFTContract("0x合約地址");

// 事件: NFTContractRevoked(address nftContract)
```

### 3. 手續費管理

#### 設定平台手續費
```javascript
// 設定 2.5% 手續費 (250 basis points)
await marketplaceV2.setPlatformFee(250);

// 最大值: 1000 (10%)
// 事件: PlatformFeeUpdated(uint256 oldFee, uint256 newFee)
```

#### 設定手續費接收地址
```javascript
await marketplaceV2.setFeeRecipient("0x10925A7138649C7E1794CE646182eeb5BF8ba647");

// 事件: FeeRecipientUpdated(address oldRecipient, address newRecipient)
```

## 🛠️ 測試環境設置腳本

### 初始化測試環境
```javascript
// scripts/setup-test-marketplace.js
const { ethers } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();
    
    // 合約實例
    const marketplaceV2 = await ethers.getContractAt(
        "DungeonMarketplaceV2", 
        "0xCd2Dc43ddB5f628f98CDAA273bd74605cBDF21F8"
    );
    
    const offerSystemV2 = await ethers.getContractAt(
        "OfferSystemV2", 
        "0xE072DC1Ea6243aEaD9c794aFe2585A8b6A5350EF"
    );
    
    console.log("🚀 設置測試環境...");
    
    // 1. 添加測試代幣 TUSD1
    console.log("📝 添加 TUSD1 代幣...");
    const tusd1Address = "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE";
    
    try {
        const tx1 = await marketplaceV2.addPaymentToken(tusd1Address);
        await tx1.wait();
        console.log("✅ TUSD1 已添加到 Marketplace");
        
        const tx2 = await offerSystemV2.addPaymentToken(tusd1Address);
        await tx2.wait();
        console.log("✅ TUSD1 已添加到 OfferSystem");
    } catch (error) {
        console.log("⚠️ TUSD1 可能已存在:", error.message);
    }
    
    // 2. 批准 NFT 合約
    console.log("📝 批准 NFT 合約...");
    const nftContracts = {
        hero: "0x162b0b673f38C11732b0bc0B4B026304e563e8e2",
        relic: "0x15c2454A31Abc0063ef4a71d0640057d71847a22",
        party: "0xab07E90d44c34FB62313C74F3C7b4b343E52a253"
    };
    
    for (const [name, address] of Object.entries(nftContracts)) {
        try {
            const tx1 = await marketplaceV2.approveNFTContract(address);
            await tx1.wait();
            console.log(\`✅ \${name.toUpperCase()} 合約已批准 (Marketplace)\`);
            
            const tx2 = await offerSystemV2.approveNFTContract(address);
            await tx2.wait();
            console.log(\`✅ \${name.toUpperCase()} 合約已批准 (OfferSystem)\`);
        } catch (error) {
            console.log(\`⚠️ \${name.toUpperCase()} 可能已批准:\`, error.message);
        }
    }
    
    // 3. 檢查當前配置
    console.log("\\n📊 當前配置:");
    const supportedTokens = await marketplaceV2.getSupportedTokens();
    console.log("支援的代幣:", supportedTokens);
    
    const platformFee = await marketplaceV2.platformFee();
    console.log("平台手續費:", platformFee.toString(), "basis points");
    
    const feeRecipient = await marketplaceV2.feeRecipient();
    console.log("手續費接收地址:", feeRecipient);
    
    console.log("\\n🎉 測試環境設置完成！");
}

main().catch(console.error);
```

### 運行設置腳本
```bash
# 在 DungeonDelversContracts 目錄下
npx hardhat run scripts/setup-test-marketplace.js --network bsc
```

## 📊 查詢合約狀態

### 檢查支援的代幣
```javascript
const supportedTokens = await marketplaceV2.getSupportedTokens();
const isSupported = await marketplaceV2.supportedTokens("0x7C67Af4EBC6651c95dF78De11cfe325660d935FE");
```

### 檢查 NFT 合約狀態
```javascript
const isApproved = await marketplaceV2.approvedNFTContracts("0x162b0b673f38C11732b0bc0B4B026304e563e8e2");
```

### 查詢當前設定
```javascript
const platformFee = await marketplaceV2.platformFee();
const feeRecipient = await marketplaceV2.feeRecipient();
const currentListingId = await marketplaceV2.getCurrentListingId();
```

## 🔍 Subgraph 查詢範例

### 查詢支援的代幣
```graphql
{
  tokenSupports(where: { isSupported: true }) {
    id
    tokenAddress
    isSupported
    addedAt
    updatedAt
  }
}
```

### 查詢市場統計
```graphql
{
  marketStatsV2(id: "global") {
    totalListings
    activeListings
    totalSales
    totalVolume
    platformFeesCollected
  }
}
```

## 🎮 用戶功能範例

### 創建列表
```javascript
// 用戶需要先批准 NFT
await heroContract.approve(marketplaceV2.address, tokenId);

// 創建列表
await marketplaceV2.createListing(
    0, // NFTType.HERO
    heroContract.address,
    tokenId,
    ethers.utils.parseEther("100"), // 100 USD
    [tusd1Address, usdtAddress] // 接受的代幣
);
```

### 購買 NFT
```javascript
// 用戶需要先批准代幣
await tusd1Contract.approve(marketplaceV2.address, price);

// 購買
await marketplaceV2.purchaseNFT(listingId, tusd1Address);
```

## 🚨 安全注意事項

1. **只有合約 Owner 可以執行管理功能**
2. **添加代幣前請確認代幣合約的安全性**
3. **平台手續費不能超過 10% (1000 basis points)**
4. **建議在測試網先測試所有功能**

## 📝 相關文件

- **合約源碼**: `/contracts/current/marketplace/`
- **部署腳本**: `/marketplace/deploy/`
- **Subgraph**: `/marketplace/subgraph-v2/`
- **測試腳本**: `/test/marketplace/`

## 🔗 有用連結

- **The Graph Studio**: https://thegraph.com/studio/subgraph/dungeondelvers-p2p-marketplace
- **查詢端點**: https://api.studio.thegraph.com/query/115633/dungeondelvers-p2p-marketplace/v0.0.1
- **BSCScan**: https://bscscan.com/address/0xCd2Dc43ddB5f628f98CDAA273bd74605cBDF21F8
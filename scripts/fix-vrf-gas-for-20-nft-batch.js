// 修復 20 個 NFT 批次的 VRF Gas 不足問題
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🔧 修復 VRF Gas 限制，解決 20 NFT 批次失敗問題");
    console.log("部署者地址:", deployer.address);
    
    // VRF Consumer 地址
    const VRF_CONSUMER_ADDRESS = "0x90Ec740CEe2C8fbd012fEb050a602E9de208A9c0";
    
    console.log("\n📊 當前問題分析:");
    console.log("20 NFT 計算公式: 309900 + (20 * 43801) = 1,185,920 gas");
    console.log("實際交易 Gas 使用: 1,288,905 gas");
    console.log("差額: 102,985 gas (8.7% 不足)");
    
    // 計算新的公式
    console.log("\n🧮 重新計算安全公式:");
    
    // 基於實際失敗案例反推
    const actualUsage20NFT = 1288905;  // 實際使用的 gas
    const safetyBuffer = 150000;       // 15萬安全緩衝
    const needed20NFT = actualUsage20NFT + safetyBuffer;
    console.log("20 NFT 實際需要:", needed20NFT, "gas");
    
    // 反推公式：假設線性關係 baseCost + quantity * perNFTCost
    // 1 NFT 大概需要: baseCost + 1 * perNFTCost
    // 20 NFT 需要: baseCost + 20 * perNFTCost = 1,438,905
    
    // 假設 1 NFT 需要約 80,000 gas
    const estimatedPerNFT = 68000;  // 每個 NFT 的 gas 成本
    const estimatedBaseCost = needed20NFT - (20 * estimatedPerNFT);
    
    console.log("預估固定成本:", estimatedBaseCost);
    console.log("預估每 NFT 成本:", estimatedPerNFT);
    
    // 驗證公式
    const formula1NFT = estimatedBaseCost + (1 * estimatedPerNFT);
    const formula10NFT = estimatedBaseCost + (10 * estimatedPerNFT);
    const formula20NFT = estimatedBaseCost + (20 * estimatedPerNFT);
    const formula50NFT = estimatedBaseCost + (50 * estimatedPerNFT);
    
    console.log("\n📋 新公式驗證:");
    console.log("1 NFT:", formula1NFT, "gas");
    console.log("10 NFT:", formula10NFT, "gas");
    console.log("20 NFT:", formula20NFT, "gas");
    console.log("50 NFT:", formula50NFT, "gas");
    
    if (formula50NFT > 2500000) {
        console.log("❌ 50 NFT 超過 2.5M 限制!");
        
        // 調整公式以確保 50 NFT 不超限
        const maxFor50NFT = 2500000;
        const adjustedPerNFT = Math.floor((maxFor50NFT - estimatedBaseCost) / 50);
        const adjustedBaseCost = estimatedBaseCost;
        
        console.log("\n🔧 調整後公式:");
        console.log("固定成本:", adjustedBaseCost);
        console.log("每 NFT 成本:", adjustedPerNFT);
        
        const adj1NFT = adjustedBaseCost + (1 * adjustedPerNFT);
        const adj10NFT = adjustedBaseCost + (10 * adjustedPerNFT);
        const adj20NFT = adjustedBaseCost + (20 * adjustedPerNFT);
        const adj50NFT = adjustedBaseCost + (50 * adjustedPerNFT);
        
        console.log("調整後 1 NFT:", adj1NFT, "gas");
        console.log("調整後 10 NFT:", adj10NFT, "gas");
        console.log("調整後 20 NFT:", adj20NFT, "gas");
        console.log("調整後 50 NFT:", adj50NFT, "gas");
        
        console.log("\n🎯 建議的 Solidity 公式:");
        console.log(`uint32 dynamicGas = uint32(${adjustedBaseCost} + quantity * ${adjustedPerNFT});`);
        
        // 檢查是否需要部署新版本
        const vrfContract = await ethers.getContractAt("VRFConsumerV2Plus", VRF_CONSUMER_ADDRESS);
        
        try {
            const currentGasFor20 = await vrfContract.calculateDynamicGasLimit(
                "0x428486A4860E54e5ACAFEfdD07FF8E23E18877Cc", // Hero 地址
                20
            );
            
            console.log("\n📊 當前合約狀態:");
            console.log("當前 20 NFT Gas:", currentGasFor20.toString());
            console.log("需要的 20 NFT Gas:", adj20NFT);
            console.log("差距:", adj20NFT - parseInt(currentGasFor20.toString()));
            
            if (adj20NFT > parseInt(currentGasFor20.toString())) {
                console.log("\n🚨 需要更新合約中的公式!");
                console.log("建議操作:");
                console.log("1. 修改 VRFConsumerV2Plus.sol 第 141 行");
                console.log(`   改為: uint32 dynamicGas = uint32(${adjustedBaseCost} + quantity * ${adjustedPerNFT});`);
                console.log("2. 重新部署 VRF 合約");
                console.log("3. 更新 DungeonCore 中的 VRF 地址");
            } else {
                console.log("✅ 當前公式已足夠");
            }
            
        } catch (error) {
            console.log("⚠️ 無法查詢當前合約狀態:", error.message);
        }
    }
    
    console.log("\n💡 臨時解決方案:");
    console.log("如果不想重新部署，可以:");
    console.log("1. 限制每次最多鑄造 15 個 NFT");
    console.log("2. 或者調整固定 gas 限制為 1,500,000");
    
    console.log("\n🔧 永久解決方案:");
    console.log("更新動態公式以確保 20 NFT 批次成功");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
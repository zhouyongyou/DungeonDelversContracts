const hre = require("hardhat");

async function main() {
    console.log("🚀 部署優化的 VRFConsumerV2Plus...");
    
    // BSC 主網配置
    const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
    const SUBSCRIPTION_ID = "114131353280130458891383141995968474440293173552039681622016393393251650814328";
    
    // 部署合約
    const VRFConsumerV2Plus = await hre.ethers.getContractFactory("VRFConsumerV2Plus_Optimized");
    const vrfConsumer = await VRFConsumerV2Plus.deploy(
        SUBSCRIPTION_ID,
        VRF_COORDINATOR
    );
    
    await vrfConsumer.deployed();
    console.log("✅ VRFConsumerV2Plus_Optimized 部署於:", vrfConsumer.address);
    
    // 等待確認
    console.log("⏳ 等待區塊確認...");
    await vrfConsumer.deployTransaction.wait(5);
    
    // 驗證合約
    console.log("🔍 驗證合約...");
    try {
        await hre.run("verify:verify", {
            address: vrfConsumer.address,
            constructorArguments: [
                SUBSCRIPTION_ID,
                VRF_COORDINATOR
            ],
        });
        console.log("✅ 合約驗證成功");
    } catch (error) {
        console.log("⚠️ 驗證失敗:", error.message);
    }
    
    // 顯示配置
    console.log("\n📋 合約配置:");
    console.log("- Subscription ID:", await vrfConsumer.s_subscriptionId());
    console.log("- Key Hash:", await vrfConsumer.keyHash());
    console.log("- Callback Gas Limit:", await vrfConsumer.callbackGasLimit());
    console.log("- Request Confirmations:", await vrfConsumer.requestConfirmations());
    
    // 重要：添加到 VRF 訂閱
    console.log("\n⚠️ 重要步驟:");
    console.log("1. 前往 https://vrf.chain.link/bsc/" + SUBSCRIPTION_ID);
    console.log("2. 添加消費者地址:", vrfConsumer.address);
    console.log("3. 確保訂閱有足夠的 LINK 餘額");
    
    // 保存地址
    const fs = require("fs");
    const config = {
        VRFConsumerV2Plus_Optimized: vrfConsumer.address,
        deployedAt: new Date().toISOString(),
        network: "BSC Mainnet",
        subscriptionId: SUBSCRIPTION_ID
    };
    
    fs.writeFileSync(
        "./deployments/vrf-optimized-" + Date.now() + ".json",
        JSON.stringify(config, null, 2)
    );
    
    console.log("\n✅ 部署完成！");
    
    return vrfConsumer.address;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
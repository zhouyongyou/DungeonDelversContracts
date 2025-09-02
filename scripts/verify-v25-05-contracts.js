const hre = require("hardhat");

async function main() {
    console.log("🔍 開始驗證 V25.0.5 合約開源...");
    
    const contracts = {
        HERO: "0x60bdCE3d1412C1aA8F18a58801895Bb0C3D45357",
        RELIC: "0xE80d9c0E6dA24f1C71C3A77E0565abc8bb139817",
        VRF: "0x0497108f4734BbC0381DF82e95A41e1425C53981"
    };
    
    // VRF 構造函數參數
    const vrfConstructorArgs = [
        "88422796721004450630713121079263696788635490871993157345476848872165866246915", // subscriptionId
        "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9" // vrfCoordinator
    ];

    console.log("📄 驗證 HERO 合約...");
    try {
        await hre.run("verify:verify", {
            address: contracts.HERO,
            constructorArguments: [], // 無參數構造函數
            contract: "contracts/current/nft/Hero.sol:Hero"
        });
        console.log("✅ HERO 合約驗證成功!");
    } catch (error) {
        if (error.message.includes("already verified")) {
            console.log("✅ HERO 合約已經驗證過了");
        } else {
            console.error("❌ HERO 合約驗證失敗:", error.message);
        }
    }

    console.log("\n📄 驗證 RELIC 合約...");
    try {
        await hre.run("verify:verify", {
            address: contracts.RELIC,
            constructorArguments: [], // 無參數構造函數
            contract: "contracts/current/nft/Relic.sol:Relic"
        });
        console.log("✅ RELIC 合約驗證成功!");
    } catch (error) {
        if (error.message.includes("already verified")) {
            console.log("✅ RELIC 合約已經驗證過了");
        } else {
            console.error("❌ RELIC 合約驗證失敗:", error.message);
        }
    }

    console.log("\n📄 驗證 VRF 合約...");
    try {
        await hre.run("verify:verify", {
            address: contracts.VRF,
            constructorArguments: vrfConstructorArgs,
            contract: "contracts/current/core/VRFConsumerV2Plus.sol:VRFConsumerV2Plus"
        });
        console.log("✅ VRF 合約驗證成功!");
    } catch (error) {
        if (error.message.includes("already verified")) {
            console.log("✅ VRF 合約已經驗證過了");
        } else {
            console.error("❌ VRF 合約驗證失敗:", error.message);
        }
    }

    console.log("\n🎉 V25.0.5 合約開源驗證完成!");
    
    // 驗證後檢查狀態
    console.log("\n🔍 檢查驗證結果...");
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(5000); // 等待 5 秒讓 BSCScan 更新
    
    console.log(`📊 HERO: https://bscscan.com/address/${contracts.HERO}#code`);
    console.log(`📊 RELIC: https://bscscan.com/address/${contracts.RELIC}#code`);
    console.log(`📊 VRF: https://bscscan.com/address/${contracts.VRF}#code`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
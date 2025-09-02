// 驗證 VRF Manager 合約

const hre = require("hardhat");

async function main() {
    console.log("\n🔧 開始驗證 VRF Manager 合約...");
    console.log("=====================================");
    
    const vrfManagerAddress = "0x0735fb572f1edc26d86f8bb9fd37d015a572544d";
    const vrfSubscriptionId = "88422796721004450630713121079263696788635490871993157345476848872165866246915";
    const vrfCoordinator = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
    
    console.log("\n📋 合約信息：");
    console.log("  地址:", vrfManagerAddress);
    console.log("  訂閱ID:", vrfSubscriptionId);
    console.log("  協調器:", vrfCoordinator);
    
    try {
        console.log("\n⏳ 提交驗證請求到 BSCScan...");
        
        await hre.run("verify:verify", {
            address: vrfManagerAddress,
            constructorArguments: [
                vrfSubscriptionId,
                vrfCoordinator
            ],
            contract: "contracts/current/core/VRFConsumerV2Plus.sol:VRFConsumerV2Plus"
        });
        
        console.log("\n✅ 驗證請求已提交！");
        console.log("📍 查看驗證狀態：");
        console.log(`   https://bscscan.com/address/${vrfManagerAddress}#code`);
        
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("\n✅ 合約已經驗證過了！");
            console.log(`📍 查看：https://bscscan.com/address/${vrfManagerAddress}#code`);
        } else {
            console.error("\n❌ 驗證失敗：", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

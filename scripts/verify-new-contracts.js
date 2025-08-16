const hre = require("hardhat");

async function main() {
    const HERO_ADDRESS = "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d";
    const RELIC_ADDRESS = "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316";
    const ALTAR_ADDRESS = "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1";
    const DEPLOYER_ADDRESS = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";

    console.log("=== 開始驗證合約原始碼 ===");

    try {
        // 驗證 Hero 合約
        console.log("📋 驗證 Hero 合約...");
        await hre.run("verify:verify", {
            address: HERO_ADDRESS,
            constructorArguments: [DEPLOYER_ADDRESS],
            contract: "contracts/current/nft/Hero.sol:Hero"
        });
        console.log("✅ Hero 合約驗證完成");
    } catch (error) {
        console.log("⚠️ Hero 合約驗證失敗:", error.message);
    }

    try {
        // 驗證 Relic 合約  
        console.log("📋 驗證 Relic 合約...");
        await hre.run("verify:verify", {
            address: RELIC_ADDRESS,
            constructorArguments: [DEPLOYER_ADDRESS],
            contract: "contracts/current/nft/Relic.sol:Relic"
        });
        console.log("✅ Relic 合約驗證完成");
    } catch (error) {
        console.log("⚠️ Relic 合約驗證失敗:", error.message);
    }

    try {
        // 驗證 AltarOfAscension 合約
        console.log("📋 驗證 AltarOfAscension 合約...");
        await hre.run("verify:verify", {
            address: ALTAR_ADDRESS,
            constructorArguments: [DEPLOYER_ADDRESS],
            contract: "contracts/current/core/AltarOfAscension.sol:AltarOfAscension"
        });
        console.log("✅ AltarOfAscension 合約驗證完成");
    } catch (error) {
        console.log("⚠️ AltarOfAscension 合約驗證失敗:", error.message);
    }

    console.log("\n=== 驗證完成 ===");
    console.log(`Hero: https://bscscan.com/address/${HERO_ADDRESS}#code`);
    console.log(`Relic: https://bscscan.com/address/${RELIC_ADDRESS}#code`);
    console.log(`AltarOfAscension: https://bscscan.com/address/${ALTAR_ADDRESS}#code`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
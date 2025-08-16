#!/usr/bin/env node

/**
 * 驗證 VRFManager 合約
 */

const hre = require("hardhat");

async function main() {
    const VRFMANAGER_ADDRESS = "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD";
    const VRF_COORDINATOR = "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9";
    
    console.log("🔍 開始驗證 VRFManager 合約...\n");
    console.log("合約地址:", VRFMANAGER_ADDRESS);
    console.log("構造參數: VRF Coordinator =", VRF_COORDINATOR);
    
    try {
        await hre.run("verify:verify", {
            address: VRFMANAGER_ADDRESS,
            constructorArguments: [
                VRF_COORDINATOR
            ],
            contract: "contracts/current/core/VRFManager.sol:VRFManager"
        });
        
        console.log("\n✅ VRFManager 驗證成功！");
        console.log("BSCScan:", `https://bscscan.com/address/${VRFMANAGER_ADDRESS}#code`);
        
    } catch (error) {
        if (error.message.includes("already verified")) {
            console.log("✅ 合約已經驗證過了");
        } else {
            console.error("❌ 驗證失敗:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
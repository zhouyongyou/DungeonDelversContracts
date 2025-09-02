const hre = require("hardhat");

/**
 * V25 NFT 合約 BSCScan 驗證腳本
 * 在部署完成後運行此腳本進行開源驗證
 */

async function main() {
    console.log("🔍 開始 V25 NFT 合約 BSCScan 開源驗證...\n");
    
    // 從最新的配置文件讀取地址，或手動設置
    const contracts = {
        // V25.1.4 已部署地址
        Hero: "0xe3DeF34622098B9dc7f042243Ce4f998Dfa3C662",
        Relic: "0x9A682D761ef20377e46136a45f10C3B2a8A76CeF",
        Party: "0xd5A1dd4Da7F0609042EeBAE3b1a5eceb0A996e25",
        PlayerProfile: "0x7DEBfb8334c0aF31f6241f7aB2f78a9907823400",
        VIPStaking: "0xa4f98938ECfc8DBD586F7eE1d51B3c1FaDDDd5da",
        DungeonMaster: "0xb1c3ff1A3192B38Ff95C093992d244fc3b75abE0"
    };
    
    const [deployer] = await hre.ethers.getSigners();
    const DUNGEON_CORE_ADDRESS = "0x5B64A5939735Ff762493D9B9666b3e13118c5722"; // V25.1.3
    
    console.log("📍 驗證地址配置:");
    Object.entries(contracts).forEach(([name, address]) => {
        console.log(`${name}: ${address}`);
    });
    console.log();
    
    // ========== 合約驗證函數 ==========
    async function verifyContract(contractName, address, constructorArgs = []) {
        console.log(`🔄 驗證 ${contractName} 合約 (${address})...`);
        
        try {
            await hre.run("verify:verify", {
                address: address,
                constructorArguments: constructorArgs,
            });
            console.log(`✅ ${contractName} 驗證成功`);
            return true;
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log(`✅ ${contractName} 已經驗證過了`);
                return true;
            } else {
                console.error(`❌ ${contractName} 驗證失敗:`, error.message);
                return false;
            }
        }
    }
    
    // ========== 開始驗證流程 ==========
    const verificationResults = {};
    
    // 1. 驗證 Hero (constructor: 無參數)
    if (contracts.Hero !== "0x...") {
        verificationResults.Hero = await verifyContract(
            "Hero", 
            contracts.Hero, 
            []
        );
    }
    
    // 2. 驗證 Relic (constructor: 無參數)
    if (contracts.Relic !== "0x...") {
        verificationResults.Relic = await verifyContract(
            "Relic", 
            contracts.Relic, 
            []
        );
    }
    
    // 3. 驗證 Party (constructor: 無參數)
    if (contracts.Party !== "0x...") {
        verificationResults.Party = await verifyContract(
            "Party", 
            contracts.Party, 
            []
        );
    }
    
    // 4. 驗證 PlayerProfile (constructor: 無參數)
    if (contracts.PlayerProfile !== "0x...") {
        verificationResults.PlayerProfile = await verifyContract(
            "PlayerProfile", 
            contracts.PlayerProfile, 
            []
        );
    }
    
    // 5. 驗證 VIPStaking (constructor: 無參數)
    if (contracts.VIPStaking !== "0x...") {
        verificationResults.VIPStaking = await verifyContract(
            "VIPStaking", 
            contracts.VIPStaking, 
            []
        );
    }
    
    // 6. 驗證 DungeonMaster (constructor: 無參數)
    if (contracts.DungeonMaster !== "0x...") {
        verificationResults.DungeonMaster = await verifyContract(
            "DungeonMaster", 
            contracts.DungeonMaster, 
            []
        );
    }
    
    // ========== 驗證結果總結 ==========
    console.log("\n📊 驗證結果總結:");
    
    let successCount = 0;
    let totalCount = 0;
    
    Object.entries(verificationResults).forEach(([contractName, success]) => {
        totalCount++;
        if (success) {
            successCount++;
            console.log(`✅ ${contractName}: 驗證成功`);
        } else {
            console.log(`❌ ${contractName}: 驗證失敗`);
        }
    });
    
    console.log(`\n📈 總計: ${successCount}/${totalCount} 個合約驗證成功`);
    
    if (successCount === totalCount && totalCount > 0) {
        console.log("\n🎉 所有合約驗證完成！");
        console.log("\n🔗 BSCScan 連結:");
        Object.entries(contracts).forEach(([name, address]) => {
            if (address !== "0x...") {
                console.log(`${name}: https://bscscan.com/address/${address}#code`);
            }
        });
    } else {
        console.log("\n⚠️ 部分合約驗證失敗，請檢查錯誤信息並重試");
    }
    
    // ========== 手動驗證命令 ==========
    console.log("\n🔧 手動驗證命令（如需要）:");
    Object.entries(contracts).forEach(([name, address]) => {
        if (address !== "0x...") {
            // 所有合約都是無參數構造函數
            console.log(`npx hardhat verify --network bsc ${address}`);
        }
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 驗證失敗:", error);
        process.exit(1);
    });
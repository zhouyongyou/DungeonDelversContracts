const hre = require("hardhat");

async function main() {
    console.log("🔄 手動更新各合約的 VRF Manager 地址...");
    
    // 新部署的 VRF Manager 地址
    const NEW_VRF_MANAGER = "0x84B1fFc7b0839906BA1EcF510ED3a74481b8438e";
    
    // 合約地址
    const CONTRACTS = {
        DungeonMaster: "0xc0bbae55cf9245f76628d2c5299cd6fa35cd102a",
        Hero: "0x671d937b171e2ba2c4dc23c133b07e4449f283ef",
        Relic: "0x42bf1bd8fc5a8dfdd0e97de131246ec0e3ec73da",
        AltarOfAscension: "0xa86749237d4631ad92ba859d0b0df4770f6147ba"
    };
    
    const [signer] = await hre.ethers.getSigners();
    console.log("執行地址:", signer.address);
    
    // 嘗試更新 Hero
    console.log("\n📝 更新 Hero VRF Manager...");
    try {
        const heroABI = [
            "function setVrfManager(address _vrfManager) external",
            "function setVRFManager(address _vrfManager) external",
            "function vrfManager() view returns (address)",
            "function owner() view returns (address)"
        ];
        
        const hero = new hre.ethers.Contract(CONTRACTS.Hero, heroABI, signer);
        
        // 檢查 owner
        try {
            const owner = await hero.owner();
            console.log("Hero Owner:", owner);
        } catch (e) {
            console.log("無法讀取 owner");
        }
        
        // 嘗試不同的函數名
        try {
            const tx = await hero.setVrfManager(NEW_VRF_MANAGER);
            await tx.wait();
            console.log("✅ Hero VRF Manager 已更新");
        } catch (e1) {
            try {
                const tx = await hero.setVRFManager(NEW_VRF_MANAGER);
                await tx.wait();
                console.log("✅ Hero VRF Manager 已更新");
            } catch (e2) {
                console.log("❌ Hero 更新失敗:", e2.message);
            }
        }
    } catch (error) {
        console.log("❌ Hero 錯誤:", error.message);
    }
    
    // 嘗試更新 Relic
    console.log("\n📝 更新 Relic VRF Manager...");
    try {
        const relicABI = [
            "function setVrfManager(address _vrfManager) external",
            "function setVRFManager(address _vrfManager) external",
            "function vrfManager() view returns (address)",
            "function owner() view returns (address)"
        ];
        
        const relic = new hre.ethers.Contract(CONTRACTS.Relic, relicABI, signer);
        
        // 檢查 owner
        try {
            const owner = await relic.owner();
            console.log("Relic Owner:", owner);
        } catch (e) {
            console.log("無法讀取 owner");
        }
        
        try {
            const tx = await relic.setVrfManager(NEW_VRF_MANAGER);
            await tx.wait();
            console.log("✅ Relic VRF Manager 已更新");
        } catch (e1) {
            try {
                const tx = await relic.setVRFManager(NEW_VRF_MANAGER);
                await tx.wait();
                console.log("✅ Relic VRF Manager 已更新");
            } catch (e2) {
                console.log("❌ Relic 更新失敗:", e2.message);
            }
        }
    } catch (error) {
        console.log("❌ Relic 錯誤:", error.message);
    }
    
    // 嘗試更新 DungeonMaster
    console.log("\n📝 更新 DungeonMaster VRF Manager...");
    try {
        const dmABI = [
            "function setVRFManager(address _vrfManager) external",
            "function setVrfManager(address _vrfManager) external",
            "function vrfManager() view returns (address)",
            "function VRFManager() view returns (address)",
            "function owner() view returns (address)"
        ];
        
        const dm = new hre.ethers.Contract(CONTRACTS.DungeonMaster, dmABI, signer);
        
        // 檢查 owner
        try {
            const owner = await dm.owner();
            console.log("DungeonMaster Owner:", owner);
        } catch (e) {
            console.log("無法讀取 owner");
        }
        
        try {
            const tx = await dm.setVRFManager(NEW_VRF_MANAGER);
            await tx.wait();
            console.log("✅ DungeonMaster VRF Manager 已更新");
        } catch (e1) {
            try {
                const tx = await dm.setVrfManager(NEW_VRF_MANAGER);
                await tx.wait();
                console.log("✅ DungeonMaster VRF Manager 已更新");
            } catch (e2) {
                console.log("❌ DungeonMaster 更新失敗:", e2.message);
            }
        }
    } catch (error) {
        console.log("❌ DungeonMaster 錯誤:", error.message);
    }
    
    // 嘗試更新 AltarOfAscension
    console.log("\n📝 更新 AltarOfAscension VRF Manager...");
    try {
        const altarABI = [
            "function setVrfManager(address _vrfManager) external",
            "function setVRFManager(address _vrfManager) external",
            "function vrfManager() view returns (address)",
            "function owner() view returns (address)"
        ];
        
        const altar = new hre.ethers.Contract(CONTRACTS.AltarOfAscension, altarABI, signer);
        
        // 檢查 owner
        try {
            const owner = await altar.owner();
            console.log("AltarOfAscension Owner:", owner);
        } catch (e) {
            console.log("無法讀取 owner");
        }
        
        try {
            const tx = await altar.setVrfManager(NEW_VRF_MANAGER);
            await tx.wait();
            console.log("✅ AltarOfAscension VRF Manager 已更新");
        } catch (e1) {
            try {
                const tx = await altar.setVRFManager(NEW_VRF_MANAGER);
                await tx.wait();
                console.log("✅ AltarOfAscension VRF Manager 已更新");
            } catch (e2) {
                console.log("❌ AltarOfAscension 更新失敗:", e2.message);
            }
        }
    } catch (error) {
        console.log("❌ AltarOfAscension 錯誤:", error.message);
    }
    
    // 驗證更新結果
    console.log("\n🔍 驗證更新結果...");
    
    // 檢查各合約的 VRF Manager
    const checkABI = [
        "function vrfManager() view returns (address)",
        "function VRFManager() view returns (address)"
    ];
    
    for (const [name, address] of Object.entries(CONTRACTS)) {
        try {
            const contract = new hre.ethers.Contract(address, checkABI, signer);
            let vrfAddr;
            try {
                vrfAddr = await contract.vrfManager();
            } catch {
                vrfAddr = await contract.VRFManager();
            }
            const isCorrect = vrfAddr.toLowerCase() === NEW_VRF_MANAGER.toLowerCase();
            console.log(`${name}: ${vrfAddr} ${isCorrect ? "✅" : "❌"}`);
        } catch (error) {
            console.log(`${name}: 無法讀取 VRF Manager`);
        }
    }
    
    console.log("\n✅ 完成！");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
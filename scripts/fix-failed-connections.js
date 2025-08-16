// 修復失敗的 V25 合約連接
const hre = require("hardhat");
const { ethers } = require("hardhat");

const ADDRESSES = {
    DUNGEONCORE: "0x8a2D2b1961135127228EdD71Ff98d6B097915a13",
    PARTY: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
    ALTAROFASCENSION: "0xa86749237d4631ad92ba859d0b0df4770f6147ba",
    VRF_MANAGER_V2PLUS: "0x980d224ec4d198d94f34a8af76a19c00dabe2436"
};

async function main() {
    console.log("=== 修復失敗的 V25 合約連接 ===\n");
    
    const [signer] = await ethers.getSigners();
    console.log("執行地址:", signer.address);
    
    // 失敗項目 1: Party 設置 DungeonCore
    try {
        console.log("\n🔧 嘗試: Party 設置 DungeonCore");
        
        // 使用完整合約而非介面
        const partyAbi = [
            "function setDungeonCore(address _address) external"
        ];
        const party = new ethers.Contract(ADDRESSES.PARTY, partyAbi, signer);
        
        const tx1 = await party.setDungeonCore(ADDRESSES.DUNGEONCORE, { gasLimit: 500000 });
        console.log("   📝 交易哈希:", tx1.hash);
        const receipt1 = await tx1.wait();
        console.log("   ✅ 成功！Gas 使用:", receipt1.gasUsed.toString());
    } catch (error) {
        console.log("   ❌ 失敗:", error.message);
    }
    
    // 失敗項目 2: AltarOfAscension 設置 DungeonCore
    try {
        console.log("\n🔧 嘗試: AltarOfAscension 設置 DungeonCore");
        
        const altarAbi = [
            "function setDungeonCore(address _address) external"
        ];
        const altar = new ethers.Contract(ADDRESSES.ALTAROFASCENSION, altarAbi, signer);
        
        const tx2 = await altar.setDungeonCore(ADDRESSES.DUNGEONCORE, { gasLimit: 500000 });
        console.log("   📝 交易哈希:", tx2.hash);
        const receipt2 = await tx2.wait();
        console.log("   ✅ 成功！Gas 使用:", receipt2.gasUsed.toString());
    } catch (error) {
        console.log("   ❌ 失敗:", error.message);
    }
    
    // 失敗項目 3: AltarOfAscension 設置 VRF Manager
    try {
        console.log("\n🔧 嘗試: AltarOfAscension 設置 VRF Manager");
        
        const altarVrfAbi = [
            "function setVRFManager(address _vrfManager) external"
        ];
        const altarVrf = new ethers.Contract(ADDRESSES.ALTAROFASCENSION, altarVrfAbi, signer);
        
        const tx3 = await altarVrf.setVRFManager(ADDRESSES.VRF_MANAGER_V2PLUS, { gasLimit: 500000 });
        console.log("   📝 交易哈希:", tx3.hash);
        const receipt3 = await tx3.wait();
        console.log("   ✅ 成功！Gas 使用:", receipt3.gasUsed.toString());
    } catch (error) {
        console.log("   ❌ 失敗:", error.message);
    }
    
    console.log("\n=== 驗證設置 ===");
    
    // 驗證 Party 的 DungeonCore
    try {
        const partyReadAbi = [
            "function dungeonCore() view returns (address)"
        ];
        const partyRead = new ethers.Contract(ADDRESSES.PARTY, partyReadAbi, signer);
        const dungeonCoreFromParty = await partyRead.dungeonCore();
        console.log(`Party.dungeonCore: ${dungeonCoreFromParty.toLowerCase() === ADDRESSES.DUNGEONCORE.toLowerCase() ? "✅" : "❌"} ${dungeonCoreFromParty}`);
    } catch (error) {
        console.log("Party.dungeonCore: ❌ 無法讀取");
    }
    
    // 驗證 AltarOfAscension 的設置
    try {
        const altarReadAbi = [
            "function dungeonCore() view returns (address)",
            "function vrfManager() view returns (address)"
        ];
        const altarRead = new ethers.Contract(ADDRESSES.ALTAROFASCENSION, altarReadAbi, signer);
        
        const dungeonCoreFromAltar = await altarRead.dungeonCore();
        console.log(`Altar.dungeonCore: ${dungeonCoreFromAltar.toLowerCase() === ADDRESSES.DUNGEONCORE.toLowerCase() ? "✅" : "❌"} ${dungeonCoreFromAltar}`);
        
        const vrfManagerFromAltar = await altarRead.vrfManager();
        console.log(`Altar.vrfManager: ${vrfManagerFromAltar.toLowerCase() === ADDRESSES.VRF_MANAGER_V2PLUS.toLowerCase() ? "✅" : "❌"} ${vrfManagerFromAltar}`);
    } catch (error) {
        console.log("Altar 設置: ❌ 無法讀取");
    }
    
    console.log("\n=== 修復完成 ===");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("腳本執行失敗:", error);
        process.exit(1);
    });
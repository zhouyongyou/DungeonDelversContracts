import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("修復探索費用設置...\n");

    // 讀取配置
    const configPath = path.join(__dirname, "../contract-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    const dungeonMasterAddress = config.contracts.game.dungeonMaster.address;
    console.log(`DungeonMaster 地址: ${dungeonMasterAddress}`);

    // 連接到合約
    const [signer] = await ethers.getSigners();
    console.log(`操作帳戶: ${signer.address}`);

    const DungeonMaster = await ethers.getContractFactory("DungeonMasterV2");
    const dungeonMaster = DungeonMaster.attach(dungeonMasterAddress);

    // 檢查當前費用
    console.log("\n檢查當前設置:");
    const currentFee = await dungeonMaster.explorationFee();
    console.log(`當前探索費用: ${ethers.formatEther(currentFee)} BNB (${currentFee.toString()} wei)`);

    // 設置新費用
    const newFee = ethers.parseEther("0.0015");
    console.log(`\n設置新費用: ${ethers.formatEther(newFee)} BNB (${newFee.toString()} wei)`);
    
    try {
        const tx = await dungeonMaster.setExplorationFee(newFee);
        console.log(`交易已發送: ${tx.hash}`);
        console.log("等待交易確認...");
        
        const receipt = await tx.wait();
        console.log(`交易已確認! 區塊: ${receipt.blockNumber}`);
        
        // 再次檢查費用
        const updatedFee = await dungeonMaster.explorationFee();
        console.log(`\n更新後的探索費用: ${ethers.formatEther(updatedFee)} BNB (${updatedFee.toString()} wei)`);
        
        if (updatedFee.toString() === newFee.toString()) {
            console.log("✅ 探索費用設置成功！");
        } else {
            console.log("❌ 設置似乎沒有生效");
        }
    } catch (error) {
        console.error("設置失敗:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("錯誤:", error);
        process.exit(1);
    });
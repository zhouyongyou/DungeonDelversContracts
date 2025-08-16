const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 詳細檢查授權問題...\n");
    
    const [signer] = await ethers.getSigners();
    
    const addresses = {
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0",
    };
    
    try {
        const ERC20_ABI = [
            "function allowance(address owner, address spender) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)"
        ];
        
        const soulShard = new ethers.Contract(addresses.soulShard, ERC20_ABI, signer);
        
        // 檢查各種組合的授權
        console.log("檢查授權狀態:");
        console.log(`From (owner): ${signer.address}`);
        console.log(`To (spender): ${addresses.dungeonMaster}`);
        
        // 檢查正確的授權
        const allowance1 = await soulShard.allowance(signer.address, addresses.dungeonMaster);
        console.log(`\n正確的授權 (signer -> DungeonMaster): ${ethers.formatEther(allowance1)} SOUL`);
        
        // 檢查反向授權（這應該是0）
        const allowance2 = await soulShard.allowance(addresses.dungeonMaster, signer.address);
        console.log(`反向授權 (DungeonMaster -> signer): ${ethers.formatEther(allowance2)} SOUL`);
        
        // 測試：模擬 DungeonMaster 調用 transferFrom
        console.log("\n模擬 DungeonMaster 內部的 transferFrom 調用:");
        console.log("transferFrom 參數將是:");
        console.log(`  from: ${signer.address}`);
        console.log(`  to: ${addresses.dungeonMaster}`);
        console.log(`  amount: 1 SOUL`);
        
        // 創建一個 fork 來測試
        console.log("\n使用不同的方式測試 transferFrom:");
        
        // 方法1: 使用 eth_call 直接測試
        const iface = new ethers.Interface([
            "function transferFrom(address from, address to, uint256 amount) returns (bool)"
        ]);
        
        const callData = iface.encodeFunctionData("transferFrom", [
            signer.address,
            addresses.dungeonMaster,
            ethers.parseEther("1")
        ]);
        
        try {
            // 從 signer 的角度調用
            console.log("\n1. 從 signer 角度調用 transferFrom:");
            const result1 = await signer.call({
                to: addresses.soulShard,
                data: callData
            });
            console.log("結果:", result1);
        } catch (e) {
            console.log("❌ 失敗:", e.message);
        }
        
        // 檢查實際的 msg.sender
        console.log("\n重要發現:");
        console.log("當 DungeonMaster 合約調用 soulShard.transferFrom 時：");
        console.log("- msg.sender 是 DungeonMaster 合約地址");
        console.log("- 需要檢查的授權是: allowance(用戶地址, DungeonMaster地址)");
        console.log("- 當前授權額度:", ethers.formatEther(allowance1), "SOUL");
        
        // 最後的測試：重新授權並確認
        if (allowance1 === 0n) {
            console.log("\n需要重新授權...");
            const tx = await soulShard.approve(addresses.dungeonMaster, ethers.MaxUint256);
            await tx.wait();
            console.log("✅ 授權完成");
            
            const newAllowance = await soulShard.allowance(signer.address, addresses.dungeonMaster);
            console.log("新的授權額度:", ethers.formatEther(newAllowance), "SOUL");
        }
        
    } catch (error) {
        console.error("檢查過程中發生錯誤:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
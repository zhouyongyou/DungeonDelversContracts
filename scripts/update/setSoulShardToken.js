const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 設定 DungeonMaster 的 SoulShard Token...\n");
    
    const [signer] = await ethers.getSigners();
    console.log("執行者錢包:", signer.address);
    
    const addresses = {
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0",
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
    };
    
    try {
        // 獲取 DungeonMaster 合約
        const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
        
        // 檢查當前設定
        console.log("1. 檢查當前設定:");
        try {
            const currentToken = await dungeonMaster.soulShardToken();
            console.log("當前 SoulShard token:", currentToken);
            
            if (currentToken === addresses.soulShard) {
                console.log("✅ SoulShard token 已正確設定");
                return;
            }
        } catch (e) {
            console.log("當前未設定 SoulShard token 或合約未更新");
        }
        
        // 檢查是否為 Owner
        console.log("\n2. 檢查權限:");
        const owner = await dungeonMaster.owner();
        console.log("合約 Owner:", owner);
        console.log("是否為 Owner:", owner.toLowerCase() === signer.address.toLowerCase() ? "✅" : "❌");
        
        if (owner.toLowerCase() !== signer.address.toLowerCase()) {
            console.log("❌ 不是合約 Owner，無法設定");
            return;
        }
        
        // 設定 SoulShard token
        console.log("\n3. 設定 SoulShard token:");
        console.log("設定地址:", addresses.soulShard);
        
        const tx = await dungeonMaster.setSoulShardToken(addresses.soulShard);
        console.log("交易已發送:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ 設定成功!");
        console.log("Gas 使用:", receipt.gasUsed.toString());
        
        // 驗證設定
        console.log("\n4. 驗證設定:");
        const newToken = await dungeonMaster.soulShardToken();
        console.log("新的 SoulShard token:", newToken);
        console.log("設定正確:", newToken.toLowerCase() === addresses.soulShard.toLowerCase() ? "✅" : "❌");
        
        // 檢查事件
        console.log("\n5. 檢查事件:");
        const events = receipt.logs.filter(log => {
            try {
                const parsed = dungeonMaster.interface.parseLog(log);
                return parsed.name === "SoulShardTokenSet";
            } catch (e) {
                return false;
            }
        });
        
        if (events.length > 0) {
            const event = dungeonMaster.interface.parseLog(events[0]);
            console.log("✅ SoulShardTokenSet 事件已發出");
            console.log("事件參數:", event.args.newAddress);
        }
        
    } catch (error) {
        console.error("設定過程中發生錯誤:", error.message);
        
        if (error.message.includes("Ownable: caller is not the owner")) {
            console.log("錯誤：不是合約 Owner");
        } else if (error.message.includes("function selector was not recognized")) {
            console.log("錯誤：合約可能未更新，缺少 setSoulShardToken 函數");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
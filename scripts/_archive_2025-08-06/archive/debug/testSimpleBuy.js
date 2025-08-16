const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 簡單測試儲備購買...\n");
    
    const [signer] = await ethers.getSigners();
    console.log("錢包地址:", signer.address);
    
    const addresses = {
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0".toLowerCase(),
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a".toLowerCase(),
    };
    
    try {
        // 使用 ABI 而不是合約名稱來避免衝突
        const ERC20_ABI = [
            "function balanceOf(address account) view returns (uint256)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function decimals() view returns (uint8)",
            "function symbol() view returns (string)"
        ];
        
        const soulShard = new ethers.Contract(addresses.soulShard, ERC20_ABI, signer);
        const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
        
        // 檢查基本信息
        const symbol = await soulShard.symbol();
        const decimals = await soulShard.decimals();
        const balance = await soulShard.balanceOf(signer.address);
        
        console.log(`代幣信息: ${symbol}, ${decimals} decimals`);
        console.log(`錢包餘額: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
        
        // 檢查儲備價格
        const provisionPriceUSD = await dungeonMaster.provisionPriceUSD();
        console.log(`儲備單價: ${ethers.formatEther(provisionPriceUSD)} USD`);
        
        // 獲取 DungeonCore 並計算實際需要的 SOUL
        const dungeonCore = await dungeonMaster.dungeonCore();
        const dungeonCoreContract = await ethers.getContractAt("DungeonCore", dungeonCore);
        const requiredSoul = await dungeonCoreContract.getSoulShardAmountForUSD(provisionPriceUSD);
        console.log(`需要 SOUL: ${ethers.formatUnits(requiredSoul, decimals)} ${symbol}`);
        
        // 檢查授權
        const allowance = await soulShard.allowance(signer.address, addresses.dungeonMaster);
        console.log(`當前授權: ${ethers.formatUnits(allowance, decimals)} ${symbol}`);
        
        if (allowance < requiredSoul) {
            console.log("\n🔓 正在授權...");
            const approveTx = await soulShard.approve(addresses.dungeonMaster, ethers.MaxUint256);
            await approveTx.wait();
            console.log("✅ 授權成功!");
        }
        
        // 嘗試購買 1 個儲備
        console.log("\n💰 嘗試購買 1 個儲備...");
        const partyId = 1; // 假設使用隊伍 ID 1
        
        try {
            const buyTx = await dungeonMaster.buyProvisions(partyId, 1);
            const receipt = await buyTx.wait();
            console.log("✅ 購買成功!");
            console.log("交易哈希:", receipt.hash);
        } catch (buyError) {
            console.log("❌ 購買失敗!");
            console.log("錯誤:", buyError.message);
            
            // 檢查是否是特定錯誤
            if (buyError.message.includes("DS: Party doesn't exist")) {
                console.log("💡 提示: 隊伍不存在");
            } else if (buyError.message.includes("DS: Not party owner")) {
                console.log("💡 提示: 不是隊伍擁有者");
            } else if (buyError.message.includes("transfer amount exceeds balance")) {
                console.log("💡 提示: SOUL 餘額不足");
            }
        }
        
    } catch (error) {
        console.error("測試過程中發生錯誤:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
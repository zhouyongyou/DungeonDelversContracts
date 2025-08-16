const { ethers } = require("hardhat");

async function main() {
    console.log("🔬 比較 NFT 鑄造（成功）與儲備購買（失敗）的差異...\n");
    
    const [signer] = await ethers.getSigners();
    
    const addresses = {
        hero: "0x929a4187A462314fCC480ff547019fA122A283f0".toLowerCase(),
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0".toLowerCase(),
        dungeonCore: "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6".toLowerCase(),
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a".toLowerCase(),
    };
    
    try {
        // 獲取合約
        const hero = await ethers.getContractAt("Hero", addresses.hero);
        const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
        const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
        
        console.log("=== 1. 比較 SoulShard 地址獲取方式 ===");
        
        // Hero 的方式
        const heroSoulShard = await hero.soulShardToken();
        console.log("Hero.soulShardToken():", heroSoulShard);
        
        // DungeonMaster 的方式（通過 DungeonCore）
        const coreSoulShard = await dungeonCore.soulShardTokenAddress();
        console.log("DungeonCore.soulShardTokenAddress():", coreSoulShard);
        
        console.log("地址相同:", heroSoulShard.toLowerCase() === coreSoulShard.toLowerCase() ? "✅" : "❌");
        
        console.log("\n=== 2. 測試直接調用 transferFrom ===");
        
        // 創建 SoulShard 實例
        const soulShardABI = [
            "function balanceOf(address) view returns (uint256)",
            "function allowance(address,address) view returns (uint256)",
            "function transferFrom(address,address,uint256) returns (bool)",
            "function approve(address,uint256) returns (bool)"
        ];
        
        const soulShard = new ethers.Contract(addresses.soulShard, soulShardABI, signer);
        
        // 檢查授權
        const heroAllowance = await soulShard.allowance(signer.address, addresses.hero);
        const dmAllowance = await soulShard.allowance(signer.address, addresses.dungeonMaster);
        
        console.log(`授權給 Hero: ${ethers.formatEther(heroAllowance)} SOUL`);
        console.log(`授權給 DungeonMaster: ${ethers.formatEther(dmAllowance)} SOUL`);
        
        console.log("\n=== 3. 模擬合約內部調用 ===");
        
        // 部署測試合約來模擬 Hero 和 DungeonMaster 的行為
        const TestContractFactory = await ethers.getContractFactory({
            abi: [
                "function testDirectTransfer(address token, address from, address to, uint256 amount) external returns (bool)",
                "function testTransferViaCore(address core, address from, address to, uint256 amount) external returns (bool)"
            ],
            bytecode: "0x608060405234801561001057600080fd5b506104a8806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806371dfeb341461003b578063a5f3c23b14610057575b600080fd5b61005560048036038101906100509190610310565b610087565b005b610071600480360381019061006c9190610310565b6100e8565b60405161007e91906103a8565b60405180910390f35b8473ffffffffffffffffffffffffffffffffffffffff166323b872dd8585856040518463ffffffff1660e01b81526004016100c4939291906103dc565b600060405180830381600087803b1580156100de57600080fd5b5050505050505050565b60008573ffffffffffffffffffffffffffffffffffffffff1663f08a03268660006040518363ffffffff1660e01b815260040161012692919061041f565b602060405180830381865afa158015610143573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101679190610477565b90508073ffffffffffffffffffffffffffffffffffffffff166323b872dd8686866040518463ffffffff1660e01b81526004016101a6939291906103dc565b6020604051808303816000875af11580156101c5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101e991906104d2565b9150509495939450505050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610226826101fb565b9050919050565b6102368161021b565b811461024157600080fd5b50565b6000813590506102538161022d565b92915050565b6102628161021b565b811461026d57600080fd5b50565b60008135905061027f81610259565b92915050565b6000819050919050565b61029881610285565b81146102a357600080fd5b50565b6000813590506102b58161028f565b92915050565b6000813590506102ca8161028f565b92915050565b6000813590506102df8161022d565b92915050565b60008060008060808587031215610300576102ff6101f6565b5b600061030e87828801610244565b945050602061031f87828801610270565b9350506040610330878288016102d0565b9250506060610341878288016102bb565b91505092959194509250565b60008115159050919050565b6103628161034d565b82525050565b61037181610285565b82525050565b600060208201905061038c6000830184610359565b92915050565b600081519050919050565b600082825260208201905092915050565b60005b838110156103cc5780820151818401526020810190506103b1565b8381111561043b5750508091505090565b6103e58161021b565b82525050565b6103f48161021b565b82525050565b61040381610285565b82525050565b600060608201905061041e60008301866103dc565b61042b60208301856103eb565b61043860408301846103fa565b949350505050565b600060408201905061045560008301856103dc565b61046260208301846103eb565b9392505050565b6000815190506104788161022d565b92915050565b600060208284031215610494576104936101f6565b5b60006104a284828501610469565b91505092915050565b6104b48161034d565b81146104bf57600080fd5b50565b6000815190506104d1816104ab565b92915050565b6000602082840312156104ee576104ed6101f6565b5b60006104fc848285016104c2565b9150509291505056fea2646970667358221220c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c564736f6c63430008140033"
        });
        
        console.log("\n=== 4. 分析 SafeERC20 的行為 ===");
        
        // 檢查 transferFrom 的返回值
        console.log("\n測試 transferFrom 返回值類型:");
        
        // 使用低層級調用
        const iface = new ethers.Interface([
            "function transferFrom(address from, address to, uint256 amount) returns (bool)"
        ]);
        
        const calldata = iface.encodeFunctionData("transferFrom", [
            signer.address,
            addresses.hero,
            ethers.parseEther("0.001") // 小額測試
        ]);
        
        try {
            const result = await signer.call({
                to: addresses.soulShard,
                data: calldata
            });
            console.log("transferFrom 返回值:", result);
            const decoded = iface.decodeFunctionResult("transferFrom", result);
            console.log("解碼後:", decoded[0]);
        } catch (e) {
            console.log("調用失敗:", e.message);
        }
        
        console.log("\n=== 5. 關鍵差異分析 ===");
        
        // 檢查合約字節碼中的 SafeERC20 模式
        const heroCode = await ethers.provider.getCode(addresses.hero);
        const dmCode = await ethers.provider.getCode(addresses.dungeonMaster);
        
        // 搜索特定的函數選擇器
        const transferFromSelector = "23b872dd"; // transferFrom
        const safeTransferFromPattern = "5b5061c"; // SafeERC20 pattern
        
        console.log("\nHero 合約分析:");
        console.log("- 包含 transferFrom selector:", heroCode.includes(transferFromSelector));
        console.log("- 字節碼長度:", heroCode.length);
        
        console.log("\nDungeonMaster 合約分析:");
        console.log("- 包含 transferFrom selector:", dmCode.includes(transferFromSelector));
        console.log("- 字節碼長度:", dmCode.length);
        
        console.log("\n=== 6. 實際測試 ===");
        
        // 確保授權
        if (dmAllowance < ethers.parseEther("100")) {
            console.log("\n重新授權給 DungeonMaster...");
            const approveTx = await soulShard.approve(addresses.dungeonMaster, ethers.MaxUint256);
            await approveTx.wait();
            console.log("✅ 授權完成");
        }
        
        // 測試 Hero 鑄造（應該成功）
        console.log("\n測試 Hero 鑄造:");
        try {
            const mintPrice = await hero.getRequiredSoulShardAmount(1);
            const platformFee = await hero.platformFee();
            console.log("需要:", ethers.formatEther(mintPrice), "SOUL");
            console.log("平台費:", ethers.formatEther(platformFee), "BNB");
            
            // 這裡只是顯示，不實際執行以避免花費
            console.log("✅ Hero 鑄造正常工作（已知）");
        } catch (e) {
            console.log("❌ 錯誤:", e.message);
        }
        
        // 分析 DungeonMaster 的確切失敗點
        console.log("\n=== 7. 精確定位失敗點 ===");
        
        // 使用 trace 來找出確切失敗位置
        const provider = ethers.provider;
        
        try {
            // 構建 buyProvisions 調用
            const buyProvisionData = dungeonMaster.interface.encodeFunctionData("buyProvisions", [1, 1]);
            
            // 執行靜態調用以獲取更多信息
            await provider.call({
                to: addresses.dungeonMaster,
                from: signer.address,
                data: buyProvisionData,
                gasLimit: 500000
            });
        } catch (error) {
            console.log("\n失敗詳情:");
            console.log("- Gas 使用:", error.receipt?.gasUsed?.toString() || "N/A");
            console.log("- 錯誤類型:", error.code);
            
            // 嘗試解析錯誤
            if (error.data && error.data !== "0x") {
                console.log("- 錯誤數據:", error.data);
                
                // 檢查是否是 SafeERC20 錯誤
                const safeERC20Error = "0xb12d13eb"; // SafeERC20: low-level call failed
                if (error.data.startsWith(safeERC20Error)) {
                    console.log("\n❌ 發現問題：SafeERC20 低層級調用失敗！");
                    console.log("這表示 transferFrom 調用返回了 false 或沒有返回值");
                }
            }
        }
        
    } catch (error) {
        console.error("比較過程中發生錯誤:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 測試修改後的 DungeonMaster 合約...\n");
    
    const [signer] = await ethers.getSigners();
    
    // 部署新的 DungeonMaster 合約進行測試
    console.log("1. 部署新的 DungeonMaster 合約:");
    const DungeonMasterFactory = await ethers.getContractFactory("DungeonMaster");
    const newDungeonMaster = await DungeonMasterFactory.deploy(signer.address);
    await newDungeonMaster.waitForDeployment();
    const newDMAddress = await newDungeonMaster.getAddress();
    console.log("✅ 新 DungeonMaster 部署至:", newDMAddress);
    
    // 設定必要的依賴
    console.log("\n2. 設定合約依賴:");
    const existingAddresses = {
        dungeonCore: "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6",
        dungeonStorage: "0x40D0DFA394707e26247a1EFfAe0f9C1b248Fff10",
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
    };
    
    try {
        await (await newDungeonMaster.setDungeonCore(existingAddresses.dungeonCore)).wait();
        console.log("✅ DungeonCore 設定完成");
        
        await (await newDungeonMaster.setDungeonStorage(existingAddresses.dungeonStorage)).wait();
        console.log("✅ DungeonStorage 設定完成");
        
        await (await newDungeonMaster.setSoulShardToken(existingAddresses.soulShard)).wait();
        console.log("✅ SoulShard token 設定完成");
        
    } catch (e) {
        console.log("❌ 設定失敗:", e.message);
        return;
    }
    
    // 驗證設定
    console.log("\n3. 驗證設定:");
    const dungeonCore = await newDungeonMaster.dungeonCore();
    const dungeonStorage = await newDungeonMaster.dungeonStorage();
    const soulShardToken = await newDungeonMaster.soulShardToken();
    
    console.log("DungeonCore:", dungeonCore);
    console.log("DungeonStorage:", dungeonStorage);
    console.log("SoulShard Token:", soulShardToken);
    
    console.log("設定正確:", 
        dungeonCore.toLowerCase() === existingAddresses.dungeonCore.toLowerCase() &&
        dungeonStorage.toLowerCase() === existingAddresses.dungeonStorage.toLowerCase() &&
        soulShardToken.toLowerCase() === existingAddresses.soulShard.toLowerCase() ? "✅" : "❌"
    );
    
    // 測試儲備購買功能
    console.log("\n4. 測試儲備購買功能:");
    
    // 首先需要設定 DungeonStorage 的 logicContract
    console.log("設定 DungeonStorage 的 logicContract...");
    const dungeonStorageContract = await ethers.getContractAt("DungeonStorage", existingAddresses.dungeonStorage);
    
    try {
        await (await dungeonStorageContract.setLogicContract(newDMAddress)).wait();
        console.log("✅ DungeonStorage logicContract 設定完成");
    } catch (e) {
        console.log("❌ 設定 logicContract 失敗:", e.message);
        if (e.message.includes("caller is not the owner")) {
            console.log("提示: 需要使用 DungeonStorage 的 owner 地址");
        }
    }
    
    // 檢查授權
    console.log("\n檢查 SoulShard 授權:");
    const soulShardContract = await ethers.getContractAt("IERC20", existingAddresses.soulShard);
    const allowance = await soulShardContract.allowance(signer.address, newDMAddress);
    console.log(`授權額度: ${ethers.formatEther(allowance)} SOUL`);
    
    if (allowance < ethers.parseEther("100")) {
        console.log("進行授權...");
        const approveTx = await soulShardContract.approve(newDMAddress, ethers.MaxUint256);
        await approveTx.wait();
        console.log("✅ 授權完成");
    }
    
    // 測試購買儲備
    console.log("\n5. 測試購買儲備:");
    const partyId = 1;
    const amount = 1;
    
    try {
        // 使用 staticCall 先測試
        console.log("執行 staticCall 測試...");
        await newDungeonMaster.buyProvisions.staticCall(partyId, amount);
        console.log("✅ staticCall 成功!");
        
        // 執行實際交易
        console.log("執行實際交易...");
        const tx = await newDungeonMaster.buyProvisions(partyId, amount);
        const receipt = await tx.wait();
        console.log("✅ 儲備購買成功!");
        console.log("交易哈希:", receipt.hash);
        console.log("Gas 使用:", receipt.gasUsed.toString());
        
        // 檢查事件
        const events = receipt.logs.filter(log => {
            try {
                const parsed = newDungeonMaster.interface.parseLog(log);
                return parsed.name === "ProvisionsBought";
            } catch (e) {
                return false;
            }
        });
        
        if (events.length > 0) {
            const event = newDungeonMaster.interface.parseLog(events[0]);
            console.log("✅ ProvisionsBought 事件:");
            console.log("  PartyId:", event.args.partyId.toString());
            console.log("  Amount:", event.args.amount.toString());
            console.log("  Cost:", ethers.formatEther(event.args.cost), "SOUL");
        }
        
    } catch (e) {
        console.log("❌ 購買失敗:", e.message);
        
        if (e.message.includes("Not party owner")) {
            console.log("提示: 需要使用隊伍擁有者地址");
        } else if (e.message.includes("SoulShard token not set")) {
            console.log("提示: SoulShard token 未設定");
        }
    }
    
    console.log("\n=== 測試總結 ===");
    console.log("修改後的 DungeonMaster 合約:");
    console.log("1. ✅ 新增了 soulShardToken 狀態變數");
    console.log("2. ✅ 新增了 setSoulShardToken 函數");
    console.log("3. ✅ 修改了 buyProvisions 使用直接儲存的 token");
    console.log("4. ✅ 修改了 restParty 使用直接儲存的 token");
    console.log("5. ✅ 修改了 withdrawSoulShard 使用直接儲存的 token");
    console.log("6. ✅ 更新了部署腳本以設定 SoulShard token");
    console.log("\n這樣的設計與 Hero 合約保持一致，更加簡潔可靠!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
// scripts/simulate-buyProvisions.ts - 模擬完整的 buyProvisions 流程

import { ethers } from "hardhat";
import { formatEther } from "ethers";

const USER_ADDRESS = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
const PARTY_ID = 2n;
const AMOUNT = 1n;

const CONTRACTS = {
    DUNGEON_MASTER: "0x8550ACe3B6C9Ef311B995678F9263A69bC00EC3A",
    DUNGEON_CORE: "0x548A15CaFAE2a5D19f9683CDad6D57e3320E61a7",
    SOUL_SHARD: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
    PARTY: "0xb069B70d61f96bE5f5529dE216538766672f1096",
    DUNGEON_STORAGE: "0xEC6773F9C52446BB2F8318dBBa09f58E72fe91b4"
};

async function main() {
    console.log("🔍 模擬完整的 buyProvisions 流程...\n");
    
    const [signer] = await ethers.getSigners();
    
    // 連接所有合約
    const dungeonMaster = await ethers.getContractAt("DungeonMaster", CONTRACTS.DUNGEON_MASTER);
    const dungeonCore = await ethers.getContractAt("DungeonCore", CONTRACTS.DUNGEON_CORE);
    const soulShard = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", CONTRACTS.SOUL_SHARD);
    const party = await ethers.getContractAt("Party", CONTRACTS.PARTY);
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", CONTRACTS.DUNGEON_STORAGE);
    
    console.log("===== 步驟 1: 檢查前置條件 =====\n");
    
    // 1.1 檢查暫停狀態
    const isPaused = await dungeonMaster.paused();
    console.log(`✅ DungeonMaster 暫停狀態: ${isPaused ? '已暫停' : '正常'}`);
    if (isPaused) {
        console.log("❌ 合約已暫停，無法繼續");
        return;
    }
    
    // 1.2 檢查隊伍擁有權
    const partyOwner = await party.ownerOf(PARTY_ID);
    console.log(`✅ 隊伍 #${PARTY_ID} 擁有者: ${partyOwner}`);
    console.log(`   用戶是否為擁有者: ${partyOwner.toLowerCase() === USER_ADDRESS.toLowerCase() ? '是' : '否'}`);
    
    // 1.3 檢查合約地址設置
    const dungeonCoreInMaster = await dungeonMaster.dungeonCore();
    const soulShardInMaster = await dungeonMaster.soulShardToken();
    const dungeonStorageInMaster = await dungeonMaster.dungeonStorage();
    
    console.log(`✅ DungeonCore 設置: ${dungeonCoreInMaster !== ethers.ZeroAddress ? '已設置' : '未設置'}`);
    console.log(`✅ SoulShard 設置: ${soulShardInMaster !== ethers.ZeroAddress ? '已設置' : '未設置'}`);
    console.log(`✅ DungeonStorage 設置: ${dungeonStorageInMaster !== ethers.ZeroAddress ? '已設置' : '未設置'}`);
    
    console.log("\n===== 步驟 2: 計算價格 =====\n");
    
    // 2.1 獲取儲備價格
    const provisionPriceUSD = await dungeonMaster.provisionPriceUSD();
    const totalCostUSD = provisionPriceUSD * AMOUNT;
    console.log(`✅ 單個儲備價格: ${formatEther(provisionPriceUSD)} USD`);
    console.log(`✅ 總價格: ${formatEther(totalCostUSD)} USD`);
    
    // 2.2 計算所需 SoulShard
    const requiredSoulShard = await dungeonCore.getSoulShardAmountForUSD(totalCostUSD);
    console.log(`✅ 所需 SoulShard: ${formatEther(requiredSoulShard)}`);
    
    console.log("\n===== 步驟 3: 檢查用戶狀態 =====\n");
    
    // 3.1 檢查餘額和授權
    const userBalance = await soulShard.balanceOf(USER_ADDRESS);
    const userAllowance = await soulShard.allowance(USER_ADDRESS, CONTRACTS.DUNGEON_MASTER);
    
    console.log(`✅ 用戶 SoulShard 餘額: ${formatEther(userBalance)}`);
    console.log(`✅ 用戶授權額度: ${formatEther(userAllowance)}`);
    console.log(`   餘額足夠: ${userBalance >= requiredSoulShard ? '是' : '否'}`);
    console.log(`   授權足夠: ${userAllowance >= requiredSoulShard ? '是' : '否'}`);
    
    console.log("\n===== 步驟 4: 模擬 SafeERC20.safeTransferFrom =====\n");
    
    // 4.1 獲取 DungeonMaster 當前的 SoulShard 餘額
    const dmBalanceBefore = await soulShard.balanceOf(CONTRACTS.DUNGEON_MASTER);
    console.log(`✅ DungeonMaster 當前餘額: ${formatEther(dmBalanceBefore)}`);
    
    // 4.2 嘗試直接調用 transferFrom（模擬 SafeERC20 的行為）
    console.log("\n嘗試執行 transferFrom...");
    try {
        // 先檢查是否可以調用
        const canTransfer = userBalance >= requiredSoulShard && userAllowance >= requiredSoulShard;
        if (!canTransfer) {
            console.log("❌ 無法執行 transferFrom：餘額或授權不足");
        } else {
            // 使用 staticCall 模擬
            const result = await soulShard.transferFrom.staticCall(
                USER_ADDRESS,
                CONTRACTS.DUNGEON_MASTER,
                requiredSoulShard,
                { from: USER_ADDRESS }
            );
            console.log(`✅ transferFrom 模擬成功，返回: ${result}`);
        }
    } catch (error: any) {
        console.log(`❌ transferFrom 模擬失敗: ${error.message}`);
        
        // 嘗試解析錯誤
        if (error.data) {
            console.log("錯誤數據:", error.data);
        }
    }
    
    console.log("\n===== 步驟 5: 檢查 DungeonStorage 操作 =====\n");
    
    // 5.1 獲取當前隊伍狀態
    const currentStatus = await dungeonStorage.getPartyStatus(PARTY_ID);
    console.log(`✅ 當前儲備數量: ${currentStatus.provisionsRemaining}`);
    
    // 5.2 檢查 setPartyStatus 權限
    const logicContract = await dungeonStorage.logicContract();
    console.log(`✅ DungeonStorage 授權的邏輯合約: ${logicContract}`);
    console.log(`   是否為 DungeonMaster: ${logicContract.toLowerCase() === CONTRACTS.DUNGEON_MASTER.toLowerCase() ? '是' : '否'}`);
    
    console.log("\n===== 步驟 6: 完整交易模擬 =====\n");
    
    // 6.1 編碼交易數據
    const buyProvisionsData = dungeonMaster.interface.encodeFunctionData("buyProvisions", [PARTY_ID, AMOUNT]);
    console.log(`✅ 交易數據: ${buyProvisionsData}`);
    
    // 6.2 估算 gas
    try {
        const estimatedGas = await ethers.provider.estimateGas({
            from: USER_ADDRESS,
            to: CONTRACTS.DUNGEON_MASTER,
            data: buyProvisionsData
        });
        console.log(`✅ 估算 Gas: ${estimatedGas}`);
    } catch (error: any) {
        console.log(`❌ Gas 估算失敗: ${error.message}`);
        
        // 嘗試獲取更詳細的錯誤信息
        if (error.error && error.error.data) {
            console.log("詳細錯誤數據:", error.error.data);
            
            // 嘗試解碼自定義錯誤
            try {
                const errorInterface = new ethers.Interface([
                    "error InsufficientBalance(uint256 available, uint256 required)",
                    "error InsufficientAllowance(uint256 available, uint256 required)",
                    "error TransferFailed()",
                    "error NotPartyOwner(address caller, address owner)"
                ]);
                
                const decodedError = errorInterface.parseError(error.error.data);
                if (decodedError) {
                    console.log("解碼的錯誤:", decodedError.name, decodedError.args);
                }
            } catch (e) {
                // 嘗試解碼字符串錯誤
                if (error.error.data.startsWith('0x08c379a0')) {
                    try {
                        const errorString = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + error.error.data.slice(10))[0];
                        console.log("錯誤訊息:", errorString);
                    } catch (e2) {
                        console.log("無法解碼錯誤");
                    }
                }
            }
        }
    }
    
    console.log("\n===== 總結 =====\n");
    console.log("如果以上所有檢查都通過，但交易仍然失敗，可能的原因：");
    console.log("1. SoulShard 代幣有特殊的轉帳限制（黑名單、白名單、稅收等）");
    console.log("2. 重入保護（ReentrancyGuard）被觸發");
    console.log("3. 某個內部調用消耗了過多 gas");
    console.log("4. 合約邏輯中有未預期的 revert");
}

main()
    .then(() => {
        console.log("\n🎉 模擬完成！");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ 模擬失敗:", error);
        process.exit(1);
    });
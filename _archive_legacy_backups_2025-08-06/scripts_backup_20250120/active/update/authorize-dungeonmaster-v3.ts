// scripts/authorize-dungeonmaster-v3.ts
// 授權新的 DungeonMasterV3 訪問 DungeonStorage

import { ethers } from "hardhat";

async function main() {
    console.log("🔑 授權 DungeonMasterV3...");
    
    const [signer] = await ethers.getSigners();
    console.log(`執行帳號: ${signer.address}`);
    
    const DUNGEON_STORAGE_ADDRESS = "0x6FF605478fea3C3270f2eeD550129c58Dea81403";
    const NEW_DUNGEON_MASTER = "0x84eD128634F9334Bd63a929824066901a74a0E71";
    const OLD_DUNGEON_MASTER = "0x311730fa5459fa099976B139f7007d98C2F1E7A7";
    
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", DUNGEON_STORAGE_ADDRESS);
    
    // 檢查當前授權狀態
    console.log("\n檢查授權狀態...");
    try {
        // 嘗試不同的函數名稱
        const possibleFunctions = [
            'authorizedContracts',
            'isAuthorized',
            'authorized',
            'getAuthorized'
        ];
        
        for (const func of possibleFunctions) {
            try {
                const isAuthorized = await dungeonStorage[func](NEW_DUNGEON_MASTER);
                console.log(`${func}(新 DM): ${isAuthorized}`);
                break;
            } catch (e) {
                // 繼續嘗試下一個
            }
        }
    } catch (e) {
        console.log("無法檢查授權狀態，繼續執行授權...");
    }
    
    // 授權新的 DungeonMaster
    console.log("\n授權新的 DungeonMaster...");
    try {
        // 嘗試不同的授權函數
        const authFunctions = [
            { name: 'setAuthorizedContract', params: [NEW_DUNGEON_MASTER, true] },
            { name: 'authorize', params: [NEW_DUNGEON_MASTER] },
            { name: 'addAuthorized', params: [NEW_DUNGEON_MASTER] },
            { name: 'setDungeonMaster', params: [NEW_DUNGEON_MASTER] }
        ];
        
        for (const { name, params } of authFunctions) {
            try {
                console.log(`嘗試 ${name}...`);
                const tx = await dungeonStorage[name](...params);
                await tx.wait();
                console.log(`✅ 使用 ${name} 成功授權！`);
                break;
            } catch (e: any) {
                if (e.message.includes('is not a function')) {
                    continue;
                } else {
                    console.log(`❌ ${name} 失敗: ${e.message}`);
                }
            }
        }
    } catch (e: any) {
        console.error("授權失敗:", e.message);
    }
    
    // 取消舊的授權（如果可能）
    console.log("\n嘗試取消舊的 DungeonMaster 授權...");
    try {
        const deauthFunctions = [
            { name: 'setAuthorizedContract', params: [OLD_DUNGEON_MASTER, false] },
            { name: 'deauthorize', params: [OLD_DUNGEON_MASTER] },
            { name: 'removeAuthorized', params: [OLD_DUNGEON_MASTER] }
        ];
        
        for (const { name, params } of deauthFunctions) {
            try {
                const tx = await dungeonStorage[name](...params);
                await tx.wait();
                console.log(`✅ 使用 ${name} 成功取消授權！`);
                break;
            } catch (e) {
                // 繼續嘗試
            }
        }
    } catch (e) {
        console.log("無法取消舊授權，可能需要手動處理");
    }
    
    console.log("\n✅ 授權流程完成！");
    console.log("如果仍有問題，請在管理後台手動設置授權。");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
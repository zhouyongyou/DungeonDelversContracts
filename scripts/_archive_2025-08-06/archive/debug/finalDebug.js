const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 最終調試：找出 buyProvisions 失敗的真正原因...\n");
    
    const [signer] = await ethers.getSigners();
    
    // 創建一個簡單的測試合約來模擬 DungeonMaster 的行為
    const TestContract = await ethers.getContractFactory("contracts/Test_SoulShard.sol:TestSoulShard");
    
    // 部署測試合約
    console.log("部署測試合約...");
    const testSoulShard = await TestContract.deploy();
    await testSoulShard.waitForDeployment();
    const testAddress = await testSoulShard.getAddress();
    console.log("測試 SoulShard 地址:", testAddress);
    
    // 給自己一些測試代幣
    console.log("\n鑄造測試代幣...");
    await testSoulShard.mint(signer.address, ethers.parseEther("1000"));
    
    // 創建一個測試合約來模擬 DungeonMaster
    const TestDungeonMaster = await ethers.getContractFactory({
        abi: [
            "function testTransfer(address token, address from, address to, uint256 amount) external"
        ],
        bytecode: "0x608060405234801561001057600080fd5b50610399806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c806371dfeb3414610030575b600080fd5b61004a60048036038101906100459190610280565b61004c565b005b8473ffffffffffffffffffffffffffffffffffffffff1663dd62ed3e85306040518363ffffffff1660e01b815260040161008792919061030f565b602060405180830381865afa1580156100a4573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100c8919061036d565b8210610109576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161010090610323565b60405180910390fd5b8473ffffffffffffffffffffffffffffffffffffffff166323b872dd8585856040518463ffffffff1660e01b815260040161014693929190610343565b6020604051808303816000875af1158015610165573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610189919061031b565b5050505050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101c082610195565b9050919050565b6101d0816101b5565b81146101db57600080fd5b50565b6000813590506101ed816101c7565b92915050565b6101fc816101b5565b811461020757600080fd5b50565b600081359050610219816101f3565b92915050565b6000819050919050565b6102328161021f565b811461023d57600080fd5b50565b60008135905061024f81610229565b92915050565b60008135905061026481610229565b92915050565b600081359050610279816101c7565b92915050565b60008060008060808587031215610299576102986101905b5b60006102a7878288016101de565b94505060206102b88782880161020a565b93505060406102c98782880161026a565b92505060606102da87828801610255565b91505092959194509250565b6102ef816101b5565b82525050565b6102fe816101b5565b82525050565b61030d8161021f565b82525050565b600060408201905061032860008301856102e6565b61033560208301846102f5565b9392505050565b600060608201905061035160008301866102e6565b61035e60208301856102f5565b61036b6040830184610304565b949350505050565b60006020828403121561038957610388610190565b5b600061039784828501610240565b9150509291505056fea26469706673582212203e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e64736f6c63430008140033"
    });
    
    // 授權給真實的 DungeonMaster
    const realDM = "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0";
    const realSoulShard = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
    
    console.log("\n檢查真實合約的版本問題...");
    
    // 使用低層級調用來獲取更多信息
    const provider = ethers.provider;
    
    // 構建 buyProvisions 調用
    const iface = new ethers.Interface([
        "function buyProvisions(uint256 _partyId, uint256 _amount) external"
    ]);
    
    const calldata = iface.encodeFunctionData("buyProvisions", [1, 1]);
    
    console.log("\n執行 debug_traceCall...");
    try {
        // 先執行一個普通的 eth_call
        await provider.call({
            to: realDM,
            from: signer.address,
            data: calldata,
            gasLimit: 3000000
        });
    } catch (error) {
        console.log("eth_call 失敗（預期）");
        console.log("錯誤:", error.message);
        
        // 嘗試獲取更詳細的錯誤
        if (error.error && error.error.data) {
            console.log("\n錯誤數據:", error.error.data);
            
            // 嘗試解碼各種可能的錯誤
            const errorSignatures = [
                "Error(string)",
                "Panic(uint256)",
                "SafeERC20FailedOperation(address)"
            ];
            
            for (const sig of errorSignatures) {
                try {
                    const errorIface = new ethers.Interface([`error ${sig}`]);
                    const decoded = errorIface.parseError(error.error.data);
                    console.log(`\n解碼為 ${sig}:`, decoded);
                } catch (e) {
                    // 忽略解碼失敗
                }
            }
        }
    }
    
    // 最後的嘗試：檢查是否是 OpenZeppelin 版本不匹配
    console.log("\n檢查 OpenZeppelin 版本相關問題...");
    console.log("SafeERC20 在 OpenZeppelin v5 中有重大更改");
    console.log("如果 SoulShard 是用舊版本編譯，而 DungeonMaster 用新版本，可能會有兼容性問題");
    
    // 檢查合約字節碼特徵
    const dmCode = await provider.getCode(realDM);
    const soulShardCode = await provider.getCode(realSoulShard);
    
    console.log("\nDungeonMaster 字節碼長度:", dmCode.length);
    console.log("SoulShard 字節碼長度:", soulShardCode.length);
    
    // 搜索 SafeERC20 的特徵
    const safeTransferFromSelector = "0x23b872dd"; // transferFrom(address,address,uint256)
    const safeERC20ErrorSelector = "0x3b393fcb"; // SafeERC20FailedOperation(address)
    
    console.log("\nDungeonMaster 包含 transferFrom selector:", dmCode.includes(safeTransferFromSelector.slice(2)));
    console.log("DungeonMaster 包含 SafeERC20 error selector:", dmCode.includes(safeERC20ErrorSelector.slice(2)));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
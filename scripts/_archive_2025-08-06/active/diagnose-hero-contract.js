// diagnose-hero-contract.js - Diagnose Hero contract issues
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔍 Diagnosing Hero Contract...\n");
    
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const HERO_ADDRESS = '0xD48867dbac5f1c1351421726B6544f847D9486af';
    
    try {
        // Check if contract exists
        const code = await provider.getCode(HERO_ADDRESS);
        console.log("Contract Code:", code.slice(0, 10) + "...");
        console.log("Contract Exists:", code !== "0x" ? "✅" : "❌");
        
        if (code === "0x") {
            console.log("\n❌ No contract deployed at this address!");
            return;
        }
        
        // Try basic calls with simple ABI
        const minimalABI = [
            'function paused() external view returns (bool)',
            'function owner() external view returns (address)',
            'function name() external view returns (string)',
            'function symbol() external view returns (string)',
            'function vrfManager() external view returns (address)',
            'function dungeonCore() external view returns (address)'
        ];
        
        const hero = new ethers.Contract(HERO_ADDRESS, minimalABI, provider);
        
        console.log("\n📋 Contract State:");
        console.log("=" .repeat(40));
        
        // Try each function separately to identify which one fails
        try {
            const name = await hero.name();
            console.log("Name:", name, "✅");
        } catch (e) {
            console.log("Name: ❌ Error -", e.message);
        }
        
        try {
            const symbol = await hero.symbol();
            console.log("Symbol:", symbol, "✅");
        } catch (e) {
            console.log("Symbol: ❌ Error -", e.message);
        }
        
        try {
            const owner = await hero.owner();
            console.log("Owner:", owner, "✅");
        } catch (e) {
            console.log("Owner: ❌ Error -", e.message);
        }
        
        try {
            const paused = await hero.paused();
            console.log("Paused:", paused ? "⏸️ YES" : "▶️ NO", "✅");
        } catch (e) {
            console.log("Paused: ❌ Error -", e.message);
        }
        
        try {
            const vrfManager = await hero.vrfManager();
            console.log("VRF Manager:", vrfManager, "✅");
        } catch (e) {
            console.log("VRF Manager: ❌ Error -", e.message);
        }
        
        try {
            const dungeonCore = await hero.dungeonCore();
            console.log("DungeonCore:", dungeonCore, "✅");
        } catch (e) {
            console.log("DungeonCore: ❌ Error -", e.message);
        }
        
        // Try totalSupply with raw call
        console.log("\n🔧 Raw Call Test:");
        console.log("=" .repeat(40));
        
        try {
            // totalSupply() selector = 0x18160ddd
            const result = await provider.call({
                to: HERO_ADDRESS,
                data: '0x18160ddd'
            });
            console.log("totalSupply() raw call result:", result);
            
            if (result && result !== '0x') {
                const supply = ethers.toBigInt(result);
                console.log("Decoded totalSupply:", supply.toString());
            }
        } catch (e) {
            console.log("totalSupply() raw call failed:", e.message);
        }
        
    } catch (error) {
        console.error("\n❌ Diagnosis Failed:", error.message);
        if (error.data) {
            console.error("Error Data:", error.data);
        }
    }
}

main()
    .then(() => {
        console.log("\n✅ Diagnosis Complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
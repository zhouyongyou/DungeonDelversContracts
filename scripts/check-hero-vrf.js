// Simple check script
const { ethers } = require('hardhat');

async function main() {
    const heroAddress = '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d';
    const hero = await ethers.getContractAt('Hero', heroAddress);
    
    console.log('Checking Hero contract:', heroAddress);
    
    try {
        const dungeonCore = await hero.dungeonCore();
        console.log('DungeonCore:', dungeonCore);
    } catch (e) {
        console.log('DungeonCore: Not set or error');
    }
    
    try {
        const vrfManager = await hero.vrfManager();
        console.log('VRF Manager:', vrfManager);
    } catch (e) {
        console.log('VRF Manager: Not available in contract');
    }
    
    try {
        const owner = await hero.owner();
        console.log('Owner:', owner);
    } catch (e) {
        console.log('Owner: Error reading');
    }
}

main().catch(console.error);

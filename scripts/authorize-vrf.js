const { ethers } = require('hardhat');

async function main() {
    const vrfManagerAddress = '0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1';
    const heroAddress = '0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d';
    const relicAddress = '0x7a9469587ffd28a69d4420d8893e7a0e92ef6316';
    
    // 簡化的 ABI，只包含需要的函數
    const vrfManagerAbi = [
        "function authorizedContracts(address) view returns (bool)",
        "function setAuthorization(address, bool)",
        "function owner() view returns (address)"
    ];
    
    const vrfManager = await ethers.getContractAt(vrfManagerAbi, vrfManagerAddress);
    
    console.log('Checking VRF Manager authorizations...');
    console.log('VRF Manager:', vrfManagerAddress);
    
    const owner = await vrfManager.owner();
    console.log('VRF Manager owner:', owner);
    
    const [signer] = await ethers.getSigners();
    console.log('Current signer:', signer.address);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log('ERROR: You are not the owner of VRF Manager!');
        console.log('Owner is:', owner);
        console.log('You are:', signer.address);
        return;
    }
    
    const isHeroAuthorized = await vrfManager.authorizedContracts(heroAddress);
    const isRelicAuthorized = await vrfManager.authorizedContracts(relicAddress);
    
    console.log('Hero authorized:', isHeroAuthorized);
    console.log('Relic authorized:', isRelicAuthorized);
    
    if (!isHeroAuthorized) {
        console.log('Authorizing Hero contract...');
        const tx1 = await vrfManager.setAuthorization(heroAddress, true);
        console.log('TX hash:', tx1.hash);
        await tx1.wait();
        console.log('Hero authorized!');
    }
    
    if (!isRelicAuthorized) {
        console.log('Authorizing Relic contract...');
        const tx2 = await vrfManager.setAuthorization(relicAddress, true);
        console.log('TX hash:', tx2.hash);
        await tx2.wait();
        console.log('Relic authorized!');
    }
    
    console.log('Authorization complete!');
}

main().catch(console.error);

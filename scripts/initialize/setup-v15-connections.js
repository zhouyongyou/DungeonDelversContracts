// scripts/initialize/setup-v15-connections.js
// 設定 V15 合約之間的連接

const { ethers } = require("hardhat");

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
    log('\n🔗 設定 V15 合約連接...', 'magenta');
    log('='.repeat(70), 'magenta');
    
    const [deployer] = await ethers.getSigners();
    log(`👤 使用帳號: ${deployer.address}`, 'cyan');
    
    // V15 合約地址
    const addresses = {
        DUNGEON_STORAGE: "0xAfA453cdca0245c858DAeb4d3e21C6360F4d62Eb",
        DUNGEON_MASTER: "0xaeBd33846a4a88Afd1B1c3ACB5D8C5872796E316",
        DUNGEON_CORE: "0xA43edd46Eb4416195bc1BAA3575358EA92CE49dD",
        ORACLE: "0x623caa925445BeACd54Cc6C62Bb725B5d93698af",
        PLAYER_VAULT: "0x34d94193aa59f8a7E34040Ed4F0Ea5B231811388",
        PLAYER_PROFILE: "0x5d4582266654CBEA6cC6Bdf696B68B8473521b63",
        VIP_STAKING: "0x9c2fdD1c692116aB5209983e467286844B3b9921",
        HERO: "0x2b6CB00D10EFB1aF0125a26dfcbd9EBa87e07CD2",
        RELIC: "0xaEa78C3FC4bc50966aC41D76331fD0bf219D00ac",
        PARTY: "0x514AFBb114fa6c77CC025720A31aaeE038fBbcd7"
    };
    
    log('\n📋 V15 合約地址:', 'yellow');
    Object.entries(addresses).forEach(([name, address]) => {
        log(`   ${name}: ${address}`, 'cyan');
    });
    
    // 連接合約
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", addresses.DUNGEON_STORAGE);
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV8", addresses.DUNGEON_MASTER);
    const dungeonCore = await ethers.getContractAt("contracts/core/DungeonCore.sol:DungeonCore", addresses.DUNGEON_CORE);
    
    log('\n🔧 設定 DungeonStorage 連接...', 'yellow');
    
    // 1. 設定 DungeonStorage 的 logicContract 為 DungeonMaster
    try {
        const currentLogicContract = await dungeonStorage.logicContract();
        if (currentLogicContract.toLowerCase() !== addresses.DUNGEON_MASTER.toLowerCase()) {
            log(`⚙️  設定 DungeonStorage.logicContract = ${addresses.DUNGEON_MASTER}`, 'yellow');
            const tx = await dungeonStorage.setLogicContract(addresses.DUNGEON_MASTER);
            await tx.wait();
            log(`✅ DungeonStorage logicContract 設定成功`, 'green');
        } else {
            log(`✅ DungeonStorage logicContract 已正確設定`, 'green');
        }
    } catch (error) {
        log(`❌ 設定 DungeonStorage logicContract 失敗: ${error.message}`, 'red');
    }
    
    log('\n🎮 設定 DungeonMaster 連接...', 'yellow');
    
    // 2. 設定 DungeonMaster 的 DungeonStorage
    try {
        const currentDungeonStorage = await dungeonMaster.dungeonStorage();
        if (currentDungeonStorage.toLowerCase() !== addresses.DUNGEON_STORAGE.toLowerCase()) {
            log(`⚙️  設定 DungeonMaster.dungeonStorage = ${addresses.DUNGEON_STORAGE}`, 'yellow');
            const tx = await dungeonMaster.setDungeonStorage(addresses.DUNGEON_STORAGE);
            await tx.wait();
            log(`✅ DungeonMaster dungeonStorage 設定成功`, 'green');
        } else {
            log(`✅ DungeonMaster dungeonStorage 已正確設定`, 'green');
        }
    } catch (error) {
        log(`❌ 設定 DungeonMaster dungeonStorage 失敗: ${error.message}`, 'red');
    }
    
    // 3. 設定 DungeonMaster 的 DungeonCore
    try {
        const currentDungeonCore = await dungeonMaster.dungeonCore();
        if (currentDungeonCore.toLowerCase() !== addresses.DUNGEON_CORE.toLowerCase()) {
            log(`⚙️  設定 DungeonMaster.dungeonCore = ${addresses.DUNGEON_CORE}`, 'yellow');
            const tx = await dungeonMaster.setDungeonCore(addresses.DUNGEON_CORE);
            await tx.wait();
            log(`✅ DungeonMaster dungeonCore 設定成功`, 'green');
        } else {
            log(`✅ DungeonMaster dungeonCore 已正確設定`, 'green');
        }
    } catch (error) {
        log(`❌ 設定 DungeonMaster dungeonCore 失敗: ${error.message}`, 'red');
    }
    
    log('\n🏰 設定 DungeonCore 連接...', 'yellow');
    
    // 4. 設定 DungeonCore 的各個模組地址
    const coreConnections = [
        { name: 'Oracle', current: await dungeonCore.oracleAddress(), target: addresses.ORACLE, setter: 'setOracle' },
        { name: 'DungeonMaster', current: await dungeonCore.dungeonMasterAddress(), target: addresses.DUNGEON_MASTER, setter: 'setDungeonMaster' },
        { name: 'PlayerVault', current: await dungeonCore.playerVaultAddress(), target: addresses.PLAYER_VAULT, setter: 'setPlayerVault' },
        { name: 'PlayerProfile', current: await dungeonCore.playerProfileAddress(), target: addresses.PLAYER_PROFILE, setter: 'setPlayerProfile' },
        { name: 'VipStaking', current: await dungeonCore.vipStakingAddress(), target: addresses.VIP_STAKING, setter: 'setVipStaking' },
        { name: 'Hero', current: await dungeonCore.heroContractAddress(), target: addresses.HERO, setter: 'setHeroContract' },
        { name: 'Relic', current: await dungeonCore.relicContractAddress(), target: addresses.RELIC, setter: 'setRelicContract' },
        { name: 'Party', current: await dungeonCore.partyContractAddress(), target: addresses.PARTY, setter: 'setPartyContract' }
    ];
    
    for (const connection of coreConnections) {
        try {
            if (connection.current.toLowerCase() !== connection.target.toLowerCase()) {
                log(`⚙️  設定 DungeonCore.${connection.name} = ${connection.target}`, 'yellow');
                const tx = await dungeonCore[connection.setter](connection.target);
                await tx.wait();
                log(`✅ DungeonCore ${connection.name} 設定成功`, 'green');
            } else {
                log(`✅ DungeonCore ${connection.name} 已正確設定`, 'green');
            }
        } catch (error) {
            log(`❌ 設定 DungeonCore ${connection.name} 失敗: ${error.message}`, 'red');
        }
    }
    
    log('\n🔄 設定反向連接（各模組指向 DungeonCore）...', 'yellow');
    
    // 5. 設定各個模組的 DungeonCore 地址
    const moduleConnections = [
        { name: 'Hero', address: addresses.HERO, contractName: 'Hero' },
        { name: 'Relic', address: addresses.RELIC, contractName: 'Relic' },
        { name: 'Party', address: addresses.PARTY, contractName: 'PartyV3' },
        { name: 'PlayerVault', address: addresses.PLAYER_VAULT, contractName: 'PlayerVault' },
        { name: 'PlayerProfile', address: addresses.PLAYER_PROFILE, contractName: 'PlayerProfile' },
        { name: 'VipStaking', address: addresses.VIP_STAKING, contractName: 'VIPStaking' }
    ];
    
    for (const module of moduleConnections) {
        try {
            const contract = await ethers.getContractAt(module.contractName, module.address);
            const currentCore = await contract.dungeonCore();
            
            if (currentCore.toLowerCase() !== addresses.DUNGEON_CORE.toLowerCase()) {
                log(`⚙️  設定 ${module.name}.dungeonCore = ${addresses.DUNGEON_CORE}`, 'yellow');
                const tx = await contract.setDungeonCore(addresses.DUNGEON_CORE);
                await tx.wait();
                log(`✅ ${module.name} dungeonCore 設定成功`, 'green');
            } else {
                log(`✅ ${module.name} dungeonCore 已正確設定`, 'green');
            }
        } catch (error) {
            log(`❌ 設定 ${module.name} dungeonCore 失敗: ${error.message}`, 'red');
        }
    }
    
    log('\n' + '='.repeat(70), 'magenta');
    log('🎉 V15 合約連接設定完成！', 'green');
    log('='.repeat(70), 'magenta');
    
    log('\n🚀 下一步：執行地城初始化腳本', 'yellow');
    log('npx hardhat run scripts/initialize/initialize-dungeons-v15.js --network bsc', 'cyan');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 合約連接設定失敗:', error);
        process.exit(1);
    });
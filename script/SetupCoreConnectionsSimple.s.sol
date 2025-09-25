// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface ISetDungeonCore {
    function setDungeonCore(address _address) external;
}

interface IDungeonCore {
    function setHeroContract(address _address) external;
    function setRelicContract(address _address) external;
    function setPartyContract(address _address) external;
    function setPlayerProfile(address _address) external;
    function setVipStaking(address _address) external;
    function setPlayerVault(address _address) external;
    function setDungeonMaster(address _address) external;
    function setAltarOfAscension(address _address) external;
    function setVRFManager(address _address) external;
    function setDungeonStorage(address _address) external;
}

interface IVRFManager {
    function setAuthorizedContract(address addr, bool auth) external;
}

contract SetupCoreConnectionsSimple is Script {
    // Checksummed addresses
    address constant DUNGEONCORE = 0x6C900a1Cf182aA5960493BF4646C9EFC8eaeD16b;
    address constant DUNGEONMASTER = 0xa573CCF8332A5B1E830eA04A87856a28C99D9b53;
    address constant DUNGEONSTORAGE = 0x8878A235d36F8a44F53D87654fdFb0e3C5b2C791;
    address constant ALTAROFASCENSION = 0x3dfd80271eb96c3be8d1e841643746954ffda11d;
    address constant VRF_MANAGER_V2PLUS = 0xCD6baD326c68ba4f4c07B2d3f9c945364E56840c;

    address constant HERO = 0x52A0Ba2a7efB9519b73E671D924F03575fA64269;
    address constant RELIC = 0x04c6bc2548B9F5C38be2bE0902259D428f1FEc2b;
    address constant PARTY = 0x73953a4daC5339b28E13C38294E758655E62DFDe;

    address constant PLAYERPROFILE = 0xEa827e472937AbD1117f0d4104a76E173724a061;
    address constant VIPSTAKING = 0xd82ef4be9e6d037140bD54Afa04BE983673637Fb;
    address constant PLAYERVAULT = 0x81Dad3AF7EdCf1026fE18977172FB6E24f3Cf7d0;

    function run() external {
        vm.startBroadcast();

        console.log("Starting DungeonDelvers core connections setup...");
        console.log("===============================================");

        setupDungeonCore();
        setupSatelliteConnections();
        setupVRFAuthorizations();

        console.log("\nCore connections setup completed successfully!");
        console.log("Total of 20 setup transactions executed");

        vm.stopBroadcast();
    }

    function setupDungeonCore() internal {
        console.log("\nPhase 1: Setting up DungeonCore...");

        IDungeonCore core = IDungeonCore(DUNGEONCORE);

        core.setHeroContract(HERO);
        console.log("Hero contract configured");

        core.setRelicContract(RELIC);
        console.log("Relic contract configured");

        core.setPartyContract(PARTY);
        console.log("Party contract configured");

        core.setPlayerProfile(PLAYERPROFILE);
        console.log("PlayerProfile contract configured");

        core.setVipStaking(VIPSTAKING);
        console.log("VIPStaking contract configured");

        core.setPlayerVault(PLAYERVAULT);
        console.log("PlayerVault contract configured");

        core.setDungeonMaster(DUNGEONMASTER);
        console.log("DungeonMaster contract configured");

        core.setAltarOfAscension(ALTAROFASCENSION);
        console.log("AltarOfAscension contract configured");

        core.setVRFManager(VRF_MANAGER_V2PLUS);
        console.log("VRFManager contract configured");

        core.setDungeonStorage(DUNGEONSTORAGE);
        console.log("DungeonStorage contract configured");
    }

    function setupSatelliteConnections() internal {
        console.log("\nPhase 2: Setting up satellite connections...");

        ISetDungeonCore(HERO).setDungeonCore(DUNGEONCORE);
        console.log("Hero -> DungeonCore connection established");

        ISetDungeonCore(RELIC).setDungeonCore(DUNGEONCORE);
        console.log("Relic -> DungeonCore connection established");

        ISetDungeonCore(PARTY).setDungeonCore(DUNGEONCORE);
        console.log("Party -> DungeonCore connection established");

        ISetDungeonCore(PLAYERPROFILE).setDungeonCore(DUNGEONCORE);
        console.log("PlayerProfile -> DungeonCore connection established");

        ISetDungeonCore(VIPSTAKING).setDungeonCore(DUNGEONCORE);
        console.log("VIPStaking -> DungeonCore connection established");

        ISetDungeonCore(PLAYERVAULT).setDungeonCore(DUNGEONCORE);
        console.log("PlayerVault -> DungeonCore connection established");

        ISetDungeonCore(DUNGEONMASTER).setDungeonCore(DUNGEONCORE);
        console.log("DungeonMaster -> DungeonCore connection established");

        ISetDungeonCore(ALTAROFASCENSION).setDungeonCore(DUNGEONCORE);
        console.log("AltarOfAscension -> DungeonCore connection established");

        ISetDungeonCore(VRF_MANAGER_V2PLUS).setDungeonCore(DUNGEONCORE);
        console.log("VRFManager -> DungeonCore connection established");
    }

    function setupVRFAuthorizations() internal {
        console.log("\nPhase 3: Setting up VRF authorizations...");

        IVRFManager vrf = IVRFManager(VRF_MANAGER_V2PLUS);

        vrf.setAuthorizedContract(DUNGEONMASTER, true);
        console.log("DungeonMaster VRF authorization granted");

        vrf.setAuthorizedContract(ALTAROFASCENSION, true);
        console.log("AltarOfAscension VRF authorization granted");
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IDungeonCore {
    function heroContractAddress() external view returns (address);
    function relicContractAddress() external view returns (address);
    function partyContractAddress() external view returns (address);
    function playerProfileAddress() external view returns (address);
    function vipStakingAddress() external view returns (address);
    function playerVaultAddress() external view returns (address);
    function dungeonMasterAddress() external view returns (address);
    function altarOfAscensionAddress() external view returns (address);
    function vrfManager() external view returns (address);
    function dungeonStorageAddress() external view returns (address);
    function oracleAddress() external view returns (address);
}

interface IHasCore {
    function dungeonCore() external view returns (address);
}

interface IHasCoreContract {
    function dungeonCoreContract() external view returns (address);
}

interface IVRFManager {
    function authorized(address) external view returns (bool);
}

contract VerifyConnectionsSimple is Script {
    address constant DUNGEONCORE = 0x6C900a1Cf182aA5960493BF4646C9EFC8eaeD16b;
    address constant DUNGEONMASTER = 0xa573CCF8332A5B1E830eA04A87856a28C99D9b53;
    address constant DUNGEONSTORAGE = 0x8878A235d36F8a44F53D87654fdFb0e3C5b2C791;
    address constant ALTAROFASCENSION = 0x66BEbb3EaF6d3De769Ae1De1D4f8471dc24C8ebf;
    address constant VRF_MANAGER_V2PLUS = 0xCD6baD326c68ba4f4c07B2d3f9c945364E56840c;
    address constant ORACLE = 0x21928dE992CB31EdE864B62BC94002FB449c2738;

    address constant HERO = 0x52A0Ba2a7efB9519b73E671D924F03575fA64269;
    address constant RELIC = 0x04c6bc2548B9F5C38be2bE0902259D428f1FEc2b;
    address constant PARTY = 0x73953a4daC5339b28E13C38294E758655E62DFDe;

    address constant PLAYERPROFILE = 0xEa827e472937AbD1117f0d4104a76E173724a061;
    address constant VIPSTAKING = 0xd82ef4be9e6d037140bD54Afa04BE983673637Fb;
    address constant PLAYERVAULT = 0x81Dad3AF7EdCf1026fE18977172FB6E24f3Cf7d0;

    function run() external view {
        console.log("Verifying DungeonDelvers contract connections...");
        console.log("===============================================");

        uint256 passedChecks = 0;
        uint256 totalChecks = 21;

        passedChecks += verifyDungeonCoreConnections();
        passedChecks += verifySatelliteConnections();
        passedChecks += verifyVRFAuthorizations();

        console.log("\nVerification Summary:");
        console.log("===============================================");
        if (passedChecks == totalChecks) {
            console.log("All connections verified successfully! (%d/%d)", passedChecks, totalChecks);
            console.log("System is ready for functional testing");
        } else {
            console.log("Some connections failed verification! (%d/%d)", passedChecks, totalChecks);
            console.log("Please check failed connections and reconfigure");
        }
    }

    function verifyDungeonCoreConnections() internal view returns (uint256) {
        console.log("\nVerifying DungeonCore satellite contracts setup...");

        IDungeonCore core = IDungeonCore(DUNGEONCORE);
        uint256 passed = 0;

        if (core.heroContractAddress() == HERO) {
            console.log("[OK] Hero contract address is correct");
            passed++;
        } else {
            console.log("[ERR] Hero contract address is incorrect");
            console.log("  Expected:", HERO);
            console.log("  Actual  :", core.heroContractAddress());
        }

        if (core.relicContractAddress() == RELIC) {
            console.log("[OK] Relic contract address is correct");
            passed++;
        } else {
            console.log("[ERR] Relic contract address is incorrect");
            console.log("  Expected:", RELIC);
            console.log("  Actual  :", core.relicContractAddress());
        }

        if (core.partyContractAddress() == PARTY) {
            console.log("[OK] Party contract address is correct");
            passed++;
        } else {
            console.log("[ERR] Party contract address is incorrect");
            console.log("  Expected:", PARTY);
            console.log("  Actual  :", core.partyContractAddress());
        }

        if (core.playerProfileAddress() == PLAYERPROFILE) {
            console.log("[OK] PlayerProfile contract address is correct");
            passed++;
        } else {
            console.log("[ERR] PlayerProfile contract address is incorrect");
            console.log("  Expected:", PLAYERPROFILE);
            console.log("  Actual  :", core.playerProfileAddress());
        }

        if (core.vipStakingAddress() == VIPSTAKING) {
            console.log("[OK] VIPStaking contract address is correct");
            passed++;
        } else {
            console.log("[ERR] VIPStaking contract address is incorrect");
            console.log("  Expected:", VIPSTAKING);
            console.log("  Actual  :", core.vipStakingAddress());
        }

        if (core.playerVaultAddress() == PLAYERVAULT) {
            console.log("[OK] PlayerVault contract address is correct");
            passed++;
        } else {
            console.log("[ERR] PlayerVault contract address is incorrect");
            console.log("  Expected:", PLAYERVAULT);
            console.log("  Actual  :", core.playerVaultAddress());
        }

        if (core.dungeonMasterAddress() == DUNGEONMASTER) {
            console.log("[OK] DungeonMaster contract address is correct");
            passed++;
        } else {
            console.log("[ERR] DungeonMaster contract address is incorrect");
            console.log("  Expected:", DUNGEONMASTER);
            console.log("  Actual  :", core.dungeonMasterAddress());
        }

        if (core.altarOfAscensionAddress() == ALTAROFASCENSION) {
            console.log("[OK] AltarOfAscension contract address is correct");
            passed++;
        } else {
            console.log("[ERR] AltarOfAscension contract address is incorrect");
            console.log("  Expected:", ALTAROFASCENSION);
            console.log("  Actual  :", core.altarOfAscensionAddress());
        }

        if (core.vrfManager() == VRF_MANAGER_V2PLUS) {
            console.log("[OK] VRFManager contract address is correct");
            passed++;
        } else {
            console.log("[ERR] VRFManager contract address is incorrect");
            console.log("  Expected:", VRF_MANAGER_V2PLUS);
            console.log("  Actual  :", core.vrfManager());
        }

        if (core.dungeonStorageAddress() == DUNGEONSTORAGE) {
            console.log("[OK] DungeonStorage contract address is correct");
            passed++;
        } else {
            console.log("[ERR] DungeonStorage contract address is incorrect");
            console.log("  Expected:", DUNGEONSTORAGE);
            console.log("  Actual  :", core.dungeonStorageAddress());
        }

        if (core.oracleAddress() == ORACLE) {
            console.log("[OK] Oracle contract address is correct");
            passed++;
        } else {
            console.log("[ERR] Oracle contract address is incorrect");
            console.log("  Expected:", ORACLE);
            console.log("  Actual  :", core.oracleAddress());
        }

        return passed;
    }

    function verifySatelliteConnections() internal view returns (uint256) {
        console.log("\nVerifying satellite contracts DungeonCore setup...");
        uint256 passed = 0;

        if (IHasCore(HERO).dungeonCore() == DUNGEONCORE) {
            console.log("[OK] Hero -> DungeonCore connection is correct");
            passed++;
        } else {
            console.log("[ERR] Hero -> DungeonCore connection is incorrect");
        }

        if (IHasCore(RELIC).dungeonCore() == DUNGEONCORE) {
            console.log("[OK] Relic -> DungeonCore connection is correct");
            passed++;
        } else {
            console.log("[ERR] Relic -> DungeonCore connection is incorrect");
        }

        if (IHasCoreContract(PARTY).dungeonCoreContract() == DUNGEONCORE) {
            console.log("[OK] Party -> DungeonCore connection is correct");
            passed++;
        } else {
            console.log("[ERR] Party -> DungeonCore connection is incorrect");
        }

        if (IHasCore(PLAYERPROFILE).dungeonCore() == DUNGEONCORE) {
            console.log("[OK] PlayerProfile -> DungeonCore connection is correct");
            passed++;
        } else {
            console.log("[ERR] PlayerProfile -> DungeonCore connection is incorrect");
        }

        if (IHasCore(VIPSTAKING).dungeonCore() == DUNGEONCORE) {
            console.log("[OK] VIPStaking -> DungeonCore connection is correct");
            passed++;
        } else {
            console.log("[ERR] VIPStaking -> DungeonCore connection is incorrect");
        }

        if (IHasCore(PLAYERVAULT).dungeonCore() == DUNGEONCORE) {
            console.log("[OK] PlayerVault -> DungeonCore connection is correct");
            passed++;
        } else {
            console.log("[ERR] PlayerVault -> DungeonCore connection is incorrect");
        }

        if (IHasCore(DUNGEONMASTER).dungeonCore() == DUNGEONCORE) {
            console.log("[OK] DungeonMaster -> DungeonCore connection is correct");
            passed++;
        } else {
            console.log("[ERR] DungeonMaster -> DungeonCore connection is incorrect");
        }

        if (IHasCore(ALTAROFASCENSION).dungeonCore() == DUNGEONCORE) {
            console.log("[OK] AltarOfAscension -> DungeonCore connection is correct");
            passed++;
        } else {
            console.log("[ERR] AltarOfAscension -> DungeonCore connection is incorrect");
        }

        if (IHasCore(VRF_MANAGER_V2PLUS).dungeonCore() == DUNGEONCORE) {
            console.log("[OK] VRFManager -> DungeonCore connection is correct");
            passed++;
        } else {
            console.log("[ERR] VRFManager -> DungeonCore connection is incorrect");
        }

        return passed;
    }

    function verifyVRFAuthorizations() internal view returns (uint256) {
        console.log("\nVerifying VRF authorization setup...");
        uint256 passed = 0;

        IVRFManager vrf = IVRFManager(VRF_MANAGER_V2PLUS);

        if (vrf.authorized(DUNGEONMASTER)) {
            console.log("[OK] DungeonMaster VRF authorization is correct");
            passed++;
        } else {
            console.log("[ERR] DungeonMaster VRF authorization is incorrect");
        }

        if (vrf.authorized(ALTAROFASCENSION)) {
            console.log("[OK] AltarOfAscension VRF authorization is correct");
            passed++;
        } else {
            console.log("[ERR] AltarOfAscension VRF authorization is incorrect");
        }

        return passed;
    }
}
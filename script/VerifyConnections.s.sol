// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/current/core/DungeonCore.sol";
import "../contracts/current/nft/Hero.sol";
import "../contracts/current/nft/Relic.sol";
import "../contracts/current/nft/Party.sol";
import "../contracts/current/nft/PlayerProfile.sol";
import "../contracts/current/nft/VIPStaking.sol";
import "../contracts/current/defi/PlayerVault.sol";
import "../contracts/current/core/DungeonMaster.sol";
import "../contracts/current/core/AltarOfAscension.sol";
import "../contracts/current/core/VRFConsumerV2Plus.sol";

/**
 * 🔍 DungeonDelvers 連接驗證腳本
 *
 * 執行方式：
 * forge script script/VerifyConnections.s.sol:VerifyConnections --rpc-url $BSC_RPC_URL -vvvv
 */
contract VerifyConnections is Script {

    // 合約地址
    address constant DUNGEONCORE = 0x6c900a1cf182aa5960493bf4646c9efc8eaed16b;
    address constant DUNGEONMASTER = 0xa573ccf8332a5b1e830ea04a87856a28c99d9b53;
    address constant DUNGEONSTORAGE = 0x8878a235d36f8a44f53d87654fdfb0e3c5b2c791;
    address constant ALTAROFASCENSION = 0x1357c546ce8cd529a1914e53f98405e1ebfbfc53;
    address constant VRF_MANAGER_V2PLUS = 0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c;

    address constant HERO = 0x52a0ba2a7efb9519b73e671d924f03575fa64269;
    address constant RELIC = 0x04c6bc2548b9f5c38be2be0902259d428f1fec2b;
    address constant PARTY = 0x73953a4dac5339b28e13c38294e758655e62dfde;

    address constant PLAYERPROFILE = 0xea827e472937abd1117f0d4104a76e173724a061;
    address constant VIPSTAKING = 0xd82ef4be9e6d037140bd54afa04be983673637fb;
    address constant PLAYERVAULT = 0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0;

    function run() external view {
        console.log("Starting DungeonDelvers contract connections verification...");
        console.log("===============================================");

        uint256 passedChecks = 0;
        uint256 totalChecks = 20;

        passedChecks += verifyDungeonCoreConnections();
        passedChecks += verifySatelliteConnections();
        passedChecks += verifyVRFAuthorizations();

        console.log("\nVerification Summary:");
        console.log("===============================================");
        if (passedChecks == totalChecks) {
            console.log("All connection verifications passed! (%d/%d)", passedChecks, totalChecks);
            console.log("System ready for testing");
        } else {
            console.log("Some connection verifications failed! (%d/%d)", passedChecks, totalChecks);
            console.log("Please check failed connections and reconfigure");
        }
    }

    function verifyDungeonCoreConnections() internal view returns (uint256) {
        console.log("\nVerifying satellite contract addresses in DungeonCore...");

        DungeonCore dungeonCore = DungeonCore(DUNGEONCORE);
        uint256 passed = 0;

        // 驗證 NFT 系統
        if (dungeonCore.heroContractAddress() == HERO) {
            console.log("Hero contract address configured correctly");
            passed++;
        } else {
            console.log("ERROR: Hero contract address misconfigured");
        }

        if (dungeonCore.relicContractAddress() == RELIC) {
            console.log("Relic contract address configured correctly");
            passed++;
        } else {
            console.log("ERROR: Relic contract address misconfigured");
        }

        if (dungeonCore.partyContractAddress() == PARTY) {
            console.log("Party contract address configured correctly");
            passed++;
        } else {
            console.log("ERROR: Party contract address misconfigured");
        }

        // 驗證玩家系統
        if (dungeonCore.playerProfileAddress() == PLAYERPROFILE) {
            console.log("PlayerProfile contract address configured correctly");
            passed++;
        } else {
            console.log("ERROR: PlayerProfile contract address misconfigured");
        }

        if (dungeonCore.vipStakingAddress() == VIPSTAKING) {
            console.log("VIPStaking contract address configured correctly");
            passed++;
        } else {
            console.log("ERROR: VIPStaking contract address misconfigured");
        }

        if (dungeonCore.playerVaultAddress() == PLAYERVAULT) {
            console.log("PlayerVault contract address configured correctly");
            passed++;
        } else {
            console.log("ERROR: PlayerVault contract address misconfigured");
        }

        // 驗證遊戲系統
        if (dungeonCore.dungeonMasterAddress() == DUNGEONMASTER) {
            console.log("DungeonMaster contract address configured correctly");
            passed++;
        } else {
            console.log("ERROR: DungeonMaster contract address misconfigured");
        }

        if (dungeonCore.altarOfAscensionAddress() == ALTAROFASCENSION) {
            console.log("AltarOfAscension contract address configured correctly");
            passed++;
        } else {
            console.log("ERROR: AltarOfAscension contract address misconfigured");
        }

        if (dungeonCore.vrfManager() == VRF_MANAGER_V2PLUS) {
            console.log("VRFManager contract address configured correctly");
            passed++;
        } else {
            console.log("ERROR: VRFManager contract address misconfigured");
        }

        if (dungeonCore.dungeonStorageAddress() == DUNGEONSTORAGE) {
            console.log("DungeonStorage contract address configured correctly");
            passed++;
        } else {
            console.log("ERROR: DungeonStorage contract address misconfigured");
        }

        return passed;
    }

    function verifySatelliteConnections() internal view returns (uint256) {
        console.log("\nVerifying satellite DungeonCore connections...");
        uint256 passed = 0;

        // NFT System
        if (Hero(HERO).dungeonCore() == DUNGEONCORE) {
            console.log("OK: Hero to DungeonCore connected correctly");
            passed++;
        } else {
            console.log("ERROR: Hero to DungeonCore connection failed");
        }

        if (Relic(RELIC).dungeonCore() == DUNGEONCORE) {
            console.log("OK: Relic to DungeonCore connected correctly");
            passed++;
        } else {
            console.log("ERROR: Relic to DungeonCore connection failed");
        }

        if (Party(PARTY).dungeonCore() == DUNGEONCORE) {
            console.log("OK: Party to DungeonCore connected correctly");
            passed++;
        } else {
            console.log("ERROR: Party to DungeonCore connection failed");
        }

        // Player System
        if (PlayerProfile(PLAYERPROFILE).dungeonCore() == DUNGEONCORE) {
            console.log("OK: PlayerProfile to DungeonCore connected correctly");
            passed++;
        } else {
            console.log("ERROR: PlayerProfile to DungeonCore connection failed");
        }

        if (VIPStaking(VIPSTAKING).dungeonCore() == DUNGEONCORE) {
            console.log("OK: VIPStaking to DungeonCore connected correctly");
            passed++;
        } else {
            console.log("ERROR: VIPStaking to DungeonCore connection failed");
        }

        if (PlayerVault(PLAYERVAULT).dungeonCore() == DUNGEONCORE) {
            console.log("OK: PlayerVault to DungeonCore connected correctly");
            passed++;
        } else {
            console.log("ERROR: PlayerVault to DungeonCore connection failed");
        }

        // Game System
        if (DungeonMaster(DUNGEONMASTER).dungeonCore() == DUNGEONCORE) {
            console.log("OK: DungeonMaster to DungeonCore connected correctly");
            passed++;
        } else {
            console.log("ERROR: DungeonMaster to DungeonCore connection failed");
        }

        if (AltarOfAscension(ALTAROFASCENSION).dungeonCore() == DUNGEONCORE) {
            console.log("OK: AltarOfAscension to DungeonCore connected correctly");
            passed++;
        } else {
            console.log("ERROR: AltarOfAscension to DungeonCore connection failed");
        }

        if (VRFConsumerV2Plus(VRF_MANAGER_V2PLUS).dungeonCore() == DUNGEONCORE) {
            console.log("OK: VRFManager to DungeonCore connected correctly");
            passed++;
        } else {
            console.log("ERROR: VRFManager to DungeonCore connection failed");
        }

        return passed;
    }

    function verifyVRFAuthorizations() internal view returns (uint256) {
        console.log("\nVerifying VRF authorization settings...");
        uint256 passed = 0;

        VRFConsumerV2Plus vrfManager = VRFConsumerV2Plus(VRF_MANAGER_V2PLUS);

        if (vrfManager.authorizedContracts(DUNGEONMASTER)) {
            console.log("OK: DungeonMaster VRF authorization correct");
            passed++;
        } else {
            console.log("ERROR: DungeonMaster VRF authorization failed");
        }

        if (vrfManager.authorizedContracts(ALTAROFASCENSION)) {
            console.log("OK: AltarOfAscension VRF authorization correct");
            passed++;
        } else {
            console.log("ERROR: AltarOfAscension VRF authorization failed");
        }

        return passed;
    }
}
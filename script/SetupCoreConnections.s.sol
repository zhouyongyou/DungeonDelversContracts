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
 * Game DungeonDelvers 核心連接設置腳本 (Foundry 版本)
 *
 * 執行方式：
 * forge script script/SetupCoreConnections.s.sol:SetupCoreConnections --rpc-url $BSC_RPC_URL --private-key $PRIVATE_KEY --broadcast -vvvv
 */
contract SetupCoreConnections is Script {

    // Target 新部署的合約地址
    address constant DUNGEONCORE = 0x6C900a1Cf182aA5960493BF4646C9EFC8eaeD16b;
    address constant DUNGEONMASTER = 0xa573CCF8332A5B1E830eA04A87856a28C99D9b53;
    address constant DUNGEONSTORAGE = 0x8878A235d36F8a44F53D87654fdFb0e3C5b2C791;
    address constant ALTAROFASCENSION = 0x1357C546CE8Cd529A1914e53f98405E1eBFbFC53;
    address constant VRF_MANAGER_V2PLUS = 0xCD6baD326c68ba4f4c07B2d3f9c945364E56840c;

    address payable constant HERO = payable(0x52A0Ba2a7efB9519b73E671D924F03575fA64269);
    address payable constant RELIC = payable(0x04C6bc2548B9F5c38Be2BE0902259D428F1FeC2B);
    address payable constant PARTY = payable(0x73953A4DAc5339B28e13c38294E758655e62DfDe);

    address payable constant PLAYERPROFILE = payable(0xea827e472937abD1117F0d4104a76e173724a061);
    address payable constant VIPSTAKING = payable(0xd82eF4BE9E6D037140Bd54Afa04BE983673637FB);
    address payable constant PLAYERVAULT = payable(0x81dad3aF7EDcF1026fE18977172FB6E24f3cf7d0);

    function run() external {
        vm.startBroadcast();

        console.log("Starting DungeonDelvers core connections setup...");
        console.log("===============================================");

        setupDungeonCoreConnections();
        setupSatelliteConnections();
        setupVRFAuthorizations();

        console.log("\nCore connections setup completed successfully!");
        console.log("Total of 20 setup transactions executed");

        vm.stopBroadcast();
    }

    function setupDungeonCoreConnections() internal {
        console.log("\nPhase 1: Setting up all satellite contracts in DungeonCore...");

        DungeonCore dungeonCore = DungeonCore(DUNGEONCORE);

        // 設置 NFT 系統地址
        console.log("Setting up NFT system contracts...");
        dungeonCore.setHeroContract(HERO);
        console.log("Hero contract configured");

        dungeonCore.setRelicContract(RELIC);
        console.log("Relic contract configured");

        dungeonCore.setPartyContract(PARTY);
        console.log("Party contract configured");

        // 設置玩家系統地址
        console.log("\nSetting up player system contracts...");
        dungeonCore.setPlayerProfile(PLAYERPROFILE);
        console.log("PlayerProfile contract configured");

        dungeonCore.setVipStaking(VIPSTAKING);
        console.log("VIPStaking contract configured");

        dungeonCore.setPlayerVault(PLAYERVAULT);
        console.log("PlayerVault contract configured");

        // 設置遊戲系統地址
        console.log("\nSetting up game system contracts...");
        dungeonCore.setDungeonMaster(DUNGEONMASTER);
        console.log("DungeonMaster contract configured");

        dungeonCore.setAltarOfAscension(ALTAROFASCENSION);
        console.log("AltarOfAscension contract configured");

        dungeonCore.setVRFManager(VRF_MANAGER_V2PLUS);
        console.log("VRFManager contract configured");

        dungeonCore.setDungeonStorage(DUNGEONSTORAGE);
        console.log("DungeonStorage contract configured");
    }

    function setupSatelliteConnections() internal {
        console.log("\nPhase 2: Setting DungeonCore address in all satellite contracts...");

        // NFT 系統
        console.log("Configuring NFT system contracts...");
        Hero(HERO).setDungeonCore(DUNGEONCORE);
        console.log("Hero -> DungeonCore connection established");

        Relic(RELIC).setDungeonCore(DUNGEONCORE);
        console.log("Relic -> DungeonCore connection established");

        Party(PARTY).setDungeonCore(DUNGEONCORE);
        console.log("Party -> DungeonCore connection established");

        // 玩家系統
        console.log("\nConfiguring player system contracts...");
        PlayerProfile(PLAYERPROFILE).setDungeonCore(DUNGEONCORE);
        console.log("PlayerProfile -> DungeonCore connection established");

        VIPStaking(VIPSTAKING).setDungeonCore(DUNGEONCORE);
        console.log("VIPStaking -> DungeonCore connection established");

        PlayerVault(PLAYERVAULT).setDungeonCore(DUNGEONCORE);
        console.log("PlayerVault -> DungeonCore connection established");

        // 遊戲系統
        console.log("\nConfiguring game system contracts...");
        DungeonMaster(DUNGEONMASTER).setDungeonCore(DUNGEONCORE);
        console.log("DungeonMaster -> DungeonCore connection established");

        AltarOfAscension(ALTAROFASCENSION).setDungeonCore(DUNGEONCORE);
        console.log("AltarOfAscension -> DungeonCore connection established");

        VRFConsumerV2Plus(VRF_MANAGER_V2PLUS).setDungeonCore(DUNGEONCORE);
        console.log("VRFManager -> DungeonCore connection established");
    }

    function setupVRFAuthorizations() internal {
        console.log("\nPhase 3: Setting up VRF authorizations...");

        VRFConsumerV2Plus vrfManager = VRFConsumerV2Plus(VRF_MANAGER_V2PLUS);

        // 授權需要隨機數的合約
        vrfManager.setAuthorizedContract(DUNGEONMASTER, true);
        console.log("DungeonMaster VRF authorization granted");

        vrfManager.setAuthorizedContract(ALTAROFASCENSION, true);
        console.log("AltarOfAscension VRF authorization granted");
    }
}
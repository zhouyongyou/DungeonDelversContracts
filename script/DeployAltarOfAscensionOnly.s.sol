// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/current/core/AltarOfAscension.sol";

/**
 * @title DeployAltarOfAscensionOnly
 * @notice Script to deploy only AltarOfAscension contract
 *
 * Usage:
 * forge script script/DeployAltarOfAscensionOnly.s.sol:DeployAltarOfAscensionOnly --rpc-url https://bsc-dataseed1.binance.org/ --private-key $PRIVATE_KEY --broadcast --verify -vvv
 */
contract DeployAltarOfAscensionOnly is Script {

    function run() external returns (address) {
        vm.startBroadcast();

        console.log("Deploying AltarOfAscension contract...");
        console.log("Deployer address:", msg.sender);
        console.log("===============================================");

        // Deploy AltarOfAscension
        AltarOfAscension altarOfAscension = new AltarOfAscension();

        console.log("AltarOfAscension deployed at:", address(altarOfAscension));
        console.log("===============================================");
        console.log("Deployment completed successfully!");

        vm.stopBroadcast();

        return address(altarOfAscension);
    }
}
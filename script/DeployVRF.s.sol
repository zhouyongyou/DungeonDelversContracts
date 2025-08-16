// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/current/core/VRFManagerV2PlusFixed.sol";

contract DeployVRF is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address wrapper = 0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94;
        
        vm.startBroadcast(deployerPrivateKey);
        
        VRFManagerV2PlusFixed vrfManager = new VRFManagerV2PlusFixed(wrapper);
        
        console.log("VRFManagerV2PlusFixed deployed at:", address(vrfManager));
        
        // Set authorized contracts
        vrfManager.setAuthorizedContract(0x575e7407C06ADeb47067AD19663af50DdAe460CF, true); // Hero
        vrfManager.setAuthorizedContract(0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739, true); // Relic
        vrfManager.setAuthorizedContract(0xE391261741Fad5FCC2D298d00e8c684767021253, true); // DungeonMaster
        
        vm.stopBroadcast();
    }
}
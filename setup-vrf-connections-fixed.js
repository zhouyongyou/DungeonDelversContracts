
// 設置 VRF 連接
const vrfManagerAddress = "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD";
const heroAddress = "0xcaF37D9D8356eE18938466F4590A69Bf84C35E15";
const relicAddress = "0xfA0F9E7bb19761A731be73FD04d6FF38ebF0555A";
const dungeonMasterAddress = "0x8DcE0E0b3063e84f85A419833e72D044d9Cdc816";
const altarAddress = "0x21EB6D4EE01aA881539d6aeA275618EDAE9cB3E1";

// 在 VRFManager 授權合約
await vrfManager.authorizeContract(heroAddress);
await vrfManager.authorizeContract(relicAddress);
await vrfManager.authorizeContract(dungeonMasterAddress);
await vrfManager.authorizeContract(altarAddress);

// 在各合約設置 VRFManager
await hero.setVRFManager(vrfManagerAddress);
await relic.setVRFManager(vrfManagerAddress);
await dungeonMaster.setVRFManager(vrfManagerAddress);
await altar.setVRFManager(vrfManagerAddress);

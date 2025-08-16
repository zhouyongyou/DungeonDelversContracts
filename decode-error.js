const { ethers } = require("ethers");

// 解碼錯誤
const errorData = "0x118cdaa7000000000000000000000000fa8d78a9245f19b42529f7c17dfaa7152860ab5a";

// 0x118cdaa7 是 OwnableUnauthorizedAccount(address) 的選擇器
const errorSignature = errorData.slice(0, 10);
const addressData = "0x" + errorData.slice(10);

console.log("錯誤簽名:", errorSignature);
console.log("錯誤名稱: OwnableUnauthorizedAccount");
console.log("未授權的地址:", ethers.getAddress("0x" + addressData.slice(26)));
console.log("\n這表示 Hero 合約 (0xfA8D78A9245F19B42529f7C17DFaA7152860aB5A)");
console.log("正在嘗試調用某個函數，但它不是該函數的 owner");

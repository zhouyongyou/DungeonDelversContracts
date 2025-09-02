const { ethers } = require("ethers");

async function checkOwner() {
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
  
  const heroAddress = "0xfA8D78A9245F19B42529f7C17DFaA7152860aB5A";
  const abi = ["function owner() view returns (address)"];
  
  const contract = new ethers.Contract(heroAddress, abi, provider);
  
  try {
    const owner = await contract.owner();
    console.log("Hero 合約 Owner:", owner);
    console.log("當前錢包地址:", "0xEbCF4A36Ad1485A9737025e9d72186b604487274");
    console.log("是否匹配:", owner.toLowerCase() === "0xEbCF4A36Ad1485A9737025e9d72186b604487274".toLowerCase());
  } catch (e) {
    console.log("Error:", e.message);
  }
}

checkOwner();

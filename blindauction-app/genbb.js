const ethers = require("ethers");
const bidAmount = ethers.utils.parseEther("0.021"); // Replace 1 with your bid amount
const secret = ethers.utils.formatBytes32String("zor"); // Replace with your secret
const blindedBid = ethers.utils.solidityKeccak256(
  ["uint256", "bytes32"],
  [bidAmount, secret]
);
console.log(blindedBid);

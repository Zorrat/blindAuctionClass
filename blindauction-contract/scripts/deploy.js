const hre = require("hardhat");

async function main() {
  const BlindAuction = await hre.ethers.getContractFactory("BlindAuction");
  const blindAuction = await BlindAuction.deploy();

  await blindAuction.deployed();

  console.log("BlindAuction deployed to:", blindAuction.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [organizer, worker] = await hre.ethers.getSigners();

  const MPC = await hre.ethers.getContractFactory("MPC");
  // We deposit only 0.001 ETH on deployment
  const depositWei = hre.ethers.utils.parseEther("0.001");

  const mpc = await MPC.deploy(worker.address, {
    value: depositWei,
  });

  await mpc.deployed();

  console.log("MPC contract deployed to:", mpc.address);
  console.log("Organizer (deployer):", organizer.address);
  console.log("Worker (recipient):", worker.address);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

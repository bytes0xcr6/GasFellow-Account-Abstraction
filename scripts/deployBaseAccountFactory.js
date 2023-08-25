const hre = require("hardhat");
const { ethers } = require("hardhat");

// Constants
const GFALProxy = process.env.PROXY_ADDRESS;

async function main() {
  const BasicWalletFactory = await hre.ethers.getContractFactory(
    "BasicWalletFactory"
  );
  const basicWalletFactory = await BasicWalletFactory.deploy(GFALProxy);

  console.log(`BasicWalletFactory deployed to ${basicWalletFactory.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

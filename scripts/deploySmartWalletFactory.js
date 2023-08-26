const { ethers } = require("hardhat");

async function main() {
  const CHAIN_ID = process.env.CHAIN_ID;
  const [Bundler] = await ethers.getSigners();

  const SmartWalletFactory = await ethers.getContractFactory(
    "SmartWalletFactory",
    Bundler
  );
  const smartWalletFactory = await SmartWalletFactory.deploy(CHAIN_ID);

  console.log(`SmartWalletFactory deployed to ${smartWalletFactory.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

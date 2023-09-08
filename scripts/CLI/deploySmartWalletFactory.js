const {
  ethers
} = require("hardhat");



async function main(Bundler, feeData) {
  const CHAIN_ID = process.env.CHAIN_ID;

  const SmartWalletFactory = await ethers.getContractFactory(
    "SmartWalletFactory",
    Bundler
  );
  const smartWalletFactory = await SmartWalletFactory.deploy(CHAIN_ID, {gasPrice: 5000000000});

  await smartWalletFactory.deployed()
  // console.log(`SmartWalletFactory deployed to ${smartWalletFactory.address}`);
  return smartWalletFactory
}

module.exports = {
  main
};
const {
  ethers
} = require("hardhat");
const {
  Provider
} = require("../config");



async function main(Bundler) {
  const chain = await Provider.detectNetwork();
  const SmartWalletFactory = await ethers.getContractFactory(
    "SmartWalletFactory",
    Bundler
  );
  const smartWalletFactory = await SmartWalletFactory.deploy(chain.chainId, {
    gasPrice: 5000000000
  });

  await smartWalletFactory.deployed()
  // console.log(`SmartWalletFactory deployed to ${smartWalletFactory.address}`);
  return smartWalletFactory
}

module.exports = {
  main
};
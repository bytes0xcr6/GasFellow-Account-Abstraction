const {
  ethers
} = require("hardhat");
const {
  Owner,
  CHAIN_ID,
  priceFeedProxyAddress,
  ERC20Address
} = require("./config")

// This Script will deploy a Smart Wallet without passing through the Smart Wallet Factory.
async function main() {
  const signers = await ethers.getSigners();
  const Bundler = signers[0];

  console.log("Smat Wallet Owner: ", Owner);
  console.log("Bundler: ", Bundler.address);

  const SmartWallet = await ethers.getContractFactory("SmartWallet", Bundler);
  const smartWallet = await SmartWallet.deploy(
    Owner,
    priceFeedProxyAddress,
    CHAIN_ID,
    ERC20Address
  );
  await smartWallet.deployed();

  console.log(
    `\nBaseAccount for USER ${Owner} deployed to ${smartWallet.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
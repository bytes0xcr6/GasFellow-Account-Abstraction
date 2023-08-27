const { ethers } = require("hardhat");

// This Script will deploy a Smart Wallet without passing through the Smart Wallet Factory.
async function main() {
  const Owner = process.env.SMART_WALLET_OWNER_PUBLIC_KEY;
  const CHAIN_ID = process.env.CHAIN_ID;
  const priceFeedProxyAddress = process.env.PRICE_FEED_PROXY;
  const ERC20Address = process.env.ERC20_FEE;

  const signers = await ethers.getSigners();
  const Bundler = signers[0];

  console.log("Smat Wallet Owner: ", Owner);
  console.log("Bundler: ", Bundler.address);

  const SmartWallet = await ethers.getContractFactory("SmartWallet", Bundler);
  const smartWallet = await SmartWallet.deploy(
    Owner,
    priceFeedProxyAddress,
    CHAIN_ID,
    ERC20Address,
    {
      gasPrice: await ethers.provider.getGasPrice(),
      gasLimit: 8500000,
    }
  );
  await SmartWallet.deployed();

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

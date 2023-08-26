const { ethers } = require("hardhat");

async function main() {
  const Owner = process.env.SMART_WALLET_OWNER_PUBLIC_KEY;
  
  const salt = "0"; // Update it for every new Smart wallet creation for each Signer. It will change the deployed address and it can be precomputed.
  const SmartWalletFactoryAddress = "0x0000000"; // You should replace it with your Wallet Factory Address

  const priceFeedProxyAddress = process.env.PRICE_FEED_PROXY;
  const ERC20Address = process.env.ERC20_FEE;

  const [Bundler] = await ethers.getSigners();

  console.log("SmartWalletFactoryAddress: ", SmartWalletFactoryAddress);
  console.log("Smart Wallet Owner: ", Owner);
  console.log("Bundler: ", Bundler.address);

  const SmartWalletFactory = await ethers.getContractAt(
    "SmartWalletFactory",
    SmartWalletFactoryAddress
  );

  const receipt = await SmartWalletFactory.connect(Bundler)
    .createWallet(Owner, salt, priceFeedProxyAddress, ERC20Address, {
      gasPrice: await ethers.provider.getGasPrice(),
      gasLimit: 8500000,
    })
    .then((tx) => tx.wait());

  console.log("Event emited: ", receipt.events[0].args);

  if (receipt.events.length > 0) {
    const baseAccountAddress = receipt.events[0].args[1];
    console.log(
      `\nBaseAccount for USER ${Owner} deployed to ${baseAccountAddress}`
    );
  } else {
    console.log(receipt);
    const walletDeployed = await SmartWalletFactory.getAddress(signer, salt);
    console.log(
      `This USER already deployed a Smart Account with the same SALT. Smart Account address: ${walletDeployed}`
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
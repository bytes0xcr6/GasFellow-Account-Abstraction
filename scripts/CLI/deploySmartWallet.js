const {
  ethers
} = require("hardhat");

async function main(SmartWalletFactoryAddress, eUSDAddress, Bundler) {
  const Owner = process.env.SMART_WALLET_OWNER_PUBLIC_KEY;

  const salt = "0"; // Update it for every new Smart wallet creation for each Signer. It will change the deployed address and it can be precomputed.

  const priceFeedProxyAddress = process.env.PRICE_FEED_PROXY;
  const ERC20Address = eUSDAddress;

  const SmartWalletFactory = await ethers.getContractAt(
    "SmartWalletFactory",
    SmartWalletFactoryAddress, Bundler
  );

  const receipt = await SmartWalletFactory.connect(Bundler)
    .createWallet(Owner, salt, priceFeedProxyAddress, ERC20Address, {gasPrice: 5000000000})
    .then((tx) => tx.wait());

  if (receipt.events.length > 0) {
    const baseAccountAddress = receipt.events[0].args[1];
    return baseAccountAddress;
  } else {
    console.log(receipt);
    const walletDeployed = await SmartWalletFactory.getAddress(signer, salt);
    return walletDeployed;
  }

}

module.exports = {
  main
};
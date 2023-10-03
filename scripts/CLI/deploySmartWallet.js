const {
  ethers
} = require("hardhat");
const {
  Owner,
  priceFeedProxyAddress,
  Provider
} = require("../config");

async function main(SmartWalletFactoryAddress, eUSDAddress, Bundler) {
  const chain = await Provider.detectNetwork();

  const salt = "0"; // Update it for every new Smart wallet creation for each Signer. It will change the deployed address and it can be precomputed.

  const ERC20Address = eUSDAddress;

  const SmartWalletFactory = await ethers.getContractAt(
    "SmartWalletFactory",
    SmartWalletFactoryAddress, Bundler
  );

  const receipt = await SmartWalletFactory.connect(Bundler)
    .createWallet(Owner, salt, priceFeedProxyAddress, ERC20Address)
    .then((tx) => tx.wait());

  // console.log(`Params to verify Smart Wallet: "${Owner}" "${priceFeedProxyAddress}" "${chain.chainId}" "${ERC20Address}"`)
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
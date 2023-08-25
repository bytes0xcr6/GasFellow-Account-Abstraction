const { ethers } = require("hardhat");

// IT WILL DEPLOY TO MAINNET!
async function main() {
  const salt = "0";

  // const BasicWalletFactoryAddress = process.env.ACCOUNT_FACTORY_MAINNET;
  const BasicWalletFactoryAddress = process.env.ACCOUNT_FACTORY_TESTNET;
  const signer = process.env.SIGNER_MAINNET;
  const bundlerPrivateKey = process.env.BUNDLER_PRIVATE_KEY_TESTNET;

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.WEB3_HTTP_PROVIDER_TEST
  );
  const bundler = new ethers.Wallet(bundlerPrivateKey, provider);
  console.log("BasicWalletFactoryAddress: ", BasicWalletFactoryAddress);
  console.log("signer: ", signer);
  console.log("bundler: ", bundler.address);

  const BasicWalletFactory = await ethers.getContractAt(
    "BasicWalletFactory",
    BasicWalletFactoryAddress
  );

  const receipt = await BasicWalletFactory.connect(bundler)
    .createWallet(signer, salt, {
      gasPrice: await provider.getGasPrice(),
      gasLimit: 8500000,
    })
    .then((tx) => tx.wait());

  console.log("Event emited: ", receipt.events[0].args);
  if (receipt.events.length > 0) {
    const baseAccountAddress = receipt.events[0].args[1];
    console.log(
      `\nBaseAccount for USER ${signer} deployed to ${baseAccountAddress}`
    );
  } else {
    console.log(receipt);
    const walletDeployed = await BasicWalletFactory.getAddress(signer, salt);
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

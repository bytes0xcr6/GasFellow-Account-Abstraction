const { ethers } = require("hardhat");

async function main() {
  const signer = process.env.SIGNER_MAINNET;
  const bundlerPrivateKey = process.env.BUNDLER_PRIVATE_KEY_TESTNET;

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.WEB3_HTTP_PROVIDER_TEST
  );
  const bundler = new ethers.Wallet(bundlerPrivateKey, provider);
  console.log("signer: ", signer);
  console.log("bundler: ", bundler.address);

  const SmartWallet = await ethers.getContractFactory("SmartWallet", bundler);
  const smartWallet = await SmartWallet.deploy(signer, {
    gasPrice: await provider.getGasPrice(),
    gasLimit: 8500000,
  });
  await SmartWallet.deployed();

  console.log(
    `\nBaseAccount for USER ${signer} deployed to ${smartWallet.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

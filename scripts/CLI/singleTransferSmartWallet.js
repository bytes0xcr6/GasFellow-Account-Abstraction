const {
  ethers
} = require("hardhat");
const {
  getSignatureAndValidate
} = require("../userOp-signer");

async function main(WalletOwnerPrivateKey, smartWalletAddress, receiverERC20Address, ERC20TokenAddress, Bundler, Provider, amount) {
  const chain = await Provider.detectNetwork();

  const ERC20TokenFee = await ethers.getContractAt("CBDC", ERC20TokenAddress, Bundler);

  // ERC20 Transfer:
  const functionIdTransfer = "transfer(address,uint256)";
  const typesArgsTransfer = ["address", "uint256"];
  const functionArgsTransfer = [
    receiverERC20Address,
    (amount * 10 ** (await ERC20TokenFee.decimals())).toString(),
  ];

  const gasPrice = await Provider.getGasPrice();

  const smartWallet = await ethers.getContractAt(
    "SmartWallet",
    smartWalletAddress, Bundler
  );

  const transferRes = await getSignatureAndValidate(
    smartWallet,
    WalletOwnerPrivateKey,
    functionIdTransfer,
    typesArgsTransfer,
    functionArgsTransfer,
    ERC20TokenAddress,
    0,
    await smartWallet.nonce(),
    chain.chainId
  );
  console.log("\n- ✅ transferERC20 Tx signature: ", transferRes.signature);
  console.log("\n- ✅ transferERC20 Tx callData: ", transferRes.callData);

  if (
    Number(await ERC20TokenFee.balanceOf(smartWallet.address)) <
    Number(functionArgsTransfer[1])
  ) {
    console.log(
      "\n************************ Not enough ERC20 in Smart Wallet to transfer *************************"
    );
    console.log(
      `Balance is 
      ${await ERC20TokenFee.balanceOf(
        smartWallet.address
      )} and you are trying to transfer  ${functionArgsTransfer[1]}`
    );
    return null;
  }


  const Tx = await smartWallet
    .connect(Bundler)
    .handleOp(
      ERC20TokenAddress,
      0,
      transferRes.callData,
      transferRes.signature,
      gasPrice,
      false
    );

  const receipt = await Tx.wait();
  return receipt;
}

module.exports = {
  main
};
const { ethers } = require("hardhat");
const { getSignatureAndValidate } = require("./userOp-signer");

const smartWalletABI = require("../../artifacts/contracts/account_abstraction/smartWallet.sol/smartWallet.json");
const BundlerPrivateKey = process.env.AA_SIGNER_PRIVATE_KEY;
const WalletOwnerPrivateKey = process.env.SIGNER_MAINNET_PRIVATE_KEY;
const smartWalletAddress = "0x000000000000000000";
const receiverERC20Address = "0x000000000000000000000";

const ERC20TokenAddress = process.env.ERC20_TOKEN_MAINNET;

// ERC20 Transfer:
const functionIdTransfer = "transfer(address,uint256)";
const typesArgsTransfer = ["address", "uint256"];
const functionArgsTransfer = [
  receiverERC20Address,
  ethers.utils.parseEther("200"),
];
// IT WILL INTERACT WITH MAINNET!
async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.WEB3_HTTP_PROVIDER_TEST
  );

  const [Bundler, WalletOwner] = await ethers.getSigners();

  const balanceBundler = await ethers.provider.getBalance(Bundler.address);

  const gasPrice = await ethers.provider.getGasPrice();

  console.log("smartWallet Address: ", smartWalletAddress);
  console.log("WalletOwner Address: ", WalletOwner.address);
  console.log("Bundler: ", Bundler.address);
  console.log(
    "BNB Balance Bundler: ",
    ethers.utils.formatEther(balanceBundler)
  );
  console.log("Gas Price: ", gasPrice);

  const smartWallet = await ethers.getContractAt(
    "smartWallet",
    smartWalletAddress
  );

  // const smartWallet = new ethers.Contract(
  //   smartWalletAddress,
  //   smartWalletABI.abi,
  //   provider
  // );

  const transferRes = await getSignatureAndValidate(
    smartWallet,
    WalletOwnerPrivateKey,
    functionIdTransfer,
    typesArgsTransfer,
    functionArgsTransfer,
    ERC20TokenAddress,
    0,
    await smartWallet.nonce()
  );
  console.log("\n- ✅ transferERC20 Tx signature: ", transferRes.signature);
  console.log("\n- ✅ transferERC20 Tx callData: ", transferRes.callData);

  const Tx = await smartWallet
    .connect(Bundler)
    .handleOp(
      ERC20TokenAddress,
      0,
      transferRes.callData,
      transferRes.signature,
      gasPrice,
      BNB_ERC20_RATE,
      false,
      { gasLimit: 650103 }
    );

  const receipt = await Tx.wait();
  console.log("Transfer ERC20 Receipt: ", receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

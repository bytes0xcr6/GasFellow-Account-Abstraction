const {
  ethers
} = require("hardhat");
const {
  getSignatureAndValidate
} = require("./userOp-signer");

const WalletOwnerPrivateKey = process.env.SMART_WALLET_OWNER_PRIVATE_KEY;

const smartWalletAddress = "0x040Aa3B42D136aB523BF614659d99bF2D98B8D65"; // Replace with the Smart wallet to interact.
const receiverERC20Address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Replace with the Address to transfer ERC20 token.

// Token to Transfer (No Fee, but it could be too. As in this case).
const ERC20TokenAddress = process.env.ERC20_FEE;

async function main() {
  const ERC20TokenFee = await ethers.getContractAt("CBDC", ERC20TokenAddress);

  // ERC20 Transfer:
  const functionIdTransfer = "transfer(address,uint256)";
  const typesArgsTransfer = ["address", "uint256"];
  const functionArgsTransfer = [
    receiverERC20Address,
    (10 * 10 ** (await ERC20TokenFee.decimals())).toString(),
  ];

  console.log("Balance: ", await ERC20TokenFee.balanceOf(smartWalletAddress));
  const [Bundler, WalletOwner] = await ethers.getSigners();

  const balanceBundler = await ethers.provider.getBalance(Bundler.address);

  const gasPrice = await ethers.provider.getGasPrice();

  console.log("smartWallet Address: ", smartWalletAddress);
  console.log("WalletOwner Address: ", WalletOwner.address);
  console.log("Bundler: ", Bundler.address);
  console.log(
    "Arbitrum Balance Bundler: ",
    ethers.utils.formatEther(balanceBundler)
  );
  console.log("Gas Price: ", Number(gasPrice));

  const smartWallet = await ethers.getContractAt(
    "SmartWallet",
    smartWalletAddress
  );

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
    return;
  }

  const Tx = await smartWallet
    .connect(Bundler)
    .handleOp(
      ERC20TokenAddress,
      0,
      transferRes.callData,
      transferRes.signature,
      gasPrice,
      false, {
        gasPrice: 5000000000
      }
    );

  const receipt = await Tx.wait();
  console.log("\nTransfer ERC20 Receipt: ", receipt);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
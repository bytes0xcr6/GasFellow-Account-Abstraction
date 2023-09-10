const prompt = require("prompt-sync")({
  sigint: true
}); //sigint allows the user to exit using CTRL-C
const {
  ethers
} = require("ethers");
const WalletABI = require("../../artifacts/contracts/SmartWallet.sol/SmartWallet.json")

const deployCBDC = require("./deployCBDC")
const deployWalletFactory = require("./deploySmartWalletFactory")
const deploySmartWallet = require("./deploySmartWallet")
const transfereUSD = require("./singleTransferSmartWallet");

const BundlerPKey = process.env.BUNDLER_PRIVATE_KEY;
const SignerPKey = process.env.SMART_WALLET_OWNER_PRIVATE_KEY;


// 1. Add a private key to add a signer for your smart wallet
// 2. Deploy a Smart Wallet through the Wallet factory (Also, Deploy factory, CBDC and transfer funds to smart wallet)
// 3. Send a transaction onChain (ERC20 transfer)
// 4. Show the transaction receipt with the fee paid in USD. 

async function main() {
  const Provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER_TESTNET)
  // const feeData = await Provider.getFeeData();

  if (!BundlerPKey || !SignerPKey) {
    throw new Error("Please add a private key to your .env for the Bundler and for the Smart Wallet Owner");
  }

  const Bundler = new ethers.Wallet(BundlerPKey, Provider)

  const BundlerBalance = await Provider.getBalance(Bundler.address);

  if (BundlerBalance == 0) {
    throw new Error("Bundler needs to have some Native Currency as ETH/ARB/BNB for Deployments and fees sponsorship")
  }
  const CBDC = await deployCBDC.main(Bundler);
  const WalletFactory = await deployWalletFactory.main(Bundler);
  const SmartWalletAddress = await deploySmartWallet.main(WalletFactory.address, CBDC.address, Bundler)

  const SmartWallet = new ethers.Contract(SmartWalletAddress, WalletABI.abi, Bundler)

  console.log("Smart Wallet instanced")

  console.log(`\nSMART CONTRACTS DEPLOYED:`)
  console.log(`- eUSD CBDC to: ${CBDC.address}`)
  console.log(`- Smart Wallet Factory to: ${WalletFactory.address}`)
  console.log(`- Smart Wallet to: ${SmartWallet.address}`)

  const transferRes = await CBDC.connect(Bundler).transfer(SmartWallet.address, 1000 *10**8, {
    gasPrice: 5000000000
  })
  await transferRes.wait();
  console.log(transferRes)
  const walletBalance = await CBDC.balanceOf(SmartWallet.address)

  console.log(`\nWe have topped up Smart Wallet Balance with some USD CBDC. Smart Wallet balance is: ${walletBalance} eUSD `)

  let receiver = "";

  while (receiver === "") {
    console.log("\nLet's execute a eUSD transfer to another Wallet to test how the Smart Wallet does not need Balance in the native token.")
    receiver = String(prompt("Add the Public key to send eUSD: "))
  }

  let confirmation = String(prompt("\nYou are about to send eUSD and no pay Gas Fees. Are you excited? (Yes / No)"))

  if (confirmation.toUpperCase === "YES") console.log("\nLet's gooo!")
  if (confirmation.toUpperCase === "NO") console.log("\nYou will be exited after you try!")
  if (confirmation.toUpperCase !== "YES" || "NO") console.log("\nI didn't understand, but let`s show you how Gas Fellow can do magic")

  const receipt = await transfereUSD.main(SignerPKey, SmartWallet.address, receiver, CBDC.address, Bundler, Provider);

  if(!receipt) return
  console.log(receipt)
  console.log('\nCongrats! You have completed your first transaction without having the native token and paying fees in eUSD')
  console.log(`\nCheck the transaction receipt in the chain scanner by adding the Transaction Hash.`)
  console.log(`Transaction Hash: ${receipt.transactionHash}`)


  console.log("Script execution ended.");
}

main().catch(err => {
  console.log(err)
})
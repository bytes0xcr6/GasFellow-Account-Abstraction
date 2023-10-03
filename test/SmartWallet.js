const {
  loadFixture
} = require("@nomicfoundation/hardhat-network-helpers");
const {
  expect
} = require("chai");
const {
  ethers
} = require("hardhat");
const {
  getSignatureAndValidate,
  getValueTxSignatureAndValidate,
} = require("../scripts/userOp-signer");

const {
  Owner,
  CHAIN_ID,
  priceFeedProxyAddress,
  ERC20Address,
  WalletOwnerPrivateKey,
  WalletOwnerPublicKey
} = require("../config")

c = 1; // How much USDC is 1 ARB?  -NO DECIMALS!

describe("smartWallet", function () {
  async function deployContracts() {

    const Bundler = await ethers.getImpersonatedSigner(
      process.env.BUNDLER_PUBLIC_KEY
    );
    const ARB_Whale = await ethers.getImpersonatedSigner(
      process.env.ARB_WHALE_HOLDER
    );

    // USDC Transfer:
    const functionIdTransfer = "transfer(address,uint256)";
    const typesArgsTransfer = ["address", "uint256"];
    const functionArgsTransfer = [
      WalletOwnerPublicKey,
      (1000 * 10 ** 8).toString(),
    ];

    // USDC Balance:
    const functionIdBalance = "balanceOf(address)";
    const typesArgsBalance = ["address"];
    const functionArgsBalance = [Bundler.address];

    // USDC Approve:
    const functionIdApprove = "approve(address,uint256)";
    const typesArgsApprove = ["address", "uint256"];
    const functionArgsApprove = [
      WalletOwnerPublicKey,
      (1000 * 10 ** 8).toString(),
    ];

    const feeData = await ethers.provider.getFeeData();

    // Fill up Bundler for fees
    const tx1ARB = {
      to: Bundler.address,
      value: ethers.utils.parseEther("0.0001"),
    };
    const tx2ARB = {
      to: Bundler.address,
      value: ethers.utils.parseEther("0.0001"),
    };
    await Bundler.sendTransaction(tx1ARB);
    await Bundler.sendTransaction(tx2ARB);
    console.log(
      `- USDC Whale transferred ${tx2ARB.value}ARB to Bundler and USDC Whale`
    );

    const ERC20_Fee = await ethers.getContractAt("CBDC", ERC20Address);

    const target = ERC20Address;
    const value = 0; // Value to transfer in ARB

    const SmartWalletFactory = await ethers.getContractFactory(
      "SmartWalletFactory"
    );
    const smartWalletFactory = await SmartWalletFactory.connect(Bundler).deploy(
      CHAIN_ID
    );
    await smartWalletFactory.deployed();

    const counterfactualWallet = await smartWalletFactory.getAddress(
      WalletOwnerPublicKey,
      "1",
      priceFeedProxyAddress,
      ERC20_Fee.address
    );

    const walletCreated = await smartWalletFactory
      .connect(Bundler)
      .createWallet(
        WalletOwnerPublicKey,
        "1",
        priceFeedProxyAddress,
        ERC20_Fee.address
      );

    const receipt = await walletCreated.wait();

    const userProfile = {
      owner: receipt.events[0].args[0],
      accountAddress: receipt.events[0].args[1],
    };

    console.log(`\n- EXPECTED USER: ${WalletOwnerPublicKey}`);
    console.log(`- OWNER: ${userProfile.owner}`);
    console.log(`\n- EXPECTED SMART WALLET Addr: ${counterfactualWallet}`);
    console.log(`- SMART WALLET Addr: ${userProfile.accountAddress}`);

    console.log(
      `\n- User (${userProfile.owner}) created a Smart Account to (${userProfile.accountAddress})`
    );

    const smartWallet = await ethers.getContractAt(
      "SmartWallet",
      userProfile.accountAddress
    );

    console.log("- smartWallet deployed to: ", smartWallet.address);

    console.log(`- Bundler/Admin wallet is: ${Bundler.address}`);
    console.log(
      "Balance Bundler: ",
      await ERC20_Fee.balanceOf(Bundler.address)
    );

    await ERC20_Fee.connect(Bundler).transfer(
      smartWallet.address,
      (10000 * 10 ** 8).toString()
    );

    const balanceUSDCaccount = await ERC20_Fee.balanceOf(smartWallet.address);

    console.log(
      `- Smart Account filled up with ${ethers.utils.formatEther(
        balanceUSDCaccount.toString()
      )} USDCs`
    );

    return {
      Bundler,
      WalletOwnerPublicKey,
      smartWallet,
      smartWalletFactory,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      functionIdApprove,
      typesArgsApprove,
      functionArgsApprove,
      functionIdBalance,
      typesArgsBalance,
      functionArgsBalance,
      ERC20_Fee,
      counterfactualWallet,
      smartWallet, // Wallet 1 deployed
      userProfile,
      WalletOwnerPublicKey,
      Bundler,
      feeData,
      target,
      value,
      ERC20_Fee,
      ARB_Whale,
      CHAIN_ID
    };
  }

  it("Verify expected Wallet deployed Matches the deployed wallet", async () => {
    const {
      userProfile,
      counterfactualWallet,
      WalletOwnerPublicKey,
      smartWallet,
    } = await loadFixture(deployContracts);

    expect(await smartWallet.owner()).to.equal(WalletOwnerPublicKey);
    expect(userProfile.owner).to.equal(WalletOwnerPublicKey);
    expect(counterfactualWallet).to.equal(userProfile.accountAddress);
    expect(userProfile.accountAddress).to.equal(smartWallet.address);
  });

  it("Transfer Value from the Smart Wallet (ARB)", async () => {
    const {
      userProfile,
      smartWallet,
      Bundler,
      ARB_Whale,
      CHAIN_ID
    } = await loadFixture(
      deployContracts
    );

    ARBtopUp = {
      to: userProfile.accountAddress,
      value: ethers.utils.parseEther("1"),
    };

    await ARB_Whale.sendTransaction(ARBtopUp);

    const WalletARBbalanceBefore = await ethers.provider.getBalance(
      userProfile.accountAddress
    );
    const SignerARBbalanceBefore = await ethers.provider.getBalance(
      userProfile.owner
    );
    console.log(
      "ARB Balance Wallet AfterARB Topped up: ",
      ethers.utils.formatEther(WalletARBbalanceBefore)
    );

    ARBtransferRes = await getValueTxSignatureAndValidate(
      smartWallet,
      WalletOwnerPrivateKey,
      userProfile.owner,
      ethers.utils.parseUnits("0.1", "ether"),
      await smartWallet.nonce(), CHAIN_ID

    );

    console.log("\n- ✅ARB Transfer signature: ", ARBtransferRes.signature);

    const Tx = await smartWallet
      .connect(Bundler)
      .handleOp(
        userProfile.owner,
        ethers.utils.parseUnits("0.1", "ether"),
        ARBtransferRes.callData,
        ARBtransferRes.signature,
        await ethers.provider.getGasPrice(),
        true
      );

    await Tx.wait();

    const WalletARBbalanceAfter = await ethers.provider.getBalance(
      userProfile.accountAddress
    );
    const SignerARBbalanceAfter = await ethers.provider.getBalance(
      userProfile.owner
    );

    console.log(
      "- WalletARBbalanceBefore: ",
      ethers.utils.formatEther(WalletARBbalanceBefore)
    );
    console.log(
      "- WalletARBbalanceAfter",
      ethers.utils.formatEther(WalletARBbalanceAfter)
    );

    console.log(
      "\n- SignerARBbalanceBefore: ",
      ethers.utils.formatEther(SignerARBbalanceBefore)
    );
    console.log(
      "- SignerARBbalanceAfter",
      ethers.utils.formatEther(SignerARBbalanceAfter)
    );

    expect(WalletARBbalanceAfter).to.be.lessThan(WalletARBbalanceBefore);
    expect(SignerARBbalanceBefore).to.be.lessThan(SignerARBbalanceAfter);
  });

  it("If Sponsored is true, None USDC should be transferred", async () => {
    const {
      Bundler,
      ERC20_Fee,
      smartWallet,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      CHAIN_ID
    } = await loadFixture(deployContracts);

    const USDCBalanceBefore = await ERC20_Fee.balanceOf(Bundler.address);

    const transferRes = await getSignatureAndValidate(
      smartWallet,
      WalletOwnerPrivateKey,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      ERC20_Fee.address,
      0,
      await smartWallet.nonce(), CHAIN_ID
    );

    await smartWallet
      .connect(Bundler)
      .handleOp(
        ERC20_Fee.address,
        0,
        transferRes.callData,
        transferRes.signature,
        await ethers.provider.getGasPrice(),
        true
      );

    expect(await ERC20_Fee.balanceOf(Bundler.address)).to.equal(
      USDCBalanceBefore
    );
  });

  it("Verify expected wallet address matches Deployed Wallet Address SAME OWNER", async function () {
    const {
      smartWalletFactory,
      WalletOwnerPublicKey,
      ERC20_Fee,
      Bundler
    } =
    await loadFixture(deployContracts);

    // 2nd Wallet creation
    const counterfactualWallet2 = await smartWalletFactory.getAddress(
      WalletOwnerPublicKey,
      "2",
      priceFeedProxyAddress,
      ERC20_Fee.address
    );

    const smartWallet2 = await smartWalletFactory
      .connect(Bundler)
      .createWallet(
        WalletOwnerPublicKey,
        "2",
        priceFeedProxyAddress,
        ERC20_Fee.address
      );

    const receipt2 = await smartWallet2.wait();
    const userProfile2 = {
      owner: receipt2.events[0].args[0],
      accountAddress: receipt2.events[0].args[1],
    };

    // 3rd Wallet creation
    const counterfactualWallet3 = await smartWalletFactory.getAddress(
      WalletOwnerPublicKey,
      "3",
      priceFeedProxyAddress,
      ERC20_Fee.address
    );

    const smartWallet3 = await smartWalletFactory
      .connect(Bundler)
      .createWallet(
        WalletOwnerPublicKey,
        "3",
        priceFeedProxyAddress,
        ERC20_Fee.address
      );
    const receipt3 = await smartWallet3.wait();

    const userProfile3 = {
      owner: receipt3.events[0].args[0],
      accountAddress: receipt3.events[0].args[1],
    };

    expect(WalletOwnerPublicKey).to.equal(userProfile2.owner);
    expect(counterfactualWallet2).to.equal(userProfile2.accountAddress);
    expect(WalletOwnerPublicKey).to.equal(userProfile3.owner);
    expect(counterfactualWallet3).to.equal(userProfile3.accountAddress);
  });

  it("Verify expected wallet address matches Deployed Wallet Address DIFFERENT OWNER", async function () {
    const {
      smartWalletFactory,
      Bundler,
      ERC20_Fee
    } = await loadFixture(
      deployContracts
    );

    // 2nd Wallet creation
    const counterfactualWallet2 = await smartWalletFactory.getAddress(
      Bundler.address,
      "1",
      priceFeedProxyAddress,
      ERC20_Fee.address
    );

    const smartWallet2 = await smartWalletFactory
      .connect(Bundler)
      .createWallet(
        Bundler.address,
        "1",
        priceFeedProxyAddress,
        ERC20_Fee.address
      );
    const receipt2 = await smartWallet2.wait();
    const userProfile2 = {
      owner: receipt2.events[0].args[0],
      accountAddress: receipt2.events[0].args[1],
    };

    // 3rd Wallet creation
    const counterfactualWallet3 = await smartWalletFactory.getAddress(
      Bundler.address,
      "2",
      priceFeedProxyAddress,
      ERC20_Fee.address
    );

    const smartWallet3 = await smartWalletFactory
      .connect(Bundler)
      .createWallet(
        Bundler.address,
        "2",
        priceFeedProxyAddress,
        ERC20_Fee.address
      );
    const receipt3 = await smartWallet3.wait();

    const userProfile3 = {
      owner: receipt3.events[0].args[0],
      accountAddress: receipt3.events[0].args[1],
    };

    expect(Bundler.address).to.equal(userProfile2.owner);
    expect(counterfactualWallet2).to.equal(userProfile2.accountAddress);
    expect(Bundler.address).to.equal(userProfile3.owner);
    expect(counterfactualWallet3).to.equal(userProfile3.accountAddress);
  });

  it("Verify expected wallet address does not match deployed wallet if different address", async function () {
    const {
      smartWalletFactory,
      WalletOwnerPublicKey,
      ERC20_Fee,
      Bundler
    } =
    await loadFixture(deployContracts);

    const counterfactualWallet2 = await smartWalletFactory.getAddress(
      WalletOwnerPublicKey,
      "1",
      priceFeedProxyAddress,
      ERC20_Fee.address
    );
    const smartWallet2 = await smartWalletFactory
      .connect(Bundler)
      .createWallet(
        Bundler.address,
        "1",
        priceFeedProxyAddress,
        ERC20_Fee.address
      );
    const receipt2 = await smartWallet2.wait();
    const userProfile2 = {
      owner: receipt2.events[0].args[0],
      accountAddress: receipt2.events[0].args[1],
    };

    const counterfactualWallet3 = await smartWalletFactory.getAddress(
      WalletOwnerPublicKey,
      "2",
      priceFeedProxyAddress,
      ERC20_Fee.address
    );

    const smartWallet3 = await smartWalletFactory
      .connect(Bundler)
      .createWallet(
        Bundler.address,
        "2",
        priceFeedProxyAddress,
        ERC20_Fee.address
      );
    const receipt3 = await smartWallet3.wait();
    const userProfile3 = {
      owner: receipt3.events[0].args[0],
      accountAddress: receipt3.events[0].args[1],
    };

    expect(Bundler.address).to.equal(userProfile2.owner);
    expect(counterfactualWallet2).to.not.equal(userProfile2.accountAddress);
    expect(Bundler.address).to.equal(userProfile3.owner);
    expect(counterfactualWallet3).to.not.equal(userProfile3.accountAddress);
  });

  it("Verify signature", async function () {
    const {
      smartWallet,
      functionIdBalance,
      typesArgsBalance,
      functionArgsBalance,
      ERC20_Fee,
      target,
      value,
      CHAIN_ID
    } = await loadFixture(deployContracts);

    const balanceRes = await getSignatureAndValidate(
      smartWallet,
      WalletOwnerPrivateKey,
      functionIdBalance,
      typesArgsBalance,
      functionArgsBalance,
      ERC20_Fee.address,
      0,
      await smartWallet.nonce(), CHAIN_ID
    );

    await smartWallet.verifySignature(
      target,
      balanceRes.callData,
      value,
      await smartWallet.nonce(),
      balanceRes.signature
    );
  });

  it("Approve USDC from the Smart Account to Swapper", async function () {
    const {
      smartWallet,
      Bundler,
      functionIdApprove,
      typesArgsApprove,
      functionArgsApprove,
      feeData,
      ERC20_Fee,
      target,
      value,
      CHAIN_ID
    } = await loadFixture(deployContracts);

    const approvalRes = await getSignatureAndValidate(
      smartWallet,
      WalletOwnerPrivateKey,
      functionIdApprove,
      typesArgsApprove,
      functionArgsApprove,
      ERC20_Fee.address,
      0,
      await smartWallet.nonce(), CHAIN_ID
    );

    const resultCoded = await smartWallet
      .connect(Bundler)
      .handleOp(
        target,
        value,
        approvalRes.callData,
        approvalRes.signature,
        feeData.gasPrice,
        false
      );

    const resultDecoded = ethers.utils.defaultAbiCoder.decode(
      ["bool"],
      ethers.utils.hexDataSlice(resultCoded.data, 4)
    );

    expect(resultDecoded[0]).to.equal(true);
  });
  1490338.36014371;
  it("Transfer USDC from the Smart Account to Bundler", async function () {
    const {
      smartWallet,
      Bundler,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      ERC20_Fee,
      feeData,
      target,
      value,
      CHAIN_ID
    } = await loadFixture(deployContracts);

    const balanceBefore = await ERC20_Fee.balanceOf(Bundler.address);

    const transferRes = await getSignatureAndValidate(
      smartWallet,
      WalletOwnerPrivateKey,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      ERC20_Fee.address,
      0,
      await smartWallet.nonce(), CHAIN_ID
    );

    await smartWallet
      .connect(Bundler)
      .handleOp(
        target,
        value,
        transferRes.callData,
        transferRes.signature,
        feeData.gasPrice,
        false
      );

    const balanceAfter = await ERC20_Fee.balanceOf(Bundler.address);

    console.log("- Bundler USDC Balance Before: " + balanceBefore);
    console.log(
      "- Bundler USDC Balance After: " + ethers.utils.formatEther(balanceAfter)
    );
    expect(balanceBefore).to.be.lessThan(balanceAfter);
  });

  it("Approve & Transfer USDC from the Smart Account to another wallet", async function () {
    const {
      smartWallet,
      Bundler,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      functionIdApprove,
      typesArgsApprove,
      functionArgsApprove,
      ERC20_Fee,
      feeData,
      target,
      value,
      CHAIN_ID
    } = await loadFixture(deployContracts);

    const balanceUSDCBefore = await ERC20_Fee.balanceOf(smartWallet.address);
    const balanceARBBefore = await ethers.provider.getBalance(Bundler.address);
    const USDCBeforeFeeReceived = await ERC20_Fee.balanceOf(Bundler.address);

    const approvalRes = await getSignatureAndValidate(
      smartWallet,
      WalletOwnerPrivateKey,
      functionIdApprove,
      typesArgsApprove,
      functionArgsApprove,
      ERC20_Fee.address,
      0,
      await smartWallet.nonce(), CHAIN_ID
    );

    const transferRes = await getSignatureAndValidate(
      smartWallet,
      WalletOwnerPrivateKey,
      functionIdTransfer,
      typesArgsTransfer,
      functionArgsTransfer,
      ERC20_Fee.address,
      0,
      (await smartWallet.nonce()) + 1, CHAIN_ID
    );

    await smartWallet
      .connect(Bundler)
      .handleOps(
        [target, target],
        [value, value],
        [approvalRes.callData, transferRes.callData],
        [approvalRes.signature, transferRes.signature],
        feeData.gasPrice,
        false, {
          gasPrice: feeData.gasPrice
        }
      );

    const balanceUSDCAfter = await ERC20_Fee.balanceOf(smartWallet.address);
    const USDCresult =
      ethers.utils.formatUnits(balanceUSDCAfter, "wei") -
      ethers.utils.formatUnits(balanceUSDCBefore, "wei");

    const balanceARBAfter = await ethers.provider.getBalance(Bundler.address);
    ARBresult = balanceARBBefore - balanceARBAfter;
    console.log("balanceARBAfter", ethers.utils.formatEther(balanceARBAfter));
    console.log("balanceARBBefore", ethers.utils.formatEther(balanceARBBefore));
    console.log(
      "\n- BALANCE USDC BEFORE: " + ethers.utils.formatUnits(balanceUSDCBefore)
    );
    console.log(
      "- BALANCE USDC AFTER: " + ethers.utils.formatUnits(balanceUSDCAfter)
    );
    console.log(
      "\n- BALANCEARB BEFORE: " + ethers.utils.formatUnits(balanceARBBefore)
    );
    console.log(
      "- BALANCEARB AFTER: " + ethers.utils.formatUnits(balanceARBAfter)
    );
    console.log(
      `\n- User transferred ${ethers.utils.formatUnits(
        functionArgsTransfer[1]
      )} USDCs`
    );

    const USDCFeesPaid = Number(functionArgsTransfer[1]) + USDCresult;
    const USDCAfterFeeReceived = await ERC20_Fee.balanceOf(Bundler.address);
    console.log(
      `\n- User just Transferred and spent a Fee of  ${
        USDCFeesPaid / 10 ** 10
      } USDCs`
    );

    console.log(
      "- Bundler got refunded in USDC as fee: ",
      (USDCAfterFeeReceived - USDCBeforeFeeReceived) / 10 ** 10
    );
    console.log(
      `- Bundler just paid a Fee of -${ethers.utils.formatEther(
        ARBresult.toString()
      )} ARBs`
    );
  });
});
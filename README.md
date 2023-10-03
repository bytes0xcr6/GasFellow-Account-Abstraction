# GasFellow - Account-Abstraction Library & CLI Demo

GasFellow is an Account Abstraction Library for creating Smart Wallets and paying chain fees in any ERC-20 or even sponsor gas fee for users.

![image](https://github.com/CristianRicharte6/Account-Abstraction/assets/102038261/57a92498-e657-442c-a0ed-94488b82677f)
_Example of Transferring 1.000 eUSD and charging 0.00128788 as fee (Refund for Bundler). The Smart Wallet does not own the native chain currency._ [ArbiScan ERC20 Transfer receipt](https://goerli.arbiscan.io/tx/0x33aef128dd49a63af12981e9dff6a13c5d933d183b090dc05c763d3aa4f354ea)

# Smart Wallet with Account Abstraction

## Overview

The Smart Wallet is a Solidity smart contract that introduces a new way for users to store value and execute transactions by paying the Gas fees in any ERC20 token or even have fees sponsored by a Bundler. This is an alternative where the only participants are:

- User (EOA or Key pair to sign transactions)
- Bundler (EOA to add Transactions on chain, pay Gas Fees & Sponsor gas fees or get refunded in ERC20 token)
- Smart Wallet Factory (Smart contract to deploy Smart Wallets to a precomputed address by using **_CREATE2_** & **_salt_**)
- Smart Wallet (Smart contract where the User will keep all his assets and privileges)

In this way to use Account Abstraction we do not need an Entry point and a Paymaster, as it is expected for internal use & not for using third party software.

## 👾👽 Try it with a quick Demo using the CLI!

As always, first get some Native token (ARB) through the <a href="https://bwarelabs.com/faucets/arbitrum-testnet">Faucet.</a>

```sh
   npm run "demo"
```

**IMPORTANT**: For this demo, we will use the Arbitrum Goerli testnet. Please, make sure you have set up the .env and have enough Test ARB in the Bundler´s Balance.

<img width="697" alt="image" src="https://github.com/CristianRicharte6/GasFellow-Account-Abstraction/assets/102038261/5ee17fc8-18d3-4d4e-8b54-712f5203826c">


## Features

- **Account Abstraction**: Users can interact with the blockchain without holding native Cryptocurrency.
- **Flexible Fee Payment**: Execute transactions and pay transaction fees in any ERC20 token.
- **Signature Verification**: Ensures secure and authenticated transaction execution.
- **Gas-Efficient Fee Calculation**: Efficiently calculates and handles fee payments.
- **Multiple Transaction Execution**: Execute single or batch transactions seamlessly.
- **CBDC Deployment**: Deploy a CBDC for testing purposes. (Already deployed)

## Getting Started

- `UserOp-signer`: Library to get Call Data, Hash Transaction Data and Sign transaction Data by the Smart Wallet Owner (EOA). It also verifies that the Tx is correctly signed with the Smart Wallet.

- `SmartWalletFactory`: It will help you deploy Smart Wallets with a precomputed address as it uses CREATE2.
- `SmartWallet`: It will be the user's account, where the user will hold all their value and from where the user will interact. This smart wallet verifies through the ECDSA (Elliptic Curve Digital Signature Algorithm) that the transaction the Bundler is trying to send has been signed by the Smart Wallet Owner (EOA).
- `CBDC`: It is just an example of an ERC20 for paying Fees. You do not need to deploy it if you impersonate accounts during testing.

- `DeployCBDC`: Deployment Script for direct deployment of a CBDC.
- `DeployDirectlySmartWallet`: Deployment Script for direct deployment of a Smart Wallet, without passing through the Smart Wallet Factory.
- `DeploySmartWallet`: Deployment Script for Smart Wallet.
- `DeploySmartWalletFactory`: Deployment Script for Smart Wallet Factory.
- `SingleTransferSmartWallet`: Example of how to sign and send an ERC20 transaction through the Smart Wallet.

### Prerequisites

- EVM development environment. (e.g., Hardhat)
- RPC Provider. (e.g., Infura or public Provider)
- Ethers.
- Node.js and npm.

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/CristianRicharte6/GasFellow-Account-Abstraction.git
   cd GasFellow-Account-Abstraction

   ```

2. Install dependencies:

   ```sh
   npm install
   ```

### Setting up Environments

Follow the `.env.example` file. It is set up for deploying and execution in the Arbitrum Goerli Chain, but it can be used in any other EVM chain. Take into account to update the necessary variables.

## Deployment

Deploy the SmartWallet contract to your desired blockchain using your chosen development environment & setting up the Networks in the config. (e.g., `hardhat.config.js`)

1. Deploy the Smart Wallet factory by running `deploySmartWalletFactory.js`

   ```sh
   npx hardhat run scripts/deploySmartWalletFactory.js --network NETWORK_NAME

   ```

2. Create a Smart Wallet for an User by setting and running `deploySmartWallet.js`

   - Before using, update: `SmartWalletFactoryAddress` with your deployed SmartWallet Factory & `Salt`with your desired Salt number.

   ```sh
   npx hardhat run scripts/deploySmartWallet.js --network NETWORK_NAME
   ```

   ![image](https://github.com/CristianRicharte6/Account-Abstraction/assets/102038261/828f2f6d-5df5-4539-935e-77c01ece567a)
   [ArbiScan Deployment receipt](https://goerli.arbiscan.io/tx/0x51380dff63b362bb9a25274542bc8c493c9efbab514e94407a00d86079018b4e#eventlog)

Provide the necessary deployment parameters, including the contract owner's address, Chainlink price feed address, chain ID, and ERC20 token address for fees & for transferring (It can be the same one too, as in this project sample).

## Usage

#### Try it with a quick Demo using the CLI!

```sh
   npm run "demo"
```

**IMPORTANT**: For this demo, we will use the Arbitrum Goerli testnet. Please, make sure you have set up the .env and have enough Test ARB in the Bundler´s Balance.

The Smart Wallet contract allows users to execute transactions and pay fees in ERC20 tokens. Here's a basic example of how to use the contract:

1. Deploy the Smart Wallet contract.
   <details>
      
   <summary>Check the Smart Wallet deployment flow diagram.</summary>

   ![deployment](https://github.com/CristianRicharte6/Account-Abstraction/assets/102038261/8198c34c-7504-41e7-9d08-e77643c8ce18)

   </details>

2. Interact with the contract by calling its functions for single (`HandleOp`) or batch (`HandleOps`) transaction execution. This functions can be called by any Bundler or by the Smart Wallet owner. Also, they can choose if they would like to send the Transaction sponsored (The bundler takes care of the gas fees) or not sponsored (The Smart wallet will refund the fees in the ERC20 set for fees).

   <details>

   <summary>Check the Smart Wallet Transaction flow diagram.</summary>

   ![AA transaction flow](https://github.com/CristianRicharte6/Account-Abstraction/assets/102038261/4bb6894f-9e11-452f-b009-1d7a3cdce904)

   </details>

Interact with the Smart wallet by signing and sending the Tx on chain. An example of usability is the script `singleTransferSmartWallet.js`.

- Before using, update: `smartWalletAddress`, `receiverERC20Address` & make sure the Smart Wallet have enough funds for the transfer and for paying the gas fees.

```sh
 npx hardhat run scripts/singleTransferSmartWallet.js --network NETWORK_NAME
```

Provide valid transaction details, including target addresses, call data, and signatures.

For detailed usage instructions and contract functions, refer to the source code and comments.

## Smart contract deployed & Participants (Arbitrum Chain Testnet)

- **_Smart Wallet Factory_**: [0x5Ddaf39509866fD883695C627083BB79694508cB](https://goerli.arbiscan.io/address/0x5Ddaf39509866fD883695C627083BB79694508cB#code)

- **_Smart Wallet_**: [0x040Aa3B42D136aB523BF614659d99bF2D98B8D65](https://goerli.arbiscan.io/address/0x040Aa3B42D136aB523BF614659d99bF2D98B8D65#code)

- **_Wallet Owner/Signer_**: [0x4B229Ed260cc6AA763c17C412162d46f2b4caF52](https://goerli.arbiscan.io/address/0x4B229Ed260cc6AA763c17C412162d46f2b4caF52)

- **_Bundler_**: [0xA878DA5bec8863eB536D8A740dd3f45a1c6b9284](https://goerli.arbiscan.io/address/0xA878DA5bec8863eB536D8A740dd3f45a1c6b9284)

- **_ERC20Fee (eCBDC USD stable coin)_**:[0xb1Db20b24414cf8AC3Bdd3497A638b28878a3859](https://goerli.arbiscan.io/address/0xb1Db20b24414cf8AC3Bdd3497A638b28878a3859#code)

- **_Chainlink Price Feed ARB/USD (Arbitrum testnet)_**: [0x2eE9BFB2D319B31A573EA15774B755715988E99D](https://goerli.arbiscan.io/address/0x2eE9BFB2D319B31A573EA15774B755715988E99D#code)

## Contributors

[Cristian Richarte Gil](https://linktr.ee/0xcr6)

cristianricharte6@gmail.com

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For inquiries and feedback, please open an issue on the GitHub repository.

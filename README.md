# Account-Abstraction

Account Abstraction Library for deploying Smart Wallets and paying chain fees in any ERC-20.

# Smart Wallet with Account Abstraction

## Overview

The Smart Wallet with Account Abstraction is a Solidity smart contract that introduces a new way for users to execute transactions by paying the Gas fees in any ERC20 token or even have fees sponsored by a Bundler.

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
   git clone https://github.com/CristianRicharte6/Account-Abstraction.git
   cd Account-Abstraction

   ```

2. Install dependencies:

   ```sh
   npm install
   ```

### Setting up Environments

Follow the `.env.example` file. It is set up for deploying and execution in the Arbitrum chain, but it can be used in any other EVM chain. Take into account to update the necessary variables.

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

Provide the necessary deployment parameters, including the contract owner's address, Chainlink price feed address, chain ID, and ERC20 token address for fees & for transferring (It can be the same one too, as in this project sample).

## Usage

The Smart Wallet contract allows users to execute transactions and pay fees in ERC20 tokens. Here's a basic example of how to use the contract:

Deploy the contract.

Interact with the contract by calling its functions for single (`HandleOp`) or batch (`HandleOps`) transaction execution. This functions can be called by any Bundler or by the Smart Wallet owner. Also, they can choose if they would like to send the Transaction sponsored (The bundler takes care of the gas fees) or not sponsored (The Smart wallet will refund the fees in the ERC20 set for fees).

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

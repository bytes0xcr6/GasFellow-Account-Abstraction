require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-tracer");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat", // consider that for deploy you should use ganache instead, so specify here, or during command run with --network ganache flag

  networks: {
    hardhat: {
      forking: {
        chainId: process.env.CHAIN_ID,
        url: process.env.WEB3_HTTP_PROVIDER_TESTNET,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    testnet: {
      url: process.env.WEB3_HTTP_PROVIDER_TESTNET,
      accounts: [
        process.env.BUNDLER_PRIVATE_KEY,
        process.env.SMART_WALLET_OWNER_PRIVATE_KEY,
      ],
      // gas: 2100000,
      // gasPrice: 10000000000,
    },
    mainnet: {
      url: process.env.WEB3_HTTP_PROVIDER_MAINNET,
      accounts: [
        process.env.BUNDLER_PRIVATE_KEY,
        process.env.SMART_WALLET_OWNER_PRIVATE_KEY,
      ],
      gas: 2100000,
      gasPrice: 10000000000,
    },
    ganache: {
      url: "HTTP://127.0.0.1:7545",
      chainId: 1337,
      gas: 2100000,
      // gasPrice: 10000000000,
    },
  },
  etherscan: {
    apiKey: process.env.SCAN_API_KEY,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 50000,
          },
        },
      },
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 50000,
          },
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    // outputFile: "gas-report.txt",
    currency: "EUR", // You can replace it with your desired currency
    gasPrice: 5,
    token: "ARB", // You can replace it with your desired currency
    // coinmarketcap: process.env.COINMARKETCAP_API,
    // gasPriceApi: process.env.BINANCE_GAS_API,
  },
};

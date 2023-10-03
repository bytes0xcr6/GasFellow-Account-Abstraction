const {
    ethers
} = require("ethers");

const BundlerPKey = process.env.BUNDLER_PRIVATE_KEY;
const SignerPKey = process.env.SMART_WALLET_OWNER_PRIVATE_KEY;
const Provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER_TESTNET)
const Owner = process.env.SMART_WALLET_OWNER_PUBLIC_KEY;
const priceFeedProxyAddress = process.env.PRICE_FEED_PROXY;
const CHAIN_ID = process.env.CHAIN_ID;
const ERC20Address = process.env.ERC20_FEE;
const WalletOwnerPrivateKey = process.env.SMART_WALLET_OWNER_PRIVATE_KEY;
const WalletOwnerPublicKey = process.env.SMART_WALLET_OWNER_PUBLIC_KEY;

const Bundler = new ethers.Wallet(BundlerPKey, Provider)
module.exports = {
    BundlerPKey,
    SignerPKey,
    Bundler,
    Provider,
    Owner,
    priceFeedProxyAddress,
    CHAIN_ID,
    ERC20Address,
    WalletOwnerPrivateKey,
    WalletOwnerPublicKey
};
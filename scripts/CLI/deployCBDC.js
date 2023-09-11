const {
  ethers
} = require("hardhat");

async function main(Bundler, feeData) {

  const trillion = "1000000000000";
  const CBDC = await ethers.getContractFactory("CBDC", Bundler);
  const cbdc = await CBDC.deploy(
    "USD_CBDC",
    "eUSD",
    (trillion * 10 ** 8).toString(), {
      gasPrice: 5000000000
    }
  );
  await cbdc.deployed();

  // console.log(`CBDC deployed to ${cbdc.address}`);
  return cbdc
}

module.exports = {
  main
};
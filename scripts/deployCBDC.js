const { ethers } = require("hardhat");

async function main() {
  const [Bundler] = await ethers.getSigners();

  const trillion = "1000000000000";

  const CBDC = await ethers.getContractFactory("CBDC", Bundler);
  const cbdc = await CBDC.deploy(
    "USD_CBDC",
    "eUSD",
    (trillion * 10 ** 8).toString()
  );

  console.log(`CBDC deployed to ${cbdc.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

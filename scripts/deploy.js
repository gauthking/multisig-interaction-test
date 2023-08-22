
const hre = require("hardhat");

async function main() {

  const lock = await hre.ethers.deployContract("sign1");

  await lock.waitForDeployment();
  console.log("MutiSignTest contract deployed to - ", lock.getAddress())

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

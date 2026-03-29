const hre = require("hardhat");

async function main() {
  const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
  const documentRegistry = await DocumentRegistry.deploy();

  await documentRegistry.waitForDeployment();

  console.log(
    `DocumentRegistry deployed to ${documentRegistry.target}`
  );
  require('fs').writeFileSync('deployed_address.txt', documentRegistry.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

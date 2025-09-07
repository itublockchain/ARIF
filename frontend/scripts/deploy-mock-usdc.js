const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Mock USDC...");

  // Mock USDC contract
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();

  const address = await mockUSDC.getAddress();
  console.log("Mock USDC deployed to:", address);

  // Mint some tokens to the deployer
  const [deployer] = await ethers.getSigners();
  const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
  await mockUSDC.mint(deployer.address, mintAmount);
  console.log("Minted 1M USDC to:", deployer.address);

  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

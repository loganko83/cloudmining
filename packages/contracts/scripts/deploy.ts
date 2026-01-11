import { ethers } from "hardhat";

async function main() {
  console.log("\n========================================");
  console.log("Xphere Mining Cloud - Contract Deployment");
  console.log("Network: Xphere Mainnet (Chain ID: 20250217)");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "XP\n");

  if (parseFloat(ethers.formatEther(balance)) < 0.1) {
    throw new Error("Insufficient XP balance for deployment (need at least 0.1 XP)");
  }

  // 1. Deploy XP Token
  console.log("1. Deploying XPToken...");
  const XPToken = await ethers.getContractFactory("XPToken");
  const xpToken = await XPToken.deploy();
  await xpToken.waitForDeployment();
  const xpTokenAddress = await xpToken.getAddress();
  console.log("   XPToken deployed to:", xpTokenAddress);

  // 2. Deploy Interest Rate Model
  console.log("2. Deploying InterestRateModel...");
  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = await InterestRateModel.deploy();
  await interestRateModel.waitForDeployment();
  const interestRateModelAddress = await interestRateModel.getAddress();
  console.log("   InterestRateModel deployed to:", interestRateModelAddress);

  // 3. Deploy XPx Token
  console.log("3. Deploying XPxToken...");
  const XPxToken = await ethers.getContractFactory("XPxToken");
  const xpxToken = await XPxToken.deploy(xpTokenAddress);
  await xpxToken.waitForDeployment();
  const xpxTokenAddress = await xpxToken.getAddress();
  console.log("   XPxToken deployed to:", xpxTokenAddress);

  // 4. Deploy Lending Pool
  console.log("4. Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(
    xpTokenAddress,
    xpxTokenAddress,
    interestRateModelAddress
  );
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("   LendingPool deployed to:", lendingPoolAddress);

  // 5. Set LendingPool as XPx minter
  console.log("5. Setting LendingPool as XPx minter...");
  await xpxToken.setLendingPool(lendingPoolAddress);
  console.log("   XPxToken lending pool set");

  // 6. Deploy Mining Rewards
  console.log("6. Deploying MiningRewards...");
  const MiningRewards = await ethers.getContractFactory("MiningRewards");
  const miningRewards = await MiningRewards.deploy(xpTokenAddress);
  await miningRewards.waitForDeployment();
  const miningRewardsAddress = await miningRewards.getAddress();
  console.log("   MiningRewards deployed to:", miningRewardsAddress);

  // 7. Set MiningRewards as XP minter
  console.log("7. Setting MiningRewards as XP minter...");
  await xpToken.setMiningRewardsController(miningRewardsAddress);
  console.log("   XPToken mining rewards controller set");

  // 8. Deploy Machine Payment (with deployer as treasury initially)
  console.log("8. Deploying MachinePayment...");
  const MachinePayment = await ethers.getContractFactory("MachinePayment");
  const machinePayment = await MachinePayment.deploy(deployer.address);
  await machinePayment.waitForDeployment();
  const machinePaymentAddress = await machinePayment.getAddress();
  console.log("   MachinePayment deployed to:", machinePaymentAddress);

  // Summary
  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("========================================");
  console.log("\nDeployed Contract Addresses:");
  console.log("----------------------------");
  console.log("XPToken:          ", xpTokenAddress);
  console.log("XPxToken:         ", xpxTokenAddress);
  console.log("InterestRateModel:", interestRateModelAddress);
  console.log("LendingPool:      ", lendingPoolAddress);
  console.log("MiningRewards:    ", miningRewardsAddress);
  console.log("MachinePayment:   ", machinePaymentAddress);
  console.log("\nExplorer URLs:");
  console.log("XPToken:       https://xp.tamsa.io/address/" + xpTokenAddress);
  console.log("LendingPool:   https://xp.tamsa.io/address/" + lendingPoolAddress);
  console.log("MiningRewards: https://xp.tamsa.io/address/" + miningRewardsAddress);
  console.log("\n========================================\n");

  // Save deployment info
  const deploymentInfo = {
    network: "xphere",
    chainId: 20250217,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      XPToken: xpTokenAddress,
      XPxToken: xpxTokenAddress,
      InterestRateModel: interestRateModelAddress,
      LendingPool: lendingPoolAddress,
      MiningRewards: miningRewardsAddress,
      MachinePayment: machinePaymentAddress,
    },
  };

  console.log("Deployment Info JSON:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

main()
  .then((info) => {
    console.log("\nDeployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nDeployment failed:", error);
    process.exit(1);
  });

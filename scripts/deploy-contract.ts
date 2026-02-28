import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * 0711 GitChain — ContentCertificate Contract Deployment
 *
 * Deploys the ContentCertificate.sol smart contract to Base network.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-contract.ts --network base-sepolia
 *   npx hardhat run scripts/deploy-contract.ts --network base-mainnet
 */

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=".repeat(60));
  console.log("0711 GitChain - ContentCertificate Deployment");
  console.log("=".repeat(60));

  const network = await hre.ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("\nERROR: Deployer has no ETH!");
    console.log("\nGet testnet ETH from:");
    console.log(
      "  https://www.coinbase.com/faucets/base-ethereum-goerli-faucet"
    );
    console.log("  https://faucet.quicknode.com/base/sepolia");
    console.log("  https://thirdweb.com/base-sepolia-testnet");
    console.log(`\nSend ETH to: ${deployer.address}`);
    process.exit(1);
  }

  console.log("\nDeploying ContentCertificate...");

  const ContentCertificate =
    await hre.ethers.getContractFactory("ContentCertificate");
  const contract = await ContentCertificate.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash;

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log(`Contract Address: ${address}`);
  console.log(`TX Hash: ${txHash}`);

  const networkName =
    Number(network.chainId) === 8453 ? "base-mainnet" : "base-sepolia";
  const explorer =
    networkName === "base-mainnet"
      ? "https://basescan.org"
      : "https://sepolia.basescan.org";

  console.log(`Explorer: ${explorer}/address/${address}`);

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deployment = {
    network: networkName,
    chainId: Number(network.chainId),
    address,
    txHash,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(deploymentsDir, `${networkName}.json`),
    JSON.stringify(deployment, null, 2)
  );

  console.log(`\nSaved to: deployments/${networkName}.json`);
  console.log("\nAdd to .env:");

  if (networkName === "base-mainnet") {
    console.log(
      `CONTENT_CERTIFICATE_ADDRESS_MAINNET=${address}`
    );
  } else {
    console.log(
      `CONTENT_CERTIFICATE_ADDRESS_SEPOLIA=${address}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

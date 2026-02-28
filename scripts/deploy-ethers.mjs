#!/usr/bin/env node

/**
 * 0711 GitChain - Direct Deployment with ethers.js
 * No hardhat required - compiles with solc and deploys
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-ethers.mjs
 *   DEPLOYER_PRIVATE_KEY=0x... BASE_MAINNET_RPC=https://mainnet.base.org node scripts/deploy-ethers.mjs --mainnet
 */

import { ethers, ContractFactory } from "ethers";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("=".repeat(60));
  console.log("0711 GitChain - ContentCertificate Deployment");
  console.log("=".repeat(60));

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("ERROR: DEPLOYER_PRIVATE_KEY not set");
    console.log(
      "\nUsage: DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-ethers.mjs"
    );
    process.exit(1);
  }

  // Detect network from args
  const isMainnet = process.argv.includes("--mainnet");
  const rpcUrl = isMainnet
    ? process.env.BASE_MAINNET_RPC || "https://mainnet.base.org"
    : process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
  const networkName = isMainnet ? "base-mainnet" : "base-sepolia";
  const explorer = isMainnet
    ? "https://basescan.org"
    : "https://sepolia.basescan.org";

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const network = await provider.getNetwork();
  console.log(`Network: ${networkName} (chainId: ${network.chainId})`);
  console.log(`Deployer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("\nERROR: Deployer has no ETH!");
    if (!isMainnet) {
      console.log("\nGet testnet ETH from:");
      console.log(
        "  https://www.coinbase.com/faucets/base-ethereum-goerli-faucet"
      );
      console.log("  https://faucet.quicknode.com/base/sepolia");
      console.log("  https://thirdweb.com/base-sepolia-testnet");
    }
    console.log(`\nSend ETH to: ${wallet.address}`);
    process.exit(1);
  }

  // Compile contract
  console.log("\nCompiling ContentCertificate.sol...");

  const contractsDir = path.join(__dirname, "../contracts");
  const buildDir = path.join(__dirname, "../build");

  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const contractPath = path.join(contractsDir, "ContentCertificate.sol");

  if (!fs.existsSync(contractPath)) {
    console.error(`ERROR: Contract not found at ${contractPath}`);
    process.exit(1);
  }

  // Try to compile
  try {
    execSync(
      `npx solcjs --optimize --abi --bin --base-path . --include-path node_modules -o ${buildDir} ${contractPath}`,
      { stdio: "inherit", cwd: path.join(__dirname, "..") }
    );
  } catch {
    console.log("solcjs failed, trying with npx solc...");
    try {
      execSync(
        `npx -y solc --optimize --abi --bin --base-path . --include-path node_modules -o ${buildDir} --overwrite ${contractPath}`,
        { stdio: "inherit", cwd: path.join(__dirname, "..") }
      );
    } catch {
      console.error("Compilation failed. Install solcjs: npm install -g solc");
      process.exit(1);
    }
  }

  // Find compiled files
  const files = fs.readdirSync(buildDir);
  let binFile = files.find(
    (f) => f.includes("ContentCertificate") && f.endsWith(".bin")
  );
  let abiFile = files.find(
    (f) => f.includes("ContentCertificate") && f.endsWith(".abi")
  );

  if (!binFile || !abiFile) {
    console.error("Compiled files not found in build/");
    console.log("Available files:", files);
    process.exit(1);
  }

  const bytecode =
    "0x" + fs.readFileSync(path.join(buildDir, binFile), "utf8").trim();
  const abi = JSON.parse(
    fs.readFileSync(path.join(buildDir, abiFile), "utf8")
  );

  console.log(`Compiled (${(bytecode.length - 2) / 2} bytes)`);

  // Deploy
  console.log("\nDeploying (this may take ~15 seconds)...");

  const factory = new ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();

  console.log(`TX Hash: ${contract.deploymentTransaction()?.hash}`);
  console.log("Waiting for confirmation...");

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log(`Contract Address: ${address}`);
  console.log(`TX Hash: ${contract.deploymentTransaction()?.hash}`);
  console.log(`Explorer: ${explorer}/address/${address}`);

  // Save deployment info
  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deployment = {
    network: networkName,
    chainId: Number(network.chainId),
    address,
    txHash: contract.deploymentTransaction()?.hash,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(deploymentDir, `${networkName}.json`),
    JSON.stringify(deployment, null, 2)
  );

  console.log(`\nSaved to: deployments/${networkName}.json`);
  console.log("\nAdd to .env:");
  if (isMainnet) {
    console.log(`CONTENT_CERTIFICATE_ADDRESS_MAINNET=${address}`);
  } else {
    console.log(`CONTENT_CERTIFICATE_ADDRESS_SEPOLIA=${address}`);
  }
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});

#!/usr/bin/env node

import "dotenv/config";
import { Command } from "commander";
import { getAddress, getBalance } from "./actions/wallet.js";
import { mintWrap } from "./actions/mint.js";
import { stakeWrap } from "./actions/stake.js";
import { bridgeWrap } from "./actions/bridge.js";
import { bridgeEth } from "./actions/bridgeEth.js";
import { transferAsset } from "./actions/transfer.js";


const program = new Command();

program
  .name("overlayer-ops")
  .description("CLI Utility for Overlayer EVM Sepolia operations")
  .version("1.0.0");

// 1. Get Wallet Address
program
  .command("address")
  .description("Dapatkan alamat wallet Anda")
  .action(() => {
    getAddress();
  });

// 2. Get Balance
program
  .command("balance")
  .description("Cek saldo native ETH atau token tertentu di Sepolia")
  .option("-t, --token <token>", "Simbol token (misal: usdt, usdc, t+, c+, st+, sc+)")
  .action((options) => {
    getBalance(options.token);
  });

// 3. Mint Wrap (Collateral to WRAP)
program
  .command("mint")
  .description("Mint stablecoin wrap (USDT ke T+ atau USDC ke C+) di Sepolia")
  .requiredOption("-p, --product <usdt|usdc>", "Produk stablecoin yang akan diwrap (USDT atau USDC)")
  .requiredOption("-a, --amount <amount>", "Jumlah stablecoin yang akan diwrap")
  .action((options) => {
    mintWrap(options.product, options.amount);
  });

// 4. Stake Wrap (WRAP to StakedWRAP)
program
  .command("stake")
  .description("Stake wrapped token (T+ ke sT+ atau C+ ke sC+) di Sepolia")
  .requiredOption("-p, --product <t+|c+>", "Token wrapped yang akan distake (T+ atau C+)")
  .requiredOption("-a, --amount <amount>", "Jumlah token yang akan distake")
  .action((options) => {
    stakeWrap(options.product, options.amount);
  });

// 5. Bridge Wrap (Cross-chain Bridge)
program
  .command("bridge")
  .description("Bridge wrapped token ke chain L2 Sepolia menggunakan LayerZero V2")
  .requiredOption("-p, --product <t+|c+>", "Token wrapped yang akan dibridge (T+ atau C+)")
  .requiredOption("-a, --amount <amount>", "Jumlah token yang dibridge")
  .requiredOption("-d, --dest <arbitrum|base|optimism>", "Chain tujuan L2 (arbitrum, base, optimism)")
  .option("-r, --recipient <address>", "Alamat dompet penerima di chain tujuan (opsional, default: alamat sendiri)")
  .action((options) => {
    bridgeWrap(options.product, options.amount, options.dest, options.recipient);
  });

// 6. Bridge Native ETH (Sepolia ke Base Sepolia)
program
  .command("bridge-eth")
  .description("Bridge native ETH dari Sepolia ke Base Sepolia menggunakan L1StandardBridge")
  .requiredOption("-a, --amount <amount>", "Jumlah ETH yang dibridge")
  .option("-r, --recipient <address>", "Alamat dompet penerima di Base Sepolia (opsional, default: alamat sendiri)")
  .action((options) => {
    bridgeEth(options.amount, options.recipient);
  });

// 7. Transfer Koin/Token
program
  .command("transfer")
  .description("Kirim native ETH atau token ERC-20 (USDT, USDC, T+, C+) ke alamat lain di Sepolia")
  .requiredOption("-p, --product <eth|usdt|usdc|t+|c+|contract_address>", "Aset yang akan ditransfer")
  .requiredOption("-to, --to <address>", "Alamat dompet penerima")
  .requiredOption("-a, --amount <amount>", "Jumlah aset yang dikirim")
  .action((options) => {
    transferAsset(options.product, options.to, options.amount);
  });

program.parse(process.argv);



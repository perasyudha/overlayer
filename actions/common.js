import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory
dotenv.config({ path: path.join(__dirname, "../.env") });

export const SEPOLIA_CONFIG = {
  id: 11155111,
  name: "Ethereum Sepolia",
  symbol: "ETH",
  rpc: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
  explorer: "https://sepolia.etherscan.io"
};

// LayerZero Testnet Endpoint IDs (EIDs)
export const DEST_EIDS = {
  arbitrum: 40231, // Arbitrum Sepolia
  optimism: 40232, // Optimism Sepolia
  base: 40245     // Base Sepolia
};

// Contract addresses on Sepolia
export const CONTRACTS = {
  usdt: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
  usdc: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  "t+": "0xe20534a32f9162488a90026F268a74fBE28d272D",
  "c+": "0xE815718D44694ec4637CB775C468d87f6e15B538",
  "st+": "0x079a4Bf1Cbd0E4ce15391340cB46efA6396aBc82",
  "sc+": "0x753937137Eb92871A6F3517514d4f1Ee860e3FDF"
};

// ABIs
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export const MINT_ABI = [
  "function mint(uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export const STAKING_ABI = [
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function asset() view returns (address)"
];

export const OFT_ABI = [
  "function send(tuple(uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) sendParam, tuple(uint256 nativeFee, uint256 lzTokenFee) fee, address refundAddress) payable returns (tuple(bytes32 guid, uint64 nonce, tuple(uint256 nativeFee, uint256 lzTokenFee) fee) receipt)",
  "function quoteSend(tuple(uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) sendParam, bool payInLzToken) view returns (tuple(uint256 nativeFee, uint256 lzTokenFee) fee)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export function getWallet() {
  const rpcUrl = SEPOLIA_CONFIG.rpc;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey.trim() === "" || privateKey.startsWith("0x0000000000")) {
    throw new Error("Konfigurasi wallet tidak ditemukan atau masih bernilai default. Silakan isi PRIVATE_KEY di file .env Anda.");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  return { wallet, provider, chainConfig: SEPOLIA_CONFIG };
}

export function formatUnits(value, decimals = 18) {
  return ethers.formatUnits(value, decimals);
}

export function parseUnits(value, decimals = 18) {
  return ethers.parseUnits(value.toString(), decimals);
}

import { ethers } from "ethers";
import { getWallet, parseUnits, formatUnits } from "./common.js";

// L1 standard bridge address for Base Sepolia on Ethereum Sepolia
const BASE_SEPOLIA_L1_BRIDGE = "0x3154Cf16ccdb4C6d922629664174b904d80F2C35";

const L1_BRIDGE_ABI = [
  "function depositETH(uint32 _minGasLimit, bytes calldata _extraData) external payable",
  "function depositETHTo(address _to, uint32 _minGasLimit, bytes calldata _extraData) external payable"
];

export async function bridgeEth(amountInput, recipientInput) {
  try {
    const { wallet, chainConfig } = getWallet();
    
    const recipient = recipientInput || wallet.address;
    if (!ethers.isAddress(recipient)) {
      throw new Error(`Alamat penerima "${recipient}" tidak valid.`);
    }
    
    const amountWei = parseUnits(amountInput, 18);
    
    // Cek saldo native ETH
    const provider = wallet.provider;
    const ethBalanceVal = await provider.getBalance(wallet.address);
    if (ethBalanceVal < amountWei) {
      throw new Error(`Saldo ETH Anda tidak mencukupi. Saldo: ${formatUnits(ethBalanceVal, 18)} ETH, Diperlukan: ${amountInput} ETH`);
    }
    
    console.log(`Menghubungkan ke L1 Standard Bridge (${BASE_SEPOLIA_L1_BRIDGE})...`);
    const bridgeContract = new ethers.Contract(BASE_SEPOLIA_L1_BRIDGE, L1_BRIDGE_ABI, wallet);
    
    // Gas limit standar L2 untuk transfer ETH adalah 200.000 gas
    const minGasLimit = 200000;
    const extraData = "0x";
    
    console.log(`Mengirim ${amountInput} ETH dari Sepolia ke Base Sepolia (Penerima: ${recipient})...`);
    
    const tx = await bridgeContract.depositETHTo(
      recipient,
      minGasLimit,
      extraData,
      { value: amountWei }
    );
    
    console.log(`Transaksi bridge ETH dikirim. Hash: ${tx.hash}`);
    console.log(`Menunggu konfirmasi block...`);
    const receipt = await tx.wait(1);
    
    console.log(JSON.stringify({
      success: true,
      chain: chainConfig.name,
      txHash: receipt.hash,
      explorer: `${chainConfig.explorer}/tx/${receipt.hash}`
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2));
  }
}

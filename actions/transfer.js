import { ethers } from "ethers";
import { getWallet, CONTRACTS, ERC20_ABI, parseUnits, formatUnits } from "./common.js";

export async function transferAsset(product, toAddress, amountInput) {
  try {
    const { wallet, chainConfig } = getWallet();
    
    if (!ethers.isAddress(toAddress)) {
      throw new Error(`Alamat penerima "${toAddress}" tidak valid.`);
    }
    
    const prodLower = product.toLowerCase();
    let txResponse;
    let decimals = 18;
    let symbol = "ETH";
    let tokenAddress = null;
    
    // Tentukan apakah native ETH atau ERC20 Token
    if (prodLower === "eth") {
      // Transfer Native ETH
      const amountWei = parseUnits(amountInput, 18);
      
      // Cek saldo native ETH
      const provider = wallet.provider;
      const ethBalanceVal = await provider.getBalance(wallet.address);
      if (ethBalanceVal < amountWei) {
        throw new Error(`Saldo ETH Anda tidak mencukupi. Saldo: ${formatUnits(ethBalanceVal, 18)} ETH, Diperlukan: ${amountInput} ETH`);
      }
      
      console.log(`Mengirim ${amountInput} ETH ke ${toAddress} di ${chainConfig.name}...`);
      txResponse = await wallet.sendTransaction({
        to: toAddress,
        value: amountWei
      });
      
    } else {
      // Transfer ERC20 Token (usdt, usdc, t+, c+, atau alamat kontrak kustom)
      if (CONTRACTS[prodLower]) {
        tokenAddress = CONTRACTS[prodLower];
        symbol = prodLower.toUpperCase();
      } else if (ethers.isAddress(product)) {
        tokenAddress = product;
        symbol = "Token";
      } else {
        throw new Error(`Token/Aset "${product}" tidak dikenal. Gunakan: eth, usdt, usdc, t+, c+, atau alamat contract token.`);
      }
      
      console.log(`Menghubungkan ke contract token (${tokenAddress})...`);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
      
      [decimals, symbol] = await Promise.all([
        tokenContract.decimals(),
        tokenContract.symbol()
      ]);
      
      const amountWei = parseUnits(amountInput, decimals);
      
      // Cek saldo token
      const balance = await tokenContract.balanceOf(wallet.address);
      if (balance < amountWei) {
        throw new Error(`Saldo ${symbol} Anda tidak mencukupi. Saldo: ${formatUnits(balance, decimals)} ${symbol}, Diperlukan: ${amountInput}`);
      }
      
      console.log(`Mengirim ${amountInput} ${symbol} ke ${toAddress} di ${chainConfig.name}...`);
      txResponse = await tokenContract.transfer(toAddress, amountWei);
    }
    
    console.log(JSON.stringify({
      success: true,
      chain: chainConfig.name,
      txHash: txResponse.hash,
      explorer: `${chainConfig.explorer}/tx/${txResponse.hash}`
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2));
  }
}

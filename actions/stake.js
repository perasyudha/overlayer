import { ethers } from "ethers";
import { getWallet, CONTRACTS, ERC20_ABI, STAKING_ABI, parseUnits, formatUnits } from "./common.js";

export async function stakeWrap(product, amountInput) {
  try {
    const { wallet, chainConfig } = getWallet();
    
    const prodLower = product.toLowerCase();
    let assetSymbol, vaultSymbol;
    
    if (prodLower === "t+" || prodLower === "t") {
      assetSymbol = "t+";
      vaultSymbol = "st+";
    } else if (prodLower === "c+" || prodLower === "c") {
      assetSymbol = "c+";
      vaultSymbol = "sc+";
    } else {
      throw new Error(`Product "${product}" tidak dikenal untuk staking. Gunakan "T+" atau "C+".`);
    }
    
    const assetAddress = CONTRACTS[assetSymbol];
    const vaultAddress = CONTRACTS[vaultSymbol];
    
    console.log(`Menghubungkan ke contract...`);
    const assetContract = new ethers.Contract(assetAddress, ERC20_ABI, wallet);
    const vaultContract = new ethers.Contract(vaultAddress, STAKING_ABI, wallet);
    
    const [assetDecimals, vaultDecimals] = await Promise.all([
      assetContract.decimals(),
      vaultContract.decimals()
    ]);
    
    const amountWeiAsset = parseUnits(amountInput, assetDecimals);
    
    // 1. Cek Saldo Asset (T+/C+)
    const userAssetBalance = await assetContract.balanceOf(wallet.address);
    if (userAssetBalance < amountWeiAsset) {
      throw new Error(`Saldo ${assetSymbol.toUpperCase()} Anda tidak mencukupi. Saldo: ${formatUnits(userAssetBalance, assetDecimals)}, Diperlukan: ${amountInput}`);
    }
    
    // 2. Cek Allowance
    console.log(`Memeriksa allowance ${assetSymbol.toUpperCase()} untuk staking vault...`);
    const allowance = await assetContract.allowance(wallet.address, vaultAddress);
    
    if (allowance < amountWeiAsset) {
      console.log(`Allowance kurang. Menyetujui (${assetSymbol.toUpperCase()}) spending...`);
      const approveTx = await assetContract.approve(vaultAddress, amountWeiAsset);
      console.log(`Transaksi approval dikirim. Hash: ${approveTx.hash}`);
      console.log(`Menunggu konfirmasi approval...`);
      await approveTx.wait(1);
      console.log(`Approval berhasil!`);
    } else {
      console.log(`Allowance mencukupi.`);
    }
    
    // 3. Staking Deposit
    console.log(`Memulai staking ${assetSymbol.toUpperCase()} sejumlah ${amountInput} ke ${vaultSymbol.toUpperCase()}...`);
    const depositTx = await vaultContract.deposit(amountWeiAsset, wallet.address);
    console.log(`Transaksi staking dikirim. Hash: ${depositTx.hash}`);
    console.log(`Menunggu konfirmasi block...`);
    const receipt = await depositTx.wait(1);
    
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

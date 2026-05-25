import { ethers } from "ethers";
import { getWallet, CONTRACTS, ERC20_ABI, STAKING_ABI, parseUnits, formatUnits } from "./common.js";

export async function stakeWrap(product, amountInput, count = 1) {
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
    const totalAssetNeeded = amountWeiAsset * BigInt(count);
    
    // 1. Cek Saldo Asset (T+/C+)
    const userAssetBalance = await assetContract.balanceOf(wallet.address);
    if (userAssetBalance < totalAssetNeeded) {
      throw new Error(`Saldo ${assetSymbol.toUpperCase()} Anda tidak mencukupi untuk ${count} staking. Saldo: ${formatUnits(userAssetBalance, assetDecimals)}, Diperlukan: ${formatUnits(totalAssetNeeded, assetDecimals)}`);
    }
    
    // 2. Cek Allowance
    console.log(`Memeriksa allowance ${assetSymbol.toUpperCase()} untuk staking vault...`);
    const allowance = await assetContract.allowance(wallet.address, vaultAddress);
    
    if (allowance < totalAssetNeeded) {
      console.log(`Allowance kurang. Menyetujui (${assetSymbol.toUpperCase()}) spending untuk ${count} staking...`);
      const approveTx = await assetContract.approve(vaultAddress, totalAssetNeeded);
      console.log(`Transaksi approval dikirim. Hash: ${approveTx.hash}`);
      console.log(`Menunggu konfirmasi approval...`);
      await approveTx.wait(1);
      console.log(`Approval berhasil!`);
    } else {
      console.log(`Allowance mencukupi.`);
    }
    
    // 3. Staking Deposit
    console.log(`Memulai ${count} transaksi staking ${assetSymbol.toUpperCase()} masing-masing ${amountInput} ke ${vaultSymbol.toUpperCase()}...`);
    
    const txHashes = [];
    for (let i = 0; i < count; i++) {
      console.log(`Mengirim transaksi #${i + 1}/${count}...`);
      const depositTx = await vaultContract.deposit(amountWeiAsset, wallet.address);
      txHashes.push(depositTx.hash);
      console.log(`Transaksi #${i + 1} dikirim. Hash: ${depositTx.hash}`);
    }
    
    console.log(JSON.stringify({
      success: true,
      chain: chainConfig.name,
      txHashes: txHashes,
      explorer: `${chainConfig.explorer}/tx/${txHashes[0]}`
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2));
  }
}

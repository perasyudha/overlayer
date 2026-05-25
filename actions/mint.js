import { ethers } from "ethers";
import { getWallet, CONTRACTS, ERC20_ABI, MINT_ABI, parseUnits, formatUnits } from "./common.js";

export async function mintWrap(product, amountInput, count = 1) {
  try {
    const { wallet, chainConfig } = getWallet();
    
    const prodUpper = product.toUpperCase();
    let collateralSymbol, wrapperSymbol;
    
    if (prodUpper === "USDT") {
      collateralSymbol = "usdt";
      wrapperSymbol = "t+";
    } else if (prodUpper === "USDC") {
      collateralSymbol = "usdc";
      wrapperSymbol = "c+";
    } else {
      throw new Error(`Product "${product}" tidak dikenal. Gunakan "USDT" atau "USDC".`);
    }
    
    const collateralAddress = CONTRACTS[collateralSymbol];
    const wrapperAddress = CONTRACTS[wrapperSymbol];
    
    console.log(`Menghubungkan ke contract...`);
    const collateralContract = new ethers.Contract(collateralAddress, ERC20_ABI, wallet);
    const wrapperContract = new ethers.Contract(wrapperAddress, MINT_ABI, wallet);
    
    const [collateralDecimals, wrapperDecimals] = await Promise.all([
      collateralContract.decimals(),
      wrapperContract.decimals()
    ]);
    
    const amountWeiCollateral = parseUnits(amountInput, collateralDecimals);
    const amountWeiWrapper = parseUnits(amountInput, wrapperDecimals);
    
    const totalCollateralNeeded = amountWeiCollateral * BigInt(count);
    
    // 1. Cek Saldo Collateral
    const userCollateralBalance = await collateralContract.balanceOf(wallet.address);
    if (userCollateralBalance < totalCollateralNeeded) {
      throw new Error(`Saldo ${collateralSymbol.toUpperCase()} Anda tidak mencukupi untuk ${count} swap. Saldo: ${formatUnits(userCollateralBalance, collateralDecimals)}, Diperlukan: ${formatUnits(totalCollateralNeeded, collateralDecimals)}`);
    }
    
    // 2. Cek Allowance
    console.log(`Memeriksa allowance ${collateralSymbol.toUpperCase()} untuk wrap contract...`);
    const allowance = await collateralContract.allowance(wallet.address, wrapperAddress);
    
    if (allowance < totalCollateralNeeded) {
      console.log(`Allowance kurang. Menyetujui (${collateralSymbol.toUpperCase()}) spending untuk ${count} swap...`);
      const approveTx = await collateralContract.approve(wrapperAddress, totalCollateralNeeded);
      console.log(`Transaksi approval dikirim. Hash: ${approveTx.hash}`);
      console.log(`Menunggu konfirmasi approval...`);
      await approveTx.wait(1);
      console.log(`Approval berhasil!`);
    } else {
      console.log(`Allowance mencukupi.`);
    }
    
    // 3. Mint Wrap
    console.log(`Memulai ${count} transaksi swap ${wrapperSymbol.toUpperCase()} masing-masing ${amountInput}...`);
    const order = {
      to: wallet.address,
      receiver: wallet.address,
      collateral: collateralAddress,
      amountIn: amountWeiCollateral,
      amountOut: amountWeiWrapper
    };
    
    const txHashes = [];
    for (let i = 0; i < count; i++) {
      console.log(`Mengirim transaksi #${i + 1}/${count}...`);
      const mintTx = await wrapperContract.mint(order);
      txHashes.push(mintTx.hash);
      console.log(`Transaksi #${i + 1} dikirim. Hash: ${mintTx.hash}`);
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

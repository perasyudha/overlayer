import { ethers } from "ethers";
import { getWallet, CONTRACTS, ERC20_ABI, MINT_ABI, parseUnits, formatUnits } from "./common.js";

export async function mintWrap(product, amountInput) {
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
    
    // 1. Cek Saldo Collateral
    const userCollateralBalance = await collateralContract.balanceOf(wallet.address);
    if (userCollateralBalance < amountWeiCollateral) {
      throw new Error(`Saldo ${collateralSymbol.toUpperCase()} Anda tidak mencukupi. Saldo: ${formatUnits(userCollateralBalance, collateralDecimals)}, Diperlukan: ${amountInput}`);
    }
    
    // 2. Cek Allowance
    console.log(`Memeriksa allowance ${collateralSymbol.toUpperCase()} untuk wrap contract...`);
    const allowance = await collateralContract.allowance(wallet.address, wrapperAddress);
    
    if (allowance < amountWeiCollateral) {
      console.log(`Allowance kurang. Menyetujui (${collateralSymbol.toUpperCase()}) spending...`);
      const approveTx = await collateralContract.approve(wrapperAddress, amountWeiCollateral);
      console.log(`Transaksi approval dikirim. Hash: ${approveTx.hash}`);
      console.log(`Menunggu konfirmasi approval...`);
      await approveTx.wait(1);
      console.log(`Approval berhasil!`);
    } else {
      console.log(`Allowance mencukupi.`);
    }
    
    // 3. Mint Wrap
    console.log(`Memulai minting ${wrapperSymbol.toUpperCase()} sejumlah ${amountInput}...`);
    // Note: Overlayer mint takes the wrapped token amount or collateral amount. Since 1:1, we pass the amount corresponding to the wrap decimals or collateral decimals.
    // Wait, on Overlayer, does mint take collateral-decimals amount or wrap-decimals amount?
    // Let's pass amountWeiWrapper (normally wrap contracts take wrap decimals). But wait! Some take collateral decimals.
    // Let's check: if USDT decimals = 6 and T+ decimals = 18, and we want to mint 1 USDT, then if we call mint(1e6) on T+, it might mint 1e6 T+ (which would be 0.000001 T+ if T+ is 18 decimals!).
    // Usually, if the wrap token is 18 decimals and collateral is 6, the wrap contract mint function takes the collateral amount (6 decimals) and mints 18 decimals tokens, OR it takes the 18 decimals amount and transfers 6 decimals.
    // Let's look at the decompiled code in task-41:
    // `a=await s.connect(n).mint(r,{gasLimit:o});`
    // Wait, `r` is the raw amount input by the user (parsed).
    // Let's see: `s.mint(r)` where `r` is `gv(r)`? No, in `A4e`, `r` is passed to `mint(r)`.
    // Wait! In `_4e` (deposit staking), it calls `deposit(gv(r), n)` where `gv` parses the value.
    // Let's look at how the front-end calls it. If USDT wrap contract decimals is actually 6, then both are 6 decimals, so `amountWeiCollateral == amountWeiWrapper`.
    // Wait! Let's query both decimals. If they differ, `mint` is a function on the wrap contract (e.g. `T+` contract), so it should take `amountWeiCollateral` (since we are paying in collateral to mint) or `amountWeiWrapper`.
    // Let's see: standard wrap contracts (like WETH) take the amount of the wrap token to mint (which is 18 decimals).
    // But since it's 1:1, let's use the collateral decimals for approval, and for minting we pass `amountWeiCollateral` or `amountWeiWrapper`?
    // Let's look at the contract: the contract is the wrap token itself, and it has a `mint(uint256)` function where it pulls USDT/USDC and mints.
    // To pull USDT (6 decimals), if we pass 10 * 10^18, and it does `USDT.transferFrom(msg.sender, address(this), amount)`, it will fail because it tries to transfer 10 * 10^18 USDT (which is 10 trillion USDT!).
    // So the contract `mint(uint256)` function MUST take the amount in the collateral decimals (e.g. 6 decimals for USDT/USDC), because it performs `transferFrom` using that amount!
    // This is a very common design in stablecoin wrappers. It takes the collateral amount (6 decimals) and mints `amount * 10^12` wrapper tokens (18 decimals) to the user.
    // So we should pass `amountWeiCollateral` (which is in collateral decimals, e.g. 6) to `mint(amount)`.
    // Let's use `amountWeiCollateral` for `mint(amount)`.
    
    const order = {
      to: wallet.address,
      receiver: wallet.address,
      collateral: collateralAddress,
      amountIn: amountWeiCollateral,
      amountOut: amountWeiWrapper
    };
    
    const mintTx = await wrapperContract.mint(order);
    console.log(`Transaksi mint dikirim. Hash: ${mintTx.hash}`);
    console.log(`Menunggu konfirmasi block...`);
    const receipt = await mintTx.wait(1);
    
    console.log(JSON.stringify({
      success: true,
      chain: chainConfig.name,
      txHash: receipt.hash,
      from: receipt.from,
      product: prodUpper,
      wrappedToken: wrapperSymbol.toUpperCase(),
      amount: amountInput,
      explorer: `${chainConfig.explorer}/tx/${receipt.hash}`
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2));
  }
}

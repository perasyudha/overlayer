import { ethers } from "ethers";
import { getWallet, CONTRACTS, DEST_EIDS, OFT_ABI, parseUnits, formatUnits } from "./common.js";

export async function bridgeWrap(product, amountInput, destInput, recipientInput) {
  try {
    const { wallet, chainConfig } = getWallet();
    
    // 1. Tentukan Token (T+ atau C+)
    const prodLower = product.toLowerCase();
    let tokenSymbol;
    if (prodLower === "t+" || prodLower === "t") {
      tokenSymbol = "t+";
    } else if (prodLower === "c+" || prodLower === "c") {
      tokenSymbol = "c+";
    } else {
      throw new Error(`Token "${product}" tidak didukung untuk bridging. Gunakan "T+" atau "C+".`);
    }
    const tokenAddress = CONTRACTS[tokenSymbol];
    
    // 2. Tentukan Dest EID
    const destLower = destInput.toLowerCase();
    const destEid = DEST_EIDS[destLower];
    if (!destEid) {
      throw new Error(`Chain tujuan "${destInput}" tidak didukung. Gunakan: arbitrum, base, optimism`);
    }
    
    // 3. Tentukan Recipient
    const recipient = recipientInput || wallet.address;
    if (!ethers.isAddress(recipient)) {
      throw new Error(`Alamat penerima "${recipient}" tidak valid.`);
    }
    
    console.log(`Menghubungkan ke OFT Token contract...`);
    const oftContract = new ethers.Contract(tokenAddress, OFT_ABI, wallet);
    
    const [decimals, symbol] = await Promise.all([
      oftContract.decimals(),
      oftContract.symbol()
    ]);
    
    const amountWei = parseUnits(amountInput, decimals);
    
    // Check balance
    const userBalance = await oftContract.balanceOf(wallet.address);
    if (userBalance < amountWei) {
      throw new Error(`Saldo ${symbol} Anda tidak mencukupi untuk bridging. Saldo: ${formatUnits(userBalance, decimals)}, Diperlukan: ${amountInput}`);
    }
    
    // 4. Siapkan SendParam
    // Recipient address harus di-pad ke 32 bytes (bytes32) untuk LayerZero
    const toBytes32 = ethers.zeroPadValue(recipient, 32);
    
    const sendParam = {
      dstEid: destEid,
      to: toBytes32,
      amountLD: amountWei,
      minAmountLD: amountWei, // minAmount to receive
      extraOptions: "0x",
      composeMsg: "0x",
      oftCmd: "0x"
    };
    
    // 5. Quote Fee dari LayerZero
    console.log(`Mengestimasi biaya gas LayerZero...`);
    const feeQuote = await oftContract.quoteSend(sendParam, false);
    const nativeFeeVal = feeQuote.nativeFee;
    
    console.log(`Biaya gas diestimasi: ${formatUnits(nativeFeeVal, 18)} ETH`);
    
    // Cek saldo native ETH user untuk biaya gas
    const provider = wallet.provider;
    const ethBalanceVal = await provider.getBalance(wallet.address);
    if (ethBalanceVal < nativeFeeVal) {
      throw new Error(`Saldo ETH Anda tidak cukup untuk membayar biaya gas LayerZero. Saldo: ${formatUnits(ethBalanceVal, 18)} ETH, Diperlukan: ${formatUnits(nativeFeeVal, 18)} ETH`);
    }
    
    // 6. Eksekusi Send / Bridge
    console.log(`Memulai bridge ${symbol} sejumlah ${amountInput} ke ${destInput.toUpperCase()} (EID: ${destEid})...`);
    
    // LayerZero V2 OFT send: send(sendParam, fee, refundAddress)
    const bridgeTx = await oftContract.send(
      sendParam,
      [nativeFeeVal, 0n], // [nativeFee, lzTokenFee]
      wallet.address, // refund address
      { value: nativeFeeVal } // pass nativeFee as tx value
    );
    
    console.log(`Transaksi bridge dikirim. Hash: ${bridgeTx.hash}`);
    console.log(`Menunggu konfirmasi block...`);
    const receipt = await bridgeTx.wait(1);
    
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

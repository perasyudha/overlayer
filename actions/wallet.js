import { ethers } from "ethers";
import { getWallet, CONTRACTS, ERC20_ABI, formatUnits } from "./common.js";

export async function getAddress() {
  try {
    const { wallet } = getWallet();
    console.log(JSON.stringify({
      success: true,
      address: wallet.address
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2));
  }
}

export async function getBalance(tokenSymbol) {
  try {
    const { wallet, provider, chainConfig } = getWallet();
    
    if (tokenSymbol) {
      // Query specific token
      const symbolLower = tokenSymbol.toLowerCase();
      const tokenAddress = CONTRACTS[symbolLower];
      if (!tokenAddress) {
        throw new Error(`Token "${tokenSymbol}" tidak didukung oleh skill ini. Gunakan: usdt, usdc, t+, c+, st+, sc+`);
      }
      
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [balance, decimals, symbol, name] = await Promise.all([
        tokenContract.balanceOf(wallet.address),
        tokenContract.decimals(),
        tokenContract.symbol(),
        tokenContract.name()
      ]);
      
      console.log(JSON.stringify({
        success: true,
        chain: chainConfig.name,
        address: wallet.address,
        tokenAddress: tokenAddress,
        tokenName: name,
        balance: formatUnits(balance, decimals),
        symbol: symbol
      }, null, 2));
      
    } else {
      // Query all balances
      const ethBalanceVal = await provider.getBalance(wallet.address);
      const balances = {
        ETH: formatUnits(ethBalanceVal, 18)
      };
      
      // Query each ERC20 token
      for (const [symbol, address] of Object.entries(CONTRACTS)) {
        try {
          const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
          const [balance, decimals] = await Promise.all([
            tokenContract.balanceOf(wallet.address),
            tokenContract.decimals()
          ]);
          balances[symbol.toUpperCase()] = formatUnits(balance, decimals);
        } catch (e) {
          balances[symbol.toUpperCase()] = "Error (Gagal Fetch)";
        }
      }
      
      console.log(JSON.stringify({
        success: true,
        chain: chainConfig.name,
        address: wallet.address,
        balances: balances
      }, null, 2));
    }
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2));
  }
}

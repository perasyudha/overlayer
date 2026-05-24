---
name: overlayer-ops
description: Melakukan operasi smart contract Overlayer pada jaringan Ethereum Sepolia (cek saldo, transfer koin/token, minting wrap, staking vault, bridge LayerZero V2, dan bridge ETH L1-L2).

env:
  - PRIVATE_KEY
  - SEPOLIA_RPC_URL

requirements:
  bins:
    - node
---

# Overlayer On-chain Operations Skill

Skill ini memungkinkan Anda untuk berinteraksi langsung dengan dApp Overlayer pada jaringan Ethereum Sepolia testnet secara lokal menggunakan Node.js.

## Perintah CLI & Argumen

Semua perintah dijalankan menggunakan Node.js di folder skill:
`node skills/overlayer-ops/index.js <perintah> [argumen]`

### 1. Dapatkan Alamat Wallet Anda
**Penggunaan:** `node skills/overlayer-ops/index.js address`

### 2. Cek Saldo
Melihat saldo native ETH atau token tertentu (USDT, USDC, T+, C+, sT+, sC+) di Sepolia.
*   **Semua Token:** `node skills/overlayer-ops/index.js balance`
*   **Spesifik Token:** `node skills/overlayer-ops/index.js balance -t <usdt|usdc|t+|c+|st+|sc+>`

### 3. Mint Wrap (Wrapper Stablecoin)
Melakukan wrap/minting stablecoin default (USDT ke T+ atau USDC ke C+). Fungsi ini secara otomatis mendeteksi decimals dan melakukan approval token.
*   **Mint T+ (dari USDT):**
    `node skills/overlayer-ops/index.js mint -p usdt -a <jumlah>`
*   **Mint C+ (dari USDC):**
    `node skills/overlayer-ops/index.js mint -p usdc -a <jumlah>`

### 4. Stake Token Wrap (Staking Vault)
Staking token wrapped ke ERC-4626 vault (T+ ke sT+ atau C+ ke sC+). Approval dilakukan otomatis sebelum deposit.
*   **Stake T+:**
    `node skills/overlayer-ops/index.js stake -p t+ -a <jumlah>`
*   **Stake C+:**
    `node skills/overlayer-ops/index.js stake -p c+ -a <jumlah>`

### 5. Bridge Token (Cross-chain LayerZero V2)
Melakukan bridge token T+ atau C+ dari Sepolia ke chain tujuan LayerZero V2 testnet (Arbitrum, Base, atau Optimism). Biaya gas native LayerZero (`quoteSend`) dihitung otomatis.
*   **Bridge T+ ke Arbitrum:**
    `node skills/overlayer-ops/index.js bridge -p t+ -a <jumlah> -d arbitrum`
*   **Bridge C+ ke Base ke dompet kustom:**
    `node skills/overlayer-ops/index.js bridge -p c+ -a <jumlah> -d base -r <alamat_penerima>`

### 6. Bridge Native ETH (Sepolia ke Base Sepolia)
Melakukan bridge native ETH dari Ethereum Sepolia ke Base Sepolia melalui L1StandardBridge.
*   **Bridge ETH ke Base Sepolia:**
    `node skills/overlayer-ops/index.js bridge-eth -a <jumlah>`
*   **Bridge ETH ke dompet kustom di Base Sepolia:**
    `node skills/overlayer-ops/index.js bridge-eth -a <jumlah> -r <alamat_penerima>`

### 7. Kirim Aset (Transfer)
Mengirim native ETH atau token ERC-20 (USDT, USDC, T+, C+, atau alamat kontrak kustom) ke alamat lain di Sepolia.
*   **Transfer ETH:**
    `node skills/overlayer-ops/index.js transfer -p eth -to <alamat_penerima> -a <jumlah>`
*   **Transfer T+:**
    `node skills/overlayer-ops/index.js transfer -p t+ -to <alamat_penerima> -a <jumlah>`
*   **Transfer Token Kustom:**
    `node skills/overlayer-ops/index.js transfer -p <alamat_kontrak> -to <alamat_penerima> -a <jumlah>`



---

## Panduan Perilaku Agent (Prompt Tambahan)

Saat pengguna berinteraksi terkait pengujian testnet Overlayer:
1.  **Analisis Keinginan Pengguna:** Terjemahkan perintah seperti "wrap 5 USDT", "stake 10 T+", "bridge 2 C+ ke Arbitrum Sepolia", "bridge 0.1 ETH dari Sepolia ke Base Sepolia", atau "kirim 5 T+ ke 0xabc..." menjadi perintah CLI yang sesuai.
2.  **Verifikasi Parameter:** Pastikan jumlah (`-a`) valid, penerima (`-to` atau `-r`) valid, produk (`-p`) sesuai jenisnya, dan chain tujuan bridge (`-d`) didukung.


3.  **Tampilkan Hasil Transaksi:** Sajikan respon JSON sukses dari CLI dengan format markdown yang rapi, sertakan **Link Explorer** Sepolia Etherscan agar pengguna dapat langsung memantau transaksi.
4.  **Keamanan:** Jangan menanyakan private key pengguna. Pengaturan Wallet menggunakan file `.env` lokal di folder ini.

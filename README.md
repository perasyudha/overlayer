# Overlayer Web3 Ops Skill for OpenClaw

Utilitas CLI dan OpenClaw Agent Skill yang dirancang khusus untuk interaksi on-chain dApp **[Overlayer (Phase 0) Testnet](https://testnet.overlayer.fi/)** pada jaringan **Ethereum Sepolia**.

## Fitur Utama
*   **Wallet Address Query**: Melihat alamat wallet yang terkonfigurasi.
*   **Multi-Token Balance**: Memeriksa saldo dinamis (ETH, USDT, USDC, T+, C+, sT+, sC+) di Ethereum Sepolia.
*   **Automatic Wrap Minting**: Wrap USDT ke T+ atau USDC ke C+ secara otomatis (termasuk pengecekan dan eksekusi approval token).
*   **ERC-4626 Staking**: Staking token wrap (T+ ke sT+, C+ ke sC+) dengan penanganan approval otomatis sebelum deposit.
*   **Cross-Chain bridging (LayerZero V2)**: Mengirim token wrap (T+/C+) lintas jaringan testnet (Arbitrum, Base, Optimism) menggunakan LayerZero V2 OFT (`send` & `quoteSend` otomatis).
*   **Native ETH L1-L2 Bridge**: Bridge native ETH dari Ethereum Sepolia ke Base Sepolia via canonical `L1StandardBridge`.

---

## Langkah Instalasi ke OpenClaw

Ikuti langkah-langkah di bawah ini untuk memasang skill ini pada agen OpenClaw Anda secara lokal:

### 1. Clone Repositori
Masuk ke direktori instalasi agen OpenClaw Anda, kemudian masuk ke folder `.agents/skills/` dan clone repositori ini:
```bash
cd /path/to/openclaw/agent
cd .agents/skills/
git clone https://github.com/perasyudha/overlayer.git overlayer-ops
```

### 2. Instal Dependensi
Masuk ke dalam folder repositori yang baru di-clone dan pasang library dependensi Node.js:
```bash
cd overlayer-ops
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan masukkan Kunci Privat (Private Key) wallet Anda:
```env
PRIVATE_KEY="0xmasukkan_private_key_sepolia_anda_di_sini"
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" # (Opsional)
```
> [!WARNING]
> **PENTING**: Jangan pernah membagikan file `.env` Anda atau mengunggahnya ke GitHub! File ini sudah otomatis diabaikan oleh git melalui konfigurasi `.gitignore`.

### 4. Daftarkan Skill di OpenClaw
Buka file `skills-lock.json` yang terletak di direktori root agen OpenClaw Anda, kemudian daftarkan skill ini di dalam objek `"skills"`:
```json
{
  "version": 1,
  "skills": {
    "overlayer-ops": {
      "source": ".agents/skills/overlayer-ops",
      "sourceType": "local",
      "skillPath": "SKILL.md",
      "computedHash": "local_override"
    }
  }
}
```

Setelah langkah di atas dilakukan, agen OpenClaw Anda siap menemukan dan menjalankan skill **overlayer-ops**.

---

## Perintah Penggunaan CLI (Manual)

Anda juga dapat menjalankan perintah ini secara manual di terminal di dalam folder `overlayer-ops`:

```bash
# 1. Dapatkan Alamat Wallet
node index.js address

# 2. Cek Seluruh Saldo
node index.js balance

# 3. Cek Saldo Token Spesifik (Contoh: t+)
node index.js balance -t t+

# 4. Minting T+ (dari USDT) sejumlah 10
node index.js mint -p usdt -a 10

# 5. Staking T+ ke sT+ sejumlah 5
node index.js stake -p t+ -a 5

# 6. Bridge T+ ke Base Sepolia sejumlah 2
node index.js bridge -p t+ -a 2 -d base

# 7. Bridge Native ETH ke Base Sepolia sejumlah 0.05
node index.js bridge-eth -a 0.05
```

---

## Lisensi
Proyek ini dilisensikan di bawah lisensi ISC.

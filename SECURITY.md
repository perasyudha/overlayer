# Keamanan Kode & Wallet (SECURITY)

Repositori `overlayer-ops` ini dirancang dengan mengutamakan standar keamanan tertinggi untuk melindungi Kunci Privat (Private Key), Frasa Mnemonic, dan dana wallet Anda selama pengujian on-chain di Ethereum Sepolia.

Berikut adalah pedoman dan mekanisme keamanan yang diterapkan dalam proyek ini:

## 1. Perlindungan Kredensial Wallet
*   **Pemuatan Lokal**: Kunci privat (`PRIVATE_KEY`) atau frasa sandi (`MNEMONIC`) dimuat secara lokal dari file `.env` di komputer Anda melalui library `dotenv`. Kredensial ini disimpan dalam memori proses Node.js yang aktif dan tidak pernah ditulis ke file log atau disimpan di database eksternal.
*   **Git Ignore**: File `.env` telah didaftarkan di dalam file `.gitignore`. Hal ini memastikan kredensial rahasia Anda tidak akan pernah terunggah secara tidak sengaja ke repositori publik GitHub.

## 2. Penandatanganan Transaksi Lokal (Local Signing)
*   **Aman dari Pihak Ketiga**: Semua transaksi ditandatangani secara lokal di komputer Anda menggunakan library `ethers.js` sebelum dikirimkan ke jaringan. Kunci privat Anda **TIDAK PERNAH** dikirimkan ke node RPC atau jaringan internet. Hanya payload transaksi yang telah ditandatangani (*signed transaction payload*) yang dipancarkan ke node RPC.

## 3. Pembatasan Akses AI Agent (Panduan Agent)
*   **Prosedur Tanpa Membaca File Kredensial**: AI Agent OpenClaw (atau asisten AI lainnya) secara ketat dilarang untuk membaca atau mengintip isi berkas `.env` menggunakan perintah file-read (seperti `cat` atau `view_file`).
*   **Eksekusi Melalui CLI**: AI Agent hanya diizinkan untuk berinteraksi dengan wallet Anda dengan menjalankan perintah CLI resmi yang tersedia (misal: `node index.js swap` atau `node index.js stake`). Parameter sensitif ditangani sepenuhnya di balik layar oleh skrip Node.js.

## 4. Pelaporan Kerentanan
Jika Anda menemukan celah keamanan dalam skrip ini, harap jangan membuat Issue publik di GitHub. Anda dapat menghubungi pengembang secara langsung untuk melaporkan masalah tersebut secara privat agar dapat diperbaiki dengan cepat.

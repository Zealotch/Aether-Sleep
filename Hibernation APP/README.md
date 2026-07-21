# Aether Sleep (Power Timer)

Aplikasi Windows modern untuk menjadwalkan PC agar tertidur (**Hibernate**) atau mati (**Shutdown**) secara otomatis, baik menggunakan timer hitung mundur maupun **Smart Trigger** (memantau aktivitas jaringan, CPU, atau baterai).

## Menjalankan Aplikasi (User Akhir)

Aplikasi ini sudah di-*compile* secara penuh. Anda tidak perlu menggunakan Python jika hanya ingin memakai aplikasinya.
1. Ekstrak file `AetherSleep_Latest.zip`.
2. Buka folder hasil ekstrak (`AetherSleep`).
3. Jalankan `PowerTimer.exe`.

## Menjalankan dari Source Code (Developer)

Jika Anda ingin melihat atau mengembangkan kode sumbernya, pastikan Anda telah memasang **Python 3** (disarankan versi 3.11 atau lebih baru).

1. Buka PowerShell atau Command Prompt di folder *source code* ini (`Hibernation APP`).
2. Pasang modul yang dibutuhkan (opsional jika sudah terpasang otomatis):
   ```powershell
   pip install -r requirements.txt
   ```
3. Jalankan aplikasi menggunakan entry point utamanya:
   ```powershell
   py main.py
   ```

*(Catatan: Error `can't open file 'main.py'` biasanya berarti Anda belum berada di folder yang tepat. Gunakan perintah `cd` terlebih dahulu).*

## Percobaan Pertama yang Aman

Bagi pemula, kami sarankan Anda mengetes aplikasinya terlebih dahulu tanpa risiko kehilangan pekerjaan:
1. Buka aplikasi.
2. Pilih aksi **Hibernate (Timer)** di menu *dropdown*.
3. Masukkan angka `2` di kolom menit kustom.
4. Pastikan Anda telah menyimpan dokumen kerja penting Anda.
5. Klik tombol **Start Sleep**.
6. Anda akan melihat animasi lingkaran menghitung mundur.
7. Sebelum waktunya habis, klik tombol **Cancel Sleep** untuk membatalkannya.

Jika alur tersebut berjalan mulus, aplikasi bekerja sempurna di PC Anda.

## Fitur Utama

- **Timer & Auto-Wake**: Jadwalkan tidur dalam beberapa menit, dan secara opsional bangunkan PC otomatis pada jam tertentu (misal: 07:00 pagi).
- **Smart Trigger**: Tidurkan PC hanya ketika *download* selesai (Network KB/s turun), atau *rendering* selesai (CPU usage turun).
- **Audio Fade-Out**: Menurunkan volume PC secara perlahan di 5 menit terakhir untuk menghindari suara mengagetkan saat tertidur.
- **Background Mode**: *Minimize* aplikasi ke *System Tray* tanpa mematikan jadwal.
- **Offline Capable UI**: Antarmuka Glassmorphism (Eel/HTML/JS) berteknologi web modern yang sepenuhnya dirangkai secara lokal (tanpa perlu internet).
- **Statistik Penghematan**: Lacak berapa banyak daya (kWh) dan jam yang telah Anda hemat karena menggunakan aplikasi ini.

## Membangun / Compile (.exe)

Aplikasi ini dikemas menggunakan PyInstaller (serta dikonfigurasi melalui `PowerTimer.spec`).
Gunakan skrip kompilasi bawaan atau jalankan perintah berikut:

```powershell
py -m PyInstaller --noconfirm --onedir --windowed --icon "icon.ico" --add-data "UI\extracted;UI/extracted" --add-data "icon.ico;." --name "PowerTimer" "main.py"
```

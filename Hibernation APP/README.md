# Aether Sleep (Power Timer)

Aplikasi Windows modern untuk menjadwalkan PC Anda agar tertidur (**Hibernate**) atau mati (**Shutdown**) secara otomatis. Dibangun dengan fokus pada keandalan jangka panjang (*long-running reliability*) dan antarmuka *Glassmorphism* yang elegan.

**Versi:** v1.0.0-RC

## Fitur Utama

- **Timer & Auto-Wake**: Jadwalkan aksi daya dalam hitungan menit dan opsional bangunkan PC secara otomatis di jam tertentu.
- **Smart Trigger (Monitoring)**: Aether Sleep dapat memantau kapan PC Anda benar-benar *idle*. 
  - *Network*: Tunggu sampai download besar selesai (kecepatan KB/s turun di bawah ambang batas).
  - *CPU*: Tunggu sampai *rendering* video selesai.
  - *Battery*: Hibernasi PC otomatis saat baterai mulai kritis.
- **Defensive Reliability**: Dilengkapi *Thread Mutex Lock*, UI *Debounce*, dan pemulihan JSON otomatis untuk memastikan PC Anda tidak pernah *crash* atau tereksekusi ganda meskipun dijalankan berhari-hari.
- **Prevent Sleep**: Secara aktif memblokir Windows dari menidurkan PC sebelum *timer* atau *smart trigger* Aether Sleep selesai.
- **Audio Fade-Out**: Menurunkan volume PC secara perlahan (5 menit terakhir) agar tidak mengagetkan sebelum PC tertidur.
- **Background Mode**: Dapat di-*minimize* ke *System Tray* dengan mulus.

## Menjalankan Aplikasi (User Akhir)

Aplikasi ini bisa di-*compile* mandiri (standalone).
1. Pastikan Anda telah membangunnya menggunakan PyInstaller atau mengunduh versi rilis.
2. Buka folder `dist/PowerTimer` (atau folder rilis Anda).
3. Jalankan `PowerTimer.exe`.

## Menjalankan dari Source Code (Developer)

1. Pastikan Anda menggunakan **Python 3.11** atau lebih baru di OS Windows.
2. Buka PowerShell atau Command Prompt di folder *source code* ini (`Hibernation APP`).
3. Pasang *dependencies* via requirements:
   ```powershell
   pip install -r requirements.txt
   ```
4. Jalankan aplikasi menggunakan entry point utamanya:
   ```powershell
   py main.py
   ```

## Membangun / Compile (.exe)

Gunakan perintah bawaan `pyinstaller` dengan file konfigurasi yang sudah disediakan untuk performa optimal dan *clean directory*:

```powershell
py -m PyInstaller PowerTimer.spec --clean -y
```
*(File executable `.exe` akan berada di folder `dist/PowerTimer`).*

## Arsitektur Teknis
- **Backend**: Python (Eel), `psutil`, `ctypes.windll` (API Windows Native).
- **Frontend**: HTML5, Vanilla JavaScript, CSS Flexbox/Grid (Tailwind utility classes).
- **Persistence**: JSON Data (`AppData/Roaming/AetherSleep`) - dengan *Defensive Persistence Recovery*.
- **Lifecycle**: *Single-Instance Lock* via Global Mutex, Background Daemon Threads.

---
*Dibangun untuk personal utility yang tangguh, aman, dan memanjakan mata.*

# 🔋 Integrasi Hibernation Control ke Monitor Page

Panduan step-by-step menempatkan dan mengaktifkan **Hibernation Control Modal** di halaman Monitor IoT.

---

## 1️⃣ Import Component

Di file **`src/App.js`**, tambahkan import di bagian atas:

```javascript
import { HibernationControlModal } from './components/HibernationControl';
```

---

## 2️⃣ Tambah State di App Component

Dalam App component, tambahkan state untuk kontrol modal:

```javascript
const [showHibernationModal, setShowHibernationModal] = useState(false);
```

Contoh penempatan (di dekat state lainnya):
```javascript
const [showAddPet, setShowAddPet] = useState(false);
const [showHibernationModal, setShowHibernationModal] = useState(false);  // ← NEW
const [toast, setToast] = useState(null);
// ... state lainnya
```

---

## 3️⃣ Render Modal di JSX

Di bagian **render JSX** (sebelum closing `</div>`), tambahkan:

```javascript
{showHibernationModal && (
  <HibernationControlModal
    isOpen={showHibernationModal}
    onClose={() => setShowHibernationModal(false)}
    petId={selectedPet?.id}
    deviceId="esp32-01"  // bisa dari selectedPet.device_id jika ada
    petName={selectedPet?.name}
    onSuccess={() => {
      showToast('Perintah hibernasi terkirim!', 'success');
      // Optional: refresh data
    }}
  />
)}
```

**Catatan:** Pastikan `selectedPet` sudah available di scope saat render.

---

## 4️⃣ Tambah Tombol di Monitor IoT Page

Di file **`src/App.js`**, cari fungsi `MonitorPage` (search: `const MonitorPage = ...`).

Di bagian **header atau toolbar Monitor IoT**, tambahkan tombol:

```javascript
{/* Di dalam MonitorPage JSX, dekat tombol-tombol lainnya */}
<button 
  onClick={() => setShowHibernationModal(true)}
  className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm"
  disabled={!selectedPet?.id}
>
  <Zap size={16} /> 🔋 Kontrol Hibernasi
</button>
```

**Placement Rekomendasi:**
- Di header Monitor page (dekat tombol refresh atau filter)
- Atau di sidebar hewan yang dipilih
- Atau di card "Status Koneksi Perangkat"

Contoh:
```javascript
<div className="flex items-center justify-between mb-6">
  <div>
    <h3>Monitor IoT — {selectedPet?.name}</h3>
  </div>
  <div className="flex items-center gap-3">
    <button onClick={...} className="...refresh...">
      <RefreshCw size={16} /> Refresh
    </button>
    <button 
      onClick={() => setShowHibernationModal(true)}
      className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700"
    >
      <Zap size={16} /> 🔋 Hibernasi
    </button>
  </div>
</div>
```

---

## 5️⃣ Setup Database Supabase

Sebelum testing, jalankan migration di Supabase:

1. **Buka Supabase Dashboard → SQL Editor**
2. **Copy-paste isi `device_commands_migration.sql`**
3. **Run** — tabel `device_commands` sudah siap

---

## 6️⃣ Update Firmware ESP32

Upload file `esp32/esp32_iot_monitoring.ino` (v2.1) ke ESP32:

- Firmware polling command setiap 5 detik
- Eksekusi hibernasi/resume/restart
- Update status command di database

---

## 7️⃣ Testing Local

### Test 1: Modal terbuka
```
✓ Klik tombol "🔋 Kontrol Hibernasi"
✓ Modal muncul dengan 3 tab: Kontrol, Riwayat, (hidden)
```

### Test 2: Hibernasi command
```
✓ Atur durasi (misal 1 menit)
✓ Klik "Hibernasi Sekarang"
✓ Check Supabase: row baru di device_commands (status: pending)
✓ Buka Serial Monitor ESP32: lihat "[Command] Menerima: hibernate"
✓ LED merah berkedip (hibernasi indicator)
✓ Data sensor stop dikirim ke Supabase
✓ Buka Monitor page: tidak ada data baru masuk
```

### Test 3: Resume command
```
✓ Klik "⚡ Bangun Sensor Sekarang"
✓ Check Supabase: row baru device_commands (status: pending)
✓ Serial Monitor: "[Command] Menerima: resume"
✓ LED normal (hijau/merah sesuai mode)
✓ Data sensor resume dikirim
✓ Monitor page: data baru mulai masuk lagi
```

### Test 4: Status real-time
```
✓ Riwayat tab: lihat command history
✓ Status: "⏳ Tertunda" → "✓ Berhasil" (real-time)
✓ Timestamp: created_at dan executed_at tampil
```

### Test 5: Auto-wake timer
```
✓ Hibernasi 2 menit
✓ Tunggu 2 menit
✓ Sensor otomatis bangun (LED normal, data resume)
✓ Serial Monitor: "[Hibernasi] Waktu habis, sensor bangun otomatis"
```

---

## 8️⃣ Debugging Tips

### Modal tidak muncul
```javascript
// Check: HibernationControl.jsx file ada?
import { HibernationControlModal } from './components/HibernationControl';
// ✓ Path benar?
// ✓ File tsuda dibuat?

// Check: state modal ada?
const [showHibernationModal, setShowHibernationModal] = useState(false);
// ✓ Terinisialisasi?

// Check: button onClick terhubung?
onClick={() => setShowHibernationModal(true)}
// ✓ Benar syntax?
```

### Command tidak masuk database
```
// Check ESP32:
Serial Monitor → lihat "checkAndExecuteCommands()" dipanggil?
// Jika tidak, ada error di WiFi/HTTP?

// Check Supabase:
Dashboard → device_commands → lihat row baru?
// Jika row ada tapi status pending, ESP32 belum update

// Check RLS:
Settings → Policies → device_commands
// ✓ Policy INSERT for anon ada?
// ✓ SELECT for authenticated ada?
```

### Status tidak update real-time
```
// Check Realtime subscription:
Dashboard → Database → Replication
// ✓ device_commands dalam publikasi?

// Test: Manual UPDATE row di Supabase
UPDATE device_commands SET status = 'executed' WHERE id = ...;
// Apakah web modal langsung update? Jika ya, subscription OK.
```

### LED tidak berkedip saat hibernasi
```cpp
// Check firmware:
Serial.println("[Hibernasi] Mulai selama ...");
// Lihat di Serial Monitor?

// Check LED wiring:
LED_RED di GPIO 12
// ✓ Resistor 220Ω + GND terhubung?

// Check loop LED control:
if (isHibernating) {
  digitalWrite(LED_RED, !digitalRead(LED_RED)); // toggle
}
// ✓ Kondisi isHibernating = true saat hibernasi?
```

### Power tidak turun saat hibernasi
```cpp
// Check: Adalah sensor yang consume daya?
// MLX90614, MPU6050 tetap polling? Coba baca di loop:
if (!isHibernating) {
  float suhu = bacaSuhu(); // hanya read saat active
}
// Jika sensor read di loop normal, silakan optimize
```

---

## 9️⃣ CSS Customization

### Ubah warna tombol
```javascript
// Default: indigo-600
<button className="bg-indigo-600 hover:bg-indigo-700">
  
// Opsi:
// - Merah (emergency): bg-rose-600 hover:bg-rose-700
// - Hijau: bg-emerald-600 hover:bg-emerald-700
// - Amber: bg-amber-600 hover:bg-amber-700
```

### Ubah ukuran modal
```javascript
// Default: max-w-lg (large)
<div className="w-full max-w-lg rounded-[32px]">

// Opsi:
// - max-w-md (medium) — lebih sempit
// - max-w-xl (extra-large) — lebih lebar
```

### Ubah preset durasi
```javascript
// Di HibernationControl.jsx, modifikasi array:
{[
  { label: '10 Menit', value: 10, emoji: '⏱️' },   // ← ubah dari 15
  { label: '30 Menit', value: 30, emoji: '☕' },  // ← tambah baru
  { label: '2 Jam', value: 120, emoji: '⏰' },     // ← ubah dari 1 jam
  // ... dst
]}
```

---

## 🔟 Production Deployment

### Pre-deployment checklist
- [ ] device_commands table sudah di Supabase (migration sudah run)
- [ ] RLS policies sudah diset (INSERT anon, SELECT authenticated)
- [ ] Realtime enabled untuk device_commands
- [ ] HibernationControl.jsx sudah di components/
- [ ] Import + state + render + button semua sudah di App.js
- [ ] ESP32 firmware v2.1 sudah terupload
- [ ] WiFi SSID, password, credentials di ESP32 sudah benar
- [ ] Testing lokal sudah passed semua (Test 1-5)
- [ ] Serial Monitor error sudah diresolved

### Deploy to Vercel
```bash
git add .
git commit -m "Add hibernation control feature"
git push origin main

# Vercel otomatis deploy
# Check: https://your-app.vercel.app
```

### Notify users
```
📢 Pengumuman: Fitur Hibernasi Sensor sekarang tersedia!
   - Hemat daya hingga 80% dengan hibernasi sensor
   - Akses via tombol "🔋 Kontrol Hibernasi" di Monitor IoT
   - Dokumentasi: HIBERNATION_GUIDE.md
```

---

## Struktur File Final

```
src/
├── components/
│   └── HibernationControl.jsx  ← NEW
├── lib/
│   └── api.js                  ← UPDATE (+ deviceCommandService)
├── App.js                       ← UPDATE (state + render + button)
└── index.css                    ← (no change)

esp32/
└── esp32_iot_monitoring.ino    ← UPDATE (v2.1)

Database/
└── device_commands_migration.sql ← NEW (run di Supabase)

Docs/
├── HIBERNATION_GUIDE.md         ← NEW (comprehensive guide)
└── HIBERNATION_INTEGRATION_GUIDE.md ← NEW (this file)
```

---

## Support & Questions

Jika ada issue atau pertanyaan:

1. **Periksa HIBERNATION_GUIDE.md** — troubleshooting section
2. **Lihat Serial Monitor ESP32** — cek message & error
3. **Inspect Network** (Chrome DevTools) — lihat API call ke Supabase
4. **Check Supabase Dashboard** — lihat data di tabel `device_commands`
5. **GitHub Issues** — buat issue di repo

---

**Selesai! 🎉 Fitur hibernasi siap digunakan!**

Nikmati hemat daya hingga 80% dan kontrol sensor real-time dari web. 🔋✨

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HeartPulse, LayoutDashboard, Calendar, Activity, Settings, Bell,
  Plus, Thermometer, Clock, X, CheckCircle2, LogOut, User, Edit3,
  Save, Cat, Dog, Rabbit, Bird, Mouse, Squirrel, Trash2, ChevronRight, AlertCircle,
  ToggleLeft, ToggleRight, Phone, Mail, Lock, Eye, EyeOff, Check,
  FileText, Pill, Stethoscope, Syringe, Droplets,
  UtensilsCrossed, Dumbbell, LucideStar, Info, BookOpen, Loader2,
  Cpu, Wifi, WifiOff, Radio, RefreshCw, Home, Tag
} from 'lucide-react';
import { authService, profileService, petService, scheduleService, recordService, notifService, monitoringService } from './lib/api';

// ─── CONSTANTS ────────────────────────────────────────────────────────
const PET_ICONS = {
  Kucing: Cat,
  Anjing: Dog,
  Kelinci: Rabbit,
  Hamster: Mouse,
  Marmut: Squirrel,
  Ferret: Cat,
  'Sugar Glider': Bird,
  'Landak Mini': Squirrel,
};
const PET_COLORS = {
  Kucing: { bg: 'bg-orange-100', text: 'text-orange-600' },
  Anjing: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  Kelinci: { bg: 'bg-pink-100', text: 'text-pink-600' },
  Hamster: { bg: 'bg-amber-100', text: 'text-amber-600' },
  Marmut: { bg: 'bg-lime-100', text: 'text-lime-600' },
  Ferret: { bg: 'bg-teal-100', text: 'text-teal-600' },
  'Sugar Glider': { bg: 'bg-violet-100', text: 'text-violet-600' },
  'Landak Mini': { bg: 'bg-slate-100', text: 'text-slate-600' },
};

const TIPS_DB = {
  Kucing: [
    { title: 'Sisir Bulu Rutin', body: 'Sisir bulu kucing setiap 2 hari sekali untuk mencegah hairball dan menjaga kebersihan.', icon: LucideStar },
    { title: 'Kotak Pasir Bersih', body: 'Bersihkan kotak pasir setiap hari agar kucing tidak menghindarinya dan tetap sehat.', icon: Info },
    { title: 'Air Segar Selalu', body: 'Kucing membutuhkan air bersih yang selalu tersedia. Ganti air minimal 2x sehari.', icon: Droplets },
    { title: 'Waktu Bermain', body: 'Luangkan 15 menit bermain bersama kucing setiap hari untuk kesehatan mental dan fisiknya.', icon: Dumbbell },
    { title: 'Cek Gigi', body: 'Sikat gigi kucing seminggu sekali untuk mencegah penyakit gigi dan gusi.', icon: Stethoscope },
  ],
  Anjing: [
    { title: 'Jalan Pagi', body: 'Ajak anjing jalan kaki minimal 20-30 menit setiap pagi untuk kesehatan otot dan jantung.', icon: Dumbbell },
    { title: 'Mandi Rutin', body: 'Mandikan anjing setiap 2 minggu atau saat kotor. Gunakan sampo khusus anjing.', icon: Droplets },
    { title: 'Latihan Perintah', body: 'Latih perintah dasar seperti duduk dan diam 10 menit sehari untuk kesehatan mental.', icon: BookOpen },
    { title: 'Cek Kuku', body: 'Potong kuku anjing setiap 3-4 minggu agar tidak melukai kaki dan lantai rumah.', icon: Info },
    { title: 'Gigi Sehat', body: 'Beri mainan kunyah khusus untuk menjaga kesehatan gigi dan gusi anjing Anda.', icon: Stethoscope },
  ],
  Kelinci: [
    { title: 'Jerami Segar', body: 'Berikan jerami timothy sebagai 80% makanan kelinci untuk kesehatan gigi dan pencernaan.', icon: UtensilsCrossed },
    { title: 'Area Gerak Bebas', body: 'Biarkan kelinci bermain di luar kandang minimal 3-4 jam sehari untuk kesehatan tulang.', icon: Dumbbell },
    { title: 'Hindari Panas', body: 'Kelinci sangat sensitif terhadap panas. Jaga suhu ruangan di bawah 29 derajat C.', icon: Thermometer },
    { title: 'Sayur Segar', body: 'Berikan daun hijau segar seperti kangkung atau selada setiap hari sebagai suplemen.', icon: LucideStar },
  ],
  Hamster: [
    { title: 'Roda Olahraga', body: 'Sediakan roda putar di kandang hamster untuk menjaga aktivitas fisiknya. Pilih roda solid agar kaki tidak terjepit.', icon: Dumbbell },
    { title: 'Bedding Bersih', body: 'Ganti alas kandang (bedding) setiap 3-5 hari. Pilih material kayu cedar-free atau kertas daur ulang.', icon: Info },
    { title: 'Makanan Segar', body: 'Berikan sayuran segar seperti wortel dan brokoli secukupnya. Hindari makanan manis berlebihan.', icon: UtensilsCrossed },
    { title: 'Waktu Aktif', body: 'Hamster aktif di malam hari (nokturnal). Keluarkan dari kandang untuk bermain di malam hari saja.', icon: Clock },
    { title: 'Suhu Nyaman', body: 'Jaga suhu ruangan 18-24°C. Hamster rentan hibernasi paksa jika suhu terlalu dingin.', icon: Thermometer },
  ],
  Marmut: [
    { title: 'Vitamin C Harian', body: 'Marmut tidak bisa memproduksi vitamin C sendiri. Berikan paprika atau peterseli setiap hari.', icon: LucideStar },
    { title: 'Jerami Tak Terbatas', body: 'Jerami timothy harus selalu tersedia sebagai makanan utama untuk menjaga gigi dan pencernaan marmut.', icon: UtensilsCrossed },
    { title: 'Sosialisasi Aktif', body: 'Marmut hewan sosial. Idealnya dipelihara minimal dua ekor agar tidak stres dan kesepian.', icon: BookOpen },
    { title: 'Kandang Luas', body: 'Sediakan kandang minimal 0,7 m² per ekor. Marmut butuh ruang berlari dan bersembunyi.', icon: Dumbbell },
    { title: 'Periksa Gigi', body: 'Periksa panjang gigi marmut secara rutin. Gigi yang terlalu panjang bisa mengganggu nafsu makan.', icon: Stethoscope },
  ],
  Ferret: [
    { title: 'Jam Bermain Wajib', body: 'Ferret butuh minimal 4 jam bermain di luar kandang setiap hari untuk mencegah kebosanan dan stres.', icon: Dumbbell },
    { title: 'Protein Tinggi', body: 'Ferret karnivora obligat. Berikan makanan berbasis daging atau kibble khusus ferret dengan protein di atas 30%.', icon: UtensilsCrossed },
    { title: 'Bau Tubuh', body: 'Ferret memiliki bau alami. Mandikan maksimal 2x per bulan agar minyak alami kulit tidak hilang berlebihan.', icon: Droplets },
    { title: 'Vaksinasi Rutin', body: 'Ferret perlu vaksin distemper dan rabies setiap tahun. Konsultasikan jadwal vaksin ke dokter hewan.', icon: Syringe },
    { title: 'Pengamanan Rumah', body: 'Ferret sangat ingin tahu dan bisa masuk ke celah kecil. Pastikan area bermain aman dari bahaya.', icon: Info },
  ],
  'Sugar Glider': [
    { title: 'Diet BML/TPG', body: 'Ikuti diet khusus Sugar Glider seperti BML atau TPG untuk menjaga keseimbangan kalsium dan fosfor.', icon: UtensilsCrossed },
    { title: 'Kantong Tidur', body: 'Sediakan bonding pouch atau kantong kain agar Sugar Glider merasa aman dan dekat dengan pemiliknya.', icon: LucideStar },
    { title: 'Sosialisasi Sejak Dini', body: 'Habiskan waktu bonding minimal 2 jam setiap hari agar Sugar Glider jinak dan tidak mudah stres.', icon: BookOpen },
    { title: 'Kandang Tinggi', body: 'Sugar Glider membutuhkan kandang vertikal (tinggi) karena senang memanjat. Minimum 60x60x90 cm.', icon: Dumbbell },
    { title: 'Hindari Pestisida', body: 'Selalu cuci bersih buah dan sayuran sebelum diberikan. Sugar Glider sangat sensitif terhadap racun pestisida.', icon: AlertCircle },
  ],
  'Landak Mini': [
    { title: 'Roda Lari Solid', body: 'Landak mini butuh roda lari setiap malam. Pilih roda solid tanpa jaring agar kaki tidak terluka.', icon: Dumbbell },
    { title: 'Mandi Pasir', body: 'Bersihkan duri landak dengan sikat lembut saat mandi. Hindari memandikan terlalu sering agar tidak kering.', icon: Droplets },
    { title: 'Suhu Hangat', body: 'Jaga suhu ruangan 24-29°C. Landak mini bisa mengalami hibernasi paksa di bawah 18°C yang berbahaya.', icon: Thermometer },
    { title: 'Protein Serangga', body: 'Berikan jangkrik atau ulat sebagai camilan protein alami. Batasi 2-3 ekor per hari.', icon: UtensilsCrossed },
    { title: 'Periksa Kaki', body: 'Cek kaki landak secara rutin. Benang atau serat karpet bisa melilit kaki dan menyebabkan cedera serius.', icon: Stethoscope },
  ],
};

const SCHEDULE_TYPES = [
  { type: 'Makan', icon: UtensilsCrossed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { type: 'Vaksinasi', icon: Syringe, color: 'text-violet-600', bg: 'bg-violet-50' },
  { type: 'Olahraga', icon: Dumbbell, color: 'text-blue-600', bg: 'bg-blue-50' },
  { type: 'Mandi', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { type: 'Dokter', icon: Stethoscope, color: 'text-rose-600', bg: 'bg-rose-50' },
  { type: 'Obat', icon: Pill, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const RECORD_TYPES = ['Pemeriksaan', 'Vaksinasi', 'Pengobatan', 'Operasi', 'Grooming'];

// ─── HELPERS ──────────────────────────────────────────────────────────
const todayStr = new Date().toISOString().split('T')[0];

const formatDate = (str) => {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const timeAgo = (ts) => {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff} dtk lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

const isToday = (str) => str === todayStr;

// Format usia: satu kolom input — bulat = tahun, ada koma/titik = minggu
const formatAge = (age, unit) => {
  if (age == null || age === '') return '-';
  const normalized = String(age).replace(',', '.');
  const val = parseFloat(normalized);
  if (isNaN(val)) return '-';
  const display = val % 1 === 0 ? val : val.toFixed(1).replace('.', ',');
  if (unit === 'minggu') return `${display} minggu`;
  return `${display} tahun`;
};

// Format berat: tampilkan desimal apa adanya, tidak dibulatkan
const formatWeight = (weight) => {
  if (weight == null || weight === '') return '-';
  const val = parseFloat(weight);
  if (isNaN(val)) return '-';
  // Hapus trailing zero, tapi tetap tunjukkan desimal jika ada
  return val % 1 === 0 ? `${val}` : `${val}`;
};

// ─── PUSH NOTIFICATION HOOK ───────────────────────────────────────────
// Minta izin notifikasi device dan kirim push saat jadwal hampir tiba
const usePushNotifications = (schedules, pets) => {
  const sentRef = useRef(new Set());

  useEffect(() => {
    // Minta izin push notification saat pertama kali
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!schedules?.length) return;

    const checkAndNotify = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const todayDate = now.toISOString().split('T')[0];

      schedules.forEach(s => {
        if (s.done) return;
        if (s.date !== todayDate) return;

        const [hour, minute] = s.time.split(':').map(Number);
        const scheduleTime = new Date();
        scheduleTime.setHours(hour, minute, 0, 0);

        const diffMs = scheduleTime - now;
        const diffMin = diffMs / 60000;

        // Notifikasi 15 menit sebelum jadwal
        const key15 = `15min-${s.id}`;
        if (diffMin > 0 && diffMin <= 15 && !sentRef.current.has(key15)) {
          sentRef.current.add(key15);
          const pet = pets?.find(p => p.id === s.pet_id);
          const n = new Notification(`⏰ Jadwal Segera: ${s.title}`, {
            body: `${pet?.name || 'Hewan'} punya jadwal ${s.type} dalam 15 menit (${s.time})`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: key15,
          });
          n.onclick = () => { window.focus(); n.close(); };
        }

        // Notifikasi tepat waktu
        const keyNow = `now-${s.id}`;
        if (diffMin >= -2 && diffMin <= 2 && !sentRef.current.has(keyNow)) {
          sentRef.current.add(keyNow);
          const pet = pets?.find(p => p.id === s.pet_id);
          const n = new Notification(`🔔 Waktunya: ${s.title}`, {
            body: `Jadwal ${s.type} untuk ${pet?.name || 'hewan'} sudah tiba!`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: keyNow,
          });
          n.onclick = () => { window.focus(); n.close(); };
        }
      });
    };

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 60 * 1000); // cek tiap menit
    return () => clearInterval(interval);
  }, [schedules, pets]);
};

// ─── SMART TIPS GENERATOR ─────────────────────────────────────────────
// Tips dinamis berdasarkan riwayat rekam medis pet
const getSmartTips = (pet, records) => {
  if (!pet) return null;

  const petRecords = (records || []).filter(r => r.pet_id === pet.id);
  const speciesTips = TIPS_DB[pet.species] || TIPS_DB['Kucing'];
  const smartTips = [];

  if (petRecords.length === 0) {
    // Belum ada rekam medis — tampilkan tips default
    return speciesTips.slice(0, 2);
  }

  // Cek apakah ada kunjungan berikutnya yang terlewat atau mendekati
  const today = new Date().toISOString().split('T')[0];
  const overdueVisits = petRecords.filter(r => r.next_visit && r.next_visit < today);
  const upcomingVisits = petRecords.filter(r => {
    if (!r.next_visit || r.next_visit < today) return false;
    const daysLeft = Math.ceil((new Date(r.next_visit) - new Date()) / (1000 * 86400));
    return daysLeft <= 14;
  });

  if (overdueVisits.length > 0) {
    const latest = overdueVisits[0];
    smartTips.push({
      title: '⚠️ Kunjungan Dokter Terlewat',
      body: `Kunjungan berikutnya setelah "${latest.title}" sudah terlewat sejak ${new Date(latest.next_visit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}. Segera jadwalkan ulang!`,
      icon: AlertCircle,
      priority: 'urgent',
    });
  }

  if (upcomingVisits.length > 0) {
    const v = upcomingVisits[0];
    const daysLeft = Math.ceil((new Date(v.next_visit) - new Date()) / (1000 * 86400));
    smartTips.push({
      title: `📅 Kunjungan Segera (${daysLeft} hari)`,
      body: `Follow-up dari "${v.title}" dijadwalkan pada ${new Date(v.next_visit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Siapkan catatan kondisi terbaru.`,
      icon: Stethoscope,
      priority: 'high',
    });
  }

  // Cek riwayat vaksinasi — jika terakhir vaksin > 11 bulan lalu
  const vaksinRecords = petRecords.filter(r => r.type === 'Vaksinasi').sort((a, b) => b.date.localeCompare(a.date));
  if (vaksinRecords.length > 0) {
    const lastVaksin = vaksinRecords[0];
    const monthsSince = Math.floor((new Date() - new Date(lastVaksin.date)) / (1000 * 86400 * 30));
    if (monthsSince >= 11) {
      smartTips.push({
        title: `💉 Vaksinasi Perlu Diperbarui`,
        body: `Vaksinasi terakhir "${lastVaksin.title}" sudah ${monthsSince} bulan lalu. Konsultasikan ke dokter hewan untuk jadwal booster.`,
        icon: Syringe,
        priority: 'high',
      });
    }
  }

  // Cek berat badan — jika ada perubahan berat signifikan
  const weightRecords = petRecords.filter(r => r.weight).sort((a, b) => a.date.localeCompare(b.date));
  if (weightRecords.length >= 2) {
    const oldest = parseFloat(weightRecords[0].weight);
    const latest = parseFloat(weightRecords[weightRecords.length - 1].weight);
    const change = ((latest - oldest) / oldest) * 100;
    if (Math.abs(change) >= 10) {
      smartTips.push({
        title: change > 0 ? '📈 Berat Badan Meningkat' : '📉 Berat Badan Menurun',
        body: `Berat ${pet.name} berubah ${Math.abs(change).toFixed(0)}% dari ${oldest}kg ke ${latest}kg. ${change > 0 ? 'Perhatikan pola makan dan aktivitas.' : 'Pantau nafsu makan dan kondisi kesehatan.'}`,
        icon: Activity,
        priority: 'medium',
      });
    }
  }

  // Cek apakah ada pengobatan/operasi baru-baru ini (< 30 hari)
  const recentTreatment = petRecords.filter(r =>
    (r.type === 'Pengobatan' || r.type === 'Operasi') &&
    Math.ceil((new Date() - new Date(r.date)) / (1000 * 86400)) <= 30
  );
  if (recentTreatment.length > 0) {
    const t = recentTreatment[0];
    smartTips.push({
      title: '🏥 Pemulihan Pasca Perawatan',
      body: `${pet.name} baru menjalani "${t.title}" ${Math.ceil((new Date() - new Date(t.date)) / (1000 * 86400))} hari lalu. Pantau kondisi, beri makanan bergizi, dan istirahat yang cukup.`,
      icon: HeartPulse,
      priority: 'medium',
    });
  }

  // Tambahkan tips spesies sebagai fallback jika belum ada smart tip
  if (smartTips.length === 0) {
    const todayIdx = new Date().getDate();
    smartTips.push(speciesTips[todayIdx % speciesTips.length]);
  }

  return smartTips.slice(0, 1);
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────
const PetAvatar = ({ species, size = 'md', className = '' }) => {
  const Icon = PET_ICONS[species] || Cat;
  const col = PET_COLORS[species] || PET_COLORS['Kucing'];
  const sizes = { sm: 'w-8 h-8', md: 'w-14 h-14', lg: 'w-20 h-20' };
  const iconSizes = { sm: 16, md: 26, lg: 36 };
  return (
    <div className={`${sizes[size]} ${col.bg} rounded-2xl flex items-center justify-center shrink-0 ${className}`}>
      <Icon size={iconSizes[size]} className={col.text} />
    </div>
  );
};

const UserAvatar = ({ name, size = 'md' }) => {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  return (
    <div className={`${sizes[size]} bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </div>
  );
};

const Toast = ({ message, type = 'success', onClose }) => {
  const colors = { success: 'bg-emerald-600', error: 'bg-rose-600', info: 'bg-indigo-600', warning: 'bg-amber-500' };
  const icons = { success: CheckCircle2, error: AlertCircle, info: Info, warning: AlertCircle };
  const Icon = icons[type] || Info;
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] ${colors[type]} text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 anim-slide-down`}>
      <Icon size={16} /><span className="font-bold text-sm">{message}</span>
    </div>
  );
};

const Spinner = ({ text = 'Memuat...' }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
    <Loader2 size={32} className="animate-spin mb-3 text-indigo-400" />
    <p className="text-sm font-medium">{text}</p>
  </div>
);

// ─── AUTH PAGE ────────────────────────────────────────────────────────
const AuthPage = () => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await authService.signIn(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError('Nama wajib diisi'); setLoading(false); return; }
        await authService.signUp(form.email, form.password, form.name, form.phone);
        setSuccess('Akun berhasil dibuat! Silakan login.');
        setMode('login');
        setForm(f => ({ ...f, password: '' }));
      }
    } catch (err) {
      const msg = err.message || 'Terjadi kesalahan';
      if (msg.includes('Invalid login')) setError('Email atau password salah');
      else if (msg.includes('already registered')) setError('Email sudah terdaftar');
      else if (msg.includes('Password should')) setError('Password minimal 6 karakter');
      else setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md anim-zoom">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/40">
            <HeartPulse size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">PetCare<span className="text-indigo-400">+</span></h1>
          <p className="text-indigo-300 mt-2 font-medium">Platform kesehatan hewan peliharaan</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m ? 'bg-white text-indigo-700 shadow' : 'text-indigo-300 hover:text-white'}`}>
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          {error && <div className="mb-4 p-3 bg-rose-500/20 border border-rose-400/30 rounded-2xl flex items-center gap-2 text-rose-300 text-sm"><AlertCircle size={15} />{error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl flex items-center gap-2 text-emerald-300 text-sm"><CheckCircle2 size={15} />{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="auth-label">Nama Lengkap</label>
                  <div className="relative"><User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                    <input type="text" required placeholder="Budi Santoso" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="auth-input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="auth-label">No. Telepon (opsional)</label>
                  <div className="relative"><Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                    <input type="tel" placeholder="08xxxxxxxxxx" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="auth-input pl-10" />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="auth-label">Email</label>
              <div className="relative"><Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input type="email" required placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="auth-input pl-10" />
              </div>
            </div>
            <div>
              <label className="auth-label">Password</label>
              <div className="relative"><Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input type={showPass ? 'text' : 'password'} required placeholder="min. 6 karakter" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="auth-input pl-10 pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={17} className="animate-spin" />Memproses...</> : mode === 'login' ? 'Masuk' : 'Buat Akun'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── HEALTH SCORE CALCULATOR ──────────────────────────────────────────
// Menghitung skor kesehatan 0-100 dari data vital sign IoT.
// Suhu bobot 35%, detak jantung 35%, SpO2 30%.
const calculateHealthScore = (suhu, hr, spo2) => {
  let tw = 0, ts = 0;
  if (suhu != null) {
    tw += 35;
    if (suhu >= 37.5 && suhu <= 39.5) ts += 35;
    else if ((suhu >= 36.0 && suhu < 37.5) || (suhu > 39.5 && suhu <= 41.0)) ts += 20;
    else ts += 5;
  }
  if (hr != null) {
    tw += 35;
    if (hr >= 60 && hr <= 140) ts += 35;
    else if ((hr >= 50 && hr < 60) || (hr > 140 && hr <= 160)) ts += 20;
    else ts += 5;
  }
  if (spo2 != null) {
    tw += 30;
    if (spo2 >= 95) ts += 30;
    else if (spo2 >= 90) ts += 18;
    else ts += 5;
  }
  return tw > 0 ? Math.round((ts / tw) * 100) : null;
};

const getHealthLabel = (score) => {
  if (score == null) return { label: 'Belum ada data IoT', emoji: '📡', cls: 'bg-slate-100 text-slate-500', barCls: 'bg-slate-300', ring: 'ring-slate-200' };
  if (score >= 85) return { label: 'Sehat', emoji: '✅', cls: 'bg-emerald-100 text-emerald-700', barCls: 'bg-emerald-500', ring: 'ring-emerald-200' };
  if (score >= 65) return { label: 'Perlu Perhatian', emoji: '⚠️', cls: 'bg-amber-100 text-amber-700', barCls: 'bg-amber-500', ring: 'ring-amber-200' };
  return { label: 'Butuh Pemeriksaan', emoji: '🚨', cls: 'bg-rose-100 text-rose-700', barCls: 'bg-rose-500', ring: 'ring-rose-200' };
};

// ─── IoT HEALTH ALERT TIPS ────────────────────────────────────────────
// Tips khusus yang muncul di dashboard saat kondisi hewan bermasalah berdasarkan data IoT
const getIotHealthTip = (score, iotCalc, petName) => {
  if (score == null || score >= 65) return null;

  const suhu = iotCalc?.avg_suhu != null ? parseFloat(iotCalc.avg_suhu) : null;
  const hr   = iotCalc?.avg_heart_rate != null ? parseFloat(iotCalc.avg_heart_rate) : null;
  const spo2 = iotCalc?.avg_spo2 != null ? parseFloat(iotCalc.avg_spo2) : null;

  // Kumpulkan masalah spesifik dari tiap sensor
  const issues = [];
  if (suhu != null && suhu < 37.5) issues.push({ param: 'Suhu', detail: `${suhu.toFixed(1)}°C — di bawah normal (37.5–39.5°C)`, icon: Thermometer });
  if (suhu != null && suhu > 39.5) issues.push({ param: 'Suhu', detail: `${suhu.toFixed(1)}°C — di atas normal (37.5–39.5°C)`, icon: Thermometer });
  if (hr != null && hr < 60)  issues.push({ param: 'Detak Jantung', detail: `${Math.round(hr)} BPM — terlalu lambat (normal 60–140 BPM)`, icon: HeartPulse });
  if (hr != null && hr > 140) issues.push({ param: 'Detak Jantung', detail: `${Math.round(hr)} BPM — terlalu cepat (normal 60–140 BPM)`, icon: HeartPulse });
  if (spo2 != null && spo2 < 95) issues.push({ param: 'Saturasi O₂', detail: `${spo2.toFixed(1)}% — di bawah batas aman (≥95%)`, icon: Activity });

  if (issues.length === 0) return null;

  const isEmergency = score < 40;
  const mainIssue = issues[0];

  const tipsMap = {
    'Suhu-low': {
      title: `Suhu ${petName} Terlalu Rendah`,
      body: `Pindahkan ke tempat hangat, jauhkan dari angin/AC. Selimuti dengan kain lembut. Jika tidak membaik dalam 30 menit, segera hubungi dokter hewan.`,
    },
    'Suhu-high': {
      title: `Suhu ${petName} Terlalu Tinggi`,
      body: `Pindahkan ke ruangan sejuk ber-AC. Kompres dengan kain basah di telapak kaki. Pastikan air minum tersedia. Segera ke klinik jika suhu di atas 41°C.`,
    },
    'Detak Jantung-low': {
      title: `Detak Jantung ${petName} Lemah`,
      body: `Bisa tanda kelelahan, dehidrasi, atau kondisi jantung. Tenangkan hewan, pastikan tidak stres. Pantau 15 menit — jika tidak membaik langsung ke dokter.`,
    },
    'Detak Jantung-high': {
      title: `Detak Jantung ${petName} Terlalu Cepat`,
      body: `Bisa disebabkan stres, demam, atau nyeri. Tenangkan hewan di tempat tenang dan gelap. Hindari aktivitas berlebihan. Segera periksa ke dokter hewan.`,
    },
    'Saturasi O₂-low': {
      title: `Saturasi Oksigen ${petName} Rendah`,
      body: `SpO₂ di bawah 95% bisa mengindikasikan masalah pernapasan. Bawa ke ruangan bersirkulasi udara baik. INI KONDISI DARURAT — segera hubungi dokter hewan.`,
    },
  };

  const key = `${mainIssue.param}-${suhu != null && suhu < 37.5 ? 'low' : suhu != null && suhu > 39.5 ? 'high' : hr != null && hr < 60 ? 'low' : hr != null && hr > 140 ? 'high' : 'low'}`;
  const tipContent = tipsMap[key] || {
    title: `Kondisi ${petName} Perlu Perhatian`,
    body: `Skor kesehatan IoT: ${score}/100. Pantau kondisi hewan dan segera konsultasikan ke dokter hewan jika ada perubahan perilaku.`,
  };

  return {
    title: tipContent.title,
    body: tipContent.body,
    icon: mainIssue.icon,
    priority: isEmergency ? 'urgent' : 'high',
    source: 'iot-health',
    issues,
  };
};

// ─── DASHBOARD ────────────────────────────────────────────────────────
const Dashboard = ({ pets, selectedPet, setSelectedPet, onAddPet, notifications, records, onAlert }) => {
  const [iotCalc, setIotCalc]         = useState(null);
  const [dailyHealth, setDailyHealth] = useState([]);
  const [iotLoading, setIotLoading]   = useState(false);
  const [tempUnit, setTempUnit]       = useState('C'); // 'C' | 'F' | 'K'
  const [iotHealthTip, setIotHealthTip] = useState(null); // tip override dari kondisi IoT
  const alertedScoreRef = useRef(null); // simpan skor terakhir yang sudah dinotif agar tidak spam

  // ── Konversi suhu ─────────────────────────────────────────────────
  const convertTemp = (celsius, unit) => {
    if (celsius == null) return null;
    const c = parseFloat(celsius);
    if (unit === 'F') return (c * 9/5 + 32);
    if (unit === 'K') return (c + 273.15);
    return c;
  };
  const tempUnitLabel = tempUnit === 'C' ? '°C' : tempUnit === 'F' ? '°F' : 'K';
  const fmtTemp = (celsius) => {
    const converted = convertTemp(celsius, tempUnit);
    return converted != null ? converted.toFixed(1) : null;
  };

  const fetchAllIot = async (petId) => {
    if (!petId) return;
    setIotLoading(true);
    try {
      const [calc, daily] = await Promise.all([
        monitoringService.getCalculated(petId, 20),
        monitoringService.getDailyHealth(petId, 7),
      ]);
      setIotCalc(calc);
      setDailyHealth(daily || []);

      // ── Cek kondisi kesehatan dari data IoT ──────────────────────
      if (calc) {
        const score = calculateHealthScore(calc.avg_suhu, calc.avg_heart_rate, calc.avg_spo2);
        const pet   = pets.find(p => p.id === petId) || selectedPet;

        // Hanya notif jika skor bermasalah DAN belum pernah notif skor ini
        if (score != null && score < 65 && alertedScoreRef.current !== score) {
          alertedScoreRef.current = score;
          const iotTip = getIotHealthTip(score, calc, pet?.name || 'Hewan');
          setIotHealthTip(iotTip);
          if (onAlert && pet) {
            const isEmergency = score < 40;
            onAlert({
              text: isEmergency
                ? `🚨 DARURAT: ${pet.name} butuh pemeriksaan segera! Skor kesehatan IoT: ${score}/100`
                : `⚠️ ${pet.name} tidak baik-baik saja. Skor kesehatan IoT: ${score}/100 — perlu perhatian`,
              type: isEmergency ? 'error' : 'warning',
              pet_id: pet.id,
            });
          }
        } else if (score != null && score >= 65) {
          // Reset jika sudah membaik
          if (alertedScoreRef.current !== null && alertedScoreRef.current < 65) {
            alertedScoreRef.current = null;
            setIotHealthTip(null);
          }
        }
      }
    } catch (e) {
      console.error('Dashboard IoT error', e);
    } finally {
      setIotLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPet?.id) return;
    alertedScoreRef.current = null;
    setIotHealthTip(null);
    fetchAllIot(selectedPet.id);

    // Realtime: re-fetch kalkulasi saat ada data IoT baru
    const channel = monitoringService.subscribe(selectedPet.id, () => {
      fetchAllIot(selectedPet.id);
    });
    return () => { channel.unsubscribe(); };
  }, [selectedPet?.id]);

  // ── Status helpers ────────────────────────────────────────────────
  const getSuhuStatus = (s) => {
    if (s == null) return { label: '—', cls: 'text-slate-400' };
    if (s < 37.5) return { label: 'Rendah', cls: 'text-blue-600' };
    if (s > 39.5) return { label: 'Tinggi', cls: 'text-rose-600' };
    return { label: 'Normal', cls: 'text-emerald-600' };
  };
  const getHRStatus = (h) => {
    if (h == null) return { label: '—', cls: 'text-slate-400' };
    if (h < 60)  return { label: 'Rendah', cls: 'text-blue-600' };
    if (h > 140) return { label: 'Tinggi', cls: 'text-rose-600' };
    return { label: 'Normal', cls: 'text-emerald-600' };
  };
  const getSpO2Status = (s) => {
    if (s == null) return { label: '—', cls: 'text-slate-400' };
    if (s < 95) return { label: 'Rendah', cls: 'text-rose-600' };
    return { label: 'Normal', cls: 'text-emerald-600' };
  };

  // Gunakan nilai kalkulasi (rata-rata), bukan nilai raw langsung
  const suhuSt = getSuhuStatus(iotCalc?.avg_suhu);
  const hrSt   = getHRStatus(iotCalc?.avg_heart_rate);
  const spo2St = getSpO2Status(iotCalc?.avg_spo2);

  // Skor kesehatan terkalkulasi dari data IoT
  const healthScore = iotCalc
    ? calculateHealthScore(iotCalc.avg_suhu, iotCalc.avg_heart_rate, iotCalc.avg_spo2)
    : null;
  const healthInfo  = getHealthLabel(healthScore);

  // ── Stats dari data kalkulasi IoT (rata-rata N pembacaan terakhir) ─
  const fmt = (v, digits = 1) => v != null ? parseFloat(v).toFixed(digits) : null;
  const stats = [
    {
      label: 'Detak Jantung',
      value: fmt(iotCalc?.avg_heart_rate, 0),
      unit: 'bpm',
      status: hrSt.label,
      statusCls: hrSt.cls,
      icon: HeartPulse,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
    },
    {
      label: 'Suhu Tubuh',
      value: fmtTemp(iotCalc?.avg_suhu),
      unit: tempUnitLabel,
      status: suhuSt.label,
      statusCls: suhuSt.cls,
      icon: Thermometer,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      isTempCard: true,
    },
    (() => {
      // Aktivitas: persentase waktu aktif bergerak dari data IoT
      const actPct = iotCalc?.avg_activity_pct != null ? parseFloat(iotCalc.avg_activity_pct) : null;
      const actVal = actPct != null ? actPct.toFixed(0) : null;
      const actStatus = actVal == null ? { label: '—', cls: 'text-slate-400' }
        : actPct >= 60 ? { label: 'Sangat Aktif', cls: 'text-emerald-600' }
        : actPct >= 30 ? { label: 'Cukup Aktif', cls: 'text-indigo-600' }
        : { label: 'Kurang Aktif', cls: 'text-amber-600' };
      return {
        label: 'Aktivitas',
        value: actVal,
        unit: '%',
        status: actStatus.label,
        statusCls: actStatus.cls,
        icon: Dumbbell,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
      };
    })(),
    (() => {
      // Istirahat: kebalikan dari waktu aktif
      const actPct = iotCalc?.avg_activity_pct != null ? parseFloat(iotCalc.avg_activity_pct) : null;
      const restVal = actPct != null ? (100 - actPct).toFixed(0) : null;
      const restStatus = restVal == null ? { label: '—', cls: 'text-slate-400' }
        : (100 - actPct) >= 60 ? { label: 'Banyak Istirahat', cls: 'text-indigo-600' }
        : (100 - actPct) >= 30 ? { label: 'Istirahat Normal', cls: 'text-sky-600' }
        : { label: 'Sedikit Istirahat', cls: 'text-amber-600' };
      return {
        label: 'Istirahat',
        value: restVal,
        unit: '%',
        status: restStatus.label,
        statusCls: restStatus.cls,
        icon: Clock,
        color: 'text-sky-500',
        bg: 'bg-sky-50',
      };
    })(),
  ];

  // ── Data grafik kesehatan 7 hari ────────────────────────────────
  const DAY_LABELS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const hasRealChartData = dailyHealth.some(d => d.score != null);
  const chartDays = dailyHealth.length > 0
    ? dailyHealth.map((d, i) => {
        const dateObj = new Date(d.date + 'T12:00:00');
        const isToday = i === dailyHealth.length - 1;
        return { label: isToday ? 'Hari ini' : DAY_LABELS_ID[dateObj.getDay()], score: d.score, count: d.reading_count, isToday };
      })
    : DAY_LABELS_ID.map((l, i) => ({ label: l, score: null, count: 0, isToday: i === 6 }));

  if (!selectedPet) return (
    <div className="text-center py-20 text-slate-400">
      <Cat size={48} className="mx-auto mb-4 opacity-30" />
      <p className="font-semibold text-lg mb-2">Belum ada hewan terdaftar</p>
      <p className="text-sm mb-6">Tambahkan hewan peliharaan pertamamu!</p>
      <button onClick={onAddPet} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all inline-flex items-center gap-2">
        <Plus size={16} />Tambah Hewan
      </button>
    </div>
  );

  const smartTips = getSmartTips(selectedPet, records);
  // Prioritas: kondisi IoT buruk > rekam medis > tips spesies harian
  const tip = iotHealthTip || smartTips?.[0] || (TIPS_DB[selectedPet.species] || TIPS_DB['Kucing'])[0];
  const TipIcon = tip.icon;

  return (
    <div className="space-y-6 anim-slide-up">

      {/* ── Pet Selector ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            Hewan Peliharaan
            <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full">{pets.length}</span>
          </h3>
          <button onClick={onAddPet} className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-700 transition-all">
            <Plus size={12} /> Tambah
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {pets.map(pet => {
            const PetIcon = PET_ICONS[pet.species] || Cat;
            const col = PET_COLORS[pet.species] || PET_COLORS['Kucing'];
            const active = selectedPet.id === pet.id;
            return (
              <button key={pet.id} onClick={() => setSelectedPet(pet)}
                className={`flex items-center gap-2.5 shrink-0 px-3.5 py-2.5 rounded-2xl border-2 transition-all duration-200 ${active ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                <div className={`w-8 h-8 ${col.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <PetIcon size={16} className={col.text} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold leading-none ${active ? 'text-indigo-700' : 'text-slate-700'}`}>{pet.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{pet.species}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* ── Health Score Card ── */}
          <div className={`rounded-3xl p-5 border flex items-center gap-4 ${healthInfo.cls.includes('emerald') ? 'bg-emerald-50 border-emerald-100' : healthInfo.cls.includes('amber') ? 'bg-amber-50 border-amber-100' : healthInfo.cls.includes('rose') ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 ring-4 ${healthInfo.ring} ${healthInfo.cls}`}>
              {iotLoading
                ? <Loader2 size={22} className="animate-spin opacity-60" />
                : healthScore != null
                  ? <><span className="text-2xl font-black leading-none">{healthScore}</span><span className="text-[9px] font-bold opacity-70 mt-0.5">/ 100</span></>
                  : <span className="text-2xl opacity-40">--</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-lg font-black text-slate-800">{healthInfo.emoji} {healthInfo.label}</span>
              <p className="text-xs text-slate-500 mt-0.5">
                {iotCalc ? `Kalkulasi dari ${iotCalc.reading_count} pembacaan IoT · Suhu, detak jantung & SpO₂` : 'Hubungkan perangkat IoT untuk skor kesehatan real-time'}
              </p>
              {iotCalc && (
                <div className="flex gap-3 mt-2 flex-wrap">
                  <span className={`text-[10px] font-bold ${suhuSt.cls}`}>🌡 {iotCalc.avg_suhu != null ? `${parseFloat(iotCalc.avg_suhu).toFixed(1)}°C` : '--'} {suhuSt.label}</span>
                  <span className={`text-[10px] font-bold ${hrSt.cls}`}>💓 {iotCalc.avg_heart_rate != null ? `${Math.round(iotCalc.avg_heart_rate)} bpm` : '--'} {hrSt.label}</span>
                  <span className={`text-[10px] font-bold ${spo2St.cls}`}>🫁 {iotCalc.avg_spo2 != null ? `${parseFloat(iotCalc.avg_spo2).toFixed(1)}%` : '--'} {spo2St.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((st, i) => (
              <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`${st.bg} ${st.color} w-9 h-9 rounded-2xl flex items-center justify-center`}><st.icon size={17} /></div>
                  {st.isTempCard && (
                    <div className="flex gap-0.5">
                      {['C','F','K'].map(u => (
                        <button key={u} onClick={() => setTempUnit(u)}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all ${tempUnit === u ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
                          {u === 'C' ? '°C' : u === 'F' ? '°F' : 'K'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{st.label}</p>
                <p className="text-2xl font-black text-slate-800 leading-none">
                  {iotLoading ? <span className="text-slate-300 text-base">···</span> : st.value != null ? <>{st.value}<span className="text-xs font-semibold text-slate-400 ml-0.5">{st.unit}</span></> : <span className="text-slate-300 text-base">--</span>}
                </p>
                <span className={`text-[10px] font-bold mt-1.5 block ${st.statusCls}`}>{st.status}</span>
              </div>
            ))}
          </div>

          {/* ── Grafik Skor Kesehatan 7 Hari ── */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={15} className="text-indigo-500" />
                  Riwayat Skor Kesehatan
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {hasRealChartData ? `Kalkulasi skor per hari · ${selectedPet.name}` : 'Belum ada data IoT — hubungkan ESP32'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 shrink-0">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"/>≥85</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block"/>65–84</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-400 inline-block"/>&lt;65</span>
              </div>
            </div>
            <div className="relative" style={{ height: 160 }}>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-full border-t border-dashed border-emerald-100" style={{ top: '15%' }}>
                  <span className="absolute right-0 text-[8px] text-emerald-400 font-bold -translate-y-full">85</span>
                </div>
                <div className="absolute w-full border-t border-dashed border-amber-100" style={{ top: '35%' }}>
                  <span className="absolute right-0 text-[8px] text-amber-400 font-bold -translate-y-full">65</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-end justify-between gap-1.5 px-0.5">
                {chartDays.map((d, i) => {
                  const heightPct = d.score != null ? Math.max(6, d.score) : 0;
                  const barCls = d.score == null ? 'bg-slate-100' : d.score >= 85 ? (d.isToday ? 'bg-emerald-500' : 'bg-emerald-300') : d.score >= 65 ? (d.isToday ? 'bg-amber-500' : 'bg-amber-300') : (d.isToday ? 'bg-rose-500' : 'bg-rose-300');
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5" style={{ height: '100%' }}>
                      <div className="w-full flex flex-col justify-end" style={{ height: 'calc(100% - 28px)' }}>
                        {d.score != null && <span className={`text-[9px] font-black text-center mb-0.5 ${d.isToday ? 'text-slate-700' : 'text-slate-400'}`}>{d.score}</span>}
                        <div className={`w-full rounded-t-xl transition-all duration-700 ${barCls}`} style={{ height: d.score != null ? `${heightPct}%` : '8%', opacity: d.score == null ? 0.25 : 1 }} />
                      </div>
                      <span className={`text-[9px] font-bold leading-none ${d.isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{d.label}</span>
                      {d.count > 0 && <span className="text-[8px] text-slate-300 leading-none">{d.count}x</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
              {healthScore != null
                ? <div className="flex items-center gap-2"><span className={`text-[10px] font-black px-3 py-1 rounded-full ${healthInfo.cls}`}>{healthInfo.label}</span><span className="text-xs text-slate-400">Skor hari ini: {healthScore}/100</span></div>
                : <span className="text-xs text-slate-400">Belum ada data IoT hari ini</span>
              }
              <span className="text-[10px] text-slate-300 font-semibold">6 hari + hari ini</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* ── Single Smart Tip ── */}
          {(() => {
            const TIcon = tip.icon;
            const isIotAlert = tip.source === 'iot-health';
            const isUrgent = tip.priority === 'urgent';
            const isHigh = tip.priority === 'high';
            const cardCls = isUrgent ? 'from-rose-500 to-rose-700' : isHigh ? 'from-amber-500 to-orange-600' : 'from-indigo-500 to-violet-600';
            const badgeLabel = isIotAlert
              ? (isUrgent ? '🚨 Kondisi Darurat' : '⚠️ Perlu Perhatian')
              : isUrgent ? 'Segera Tindak' : isHigh ? 'Perhatian' : tip.priority ? 'Rekomendasi' : 'Tips Hari Ini';
            const badgeSrc = isIotAlert ? 'Data IoT Realtime' : tip.priority ? 'Dari Rekam Medis' : selectedPet.species;
            return (
              <div className={`bg-gradient-to-br ${cardCls} p-6 rounded-[28px] text-white shadow-xl relative overflow-hidden`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"><TIcon size={15} /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{badgeLabel}</span>
                    </div>
                    <span className="text-[9px] font-bold bg-white/20 px-2 py-1 rounded-full opacity-80">{badgeSrc}</span>
                  </div>
                  <h4 className="font-black text-base mb-2 leading-snug">{tip.title}</h4>
                  <p className="text-[11px] opacity-90 leading-relaxed">{tip.body}</p>
                  {/* Daftar parameter bermasalah dari IoT */}
                  {isIotAlert && tip.issues?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {tip.issues.map((issue, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
                          <issue.icon size={11} className="shrink-0 opacity-90" />
                          <span className="text-[10px] font-bold opacity-90">{issue.param}: {issue.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-4 -top-4 w-20 h-20 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              </div>
            );
          })()}

          {/* ── Profil Singkat Hewan ── */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <PetAvatar species={selectedPet.species} size="md" />
              <div>
                <h4 className="font-bold text-slate-800">{selectedPet.name}</h4>
                <p className="text-xs text-slate-500">{selectedPet.species} · {selectedPet.breed}</p>
              </div>
            </div>
            {[['Usia', formatAge(selectedPet.age, selectedPet.age_unit)], ['Berat', `${formatWeight(selectedPet.weight)} kg`], ['Gender', selectedPet.gender || '-'], ['Warna', selectedPet.color || '-']].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-500">{k}</span>
                <span className="text-xs font-bold text-slate-800">{v}</span>
              </div>
            ))}
            {selectedPet.notes && <p className="text-xs text-slate-400 mt-3 italic">"{selectedPet.notes}"</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SCHEDULE PAGE ────────────────────────────────────────────────────
const SchedulePage = ({ pets, schedules, onAdd, onToggle, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ pet_id: pets[0]?.id || '', type: 'Makan', title: '', date: todayStr, time: '08:00', notes: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    await onAdd(form);
    setShowForm(false);
    setForm({ pet_id: pets[0]?.id || '', type: 'Makan', title: '', date: todayStr, time: '08:00', notes: '' });
  };

  const filtered = (schedules || []).filter(s => {
    if (filter === 'today') return isToday(s.date);
    if (filter === 'upcoming') return s.date >= todayStr && !s.done;
    if (filter === 'done') return s.done;
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const getPet = (id) => (pets || []).find(p => p.id === id);

  return (
    <div className="anim-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-800">Kalender Kegiatan</h3>
          <p className="text-sm text-slate-500 mt-0.5">{(schedules || []).filter(s => isToday(s.date)).length} kegiatan hari ini</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all">
          <Plus size={16} /> Tambah
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {[['all', 'Semua'], ['today', 'Hari Ini'], ['upcoming', 'Mendatang'], ['done', 'Selesai']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filter === v ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{l}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Calendar size={44} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Tidak ada jadwal</p>
          </div>
        )}
        {filtered.map(s => {
          const tp = SCHEDULE_TYPES.find(t => t.type === s.type) || SCHEDULE_TYPES[0];
          const SchedIcon = tp.icon;
          const pet = getPet(s.pet_id);
          return (
            <div key={s.id} className={`bg-white rounded-3xl border p-5 flex items-center gap-4 hover:shadow-md transition-all ${s.done ? 'border-slate-100 opacity-60' : isToday(s.date) ? 'border-indigo-200' : 'border-slate-100'}`}>
              <div className={`${tp.bg} w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`}>
                <SchedIcon size={20} className={tp.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-bold text-slate-800 ${s.done ? 'line-through text-slate-400' : ''}`}>{s.title}</p>
                  {isToday(s.date) && !s.done && <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Hari Ini</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {pet && <span className="text-xs text-slate-500">{pet.name}</span>}
                  <span className="text-xs text-slate-400">{formatDate(s.date)} · {s.time}</span>
                </div>
                {s.notes && <p className="text-xs text-slate-400 mt-1 italic truncate">{s.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onToggle(s.id, !s.done)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${s.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'}`}>
                  <Check size={15} />
                </button>
                <button onClick={() => onDelete(s.id)} className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white w-full max-w-md rounded-[32px] p-7 shadow-2xl anim-zoom">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Jadwal Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-style">Hewan</label>
                  <select value={form.pet_id} onChange={e => setForm({ ...form, pet_id: e.target.value })} className="input-style">
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="label-style">Jenis</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-style">
                    {SCHEDULE_TYPES.map(t => <option key={t.type}>{t.type}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label-style">Judul</label><input required type="text" placeholder="Nama kegiatan..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-style" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-style">Tanggal</label><input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-style" /></div>
                <div><label className="label-style">Waktu</label><input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="input-style" /></div>
              </div>
              <div><label className="label-style">Catatan (opsional)</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="input-style resize-none" /></div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">Simpan Jadwal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MEDICAL PAGE ─────────────────────────────────────────────────────
const MedicalPage = ({ pets, records, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterPet, setFilterPet] = useState('all');
  const [form, setForm] = useState({ pet_id: pets[0]?.id || '', date: todayStr, type: 'Pemeriksaan', title: '', doctor: '', clinic: '', weight: '', temp: '', notes: '', next_visit: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    await onAdd(form);
    setShowForm(false);
    setForm({ pet_id: pets[0]?.id || '', date: todayStr, type: 'Pemeriksaan', title: '', doctor: '', clinic: '', weight: '', temp: '', notes: '', next_visit: '' });
  };

  const filtered = (records || [])
    .filter(r => filterPet === 'all' || r.pet_id === filterPet)
    .sort((a, b) => b.date.localeCompare(a.date));

  const getPet = (id) => (pets || []).find(p => p.id === id);
  const typeColors = {
    Pemeriksaan: 'bg-blue-50 text-blue-600', Vaksinasi: 'bg-violet-50 text-violet-600',
    Pengobatan: 'bg-amber-50 text-amber-600', Operasi: 'bg-rose-50 text-rose-600', Grooming: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="anim-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-800">Rekam Medis</h3>
          <p className="text-sm text-slate-500 mt-0.5">{(records || []).length} catatan tersimpan</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all">
          <Plus size={16} /> Tambah
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => setFilterPet('all')} className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap ${filterPet === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>Semua</button>
        {pets.map(p => (
          <button key={p.id} onClick={() => setFilterPet(p.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap ${filterPet === p.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{p.name}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400"><FileText size={44} className="mx-auto mb-3 opacity-30" /><p className="font-semibold">Belum ada rekam medis</p></div>
        )}
        {filtered.map(r => {
          const pet = getPet(r.pet_id);
          const col = typeColors[r.type] || 'bg-slate-50 text-slate-600';
          const [colBg, colText] = col.split(' ');
          return (
            <div key={r.id} onClick={() => setSelected(r)} className="bg-white rounded-3xl border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="flex items-start gap-4">
                <div className={`${colBg} w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`}>
                  <Stethoscope size={20} className={colText} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800">{r.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col}`}>{r.type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                    {pet && <span>{pet.name}</span>}
                    <span>{formatDate(r.date)}</span>
                    {r.doctor && <span>{r.doctor}</span>}
                  </div>
                  {r.notes && <p className="text-xs text-slate-400 mt-1 italic truncate">{r.notes}</p>}
                  {r.next_visit && (
                    <p className={`text-xs font-semibold mt-1.5 ${r.next_visit < todayStr ? 'text-rose-500' : 'text-emerald-600'}`}>
                      Kunjungan berikut: {formatDate(r.next_visit)}
                    </p>
                  )}
                </div>
                <ChevronRight size={16} className="text-slate-300 shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-white w-full max-w-md rounded-[32px] p-7 shadow-2xl anim-zoom">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-slate-800">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div className="space-y-2.5">
              {[['Tanggal', formatDate(selected.date)], ['Jenis', selected.type], ['Dokter', selected.doctor || '-'], ['Klinik', selected.clinic || '-'], ['Berat', selected.weight ? `${selected.weight} kg` : '-'], ['Suhu', selected.temp ? `${selected.temp}C` : '-'], ['Kunjungan Berikutnya', selected.next_visit ? formatDate(selected.next_visit) : '-']].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-500">{k}</span>
                  <span className="text-xs font-bold text-slate-800 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
              {selected.notes && <div className="mt-3 p-4 bg-slate-50 rounded-2xl"><p className="text-xs font-bold text-slate-500 mb-1">Catatan</p><p className="text-sm text-slate-700">{selected.notes}</p></div>}
            </div>
            <button onClick={async () => { await onDelete(selected.id); setSelected(null); }}
              className="mt-5 w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2">
              <Trash2 size={15} /> Hapus Catatan
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white w-full max-w-md rounded-[32px] p-7 shadow-2xl anim-zoom max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Catatan Medis Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-style">Hewan</label><select value={form.pet_id} onChange={e => setForm({ ...form, pet_id: e.target.value })} className="input-style">{pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="label-style">Jenis</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-style">{RECORD_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div><label className="label-style">Judul</label><input required type="text" placeholder="Nama prosedur..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-style" /></div>
              <div><label className="label-style">Tanggal</label><input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-style" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-style">Dokter</label><input type="text" value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} className="input-style" /></div>
                <div><label className="label-style">Klinik</label><input type="text" value={form.clinic} onChange={e => setForm({ ...form, clinic: e.target.value })} className="input-style" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-style">Berat (kg)</label><input type="number" step="0.01" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="input-style" /></div>
                <div><label className="label-style">Suhu (C)</label><input type="number" step="0.1" value={form.temp} onChange={e => setForm({ ...form, temp: e.target.value })} className="input-style" /></div>
              </div>
              <div><label className="label-style">Catatan</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="input-style resize-none" /></div>
              <div><label className="label-style">Kunjungan Berikutnya (opsional)</label><input type="date" value={form.next_visit} onChange={e => setForm({ ...form, next_visit: e.target.value })} className="input-style" /></div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">Simpan Catatan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TIPS PAGE ────────────────────────────────────────────────────────
const TipsPage = ({ selectedPet, records }) => {
  const [activeSpecies, setActiveSpecies] = useState(selectedPet?.species || 'Kucing');
  const tips = TIPS_DB[activeSpecies] || TIPS_DB['Kucing'];
  const gradients = ['from-indigo-500 to-violet-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-sky-500 to-blue-600'];

  // Smart tips berdasarkan rekam medis pet yang sedang aktif
  const activePet = selectedPet?.species === activeSpecies ? selectedPet : null;
  const smartTips = activePet ? getSmartTips(activePet, records) : null;
  const hasPersonalized = smartTips && smartTips.some(t => t.priority);

  return (
    <div className="anim-slide-up">
      <h3 className="text-xl font-black text-slate-800 mb-2">Tips Perawatan</h3>
      <p className="text-sm text-slate-500 mb-6">Panduan merawat hewan peliharaan dengan baik</p>
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.keys(TIPS_DB).map(s => {
          const Icon = PET_ICONS[s]; const col = PET_COLORS[s];
          return (
            <button key={s} onClick={() => setActiveSpecies(s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${activeSpecies === s ? 'bg-indigo-600 text-white shadow-md' : `${col.bg} ${col.text}`}`}>
              <Icon size={15} />{s}
            </button>
          );
        })}
      </div>

      {/* Personalized tips dari rekam medis */}
      {hasPersonalized && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope size={15} className="text-indigo-600" />
            <span className="text-sm font-black text-slate-800">Rekomendasi untuk {activePet?.name}</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Berdasarkan Rekam Medis</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartTips.filter(t => t.priority).map((tip, i) => {
              const Icon = tip.icon;
              const isUrgent = tip.priority === 'urgent';
              const cardCls = isUrgent
                ? 'from-rose-500 to-rose-700'
                : tip.priority === 'high'
                ? 'from-amber-500 to-orange-600'
                : 'from-indigo-500 to-violet-600';
              return (
                <div key={i} className={`bg-gradient-to-br ${cardCls} p-6 rounded-[24px] text-white shadow-lg`}>
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3"><Icon size={18} /></div>
                  <h4 className="font-black text-base mb-1">{tip.title}</h4>
                  <p className="text-xs opacity-90 leading-relaxed">{tip.body}</p>
                </div>
              );
            })}
          </div>
          <div className="h-px bg-slate-100 my-6" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <div key={i} className={`bg-gradient-to-br ${gradients[i % gradients.length]} p-6 rounded-[28px] text-white shadow-lg hover:-translate-y-1 transition-all`}>
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><Icon size={20} /></div>
              <h4 className="font-black text-lg mb-2">{tip.title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{tip.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── SETTINGS PAGE ────────────────────────────────────────────────────
const SettingsPage = ({ user, profile, onUpdateProfile, onLogout, pets, onUpdatePet, onDeletePet }) => {
  const [section, setSection] = useState('profile');
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: profile?.name || '', phone: profile?.phone || '' });
  const [editPetId, setEditPetId] = useState(null);
  const [petForm, setPetForm] = useState({});
  const [notifSettings, setNotifSettings] = useState({ jadwal: true, kesehatan: true, tips: true, vaksinasi: true });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const saveProfile = async () => {
    setSaving(true);
    try { await onUpdateProfile(profileForm); setEditProfile(false); } finally { setSaving(false); }
  };

  const savePet = async () => {
    setSaving(true);
    try { await onUpdatePet(editPetId, petForm); setEditPetId(null); } finally { setSaving(false); }
  };

  const sections = [
    { id: 'profile', label: 'Edit Profil', icon: User },
    { id: 'pets', label: 'Kelola Hewan', icon: Cat },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'app', label: 'Tentang', icon: Settings },
  ];

  return (
    <div className="anim-slide-up">
      <h3 className="text-xl font-black text-slate-800 mb-6">Pengaturan</h3>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-1.5">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${section === s.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
              <s.icon size={16} />{s.label}
            </button>
          ))}
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all mt-2">
            <LogOut size={16} /> Keluar
          </button>
        </div>

        <div className="lg:col-span-3">
          {section === 'profile' && (
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-slate-800">Informasi Profil</h4>
                <button onClick={() => setEditProfile(!editProfile)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl ${editProfile ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {editProfile ? <><X size={13} />Batal</> : <><Edit3 size={13} />Edit</>}
                </button>
              </div>
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-2xl">
                <UserAvatar name={profile?.name} size="lg" />
                <div>
                  <p className="font-black text-slate-800 text-lg">{profile?.name || '-'}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1 uppercase">{profile?.role || 'Basic'}</span>
                </div>
              </div>
              {editProfile ? (
                <div className="space-y-4">
                  <div><label className="label-style">Nama Lengkap</label><input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="input-style" /></div>
                  <div><label className="label-style">No. Telepon</label><input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="input-style" /></div>
                  <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {[['Nama', profile?.name || '-'], ['Email', user?.email || '-'], ['Telepon', profile?.phone || '-'], ['Role', profile?.role || 'Basic']].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-500">{k}</span>
                      <span className="text-sm font-bold text-slate-800">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'pets' && (
            <div className="space-y-4">
              {pets.length === 0 && <div className="text-center py-12 text-slate-400 bg-white rounded-[28px] border border-slate-100"><Cat size={40} className="mx-auto mb-3 opacity-30" /><p>Belum ada hewan</p></div>}
              {pets.map(pet => (
                <div key={pet.id} className="bg-white rounded-[28px] border border-slate-100 p-5 shadow-sm">
                  {editPetId === pet.id ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800">Edit {pet.name}</h4>
                        <button onClick={() => setEditPetId(null)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"><X size={17} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[['Nama', 'name', 'text'], ['Ras', 'breed', 'text']].map(([l, k, t]) => (
                          <div key={k}><label className="label-style">{l}</label><input type={t} value={petForm[k] || ''} onChange={e => setPetForm({ ...petForm, [k]: e.target.value })} className="input-style" /></div>
                        ))}
                        <div>
                          <label className="label-style">Usia</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="cth: 2 = 2 tahun, 3,5 = 3,5 minggu"
                            value={petForm.age || ''}
                            onChange={e => {
                              const raw = e.target.value;
                              const hasDecimal = raw.replace(',', '.').includes('.');
                              setPetForm({ ...petForm, age: raw, age_unit: hasDecimal ? 'minggu' : 'tahun' });
                            }}
                            className="input-style"
                          />
                          {petForm.age != null && petForm.age !== '' && (
                            <p className="text-[10px] mt-1 font-semibold text-indigo-500">
                              → {String(petForm.age).replace(',','.')} {petForm.age_unit || 'tahun'}
                            </p>
                          )}
                        </div>
                        <div><label className="label-style">Berat (kg)</label><input type="number" min="0" step="0.01" value={petForm.weight || ''} onChange={e => setPetForm({ ...petForm, weight: e.target.value })} className="input-style" /></div>
                        <div><label className="label-style">Gender</label><select value={petForm.gender || 'Jantan'} onChange={e => setPetForm({ ...petForm, gender: e.target.value })} className="input-style"><option>Jantan</option><option>Betina</option></select></div>
                        <div><label className="label-style">Warna</label><input type="text" value={petForm.color || ''} onChange={e => setPetForm({ ...petForm, color: e.target.value })} className="input-style" /></div>
                      </div>
                      <div className="mt-3"><label className="label-style">Catatan</label><textarea value={petForm.notes || ''} onChange={e => setPetForm({ ...petForm, notes: e.target.value })} rows={2} className="input-style resize-none" /></div>
                      <div className="flex gap-3 mt-4">
                        <button onClick={savePet} disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-60">
                          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                        </button>
                        <button onClick={() => setDeleteConfirm(pet.id)} className="py-3 px-5 bg-rose-50 text-rose-500 rounded-2xl font-bold"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <PetAvatar species={pet.species} size="md" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{pet.name}</p>
                        <p className="text-xs text-slate-500">{pet.species} · {pet.breed} · {formatAge(pet.age, pet.age_unit)} · {formatWeight(pet.weight)} kg</p>
                      </div>
                      <button onClick={() => { setEditPetId(pet.id); setPetForm({ ...pet }); }} className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {deleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                  <div className="bg-white rounded-[28px] p-6 max-w-sm w-full shadow-2xl anim-zoom text-center">
                    <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-rose-500" /></div>
                    <h4 className="font-black text-slate-800 text-lg mb-2">Hapus Hewan?</h4>
                    <p className="text-sm text-slate-500 mb-6">Data akan dihapus permanen dari database.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm">Batal</button>
                      <button onClick={async () => { await onDeletePet(deleteConfirm); setDeleteConfirm(null); setEditPetId(null); }} className="flex-1 py-3 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600">Hapus</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {section === 'notifications' && (
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-5">Pengaturan Notifikasi</h4>
              <div className="space-y-3">
                {[['jadwal', 'Pengingat Jadwal', 'Notifikasi kegiatan hewan'], ['kesehatan', 'Pemantauan Kesehatan', 'Update kondisi real-time'], ['tips', 'Tips Harian', 'Tips perawatan setiap hari'], ['vaksinasi', 'Vaksinasi dan Kontrol', 'Pengingat vaksinasi']].map(([k, title, desc]) => (
                  <div key={k} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div><p className="font-semibold text-slate-800 text-sm">{title}</p><p className="text-xs text-slate-500 mt-0.5">{desc}</p></div>
                    <button onClick={() => setNotifSettings(prev => ({ ...prev, [k]: !prev[k] }))} className="transition-colors">
                      {notifSettings[k] ? <ToggleRight size={30} className="text-indigo-600" /> : <ToggleLeft size={30} className="text-slate-300" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'app' && (
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4">Tentang Aplikasi</h4>
              {[['Versi', '2.0.0'], ['Framework', 'React 18'], ['Database', 'Supabase PostgreSQL'], ['Auth', 'Supabase Auth'], ['Hosting', 'Vercel']].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-500">{k}</span><span className="text-sm font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── NOTIF PANEL ──────────────────────────────────────────────────────
const NotifPanel = ({ notifications, onMarkAllRead, onClearAll, onMarkOneRead }) => {
  const typeIcon = { success: CheckCircle2, warning: AlertCircle, info: Info };
  const typeColor = { success: 'text-emerald-500', warning: 'text-amber-500', info: 'text-indigo-500' };
  return (
    <div className="absolute right-0 top-14 w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 anim-slide-down">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <span className="font-black text-slate-800">Notifikasi
          <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full ml-2">{notifications.filter(n => n.unread).length}</span>
        </span>
        <div className="flex gap-3">
          <button onClick={onMarkAllRead} className="text-[10px] font-bold text-indigo-600 hover:underline">Baca semua</button>
          <button onClick={onClearAll} className="text-[10px] font-bold text-rose-500 hover:underline">Hapus semua</button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 && (
          <div className="py-10 text-center text-slate-400"><Bell size={30} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Tidak ada notifikasi</p></div>
        )}
        {notifications.map(n => {
          const Icon = typeIcon[n.type] || Info;
          return (
            <div key={n.id} onClick={() => onMarkOneRead(n.id)}
              className={`p-4 border-b border-slate-50 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${n.unread ? 'bg-indigo-50/40' : ''}`}>
              <Icon size={15} className={`${typeColor[n.type] || 'text-slate-400'} mt-0.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm text-slate-700 leading-snug ${n.unread ? 'font-semibold' : ''}`}>{n.text}</p>
                <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {n.unread && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── ADD PET MODAL ────────────────────────────────────────────────────
const AddPetModal = ({ onClose, onAdd, loading }) => {
  const [form, setForm] = useState({ name: '', species: 'Kucing', breed: '', age: '1', age_unit: 'tahun', weight: '1', gender: 'Jantan', color: '', notes: '' });
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-md rounded-[32px] p-7 shadow-2xl anim-zoom max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800">Tambah Anabul</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onAdd(form); }} className="space-y-4">
          <div><label className="label-style">Nama Panggilan</label><input required type="text" placeholder="Luna, Max, dsb..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-style" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-style">Spesies</label><select value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} className="input-style">{Object.keys(PET_ICONS).map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label className="label-style">Gender</label><select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="input-style"><option>Jantan</option><option>Betina</option></select></div>
          </div>
          <div><label className="label-style">Jenis Ras</label><input required type="text" placeholder="Persian, Golden, dsb..." value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} className="input-style" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-style">Usia</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="cth: 2 = 2 tahun, 3,5 = 3,5 minggu"
                value={form.age}
                onChange={e => {
                  const raw = e.target.value;
                  const normalized = raw.replace(',', '.');
                  const hasDecimal = normalized.includes('.');
                  setForm({ ...form, age: raw, age_unit: hasDecimal ? 'minggu' : 'tahun' });
                }}
                className="input-style"
              />
              {form.age !== '' && (
                <p className="text-[10px] mt-1 font-semibold text-indigo-500">
                  → {form.age.replace(',','.')} {form.age_unit}
                </p>
              )}
            </div>
            <div><label className="label-style">Berat (kg)</label><input type="number" min="0" step="0.01" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="input-style" /></div>
          </div>
          <div><label className="label-style">Warna</label><input type="text" placeholder="Putih, hitam, dsb..." value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="input-style" /></div>
          <div><label className="label-style">Catatan (opsional)</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="input-style resize-none" /></div>
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
            <PetAvatar species={form.species} size="md" />
            <div><p className="font-bold text-slate-700">{form.name || 'Nama Anabul'}</p><p className="text-xs text-slate-500">{form.species} · {form.breed || 'Ras'}</p></div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={17} className="animate-spin" />Menyimpan...</> : 'Daftarkan Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
};


// ─── MONITOR PAGE (IoT) ───────────────────────────────────────────────
const MonitorPage = ({ pets, selectedPet, setSelectedPet }) => {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async (petId) => {
    if (!petId) return;
    setLoading(true);
    try {
      const [one, hist] = await Promise.all([
        monitoringService.getOne(petId),
        monitoringService.getLatest(petId, 15),
      ]);
      setLatest(one);
      setHistory((hist || []).slice().reverse());
      setLastUpdate(new Date());
    } catch (e) {
      console.error('Monitor fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPet) return;
    fetchData(selectedPet.id);
    const channel = monitoringService.subscribe(selectedPet.id, (newRow) => {
      setLatest(newRow);
      setHistory(prev => [...prev, newRow].slice(-15));
      setLastUpdate(new Date());
      setIsLive(true);
      setTimeout(() => setIsLive(false), 3000);
    });
    return () => { channel.unsubscribe(); };
  }, [selectedPet, fetchData]);

  const StatCard = ({ label, value, unit, icon: Icon, color, bg, status, statusColor }) => (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center`}>
          <Icon size={18} className={color} />
        </div>
        {status && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor || 'bg-emerald-100 text-emerald-700'}`}>
            {status}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 font-semibold mt-2">{label}</p>
      <p className="text-2xl font-black text-slate-800 mt-0.5">
        {value != null ? value : <span className="text-slate-300">--</span>}
        {value != null && <span className="text-sm font-semibold text-slate-400 ml-1">{unit}</span>}
      </p>
    </div>
  );

  const MiniChart = ({ data, field, color, label }) => {
    if (!data.length) return null;
    const vals = data.map(d => parseFloat(d[field]) || 0);
    const max = Math.max(...vals) || 1;
    const min = Math.min(...vals);
    const range = max - min || 1;
    return (
      <div>
        <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
        <div className="flex items-end gap-1 h-14">
          {vals.map((v, i) => (
            <div key={i} className="flex-1">
              <div
                className={`w-full rounded-t-sm ${color}`}
                style={{ height: `${Math.max(6, ((v - min) / range) * 48)}px`, opacity: 0.45 + (i / vals.length) * 0.55 }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-400">{vals[0]?.toFixed(1)}</span>
          <span className="text-[9px] text-slate-400 font-bold">{vals[vals.length - 1]?.toFixed(1)}</span>
        </div>
      </div>
    );
  };

  if (!pets.length) return (
    <div className="text-center py-20 text-slate-400">
      <Cpu size={48} className="mx-auto mb-4 opacity-30" />
      <p className="font-semibold text-lg mb-2">Belum ada hewan terdaftar</p>
      <p className="text-sm">Tambahkan hewan peliharaan terlebih dahulu.</p>
    </div>
  );

  // Spesies yang cenderung banyak gerak di luar kandang → default mode kalung
  const OUTDOOR_SPECIES = ['Kucing', 'Anjing', 'Kelinci', 'Ferret'];
  // Spesies yang cenderung tinggal di dalam kandang → default mode kandang
  const INDOOR_SPECIES  = ['Hamster', 'Marmut', 'Sugar Glider', 'Landak Mini'];

  // Tentukan default mode berdasarkan spesies hewan
  const speciesDefaultMode = selectedPet
    ? OUTDOOR_SPECIES.includes(selectedPet.species)
      ? 'kalung'
      : 'kandang'
    : null;

  // Mode final: utamakan data dari IoT (latest?.mode),
  // jika IoT belum ada data gunakan default dari spesies
  const iotMode = latest?.mode ?? null;
  const mode    = iotMode ?? speciesDefaultMode;
  const isKandang = mode === 'kandang';

  // Sumber mode untuk ditampilkan ke user
  const modeSource = iotMode
    ? 'iot'        // mode diterima langsung dari perangkat IoT
    : speciesDefaultMode
    ? 'species'    // mode default berdasarkan jenis hewan
    : null;

  const getSuhuStatus = (s) => {
    if (s == null) return null;
    if (s < 37.5) return { label: 'Rendah', cls: 'bg-blue-100 text-blue-700' };
    if (s > 39.5) return { label: 'Tinggi', cls: 'bg-rose-100 text-rose-700' };
    return { label: 'Normal', cls: 'bg-emerald-100 text-emerald-700' };
  };
  const getHRStatus = (h) => {
    if (h == null) return null;
    if (h < 60) return { label: 'Rendah', cls: 'bg-blue-100 text-blue-700' };
    if (h > 140) return { label: 'Tinggi', cls: 'bg-rose-100 text-rose-700' };
    return { label: 'Normal', cls: 'bg-emerald-100 text-emerald-700' };
  };
  const getSpO2Status = (s) => {
    if (s == null) return null;
    if (s < 95) return { label: 'Rendah', cls: 'bg-rose-100 text-rose-700' };
    return { label: 'Normal', cls: 'bg-emerald-100 text-emerald-700' };
  };

  const suhuSt = getSuhuStatus(latest?.suhu);
  const hrSt   = getHRStatus(latest?.heart_rate);
  const spo2St = getSpO2Status(latest?.spo2);

  return (
    <div className="space-y-6 anim-slide-up">

      {/* Pet Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {pets.map(pet => {
          const Icon = PET_ICONS[pet.species] || Cat;
          const col  = PET_COLORS[pet.species] || PET_COLORS["Kucing"];
          const active = selectedPet?.id === pet.id;
          return (
            <button key={pet.id} onClick={() => setSelectedPet(pet)}
              className={`flex items-center gap-2.5 shrink-0 px-3.5 py-2.5 rounded-2xl border-2 transition-all duration-200 ${active ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm"}`}>
              <div className={`w-8 h-8 ${col.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={16} className={col.text} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-bold leading-none ${active ? "text-indigo-700" : "text-slate-700"}`}>{pet.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{pet.species}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode Status Bar */}
      <div className={`rounded-3xl p-5 flex items-center justify-between transition-all ${isKandang ? "bg-amber-50 border border-amber-200" : "bg-indigo-50 border border-indigo-200"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isKandang ? "bg-amber-100" : "bg-indigo-100"}`}>
            {isKandang
              ? <Home size={22} className="text-amber-600" />
              : <Tag  size={22} className="text-indigo-600" />
            }
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-black text-lg ${isKandang ? "text-amber-800" : "text-indigo-800"}`}>
                Mode {isKandang ? "Kandang" : "Kalung"}
              </p>
              {/* Badge sumber mode */}
              {modeSource === 'iot' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <Wifi size={9} /> Dari IoT
                </span>
              )}
              {modeSource === 'species' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center gap-1">
                  ✦ Default Spesies
                </span>
              )}
            </div>
            <p className={`text-xs font-semibold ${isKandang ? "text-amber-600" : "text-indigo-500"}`}>
              {modeSource === 'iot'
                ? isKandang
                  ? "IoT terdeteksi di kandang — kirim data tiap 5 detik"
                  : "IoT terdeteksi bebas bergerak — kirim data tiap 15 detik"
                : modeSource === 'species'
                ? isKandang
                  ? `${selectedPet?.species} cenderung di kandang — menunggu konfirmasi IoT`
                  : `${selectedPet?.species} aktif di luar — menunggu konfirmasi IoT`
                : "Menunggu data dari perangkat IoT..."
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full animate-pulse">
              <Radio size={11} /> LIVE
            </span>
          )}
          <button onClick={() => fetchData(selectedPet?.id)} disabled={loading}
            className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 border border-slate-200 shadow-sm transition-all">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading && !latest ? <Spinner text="Mengambil data sensor dari Supabase..." /> : (
        <>
          {/* Vital Signs Stat Cards */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <HeartPulse size={12} className="text-rose-400" /> Tanda Vital
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                label="Suhu Tubuh"
                value={latest?.suhu != null ? parseFloat(latest.suhu).toFixed(1) : null}
                unit="°C" icon={Thermometer} color="text-amber-500" bg="bg-amber-50"
                status={suhuSt?.label} statusColor={suhuSt?.cls}
              />
              <StatCard
                label="Detak Jantung"
                value={latest?.heart_rate != null ? parseFloat(latest.heart_rate).toFixed(0) : null}
                unit="BPM" icon={HeartPulse} color="text-rose-500" bg="bg-rose-50"
                status={hrSt?.label} statusColor={hrSt?.cls}
              />
              <StatCard
                label="Saturasi O₂"
                value={latest?.spo2 != null ? parseFloat(latest.spo2).toFixed(1) : null}
                unit="%" icon={Activity} color="text-sky-500" bg="bg-sky-50"
                status={spo2St?.label} statusColor={spo2St?.cls}
              />
            </div>
          </div>

          {/* Akselerasi / Gerakan Stat Cards */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Dumbbell size={12} className="text-violet-400" /> Sensor Gerak (Akselerometer)
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Akselerasi X" value={latest?.ax ?? null} unit="mg" icon={Cpu} color="text-violet-500" bg="bg-violet-50" />
              <StatCard label="Akselerasi Y" value={latest?.ay ?? null} unit="mg" icon={Cpu} color="text-purple-500" bg="bg-purple-50" />
              <StatCard label="Akselerasi Z" value={latest?.az ?? null} unit="mg" icon={Cpu} color="text-fuchsia-500" bg="bg-fuchsia-50" />
              <StatCard
                label="Intensitas Gerak"
                value={(() => {
                  const ax = parseFloat(latest?.ax), ay = parseFloat(latest?.ay), az = parseFloat(latest?.az);
                  if (isNaN(ax) && isNaN(ay) && isNaN(az)) return null;
                  const mag = Math.sqrt((isNaN(ax)?0:ax)**2 + (isNaN(ay)?0:ay)**2 + (isNaN(az)?0:az)**2);
                  return mag.toFixed(0);
                })()}
                unit="mg" icon={Radio} color="text-pink-500" bg="bg-pink-50"
                status={(() => {
                  const ax = parseFloat(latest?.ax), ay = parseFloat(latest?.ay), az = parseFloat(latest?.az);
                  if (isNaN(ax) && isNaN(ay) && isNaN(az)) return null;
                  const mag = Math.sqrt((isNaN(ax)?0:ax)**2 + (isNaN(ay)?0:ay)**2 + (isNaN(az)?0:az)**2);
                  return mag > 200 ? 'Aktif' : mag > 80 ? 'Sedang' : 'Diam';
                })()}
                statusColor={(() => {
                  const ax = parseFloat(latest?.ax), ay = parseFloat(latest?.ay), az = parseFloat(latest?.az);
                  if (isNaN(ax) && isNaN(ay) && isNaN(az)) return null;
                  const mag = Math.sqrt((isNaN(ax)?0:ax)**2 + (isNaN(ay)?0:ay)**2 + (isNaN(az)?0:az)**2);
                  return mag > 200 ? 'bg-emerald-100 text-emerald-700' : mag > 80 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';
                })()}
              />
            </div>
          </div>

          {/* Mini Charts */}
          {history.length > 1 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-500" /> Grafik Histori Real-time
                </h3>
                <span className="text-xs text-slate-400 font-semibold">{history.length} data terakhir</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <MiniChart data={history} field="suhu"       color="bg-amber-400" label="Suhu (°C)" />
                <MiniChart data={history} field="heart_rate" color="bg-rose-400"  label="Detak Jantung (BPM)" />
                <MiniChart data={history} field="spo2"       color="bg-sky-400"   label="SpO₂ (%)" />
                <MiniChart data={history} field="ax"         color="bg-violet-400" label="Akselerasi X (mg)" />
              </div>
            </div>
          )}

          {/* Detail Sensor yang Dipakai */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 flex items-center gap-2 mb-5">
              <Cpu size={16} className="text-indigo-500" /> Detail Sensor yang Dipakai
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sensor Suhu */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Thermometer size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-amber-800">MLX90614</p>
                    <p className="text-[10px] text-amber-600 font-semibold">Sensor Suhu Inframerah</p>
                  </div>
                </div>
                <div className="space-y-1 mt-3">
                  {[['Tipe', 'Non-kontak IR'], ['Rentang', '-40 s/d 125°C'], ['Akurasi', '±0.5°C'], ['Interface', 'I²C (SMBus)'], ['Data Field', 'suhu']].map(([k,v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-amber-600 font-medium">{k}</span>
                      <span className="text-amber-800 font-bold">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-amber-600 mt-3 leading-relaxed">Mengukur suhu permukaan tubuh hewan tanpa kontak langsung. Ideal untuk hewan berbulu tebal.</p>
              </div>

              {/* Sensor Detak Jantung & SpO2 */}
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center">
                    <HeartPulse size={16} className="text-rose-600" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-rose-800">MAX30102</p>
                    <p className="text-[10px] text-rose-600 font-semibold">Sensor Oksimetri & HR</p>
                  </div>
                </div>
                <div className="space-y-1 mt-3">
                  {[['Tipe', 'Fotopletysmografi'], ['LED', 'Merah 660nm + IR 880nm'], ['Resolusi ADC', '18-bit'], ['Interface', 'I²C'], ['Data Field', 'heart_rate, spo2']].map(([k,v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-rose-600 font-medium">{k}</span>
                      <span className="text-rose-800 font-bold">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-rose-600 mt-3 leading-relaxed">Mengukur detak jantung dan saturasi oksigen darah via pantulan cahaya pada pembuluh darah.</p>
              </div>

              {/* Sensor Gerak / IMU */}
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Radio size={16} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-violet-800">MPU6050</p>
                    <p className="text-[10px] text-violet-600 font-semibold">IMU 6-Axis (Akselerometer)</p>
                  </div>
                </div>
                <div className="space-y-1 mt-3">
                  {[['Tipe', '3-axis Gyro + Accel'], ['Rentang Accel', '±2g / ±4g / ±8g / ±16g'], ['Resolusi', '16-bit ADC'], ['Interface', 'I²C / SPI'], ['Data Field', 'ax, ay, az']].map(([k,v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-violet-600 font-medium">{k}</span>
                      <span className="text-violet-800 font-bold">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-violet-600 mt-3 leading-relaxed">Mendeteksi gerakan dan orientasi untuk menentukan tingkat aktivitas fisik hewan secara real-time.</p>
              </div>
            </div>

            {/* Mikrokontroler */}
            <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Cpu size={17} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-black text-sm text-slate-800">ESP32 — Mikrokontroler Utama</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Dual-core Xtensa LX6 · Wi-Fi 802.11 b/g/n · Bluetooth 4.2</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  ['Frekuensi Kirim', isKandang ? '5 detik' : '15 detik'],
                  ['Protokol', 'HTTPS REST → Supabase'],
                  ['Firmware', 'Arduino IDE (C++)'],
                  ['Power', 'USB 5V / LiPo 3.7V'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white rounded-xl p-2.5 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{k}</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabel Referensi Nilai Normal */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4">
              <Info size={16} className="text-indigo-500" /> Referensi Nilai Normal Vital Sign Hewan
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 rounded-xl">
                    <th className="text-left p-3 font-black text-slate-500 rounded-l-xl">Spesies</th>
                    <th className="text-center p-3 font-black text-amber-600">Suhu (°C)</th>
                    <th className="text-center p-3 font-black text-rose-600">Detak Jantung (BPM)</th>
                    <th className="text-center p-3 font-black text-sky-600 rounded-r-xl">SpO₂ (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Kucing', '38.1 – 39.2', '120 – 140', '≥ 95'],
                    ['Anjing', '37.5 – 39.2', '60 – 120', '≥ 95'],
                    ['Kelinci', '38.5 – 40.0', '120 – 150', '≥ 95'],
                    ['Hamster', '37.0 – 38.5', '250 – 500', '≥ 95'],
                    ['Marmut', '37.2 – 39.5', '150 – 250', '≥ 95'],
                  ].map(([sp, suhu, hr, spo2], idx) => {
                    const isSelected = selectedPet?.species === sp;
                    return (
                      <tr key={sp} className={`border-t border-slate-50 ${isSelected ? 'bg-indigo-50' : idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                        <td className="p-3 font-bold text-slate-700 flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />}
                          {sp}
                          {isSelected && <span className="text-[9px] bg-indigo-100 text-indigo-700 font-black px-1.5 py-0.5 rounded-full">Aktif</span>}
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-600">{suhu}</td>
                        <td className="p-3 text-center font-semibold text-slate-600">{hr}</td>
                        <td className="p-3 text-center font-semibold text-slate-600">{spo2}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">* Nilai referensi bersifat indikatif. Konsultasikan dengan dokter hewan untuk diagnosis akurat.</p>
          </div>

          {/* Device Info */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Wifi size={16} className="text-slate-400" /> Status Koneksi Perangkat
              </h3>
              {lastUpdate && (
                <span className="text-xs text-slate-400 font-semibold">
                  Update: {lastUpdate.toLocaleTimeString("id-ID")}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["Device ID", latest?.device_id ?? "—"],
                ["Mode Aktif", mode ? (isKandang ? "Kandang" : "Kalung") : "—"],
                ["Sumber Mode", modeSource === 'iot' ? "Dari ESP32" : modeSource === 'species' ? `Default (${selectedPet?.species})` : "—"],
                ["Interval Kirim", mode ? (isKandang ? "5 detik" : "15 detik") : "—"],
                ["Data Tersimpan", history.length + " rekaman"],
                ["Firmware", "esp32_iot_monitoring"],
                ["Database", "Supabase Realtime"],
                ["Status Koneksi", latest ? "🟢 Terhubung" : "🔴 Menunggu"],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k}</p>
                  <p className="font-bold text-slate-700 mt-0.5 text-xs">{v}</p>
                </div>
              ))}
            </div>
            <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold ${latest ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {latest
                ? <><Wifi size={14} /> Terhubung — Supabase Realtime aktif, data langsung dari ESP32</>
                : <><WifiOff size={14} /> Menunggu data dari ESP32. Pastikan PET_ID di firmware sudah diisi.</>
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [records, setRecords] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('petcare_tab') || 'dashboard');
  const handleTabChange = (tab) => { localStorage.setItem('petcare_tab', tab); setActiveTab(tab); };
  const [showNotif, setShowNotif] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [petLoading, setPetLoading] = useState(false);
  const notifRef = useRef(null);

  // Push notification ke device untuk pengingat jadwal
  usePushNotifications(schedules, pets);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const addNotif = useCallback(async (userId, payload) => {
    try {
      const n = await notifService.create(userId, payload);
      setNotifications(prev => [n, ...prev]);
      showToast(payload.text, payload.type);
    } catch (e) { console.error('Notif error', e); }
  }, [showToast]);

  // Auth state
  useEffect(() => {
    authService.getSession().then(s => { setSession(s); setLoading(false); });
    const { data: { subscription } } = authService.onAuthChange((_e, s) => { setSession(s); setLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  // Load all data
  useEffect(() => {
    if (!session) {
      setPets([]); setSelectedPet(null); setSchedules([]); setRecords([]); setNotifications([]); setProfile(null);
      return;
    }
    const uid = session.user.id;
    setDataLoading(true);
    Promise.all([
      profileService.get(uid).catch(() => null),
      petService.getAll(uid),
      scheduleService.getAll(uid),
      recordService.getAll(uid),
      notifService.getAll(uid),
    ]).then(([prof, pts, scheds, recs, notifs]) => {
      setProfile(prof);
      setPets(pts);
      setSelectedPet(pts[0] || null);
      setSchedules(scheds);
      setRecords(recs);
      setNotifications(notifs);
    }).catch(e => {
      console.error(e);
      showToast('Gagal memuat data dari Supabase', 'error');
    }).finally(() => setDataLoading(false));
  }, [session, showToast]);

  // Close notif panel on outside click
  useEffect(() => {
    const h = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Handlers
  const handleUpdateProfile = async (data) => {
    const updated = await profileService.update(session.user.id, data);
    setProfile(updated);
    showToast('Profil berhasil diperbarui');
  };

  const handleAddPet = async (form) => {
    setPetLoading(true);
    try {
      const newPet = await petService.create(session.user.id, form);
      setPets(prev => [...prev, newPet]);
      setSelectedPet(newPet);
      await addNotif(session.user.id, { text: `${form.name} berhasil didaftarkan!`, type: 'success', pet_id: newPet.id });
      setShowAddPet(false);
    } catch (e) { showToast('Gagal menyimpan hewan', 'error'); }
    finally { setPetLoading(false); }
  };

  const handleUpdatePet = async (petId, data) => {
    const updated = await petService.update(petId, data);
    setPets(prev => prev.map(p => p.id === petId ? updated : p));
    if (selectedPet?.id === petId) setSelectedPet(updated);
    await addNotif(session.user.id, { text: `Data ${updated.name} diperbarui`, type: 'success', pet_id: petId });
  };

  const handleDeletePet = async (petId) => {
    const pet = pets.find(p => p.id === petId);
    await petService.delete(petId);
    const remaining = pets.filter(p => p.id !== petId);
    setPets(remaining);
    if (selectedPet?.id === petId) setSelectedPet(remaining[0] || null);
    showToast(`${pet?.name} dihapus`, 'info');
  };

  const handleAddSchedule = async (form) => {
    const newS = await scheduleService.create(session.user.id, form);
    setSchedules(prev => [...prev, newS]);
    const pet = pets.find(p => p.id === form.pet_id);
    await addNotif(session.user.id, { text: `Jadwal "${form.title}" untuk ${pet?.name} ditambahkan`, type: 'success', pet_id: form.pet_id });
  };

  const handleToggleSchedule = async (id, done) => {
    const updated = await scheduleService.toggleDone(id, done);
    setSchedules(prev => prev.map(s => s.id === id ? updated : s));
    if (done) {
      await addNotif(session.user.id, { text: `"${updated.title}" selesai`, type: 'success', pet_id: updated.pet_id });
    }
  };

  const handleDeleteSchedule = async (id) => {
    await scheduleService.delete(id);
    setSchedules(prev => prev.filter(s => s.id !== id));
    showToast('Jadwal dihapus', 'info');
  };

  const handleAddRecord = async (form) => {
    const newR = await recordService.create(session.user.id, form);
    setRecords(prev => [newR, ...prev]);
    const pet = pets.find(p => p.id === form.pet_id);
    await addNotif(session.user.id, { text: `Rekam medis ${pet?.name} ditambahkan`, type: 'success', pet_id: form.pet_id });
  };

  const handleDeleteRecord = async (id) => {
    await recordService.delete(id);
    setRecords(prev => prev.filter(r => r.id !== id));
    showToast('Catatan dihapus', 'info');
  };

  const handleMarkAllRead = async () => {
    await notifService.markAllRead(session.user.id);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleClearAllNotif = async () => {
    await notifService.deleteAll(session.user.id);
    setNotifications([]);
  };

  const handleMarkOneRead = async (id) => {
    await notifService.markOneRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const handleLogout = async () => { await authService.signOut(); handleTabChange('dashboard'); };

  const handlePanggilDokter = () => {
    const query = encodeURIComponent('klinik hewan dokter hewan terdekat');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          window.open(
            `https://www.google.com/maps/search/${query}/@${latitude},${longitude},15z`,
            '_blank'
          );
        },
        () => {
          window.open(`https://www.google.com/maps/search/${query}`, '_blank');
        }
      );
    } else {
      window.open(`https://www.google.com/maps/search/${query}`, '_blank');
    }
  };

  // Render loading screen
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
          <HeartPulse size={40} className="text-white" />
        </div>
        <Loader2 size={28} className="animate-spin mx-auto mt-4 text-indigo-300" />
      </div>
    </div>
  );

  // Render auth page if not logged in
  if (!session) return <AuthPage />;

  const NAV = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'monitor',   icon: Cpu,             label: 'Monitor IoT' },
    { id: 'schedule',  icon: Calendar,         label: 'Jadwal' },
    { id: 'medical',   icon: FileText,         label: 'Rekam Medis' },
    { id: 'tips',      icon: BookOpen,         label: 'Tips' },
    { id: 'settings',  icon: Settings,         label: 'Pengaturan' },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;
  const pageTitles = { dashboard: 'Dashboard', monitor: 'Monitor IoT (ESP32)', schedule: 'Jadwal Kegiatan', medical: 'Rekam Medis', tips: 'Tips Perawatan', settings: 'Pengaturan' };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-5 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <HeartPulse size={22} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-indigo-900">PetCare<span className="text-indigo-500">+</span></h1>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map(item => (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all font-semibold ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
              <item.icon size={17} />{item.label}
            </button>
          ))}
        </nav>
        <div className="mt-4 p-4 bg-slate-900 rounded-3xl text-white">
          <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-widest">Darurat</p>
          <p className="text-xs font-bold mb-3">Butuh bantuan medis segera?</p>
          <button onClick={handlePanggilDokter} className="w-full py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2">
            <Phone size={13} /> Panggil Dokter
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-slate-800">{pageTitles[activeTab]}</h2>
            {/* Banner izin push notifikasi — ditampilkan di header agar tidak ganggu konten */}
            {'Notification' in window && Notification.permission === 'default' && (
              <button
                onClick={() => Notification.requestPermission()}
                className="hidden sm:flex items-center gap-2 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
              >
                <Bell size={12} />
                <span>Aktifkan notifikasi jadwal</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={notifRef}>
              <button onClick={() => setShowNotif(!showNotif)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center relative transition-all ${showNotif ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotif && <NotifPanel notifications={notifications} onMarkAllRead={handleMarkAllRead} onClearAll={handleClearAllNotif} onMarkOneRead={handleMarkOneRead} />}
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabChange('settings')}>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-800">{(profile?.name || session.user.email || '').split(' ')[0]}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{profile?.role || 'Basic'}</p>
              </div>
              <UserAvatar name={profile?.name || session.user.email} size="md" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {dataLoading ? <Spinner text="Memuat data dari Supabase..." /> : (
            <div className="max-w-6xl mx-auto">
              {activeTab === 'dashboard' && <Dashboard pets={pets} selectedPet={selectedPet} setSelectedPet={setSelectedPet} onAddPet={() => setShowAddPet(true)} notifications={notifications} records={records} onAlert={(payload) => addNotif(session.user.id, payload)} />}
              {activeTab === 'monitor'   && <MonitorPage pets={pets} selectedPet={selectedPet} setSelectedPet={setSelectedPet} />}
              {activeTab === 'schedule' && <SchedulePage pets={pets} schedules={schedules} onAdd={handleAddSchedule} onToggle={handleToggleSchedule} onDelete={handleDeleteSchedule} />}
              {activeTab === 'medical' && <MedicalPage pets={pets} records={records} onAdd={handleAddRecord} onDelete={handleDeleteRecord} />}
              {activeTab === 'tips' && <TipsPage selectedPet={selectedPet} records={records} />}
              {activeTab === 'settings' && <SettingsPage user={session.user} profile={profile} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} pets={pets} onUpdatePet={handleUpdatePet} onDeletePet={handleDeletePet} />}
            </div>
          )}
        </div>

        <nav className="md:hidden flex bg-white border-t border-slate-100 px-2 py-2 shrink-0">
          {NAV.map(item => (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
              <item.icon size={19} /><span className="text-[9px] font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>

      {showAddPet && <AddPetModal onClose={() => setShowAddPet(false)} onAdd={handleAddPet} loading={petLoading} />}
    </div>
  );
}

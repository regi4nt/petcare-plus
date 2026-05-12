import React, { useState, useEffect, useRef, useCallback } from 'react';
// jsPDF loaded dynamically via CDN in handleDownload
import { createPortal } from 'react-dom';
import {
  HeartPulse, LayoutDashboard, Calendar, Activity, Settings, Bell,
  Plus, Thermometer, Clock, X, CheckCircle2, LogOut, User, Edit3,
  Save, Cat, Dog, Rabbit, Bird, Mouse, Squirrel, Trash2, ChevronRight, AlertCircle,
  ToggleLeft, ToggleRight, Phone, Mail, Lock, Eye, EyeOff, Check,
  FileText, Pill, Stethoscope, Syringe, Droplets,
  UtensilsCrossed, Dumbbell, LucideStar, Info, BookOpen, Loader2,
  Cpu, Wifi, WifiOff, Radio, RefreshCw, Home, Tag, ChevronDown, PawPrint, Moon, Sun,
  Download, Smartphone, Monitor, Share2, ArrowDown, MoreHorizontal, Chrome,
  Zap, LogIn
} from 'lucide-react';
import { authService, profileService, petService, scheduleService, recordService, notifService, monitoringService, deviceCommandService } from './lib/api';
import { HibernationControlModal } from './components/HibernationControl';
import { SpeedInsights } from '@vercel/speed-insights/react';

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
const usePushNotifications = (schedules, pets, notifSettings = {}) => {
  const sentRef = useRef(new Set());

  useEffect(() => {
    if (!schedules?.length) return;

    const checkAndNotify = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      // Jika notifikasi jadwal dimatikan, skip semua
      if (notifSettings.jadwal === false) return;

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

        // ── Helper: getar perangkat (mobile) ─────────────────────────
        const vibrate = (pattern) => {
          if ('vibrate' in navigator) {
            try { navigator.vibrate(pattern); } catch (_) {}
          }
        };

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
          // Getar: pendek-pendek (perhatian)
          vibrate([150, 80, 150]);
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
          // Getar: panjang-pendek-panjang (mendesak)
          vibrate([300, 100, 300, 100, 300]);
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
    // Belum ada rekam medis — pilih satu tips secara acak berdasarkan hari + pet
    const dateKey = new Date().toISOString().split('T')[0] + (pet.id || '');
    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) hash = (hash * 31 + dateKey.charCodeAt(i)) & 0x7fffffff;
    return [speciesTips[hash % speciesTips.length]];
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
    // Seed dari tanggal + pet.id agar berbeda tiap hari dan tiap hewan, tapi stabil dalam sehari
    const dateKey = new Date().toISOString().split('T')[0] + (pet.id || '');
    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) hash = (hash * 31 + dateKey.charCodeAt(i)) & 0x7fffffff;
    smartTips.push(speciesTips[hash % speciesTips.length]);
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
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] ${colors[type]} text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3`}>
      <Icon size={16} /><span className="font-bold text-sm">{message}</span>
    </div>
  );
};

const Spinner = ({ text = 'Memuat...' }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
    <div style={{width:'32px',height:'32px',border:'3px solid transparent',borderTopColor:'#818cf8',borderRadius:'50%',animation:'spin 0.8s linear infinite',marginBottom:'12px'}} />
    <p className="text-sm font-medium">{text}</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ─── PWA INSTALL LOGIC ────────────────────────────────────────────────

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('unknown'); // 'ios' | 'android' | 'desktop' | 'installed'

  useEffect(() => {
    // Detect if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (isStandalone) { setIsInstalled(true); setPlatform('installed'); return; }

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    // Listen for Chrome/Edge install prompt
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed
    window.addEventListener('appinstalled', () => { setIsInstalled(true); setDeferredPrompt(null); });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setIsInstalled(true);
    return outcome === 'accepted';
  };

  return { deferredPrompt, isInstalled, platform, triggerInstall };
};

// ─── PWA INSTALL MODAL (new user onboarding) ──────────────────────────
const PWAInstallModal = ({ onDismiss, platform, deferredPrompt, triggerInstall }) => {
  const [step, setStep] = useState('main'); // 'main' | 'ios-steps' | 'android-steps' | 'desktop-steps'
  const [installing, setInstalling] = useState(false);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      await triggerInstall();
      setInstalling(false);
      onDismiss();
    } else {
      setStep(platform === 'ios' ? 'ios-steps' : platform === 'android' ? 'android-steps' : 'desktop-steps');
    }
  };

  const PlatformIcon = platform === 'ios' || platform === 'android' ? Smartphone : Monitor;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden">

        {step === 'main' && (
          <>
            {/* Hero */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-white/30 blur-xl" />
                <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
              </div>
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <PawPrint size={36} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Selamat Datang!</h2>
                <p className="text-indigo-200 text-sm font-medium">Instal PetCare+ untuk pengalaman terbaik</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="p-6">
              <div className="space-y-3 mb-6">
                {[
                  { icon: '⚡', title: 'Akses Lebih Cepat', desc: 'Buka langsung dari home screen tanpa browser' },
                  { icon: '🔔', title: 'Notifikasi Jadwal', desc: 'Reminder vaksin & perawatan hewan kamu' },
                  { icon: '📡', title: 'Monitor IoT Real-time', desc: 'Pantau vital sign hewan kapan saja' },
                ].map(b => (
                  <div key={b.title} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                    <span className="text-2xl w-10 text-center">{b.icon}</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{b.title}</p>
                      <p className="text-xs text-slate-500">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleNativeInstall} disabled={installing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30 text-base">
                {installing
                  ? <><Loader2 size={18} className="animate-spin" /> Menginstal...</>
                  : <><Download size={18} /> Instal Sekarang</>}
              </button>

              <button onClick={onDismiss}
                className="w-full py-3 mt-2 text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors">
                Nanti saja
              </button>
            </div>
          </>
        )}

        {step === 'ios-steps' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('main')} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                <ChevronRight size={16} className="text-slate-600 rotate-180" />
              </button>
              <h3 className="font-black text-slate-800">Instal di iPhone / iPad</h3>
            </div>
            <div className="space-y-4">
              {[
                { n: 1, icon: <Share2 size={20} className="text-blue-500" />, text: 'Tap tombol Share (kotak dengan panah atas) di bagian bawah Safari' },
                { n: 2, icon: <Plus size={20} className="text-blue-500" />, text: 'Gulir ke bawah dan tap "Add to Home Screen"' },
                { n: 3, icon: <Check size={20} className="text-blue-500" />, text: 'Tap "Add" di pojok kanan atas untuk mengkonfirmasi' },
              ].map(s => (
                <div key={s.n} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">{s.icon}</div>
                  <div className="flex-1 pt-1">
                    <span className="text-xs font-black text-blue-500 uppercase tracking-wide">Langkah {s.n}</span>
                    <p className="text-sm text-slate-700 font-medium mt-0.5">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-2xl text-xs text-blue-700 font-medium">
              💡 Pastikan kamu menggunakan browser <strong>Safari</strong> di iPhone/iPad
            </div>
            <button onClick={onDismiss} className="w-full py-3 mt-4 bg-indigo-600 text-white font-bold rounded-2xl text-sm">
              Mengerti, terima kasih!
            </button>
          </div>
        )}

        {step === 'android-steps' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('main')} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                <ChevronRight size={16} className="text-slate-600 rotate-180" />
              </button>
              <h3 className="font-black text-slate-800">Instal di Android</h3>
            </div>
            <div className="space-y-4">
              {[
                { n: 1, icon: <MoreHorizontal size={20} className="text-emerald-500" />, text: 'Tap ikon tiga titik (⋮) di pojok kanan atas Chrome' },
                { n: 2, icon: <ArrowDown size={20} className="text-emerald-500" />, text: 'Pilih "Tambahkan ke layar utama" atau "Install app"' },
                { n: 3, icon: <Check size={20} className="text-emerald-500" />, text: 'Tap "Tambahkan" untuk mengkonfirmasi instalasi' },
              ].map(s => (
                <div key={s.n} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">{s.icon}</div>
                  <div className="flex-1 pt-1">
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-wide">Langkah {s.n}</span>
                    <p className="text-sm text-slate-700 font-medium mt-0.5">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-emerald-50 rounded-2xl text-xs text-emerald-700 font-medium">
              💡 Gunakan browser <strong>Chrome</strong> atau <strong>Edge</strong> di Android untuk hasil terbaik
            </div>
            <button onClick={onDismiss} className="w-full py-3 mt-4 bg-indigo-600 text-white font-bold rounded-2xl text-sm">
              Mengerti, terima kasih!
            </button>
          </div>
        )}

        {step === 'desktop-steps' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('main')} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                <ChevronRight size={16} className="text-slate-600 rotate-180" />
              </button>
              <h3 className="font-black text-slate-800">Instal di Desktop</h3>
            </div>
            <div className="space-y-4">
              {[
                { n: 1, icon: <Download size={20} className="text-violet-500" />, text: 'Cari ikon instal (⊕) di address bar browser kamu' },
                { n: 2, icon: <Monitor size={20} className="text-violet-500" />, text: 'Klik ikon tersebut lalu pilih "Install PetCare+"' },
                { n: 3, icon: <Check size={20} className="text-violet-500" />, text: 'Klik "Install" untuk mengkonfirmasi — aplikasi akan terbuka terpisah' },
              ].map(s => (
                <div key={s.n} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">{s.icon}</div>
                  <div className="flex-1 pt-1">
                    <span className="text-xs font-black text-violet-500 uppercase tracking-wide">Langkah {s.n}</span>
                    <p className="text-sm text-slate-700 font-medium mt-0.5">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-violet-50 rounded-2xl text-xs text-violet-700 font-medium">
              💡 Didukung di <strong>Chrome</strong>, <strong>Edge</strong>, dan <strong>Opera</strong>
            </div>
            <button onClick={onDismiss} className="w-full py-3 mt-4 bg-indigo-600 text-white font-bold rounded-2xl text-sm">
              Mengerti, terima kasih!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── PWA INSTALL BUTTON (manual trigger in Settings) ──────────────────
const PWAInstallButton = ({ platform, deferredPrompt, triggerInstall, isInstalled }) => {
  const [showGuide, setShowGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 size={18} className="text-emerald-600" />
        </div>
        <div>
          <p className="font-bold text-emerald-800 text-sm">Sudah Terinstal</p>
          <p className="text-xs text-emerald-600">PetCare+ berjalan sebagai aplikasi</p>
        </div>
      </div>
    );
  }

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      await triggerInstall();
      setInstalling(false);
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button onClick={handleInstall} disabled={installing}
        className="w-full flex items-center gap-3 p-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-md shadow-indigo-500/20">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          {platform === 'ios' || platform === 'android'
            ? <Smartphone size={18} className="text-white" />
            : <Monitor size={18} className="text-white" />}
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-white text-sm">
            {installing ? 'Menginstal...' : 'Instal PetCare+'}
          </p>
          <p className="text-xs text-indigo-200">
            {platform === 'ios' ? 'Tambahkan ke Home Screen (iOS)'
              : platform === 'android' ? 'Instal di Android'
              : 'Instal di Desktop'}
          </p>
        </div>
        {installing ? <Loader2 size={16} className="text-white animate-spin" /> : <Download size={16} className="text-white" />}
      </button>

      {showGuide && (
        <PWAInstallModal
          platform={platform}
          deferredPrompt={null}
          triggerInstall={triggerInstall}
          onDismiss={() => setShowGuide(false)}
        />
      )}
    </>
  );
};

// ─── RECOVERY CHOICE PAGE ─────────────────────────────────────────────
const RecoveryChoicePage = ({ onResetPassword, onGoToDashboard }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #06081a 0%, #0d1035 40%, #0f0a2e 100%)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:'absolute', top:'-10%', right:'-5%', width:'45vw', height:'45vw', maxWidth:480, maxHeight:480, background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'-10%', left:'-5%', width:'40vw', height:'40vw', maxWidth:420, maxHeight:420, background:'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(165,180,252,0.06) 1px, transparent 1px)', backgroundSize:'32px 32px' }} />
      </div>
      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div style={{ position:'absolute', inset:'-8px', background:'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', borderRadius:28, filter:'blur(12px)' }} />
            <img src="/logo.svg" alt="PetCare+" className="relative rounded-[22px]"
              style={{ width:72, height:72, boxShadow:'0 0 0 1px rgba(165,180,252,0.15), 0 20px 40px rgba(0,0,0,0.5)' }} />
          </div>
          <h1 className="text-[32px] font-black text-white tracking-tight leading-none mb-2">
            PetCare<span style={{ color:'#818cf8' }}>+</span>
          </h1>
          <p className="text-sm font-medium" style={{ color:'rgba(165,180,252,0.6)' }}>
            Verifikasi email berhasil
          </p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:28, overflow:'hidden', boxShadow:'0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset' }}>

          {/* Header */}
          <div className="p-6 text-center" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
              style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.25)' }}>
              <CheckCircle2 size={24} style={{ color:'#34d399' }} />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Link berhasil diverifikasi</p>
            <p className="text-xs" style={{ color:'rgba(165,180,252,0.5)' }}>
              Pilih tindakan yang ingin Anda lakukan
            </p>
          </div>

          {/* Pilihan */}
          <div className="p-6 space-y-3">

            {/* Opsi 1: Ganti Password */}
            <button onClick={onResetPassword}
              className="w-full flex items-center gap-4 text-left transition-all"
              style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:16, padding:'16px 18px', cursor:'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.18)'; e.currentTarget.style.borderColor='rgba(99,102,241,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor='rgba(99,102,241,0.25)'; }}>
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ background:'rgba(99,102,241,0.2)' }}>
                <Lock size={18} style={{ color:'#818cf8' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white mb-0.5">Ganti Password</p>
                <p className="text-xs" style={{ color:'rgba(165,180,252,0.5)' }}>
                  Buat password baru untuk akun Anda
                </p>
              </div>
              <ChevronRight size={16} style={{ color:'rgba(165,180,252,0.4)', flexShrink:0 }} />
            </button>

            {/* Opsi 2: Langsung Masuk */}
            <button onClick={onGoToDashboard}
              className="w-full flex items-center gap-4 text-left transition-all"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'16px 18px', cursor:'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}>
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ background:'rgba(255,255,255,0.08)' }}>
                <LogIn size={18} style={{ color:'rgba(165,180,252,0.7)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white mb-0.5">Langsung Masuk</p>
                <p className="text-xs" style={{ color:'rgba(165,180,252,0.5)' }}>
                  Masuk ke dashboard tanpa ganti password
                </p>
              </div>
              <ChevronRight size={16} style={{ color:'rgba(165,180,252,0.4)', flexShrink:0 }} />
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

// ─── RESET PASSWORD PAGE ───────────────────────────────────────────────
const ResetPasswordPage = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok'); return; }
    setLoading(true);
    try {
      await authService.updatePassword(password);
      setSuccess('Password berhasil diubah! Anda akan diarahkan ke aplikasi...');
      setTimeout(() => onDone(), 2000);
    } catch (err) {
      setError(err.message || 'Gagal mengubah password');
    } finally { setLoading(false); }
  };

  const getStrength = () => {
    if (password.length < 6) return 0;
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) return 4;
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 3;
    if (password.length >= 8) return 2;
    return 1;
  };
  const strengthLabel = ['Terlalu pendek','Lemah','Cukup','Sedang','Kuat'];
  const strengthColor = ['rgba(255,255,255,0.1)','#ef4444','#f97316','#eab308','#22c55e'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #06081a 0%, #0d1035 40%, #0f0a2e 100%)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:'absolute', top:'-10%', right:'-5%', width:'45vw', height:'45vw', maxWidth:480, maxHeight:480, background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'-10%', left:'-5%', width:'40vw', height:'40vw', maxWidth:420, maxHeight:420, background:'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(165,180,252,0.06) 1px, transparent 1px)', backgroundSize:'32px 32px' }} />
      </div>
      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div style={{ position:'absolute', inset:'-8px', background:'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', borderRadius:28, filter:'blur(12px)' }} />
            <img src="/logo.svg" alt="PetCare+" className="relative rounded-[22px]"
              style={{ width:72, height:72, boxShadow:'0 0 0 1px rgba(165,180,252,0.15), 0 20px 40px rgba(0,0,0,0.5)' }} />
          </div>
          <h1 className="text-[32px] font-black text-white tracking-tight leading-none mb-2">
            PetCare<span style={{ color:'#818cf8' }}>+</span>
          </h1>
          <p className="text-sm font-medium" style={{ color:'rgba(165,180,252,0.6)' }}>Buat password baru Anda</p>
        </div>
        <div style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:28, overflow:'hidden', boxShadow:'0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset' }}>
          <div className="flex items-center justify-center gap-2.5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            <Lock size={15} style={{ color:'#818cf8' }} />
            <span className="text-sm font-bold text-white">Buat Password Baru</span>
          </div>
          <div className="p-7">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 text-sm px-4 py-3 rounded-2xl"
                style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.22)', color:'#fca5a5' }}>
                <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-start gap-2.5 text-sm px-4 py-3 rounded-2xl"
                style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.22)', color:'#6ee7b7' }}>
                <CheckCircle2 size={15} className="mt-0.5 shrink-0" /><span>{success}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="auth-label">Password Baru</label>
                <div className="auth-field">
                  <span className="auth-field-icon"><Lock size={16} /></span>
                  <input type={showPass ? 'text' : 'password'} required placeholder="min. 6 karakter"
                    value={password} onChange={e => setPassword(e.target.value)} className="auth-input" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="auth-input-right transition-colors"
                    style={{ color:'rgba(165,180,252,0.5)', background:'none', border:'none', cursor:'pointer' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(lvl => (
                      <div key={lvl} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: lvl <= getStrength() ? strengthColor[getStrength()] : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <p className="text-[10px]" style={{ color:'rgba(165,180,252,0.45)' }}>{strengthLabel[getStrength()]}</p>
                </div>
              )}
              <div>
                <label className="auth-label">Konfirmasi Password</label>
                <div className="auth-field" style={ confirm.length > 0 ? { borderColor: confirm === password ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)' } : {} }>
                  <span className="auth-field-icon"><Lock size={16} /></span>
                  <input type={showConfirm ? 'text' : 'password'} required placeholder="ulangi password baru"
                    value={confirm} onChange={e => setConfirm(e.target.value)} className="auth-input" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="auth-input-right transition-colors"
                    style={{ color:'rgba(165,180,252,0.5)', background:'none', border:'none', cursor:'pointer' }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-[10px] mt-1.5" style={{ color:'#fca5a5' }}>Password tidak cocok</p>
                )}
              </div>
              <button type="submit" disabled={loading || !!success}
                className="w-full flex items-center justify-center gap-2 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ marginTop:8, padding:'15px 24px', borderRadius:16, background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color:'#fff', boxShadow: loading ? 'none' : '0 8px 24px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.3)', letterSpacing:'0.01em' }}>
                {loading ? <><Loader2 size={16} className="animate-spin" />Menyimpan...</> : <><CheckCircle2 size={15} /> Simpan Password Baru</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      } else if (mode === 'register') {
        if (!form.name.trim()) { setError('Nama wajib diisi'); setLoading(false); return; }
        await authService.signUp(form.email, form.password, form.name, form.phone);
        setSuccess('Akun berhasil dibuat! Silakan login.');
        setMode('login');
        setForm(f => ({ ...f, password: '' }));
      } else if (mode === 'forgot') {
        if (!form.email.trim()) { setError('Email wajib diisi'); setLoading(false); return; }
        await authService.resetPassword(form.email);
        setSuccess('Link reset password telah dikirim ke email Anda. Cek inbox atau folder Spam.');
      }
    } catch (err) {
      const msg = err.message || 'Terjadi kesalahan';
      if (msg.includes('Invalid login')) setError('Email atau password salah');
      else if (msg.includes('already registered')) setError('Email sudah terdaftar');
      else if (msg.includes('Password should')) setError('Password minimal 6 karakter');
      else if (msg.includes('Email not confirmed')) setError('Email belum dikonfirmasi, cek inbox Anda');
      else if (msg.includes('User not found')) setError('Email tidak terdaftar');
      else setError(msg);
    } finally { setLoading(false); }
  };

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #06081a 0%, #0d1035 40%, #0f0a2e 100%)' }}>

      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:'absolute', top:'-10%', right:'-5%', width:'45vw', height:'45vw', maxWidth:480, maxHeight:480, background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'-10%', left:'-5%', width:'40vw', height:'40vw', maxWidth:420, maxHeight:420, background:'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', top:'30%', left:'30%', width:'30vw', height:'30vw', maxWidth:320, maxHeight:320, background:'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(165,180,252,0.06) 1px, transparent 1px)', backgroundSize:'32px 32px' }} />
      </div>

      <div className="w-full max-w-[400px] relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div style={{ position:'absolute', inset:'-8px', background:'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', borderRadius:28, filter:'blur(12px)' }} />
            <img src="/logo.svg" alt="PetCare+"
              className="relative rounded-[22px]"
              style={{ width:72, height:72, boxShadow:'0 0 0 1px rgba(165,180,252,0.15), 0 20px 40px rgba(0,0,0,0.5)' }} />
          </div>
          <h1 className="text-[32px] font-black text-white tracking-tight leading-none mb-2">
            PetCare<span style={{ color:'#818cf8' }}>+</span>
          </h1>
          <p className="text-sm font-medium" style={{ color:'rgba(165,180,252,0.6)' }}>
            Platform kesehatan hewan peliharaan
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:'rgba(255,255,255,0.05)',
          backdropFilter:'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
          border:'1px solid rgba(255,255,255,0.09)',
          borderRadius:28,
          overflow:'hidden',
          boxShadow:'0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset'
        }}>

          {/* Tab switcher */}
          <div className="flex" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            {[['login','Masuk'], ['register','Daftar']].map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)}
                className="flex-1 py-4 text-sm font-bold transition-all relative"
                style={{ color: mode === m ? '#fff' : 'rgba(165,180,252,0.45)' }}>
                {label}
                <span style={{
                  position:'absolute', bottom:0, left:'50%',
                  transform:`translateX(-50%) scaleX(${mode === m ? 1 : 0})`,
                  width:40, height:2,
                  background:'linear-gradient(90deg, #818cf8, #6366f1)',
                  borderRadius:99,
                  transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                  display:'block'
                }} />
              </button>
            ))}
          </div>

          {/* Form body */}
          <div className="p-7">

            {error && (
              <div className="mb-5 flex items-start gap-2.5 text-sm px-4 py-3 rounded-2xl"
                style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.22)', color:'#fca5a5' }}>
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-start gap-2.5 text-sm px-4 py-3 rounded-2xl"
                style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.22)', color:'#6ee7b7' }}>
                <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* ── FORGOT PASSWORD FORM ── */}
            {mode === 'forgot' ? (
              <div>
                <div className="mb-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
                    style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)' }}>
                    <Mail size={22} style={{ color:'#818cf8' }} />
                  </div>
                  <h2 className="text-base font-bold text-white mb-1">Reset Password</h2>
                  <p className="text-xs" style={{ color:'rgba(165,180,252,0.55)' }}>
                    Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="auth-label">Email</label>
                    <div className="auth-field">
                      <span className="auth-field-icon"><Mail size={16} /></span>
                      <input type="email" required placeholder="email@example.com" value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })} className="auth-input" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      marginTop:8, padding:'15px 24px', borderRadius:16,
                      background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color:'#fff',
                      boxShadow: loading ? 'none' : '0 8px 24px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.3)',
                      letterSpacing:'0.01em'
                    }}>
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" />Mengirim...</>
                      : <><Mail size={15} /> Kirim Link Reset</>
                    }
                  </button>
                </form>
                <p className="text-center mt-5 text-xs" style={{ color:'rgba(165,180,252,0.35)' }}>
                  Ingat password?{' '}
                  <button onClick={() => switchMode('login')}
                    className="font-bold transition-colors"
                    style={{ color:'rgba(165,180,252,0.65)' }}>
                    Masuk
                  </button>
                </p>
              </div>
            ) : (
            /* ── LOGIN / REGISTER FORM ── */
            <form onSubmit={handleSubmit} className="space-y-4">

              {mode === 'register' && (
                <>
                  <div>
                    <label className="auth-label">Nama Lengkap</label>
                    <div className="auth-field">
                      <span className="auth-field-icon"><User size={16} /></span>
                      <input type="text" required placeholder="Budi Santoso" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} className="auth-input" />
                    </div>
                  </div>
                  <div>
                    <label className="auth-label">
                      No. Telepon
                      <span className="ml-1.5 normal-case font-medium" style={{ color:'rgba(165,180,252,0.4)', letterSpacing:0 }}>opsional</span>
                    </label>
                    <div className="auth-field">
                      <span className="auth-field-icon"><Phone size={16} /></span>
                      <input type="tel" placeholder="08xxxxxxxxxx" value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })} className="auth-input" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="auth-label">Email</label>
                <div className="auth-field">
                  <span className="auth-field-icon"><Mail size={16} /></span>
                  <input type="email" required placeholder="email@example.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} className="auth-input" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="auth-label" style={{ marginBottom:0 }}>Password</label>
                  {mode === 'login' && (
                    <button type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[10px] font-semibold cursor-pointer transition-colors"
                      style={{ color:'rgba(165,180,252,0.55)', background:'none', border:'none', padding:0 }}
                      onMouseEnter={e => e.currentTarget.style.color='rgba(165,180,252,0.9)'}
                      onMouseLeave={e => e.currentTarget.style.color='rgba(165,180,252,0.55)'}>
                      Lupa password?
                    </button>
                  )}
                </div>
                <div className="auth-field">
                  <span className="auth-field-icon"><Lock size={16} /></span>
                  <input type={showPass ? 'text' : 'password'} required placeholder="min. 6 karakter"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="auth-input" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="auth-input-right transition-colors"
                    style={{ color:'rgba(165,180,252,0.5)', background:'none', border:'none', cursor:'pointer' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  marginTop:8, padding:'15px 24px', borderRadius:16,
                  background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color:'#fff',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.3)',
                  letterSpacing:'0.01em'
                }}>
                {loading
                  ? <><Loader2 size={16} className="animate-spin" />Memproses...</>
                  : mode === 'login'
                    ? <><span style={{ fontSize:14, marginRight:2 }}>→</span> Masuk ke Akun</>
                    : <><span style={{ fontSize:14, marginRight:2 }}>✦</span> Buat Akun Gratis</>
                }
              </button>
            </form>
            )}

            {mode !== 'forgot' && (
            <p className="text-center mt-5 text-xs" style={{ color:'rgba(165,180,252,0.35)' }}>
              {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="font-bold transition-colors"
                style={{ color:'rgba(165,180,252,0.65)' }}>
                {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
              </button>
            </p>
            )}
          </div>
        </div>

        <p className="text-center mt-5 flex items-center justify-center gap-1.5 text-xs"
          style={{ color:'rgba(165,180,252,0.25)' }}>
          <span>🔒</span> Data tersimpan aman &amp; terenkripsi
        </p>
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
const Dashboard = ({ pets, selectedPet, setSelectedPet, onAddPet, notifications, records, onAlert, onUpdatePet, onDeletePet, streak = 0, profile }) => {
  const [iotCalc, setIotCalc]         = useState(null);
  const [dailyHealth, setDailyHealth] = useState([]);
  const [iotLoading, setIotLoading]   = useState(false);
  const [tempUnit, setTempUnit]       = useState('C'); // 'C' | 'F' | 'K'
  const [iotHealthTip, setIotHealthTip] = useState(null); // tip override dari kondisi IoT
  const alertedScoreRef = useRef(null); // simpan skor terakhir yang sudah dinotif agar tidak spam

  // ── State Kelola Hewan ─────────────────────────────────────────────
  const [editPetId, setEditPetId]     = useState(null);
  const [petForm, setPetForm]         = useState({});
  const [petSaving, setPetSaving]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── State Tips Panel ───────────────────────────────────────────────
  const [tipsSpecies, setTipsSpecies] = useState(selectedPet?.species || 'Kucing');
  const [showTipsPanel, setShowTipsPanel] = useState(false);

  const savePetDash = async () => {
    setPetSaving(true);
    try { await onUpdatePet(editPetId, petForm); setEditPetId(null); } finally { setPetSaving(false); }
  };

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
    <div className="space-y-6">

      {/* ── Streak Card (Basic) ── */}
      {(profile?.role === 'Basic' || !profile?.role) && (() => {
        const nextMilestone = streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : streak < 60 ? 60 : streak < 100 ? 100 : null;
        const progressTarget = nextMilestone || 100;
        const progressPct = Math.min((streak / progressTarget) * 100, 100);
        const milestone = streak >= 100 ? { label: '🏆 Legenda 100 Hari!', bg: 'from-yellow-500 to-amber-400' }
          : streak >= 60 ? { label: '💎 Master 60 Hari!', bg: 'from-violet-500 to-purple-600' }
          : streak >= 30 ? { label: '🌟 30 Hari Hebat!', bg: 'from-indigo-500 to-blue-600' }
          : streak >= 14 ? { label: '⚡ 14 Hari Konsisten!', bg: 'from-teal-500 to-emerald-500' }
          : streak >= 7  ? { label: '🎯 7 Hari Pertama!', bg: 'from-orange-400 to-rose-500' }
          : null;
        const gradientBg = milestone?.bg || 'from-orange-400 to-rose-500';

        const flameSize = streak >= 30 ? 'text-4xl' : streak >= 7 ? 'text-3xl' : 'text-2xl';

        return (
          <section>
            <div className={`bg-gradient-to-br ${gradientBg} rounded-2xl p-4 shadow-md text-white`}>
              <div className="flex items-center justify-between">
                {/* Kiri: flame + angka */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center ${flameSize} leading-none select-none`}>
                    🔥
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold opacity-80 uppercase tracking-wide">Login Streak</p>
                    <p className="text-3xl font-black leading-none">{streak} <span className="text-lg font-bold opacity-90">hari</span></p>
                    {streak === 0 && <p className="text-[11px] opacity-70 mt-0.5">Login tiap hari untuk memulai!</p>}
                    {streak > 0 && streak < 7 && <p className="text-[11px] opacity-70 mt-0.5">Terus semangat! 💪</p>}
                  </div>
                </div>
                {/* Kanan: badge milestone atau target */}
                <div className="text-right flex flex-col items-end gap-1.5">
                  {milestone ? (
                    <div className="bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm">
                      {milestone.label}
                    </div>
                  ) : (
                    <div className="bg-white/20 px-3 py-1.5 rounded-xl text-[11px] font-semibold opacity-90 leading-snug text-right">
                      🎯 Target<br/>
                      <span className="text-sm font-black">{nextMilestone} hari</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {nextMilestone && (
                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-[11px] opacity-75 mb-1.5">
                    <span>Menuju {nextMilestone} hari</span>
                    <span>{streak}/{nextMilestone}</span>
                  </div>
                  <div className="bg-white/25 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-white rounded-full h-2 transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Milestone badges row */}
              <div className="flex items-center gap-1.5 mt-3">
                {[
                  { days: 7,  icon: '🎯', label: '7' },
                  { days: 14, icon: '⚡', label: '14' },
                  { days: 30, icon: '🌟', label: '30' },
                  { days: 60, icon: '💎', label: '60' },
                  { days: 100, icon: '🏆', label: '100' },
                ].map(m => (
                  <div
                    key={m.days}
                    className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      streak >= m.days
                        ? 'bg-white text-orange-500 shadow-sm'
                        : 'bg-white/20 text-white/70'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

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
              <div key={pet.id} className="shrink-0">
                <div onClick={() => { setSelectedPet(pet); if (editPetId && editPetId !== pet.id) setEditPetId(null); }}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${active ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                  <div className={`w-8 h-8 ${col.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <PetIcon size={16} className={col.text} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold leading-none ${active ? 'text-indigo-700' : 'text-slate-700'}`}>{pet.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{pet.species}</p>
                    {active && (
                      <button
                        onClick={e => { e.stopPropagation(); setEditPetId(editPetId === pet.id ? null : pet.id); setPetForm({ ...pet }); }}
                        className={`mt-1 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${editPetId === pet.id ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border-slate-200'}`}>
                        <Edit3 size={10} /> Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inline Edit Form */}
        {editPetId && (
          <div className="mt-3 bg-slate-50 rounded-[20px] border border-slate-100 p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-800 text-sm">Edit {pets.find(p => p.id === editPetId)?.name}</h4>
              <button onClick={() => setEditPetId(null)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400"><X size={15} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Nama', 'name', 'text'], ['Ras', 'breed', 'text']].map(([l, k, t]) => (
                <div key={k}><label className="label-style">{l}</label><input type={t} value={petForm[k] || ''} onChange={e => setPetForm({ ...petForm, [k]: e.target.value })} className="input-style" /></div>
              ))}
              <div>
                <label className="label-style">Usia</label>
                <input type="text" inputMode="decimal" placeholder="2 = 2th, 3,5 = 3,5mgg"
                  value={petForm.age || ''}
                  onChange={e => { const raw = e.target.value; const hasDecimal = raw.replace(',','.').includes('.'); setPetForm({ ...petForm, age: raw, age_unit: hasDecimal ? 'minggu' : 'tahun' }); }}
                  className="input-style" />
                {petForm.age != null && petForm.age !== '' && (
                  <p className="text-[10px] mt-1 font-semibold text-indigo-500">{'\u2192'} {String(petForm.age).replace(',','.')} {petForm.age_unit || 'tahun'}</p>
                )}
              </div>
              <div><label className="label-style">Berat (kg)</label><input type="number" min="0" step="0.01" value={petForm.weight || ''} onChange={e => setPetForm({ ...petForm, weight: e.target.value })} className="input-style" /></div>
              <div><label className="label-style">Gender</label><select value={petForm.gender || 'Jantan'} onChange={e => setPetForm({ ...petForm, gender: e.target.value })} className="input-style"><option>Jantan</option><option>Betina</option></select></div>
              <div><label className="label-style">Warna</label><input type="text" value={petForm.color || ''} onChange={e => setPetForm({ ...petForm, color: e.target.value })} className="input-style" /></div>
            </div>
            <div className="mt-3"><label className="label-style">Catatan</label><textarea value={petForm.notes || ''} onChange={e => setPetForm({ ...petForm, notes: e.target.value })} rows={2} className="input-style resize-none" /></div>
            <div className="mt-4 flex gap-2">
              <button onClick={savePetDash} disabled={petSaving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-60">
                {petSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan Perubahan
              </button>
              <button onClick={() => setDeleteConfirm(editPetId)} className="py-2.5 px-4 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl border border-slate-200 transition-all flex items-center gap-1.5 text-sm font-semibold">
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        )}
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
        </div>
      </div>

      {/* ── TIPS PERAWATAN SECTION ── */}
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-500" />
            <h3 className="font-black text-slate-800">Tips Perawatan</h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">Panduan</span>
          </div>
          <button
            onClick={() => setShowTipsPanel(!showTipsPanel)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
          >
            {showTipsPanel ? 'Sembunyikan' : 'Lihat Semua'}
            <ChevronDown size={13} className={`transition-transform ${showTipsPanel ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="px-6 py-4">
          {/* Species filter chips */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {Object.keys(TIPS_DB).map(s => {
              const Icon = PET_ICONS[s]; const col = PET_COLORS[s];
              return (
                <button key={s} onClick={() => setTipsSpecies(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${tipsSpecies === s ? 'bg-indigo-600 text-white shadow-md' : `${col.bg} ${col.text}`}`}>
                  <Icon size={12} />{s}
                </button>
              );
            })}
          </div>

          {/* Tips grid — tampilkan 2 atau semua */}
          {(() => {
            const tips = TIPS_DB[tipsSpecies] || TIPS_DB['Kucing'];
            const accents = [
              { border: 'border-l-indigo-400', icon: 'bg-indigo-50 text-indigo-500', badge: 'bg-indigo-50 text-indigo-600' },
              { border: 'border-l-emerald-400', icon: 'bg-emerald-50 text-emerald-500', badge: 'bg-emerald-50 text-emerald-600' },
              { border: 'border-l-amber-400',   icon: 'bg-amber-50 text-amber-500',   badge: 'bg-amber-50 text-amber-600' },
              { border: 'border-l-rose-400',    icon: 'bg-rose-50 text-rose-500',     badge: 'bg-rose-50 text-rose-600' },
              { border: 'border-l-sky-400',     icon: 'bg-sky-50 text-sky-500',       badge: 'bg-sky-50 text-sky-600' },
            ];
            const shown = showTipsPanel ? tips : tips.slice(0, 2);
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shown.map((tip, i) => {
                  const Icon = tip.icon;
                  const acc = accents[i % accents.length];
                  return (
                    <div key={i} className={`bg-white border border-slate-100 border-l-4 ${acc.border} p-4 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all flex gap-3 items-start`}>
                      <div className={`w-9 h-9 ${acc.icon} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}><Icon size={16} /></div>
                      <div>
                        <span className={`text-[9px] font-black uppercase tracking-wider ${acc.badge} px-2 py-0.5 rounded-full`}>Tips #{i + 1}</span>
                        <h4 className="font-black text-sm text-slate-800 mt-1 mb-1">{tip.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{tip.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-6 max-w-sm w-full shadow-2xl text-center">
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
  );
};

// ─── SCHEDULE PAGE ────────────────────────────────────────────────────
const RECURRENCE_OPTIONS = [
  { value: 'Sekali',    label: 'Sekali',          desc: 'Satu kali saja',         icon: '📌' },
  { value: 'Harian',   label: 'Harian',           desc: 'Ulangi 7 hari',          icon: '🔁' },
  { value: 'Mingguan', label: 'Mingguan',         desc: 'Ulangi 4 minggu',        icon: '📅' },
  { value: 'Bulanan',  label: 'Bulanan',          desc: 'Ulangi 3 bulan',         icon: '🗓️' },
];

const RECURRENCE_COLORS = {
  Harian:   'bg-sky-50 text-sky-600 border-sky-200',
  Mingguan: 'bg-violet-50 text-violet-600 border-violet-200',
  Bulanan:  'bg-amber-50 text-amber-600 border-amber-200',
};

const generateRecurrenceDates = (startDate, recurrence) => {
  const dates = [];
  const start = new Date(startDate + 'T12:00:00');
  if (recurrence === 'Harian') {
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
  } else if (recurrence === 'Mingguan') {
    for (let i = 0; i < 4; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i * 7);
      dates.push(d.toISOString().split('T')[0]);
    }
  } else if (recurrence === 'Bulanan') {
    for (let i = 0; i < 3; i++) {
      const d = new Date(start); d.setMonth(d.getMonth() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
  } else {
    dates.push(startDate);
  }
  return dates;
};

const BLANK_SCHED = (pets) => ({ pet_id: pets[0]?.id || '', type: 'Makan', title: '', date: todayStr, time: '08:00', notes: '', recurrence: 'Sekali' });

const SchedulePage = ({ pets, schedules, onAdd, onToggle, onDelete, darkMode }) => {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(BLANK_SCHED(pets));

  const resetForm = () => setForm(BLANK_SCHED(pets));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { recurrence, ...baseData } = form;
      const dates = generateRecurrenceDates(form.date, recurrence);
      for (const date of dates) {
        await onAdd({ ...baseData, date });
      }
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const filtered = (schedules || []).filter(s => {
    if (filter === 'today') return isToday(s.date);
    if (filter === 'upcoming') return s.date >= todayStr && !s.done;
    if (filter === 'done') return s.done;
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const getPet = (id) => (pets || []).find(p => p.id === id);
  const selType = SCHEDULE_TYPES.find(t => t.type === form.type) || SCHEDULE_TYPES[0];

  return (
    <div className="">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-800">Jadwal Kegiatan</h3>
          <p className="text-sm text-slate-500 mt-0.5">{(schedules || []).filter(s => isToday(s.date)).length} jadwal kegiatan hari ini</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm">
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {[['all', 'Semua'], ['today', 'Hari Ini'], ['upcoming', 'Mendatang'], ['done', 'Selesai']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filter === v ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}>{l}</button>
        ))}
      </div>

      {/* ── Schedule list ── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Calendar size={44} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Tidak ada jadwal</p>
            <p className="text-sm mt-1">Tambahkan jadwal baru untuk memulai</p>
          </div>
        )}
        {filtered.map(s => {
          const tp = SCHEDULE_TYPES.find(t => t.type === s.type) || SCHEDULE_TYPES[0];
          const SchedIcon = tp.icon;
          const pet = getPet(s.pet_id);
          return (
            <div key={s.id} className={`bg-white rounded-[24px] border p-4 flex items-center gap-4 hover:shadow-md transition-all group ${s.done ? 'border-slate-100 opacity-60' : isToday(s.date) ? 'border-indigo-200 shadow-sm' : 'border-slate-100'}`}>
              <div className={`${tp.bg} w-11 h-11 rounded-2xl flex items-center justify-center shrink-0`}>
                <SchedIcon size={18} className={tp.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-bold text-slate-800 text-sm ${s.done ? 'line-through text-slate-400' : ''}`}>{s.title}</p>
                  {isToday(s.date) && !s.done && <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Hari Ini</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {pet && <span className="text-xs text-slate-500 font-medium">{pet.name}</span>}
                  <span className="text-[10px] text-slate-400">{formatDate(s.date)} · {s.time}</span>
                </div>
                {s.notes && <p className="text-[11px] text-slate-400 mt-1 italic truncate">{s.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onToggle(s.id, !s.done)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${s.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'}`}>
                  <Check size={14} />
                </button>
                <button onClick={() => onDelete(s.id)} className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal Tambah Jadwal ── */}
      {showForm && createPortal(
        <div data-dark={darkMode ? "true" : undefined}>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-7 pt-7 pb-6 rounded-t-[32px] relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
              <div className="absolute right-8 bottom-0 w-14 h-14 bg-white/10 rounded-full" />
              <div className="flex justify-between items-start relative">
                <div>
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Jadwal Baru</p>
                  <h3 className="text-2xl font-black text-white">Tambah Jadwal</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"><X size={18} /></button>
              </div>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 p-7">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-style">Hewan</label>
                  <select value={form.pet_id} onChange={e => setForm({ ...form, pet_id: e.target.value })} className="input-style">
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="label-style">Jenis Kegiatan</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-style">
                    {SCHEDULE_TYPES.map(t => <option key={t.type}>{t.type}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label-style">Nama Kegiatan</label>
                <input required type="text" placeholder="Contoh: Makan pagi, Vaksin rabies..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-style" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-style">Tanggal Mulai</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-style" />
                </div>
                <div><label className="label-style">Jam</label>
                  <input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="input-style" />
                </div>
              </div>
              <div>
                <label className="label-style">Perulangan</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {RECURRENCE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setForm({ ...form, recurrence: opt.value })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${form.recurrence === opt.value ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                      <span className="text-base leading-none">{opt.icon}</span>
                      <div><p className="text-xs font-bold">{opt.label}</p><p className="text-[10px] opacity-60">{opt.desc}</p></div>
                    </button>
                  ))}
                </div>
                {form.recurrence !== 'Sekali' && (
                  <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium mt-2 ${RECURRENCE_COLORS[form.recurrence]}`}>
                    <RefreshCw size={12} />
                    Akan membuat {generateRecurrenceDates(form.date, form.recurrence).length} jadwal otomatis mulai {formatDate(form.date)}
                  </div>
                )}
              </div>
              <div><label className="label-style">Catatan <span className="text-slate-400 font-normal normal-case">(opsional)</span></label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Tambahkan catatan tambahan..." className="input-style resize-none" />
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                <div className={`w-9 h-9 ${selType.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <selType.icon size={16} className={selType.color} />
                </div>
                <div><p className="font-bold text-slate-700 text-sm">{form.title || 'Nama Kegiatan'}</p>
                  <p className="text-xs text-slate-500">{form.type} · {form.date || 'Pilih tanggal'} · {form.time || '--:--'}</p>
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={17} className="animate-spin" />Menyimpan...</> : <>Simpan Jadwal{form.recurrence !== 'Sekali' ? ` (${generateRecurrenceDates(form.date, form.recurrence).length}x)` : ''}</>}
              </button>
            </form>
          </div>
        </div>
        </div>
      , document.body)}
    </div>
  );
};


// ─── MEDICAL PAGE ─────────────────────────────────────────────────────
const MEDICAL_TYPE_META = {
  Pemeriksaan: { color: 'text-blue-600',   bg: 'bg-blue-50',   badge: 'bg-blue-50 text-blue-700' },
  Vaksinasi:   { color: 'text-violet-600', bg: 'bg-violet-50', badge: 'bg-violet-50 text-violet-700' },
  Pengobatan:  { color: 'text-amber-600',  bg: 'bg-amber-50',  badge: 'bg-amber-50 text-amber-700' },
  Operasi:     { color: 'text-rose-600',   bg: 'bg-rose-50',   badge: 'bg-rose-50 text-rose-700' },
  Grooming:    { color: 'text-emerald-600',bg: 'bg-emerald-50',badge: 'bg-emerald-50 text-emerald-700' },
};

const BLANK_RECORD = (pets) => ({ pet_id: pets[0]?.id || '', date: todayStr, type: 'Pemeriksaan', title: '', doctor: '', clinic: '', weight: '', temp: '', notes: '', next_visit: '' });

const MedicalPage = ({ pets, records, onAdd, onDelete, darkMode }) => {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [filterPet, setFilterPet] = useState('all');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK_RECORD(pets));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onAdd(form);
      setShowForm(false);
      setForm(BLANK_RECORD(pets));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await onDelete(id);
    setDeleteConfirmId(null);
    setSelected(null);
  };

  const filtered = (records || [])
    .filter(r => filterPet === 'all' || r.pet_id === filterPet)
    .sort((a, b) => b.date.localeCompare(a.date));

  const getPet = (id) => (pets || []).find(p => p.id === id);

  return (
    <div className="">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-800">Rekam Medis</h3>
          <p className="text-sm text-slate-500 mt-0.5">{(records || []).length} catatan tersimpan</p>
        </div>
        <button onClick={() => { setForm(BLANK_RECORD(pets)); setShowForm(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm">
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* ── Filter ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => setFilterPet('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filterPet === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}>
          Semua
        </button>
        {pets.map(p => (
          <button key={p.id} onClick={() => setFilterPet(p.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filterPet === p.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}>
            {p.name}
          </button>
        ))}
      </div>

      {/* ── Record list ── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText size={44} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Belum ada rekam medis</p>
            <p className="text-sm mt-1">Tambahkan catatan medis pertama</p>
          </div>
        )}
        {filtered.map(r => {
          const pet = getPet(r.pet_id);
          const meta = MEDICAL_TYPE_META[r.type] || { color: 'text-slate-600', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-600' };
          return (
            <div key={r.id} onClick={() => setSelected(r)}
              className="bg-white rounded-[24px] border border-slate-100 p-4 cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all group">
              <div className="flex items-start gap-3">
                <div className={`${meta.bg} w-11 h-11 rounded-2xl flex items-center justify-center shrink-0`}>
                  <Stethoscope size={18} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 text-sm">{r.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>{r.type}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {pet && <span className="text-xs text-slate-500 font-medium">{pet.name}</span>}
                    <span className="text-[10px] text-slate-400">{formatDate(r.date)}</span>
                    {r.doctor && <span className="text-[10px] text-slate-400">· {r.doctor}</span>}
                  </div>
                  {r.notes && <p className="text-[11px] text-slate-400 mt-1 italic truncate">{r.notes}</p>}
                  {r.next_visit && (
                    <p className={`text-[11px] font-semibold mt-1.5 ${r.next_visit < todayStr ? 'text-rose-500' : 'text-emerald-600'}`}>
                      Kontrol berikut: {formatDate(r.next_visit)}
                    </p>
                  )}
                </div>
                <ChevronRight size={15} className="text-slate-300 shrink-0 mt-1 group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal Detail ── */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-white w-full max-w-md rounded-[32px] p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(MEDICAL_TYPE_META[selected.type] || {}).badge || 'bg-slate-100 text-slate-600'}`}>{selected.type}</span>
                </div>
                <h3 className="text-xl font-black text-slate-800 leading-tight">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all shrink-0 ml-3"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              {/* Info kunjungan */}
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Informasi Kunjungan</p>
                {[['Tanggal', formatDate(selected.date)], ['Dokter', selected.doctor || '—'], ['Klinik', selected.clinic || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{k}</span>
                    <span className="text-xs font-bold text-slate-800">{v}</span>
                  </div>
                ))}
              </div>

              {/* Vital */}
              {(selected.weight || selected.temp) && (
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Data Vital</p>
                  {selected.weight && <div className="flex justify-between items-center"><span className="text-xs text-slate-500">Berat Badan</span><span className="text-xs font-bold text-slate-800">{selected.weight} kg</span></div>}
                  {selected.temp && <div className="flex justify-between items-center"><span className="text-xs text-slate-500">Suhu Tubuh</span><span className="text-xs font-bold text-slate-800">{selected.temp}°C</span></div>}
                </div>
              )}

              {/* Catatan */}
              {selected.notes && (
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Catatan</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{selected.notes}</p>
                </div>
              )}

              {/* Kunjungan berikut */}
              {selected.next_visit && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${selected.next_visit < todayStr ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                  <Calendar size={16} className={selected.next_visit < todayStr ? 'text-rose-500' : 'text-emerald-500'} />
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${selected.next_visit < todayStr ? 'text-rose-400' : 'text-emerald-500'}`}>
                      {selected.next_visit < todayStr ? 'Kontrol Terlewat' : 'Jadwal Kontrol'}
                    </p>
                    <p className={`text-sm font-bold ${selected.next_visit < todayStr ? 'text-rose-700' : 'text-emerald-700'}`}>{formatDate(selected.next_visit)}</p>
                  </div>
                </div>
              )}

              <button onClick={() => setDeleteConfirmId(selected.id)}
                className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center justify-center gap-2 mt-2">
                <Trash2 size={14} /> Hapus Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Hapus ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-7 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-rose-500" />
            </div>
            <h4 className="font-black text-slate-800 text-lg mb-2">Hapus Catatan?</h4>
            <p className="text-sm text-slate-500 mb-6">Data rekam medis ini akan dihapus permanen dan tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Batal</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-3.5 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600 transition-all">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Form Tambah ── */}
      {showForm && createPortal(
        <div data-dark={darkMode ? "true" : undefined}>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-7 pt-7 pb-6 rounded-t-[32px] relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
              <div className="absolute right-8 bottom-0 w-14 h-14 bg-white/10 rounded-full" />
              <div className="flex justify-between items-start relative">
                <div>
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Rekam Medis</p>
                  <h3 className="text-2xl font-black text-white">Catatan Medis Baru</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"><X size={18} /></button>
              </div>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 p-7">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-style">Hewan</label>
                  <select value={form.pet_id} onChange={e => setForm({ ...form, pet_id: e.target.value })} className="input-style">
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="label-style">Jenis Prosedur</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-style">
                    {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label-style">Judul / Nama Prosedur</label>
                <input required type="text" placeholder="Contoh: Vaksin rabies, Operasi steril..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-style" />
              </div>
              <div><label className="label-style">Tanggal</label>
                <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-style" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-style">Nama Dokter</label>
                  <input type="text" placeholder="drh. ..." value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} className="input-style" />
                </div>
                <div><label className="label-style">Nama Klinik</label>
                  <input type="text" placeholder="Klinik Hewan..." value={form.clinic} onChange={e => setForm({ ...form, clinic: e.target.value })} className="input-style" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-style">Berat (kg) <span className="normal-case font-normal">(opsional)</span></label>
                  <input type="number" step="0.01" placeholder="0.0" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="input-style" />
                </div>
                <div><label className="label-style">Suhu (°C) <span className="normal-case font-normal">(opsional)</span></label>
                  <input type="number" step="0.1" placeholder="38.5" value={form.temp} onChange={e => setForm({ ...form, temp: e.target.value })} className="input-style" />
                </div>
              </div>
              <div><label className="label-style">Catatan <span className="text-slate-400 font-normal normal-case">(opsional)</span></label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Hasil pemeriksaan, obat yang diberikan, dll..." className="input-style resize-none" />
              </div>
              <div><label className="label-style">Kunjungan Berikutnya <span className="text-slate-400 font-normal normal-case">(opsional)</span></label>
                <input type="date" value={form.next_visit} onChange={e => setForm({ ...form, next_visit: e.target.value })} className="input-style" />
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                <div className={`w-9 h-9 ${(MEDICAL_TYPE_META[form.type] || {}).bg || 'bg-slate-50'} rounded-xl flex items-center justify-center shrink-0`}>
                  <Stethoscope size={16} className={(MEDICAL_TYPE_META[form.type] || {}).color || 'text-slate-500'} />
                </div>
                <div><p className="font-bold text-slate-700 text-sm">{form.title || 'Nama Prosedur'}</p>
                  <p className="text-xs text-slate-500">{form.type} · {form.date || 'Pilih tanggal'}{form.doctor ? ` · ${form.doctor}` : ''}</p>
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={17} className="animate-spin" />Menyimpan...</> : 'Simpan Catatan'}
              </button>
            </form>
          </div>
        </div>
        </div>
      , document.body)}
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
    <div className="">
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
const SettingsPage = ({ user, profile, onUpdateProfile, onLogout, pets, onUpdatePet, onDeletePet, darkMode, onToggleDark, notifSettings, onSaveNotifSettings, pwaInstall, schedules, records }) => {
  const [section, setSection] = useState('profile');
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: profile?.name || '', phone: profile?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [openTutorial, setOpenTutorial] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('json');
  const [downloadSelection, setDownloadSelection] = useState({ pets: true, schedules: true, records: true, profile: true });
  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [downloadQuickRange, setDownloadQuickRange] = useState('all');
  const [downloadCustomStart, setDownloadCustomStart] = useState('');
  const [downloadCustomEnd, setDownloadCustomEnd] = useState('');
  const [revealWa, setRevealWa] = useState(false);
  const [revealEmail, setRevealEmail] = useState(false);
  const [pushPermission, setPushPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const saveProfile = async () => {
    setSaving(true);
    try { await onUpdateProfile(profileForm); setEditProfile(false); } finally { setSaving(false); }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPushPermission(result);
  };

  // ── Download Data Helpers ──────────────────────────────────────────

  // Hitung rentang tanggal berdasarkan pilihan cepat atau kustom
  const getDateRange = () => {
    const now = new Date();
    if (downloadQuickRange === 'custom') {
      return {
        start: downloadCustomStart ? new Date(downloadCustomStart + 'T00:00:00') : null,
        end:   downloadCustomEnd   ? new Date(downloadCustomEnd   + 'T23:59:59') : null,
        label: downloadCustomStart && downloadCustomEnd
          ? `${downloadCustomStart} s/d ${downloadCustomEnd}`
          : downloadCustomStart ? `Sejak ${downloadCustomStart}`
          : downloadCustomEnd   ? `Hingga ${downloadCustomEnd}`
          : 'Semua Data',
      };
    }
    if (downloadQuickRange === '30d') {
      const start = new Date(now); start.setDate(start.getDate() - 30); start.setHours(0,0,0,0);
      return { start, end: now, label: '30 Hari Terakhir' };
    }
    if (downloadQuickRange === '3m') {
      const start = new Date(now); start.setMonth(start.getMonth() - 3); start.setHours(0,0,0,0);
      return { start, end: now, label: '3 Bulan Terakhir' };
    }
    if (downloadQuickRange === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: now, label: `Tahun ${now.getFullYear()}` };
    }
    return { start: null, end: null, label: 'Semua Data' };
  };

  const filterByDate = (items, dateField) => {
    const { start, end } = getDateRange();
    if (!start && !end) return items;
    return (items || []).filter(item => {
      const d = item[dateField] ? new Date(item[dateField]) : null;
      if (!d) return true;
      if (start && d < start) return false;
      if (end   && d > end)   return false;
      return true;
    });
  };

  const buildExportData = () => {
    const data = {};
    const { label: rangeLabel } = getDateRange();
    if (downloadSelection.profile) {
      data.profil_pengguna = {
        nama: profile?.name || '-',
        email: user?.email || '-',
        telepon: profile?.phone || '-',
        role: profile?.role || 'Basic',
        rentang_data: rangeLabel,
        tanggal_ekspor: new Date().toLocaleString('id-ID'),
      };
    }
    if (downloadSelection.pets) {
      data.daftar_hewan = (pets || []).map(p => ({
        id: p.id,
        nama: p.name,
        spesies: p.species,
        ras: p.breed || '-',
        usia: p.age != null ? `${p.age} ${p.age_unit || 'tahun'}` : '-',
        berat_kg: p.weight || '-',
        gender: p.gender || '-',
        device_id: p.device_id || '-',
        catatan: p.notes || '-',
      }));
    }
    if (downloadSelection.schedules) {
      const filtered = filterByDate(schedules, 'date');
      data.jadwal_kegiatan = filtered.map(s => {
        const petName = (pets || []).find(p => p.id === s.pet_id)?.name || '-';
        return {
          id: s.id,
          hewan: petName,
          judul: s.title,
          jenis: s.type,
          tanggal: s.date,
          waktu: s.time,
          pengulangan: s.repeat || 'none',
          selesai: s.done ? 'Ya' : 'Tidak',
          catatan: s.notes || '-',
        };
      });
    }
    if (downloadSelection.records) {
      const filtered = filterByDate(records, 'date');
      data.rekam_medis = filtered.map(r => {
        const petName = (pets || []).find(p => p.id === r.pet_id)?.name || '-';
        return {
          id: r.id,
          hewan: petName,
          judul: r.title,
          jenis: r.type,
          tanggal: r.date,
          berat_saat_itu_kg: r.weight || '-',
          deskripsi: r.description || '-',
          dokter: r.vet_name || '-',
          klinik: r.clinic || '-',
          kunjungan_berikutnya: r.next_visit || '-',
          obat: r.medication || '-',
        };
      });
    }
    return data;
  };

  // Helper: escape a single CSV cell value
  const escapeCSVCell = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('\n') || str.includes('"') || str !== str.trim()) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const toCSV = (rows, label) => {
    if (!rows || rows.length === 0) return '';
    const keys = Object.keys(rows[0]);
    const header = keys.map(escapeCSVCell).join(',');
    const body = rows.map(row =>
      keys.map(k => escapeCSVCell(row[k])).join(',')
    ).join('\n');
    return `"=== ${label} ===",\n${header}\n${body}\n\n`;
  };

  const handleDownload = () => {
    setDownloading(true);
    setDownloadDone(false);
    setTimeout(() => {
      try {
        const data = buildExportData();
        const ts = new Date().toISOString().slice(0, 10);
        const rangeSuffix = downloadQuickRange !== 'all' ? `-${downloadQuickRange}` : '';
        if (downloadFormat === 'json') {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `petcare-data-${ts}${rangeSuffix}.json`;
          a.click();
          URL.revokeObjectURL(url);
          setDownloadDone(true);
        } else if (downloadFormat === 'pdf') {
          // Load jsPDF from CDN dynamically
          const loadJsPDF = () => new Promise((resolve, reject) => {
            if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => resolve(window.jspdf.jsPDF);
            script.onerror = reject;
            document.head.appendChild(script);
          });
          loadJsPDF().then(jsPDF => {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = doc.internal.pageSize.getWidth();
            const margin = 14;
            const colW = pageW - margin * 2;
            let y = 0;

            const checkPage = (needed = 10) => {
              if (y + needed > 275) { doc.addPage(); y = 20; }
            };

            // Header
            doc.setFillColor(99, 102, 241);
            doc.rect(0, 0, pageW, 28, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text('PetCare+', margin, 13);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Laporan Data Hewan Peliharaan', margin, 20);
            const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
            doc.text(`Dicetak: ${nowStr}`, pageW - margin, 20, { align: 'right' });
            doc.text(`Rentang: ${getDateRange().label}`, pageW - margin, 14, { align: 'right' });

            y = 36;
            doc.setTextColor(30, 30, 30);

            const sectionTitle = (title) => {
              checkPage(14);
              doc.setFillColor(238, 239, 255);
              doc.roundedRect(margin, y, colW, 9, 2, 2, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.setTextColor(79, 70, 229);
              doc.text(title, margin + 3, y + 6.2);
              doc.setTextColor(30, 30, 30);
              y += 12;
            };

            const labelValue = (label, value) => {
              checkPage(7);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(8.5);
              doc.text(`${label}:`, margin, y);
              doc.setFont('helvetica', 'normal');
              const val = String(value ?? '-');
              const lines = doc.splitTextToSize(val, colW - 35);
              doc.text(lines, margin + 35, y);
              y += lines.length * 5.5 + 1;
            };

            const tableSection = (rows, columns, title) => {
              if (!rows || rows.length === 0) return;
              sectionTitle(title);
              const cellPad = 2.5;
              const cw = colW / columns.length;
              checkPage(10);
              doc.setFillColor(224, 225, 255);
              doc.rect(margin, y, colW, 8, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(8);
              doc.setTextColor(55, 48, 163);
              columns.forEach((col, i) => {
                doc.text(col.label, margin + i * cw + cellPad, y + 5.5);
              });
              doc.setTextColor(30, 30, 30);
              y += 8;
              rows.forEach((row, ri) => {
                const rowVals = columns.map(col => String(row[col.key] ?? '-'));
                const lineCount = Math.max(...rowVals.map(v => doc.splitTextToSize(v, cw - cellPad * 2).length));
                const rowH = lineCount * 5 + 4;
                checkPage(rowH + 2);
                if (ri % 2 === 0) { doc.setFillColor(248, 248, 255); doc.rect(margin, y, colW, rowH, 'F'); }
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                rowVals.forEach((val, i) => {
                  const lines = doc.splitTextToSize(val, cw - cellPad * 2);
                  doc.text(lines, margin + i * cw + cellPad, y + 5);
                });
                doc.setDrawColor(220, 220, 240);
                doc.line(margin, y + rowH, margin + colW, y + rowH);
                y += rowH;
              });
              y += 6;
            };

            if (data.profil_pengguna) {
              sectionTitle('Profil Pengguna');
              Object.entries(data.profil_pengguna).forEach(([k, v]) => labelValue(k, v));
              y += 4;
            }
            if (data.daftar_hewan && data.daftar_hewan.length > 0) {
              tableSection(data.daftar_hewan, [
                { label: 'Nama', key: 'nama' }, { label: 'Jenis', key: 'jenis' },
                { label: 'Ras', key: 'ras' }, { label: 'Tgl Lahir', key: 'tanggal_lahir' },
                { label: 'Berat (kg)', key: 'berat_kg' },
              ], 'Daftar Hewan Peliharaan');
            }
            if (data.jadwal_kegiatan && data.jadwal_kegiatan.length > 0) {
              tableSection(data.jadwal_kegiatan, [
                { label: 'Pet ID', key: 'pet_id' }, { label: 'Kegiatan', key: 'jenis_kegiatan' },
                { label: 'Jadwal', key: 'jadwal_waktu' }, { label: 'Status', key: 'status' },
                { label: 'Catatan', key: 'catatan' },
              ], 'Jadwal Kegiatan');
            }
            if (data.rekam_medis && data.rekam_medis.length > 0) {
              tableSection(data.rekam_medis, [
                { label: 'Pet ID', key: 'pet_id' }, { label: 'Jenis', key: 'jenis_rekaman' },
                { label: 'Tanggal', key: 'tanggal_rekaman' }, { label: 'Diagnosis', key: 'diagnosis' },
                { label: 'Catatan', key: 'catatan' },
              ], 'Rekam Medis');
            }

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
              doc.setPage(i);
              doc.setFontSize(7.5);
              doc.setTextColor(160, 160, 180);
              doc.text('PetCare+ — Laporan otomatis', margin, 290);
              doc.text(`Halaman ${i} dari ${pageCount}`, pageW - margin, 290, { align: 'right' });
            }

            doc.save(`petcare-laporan-${ts}${rangeSuffix}.pdf`);
            setDownloadDone(true);
            setDownloading(false);
          }).catch(() => {
            alert('Gagal memuat library PDF. Pastikan koneksi internet aktif.');
            setDownloading(false);
          });
          return;
        } else {
          // Export XLSX dengan styling penuh menggunakan ExcelJS
          const loadExcelJS = () => new Promise((resolve, reject) => {
            if (window.ExcelJS) { resolve(window.ExcelJS); return; }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
            script.onload = () => resolve(window.ExcelJS);
            script.onerror = reject;
            document.head.appendChild(script);
          });

          loadExcelJS().then(async (ExcelJS) => {
            const rangeLabel = getDateRange().label;
            const exportDate = new Date().toLocaleString('id-ID');
            const wb = new ExcelJS.Workbook();
            wb.creator = 'PetCare+';
            wb.created = new Date();

            // warna tema
            const C = {
              indigo:      'FF4F46E5', indigoLight: 'FFEDE9FE', indigoDark: 'FF3730A3',
              white:       'FFFFFFFF', slate50:     'FFF8FAFC', slate100:   'FFF1F5F9',
              slate200:    'FFE2E8F0', slate600:    'FF475569', slate800:   'FF1E293B',
              green:       'FF16A34A', greenLight:  'FFdcfce7',
              purple:      'FF7C3AED', purpleLight: 'FFF5F3FF',
              orange:      'FFEA580C', orangeLight: 'FFFFF7ED',
            };

            const hdrStyle = (bgArgb) => ({
              font:      { bold: true, color: { argb: C.white }, size: 10, name: 'Calibri' },
              fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } },
              alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
              border: {
                top:    { style: 'thin',   color: { argb: 'FF6366F1' } },
                bottom: { style: 'medium', color: { argb: C.indigoDark } },
                left:   { style: 'thin',   color: { argb: 'FF6366F1' } },
                right:  { style: 'thin',   color: { argb: 'FF6366F1' } },
              },
            });

            const rowStyle = (even, stripeBg) => ({
              font:      { size: 9.5, name: 'Calibri', color: { argb: C.slate800 } },
              fill:      even
                ? { type: 'pattern', pattern: 'solid', fgColor: { argb: stripeBg } }
                : { type: 'pattern', pattern: 'solid', fgColor: { argb: C.white } },
              alignment: { vertical: 'middle', wrapText: true },
              border: {
                top:    { style: 'hair', color: { argb: C.slate200 } },
                bottom: { style: 'hair', color: { argb: C.slate200 } },
                left:   { style: 'thin', color: { argb: C.slate200 } },
                right:  { style: 'thin', color: { argb: C.slate200 } },
              },
            });

            const addTableSheet = (sheetName, rows, colDefs, accentBg, stripeBg) => {
              if (!rows || rows.length === 0) return;
              const ws = wb.addWorksheet(sheetName, {
                views: [{ state: 'frozen', ySplit: 1 }],
                properties: { tabColor: { argb: accentBg } },
              });
              ws.columns = colDefs.map(c => ({
                header: c.label, key: c.key,
                width: Math.max(c.label.length + 4, c.width || 20),
              }));
              const headerRow = ws.getRow(1);
              headerRow.height = 24;
              headerRow.eachCell(cell => { Object.assign(cell, hdrStyle(accentBg)); });
              rows.forEach((rowData, ri) => {
                const r = ws.addRow(colDefs.map(c => rowData[c.key] ?? ''));
                r.height = 18;
                const style = rowStyle(ri % 2 === 0, stripeBg);
                r.eachCell({ includeEmpty: true }, cell => { Object.assign(cell, style); });
              });
              ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colDefs.length } };
            };

            // Sheet 1: Ringkasan
            const wsInfo = wb.addWorksheet('Ringkasan', { properties: { tabColor: { argb: C.indigo } } });
            wsInfo.columns = [{ width: 30 }, { width: 45 }];

            wsInfo.mergeCells('A1:B1');
            const titleCell = wsInfo.getCell('A1');
            titleCell.value = 'PetCare+ — Laporan Ekspor Data';
            titleCell.font  = { bold: true, size: 15, name: 'Calibri', color: { argb: C.white } };
            titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.indigo } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            wsInfo.getRow(1).height = 34;

            wsInfo.addRow([]);

            const addInfoRow = (label, value, bold, bgArgb) => {
              const r = wsInfo.addRow([label, String(value ?? '')]);
              r.height = 20;
              r.getCell(1).font      = { bold: true, size: 10, name: 'Calibri', color: { argb: C.slate600 } };
              r.getCell(2).font      = { bold: !!bold, size: 10, name: 'Calibri', color: { argb: C.slate800 } };
              r.getCell(1).alignment = { vertical: 'middle' };
              r.getCell(2).alignment = { vertical: 'middle' };
              if (bgArgb) {
                r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
                r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
              }
            };

            addInfoRow('Tanggal Export', exportDate, true, C.slate50);
            addInfoRow('Rentang Data',   rangeLabel,  true, C.slate50);
            wsInfo.addRow([]);

            if (data.profil_pengguna) {
              wsInfo.mergeCells('A' + wsInfo.rowCount + ':B' + wsInfo.rowCount);
              const ph = wsInfo.addRow(['Profil Pengguna']);
              ph.height = 22;
              ph.getCell(1).font      = { bold: true, size: 11, name: 'Calibri', color: { argb: C.white } };
              ph.getCell(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.purple } };
              ph.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
              Object.entries(data.profil_pengguna).forEach(([k, v], i) => {
                addInfoRow(k, v, false, i % 2 === 0 ? C.purpleLight : C.white);
              });
            }

            // Sheet 2: Daftar Hewan
            addTableSheet('Daftar Hewan', data.daftar_hewan, [
              { label: 'Nama',          key: 'nama',          width: 20 },
              { label: 'Jenis',         key: 'jenis',         width: 16 },
              { label: 'Ras',           key: 'ras',           width: 20 },
              { label: 'Tanggal Lahir', key: 'tanggal_lahir', width: 18 },
              { label: 'Berat (kg)',    key: 'berat_kg',      width: 14 },
              { label: 'Catatan',       key: 'catatan',       width: 30 },
            ], C.green, C.greenLight);

            // Sheet 3: Jadwal Kegiatan
            addTableSheet('Jadwal Kegiatan', data.jadwal_kegiatan, [
              { label: 'Pet ID',         key: 'pet_id',         width: 14 },
              { label: 'Jenis Kegiatan', key: 'jenis_kegiatan', width: 22 },
              { label: 'Jadwal Waktu',   key: 'jadwal_waktu',   width: 22 },
              { label: 'Status',         key: 'status',         width: 16 },
              { label: 'Catatan',        key: 'catatan',        width: 30 },
            ], C.indigo, C.indigoLight);

            // Sheet 4: Rekam Medis
            addTableSheet('Rekam Medis', data.rekam_medis, [
              { label: 'Pet ID',    key: 'pet_id',          width: 14 },
              { label: 'Jenis',     key: 'jenis_rekaman',   width: 20 },
              { label: 'Tanggal',   key: 'tanggal_rekaman', width: 18 },
              { label: 'Diagnosis', key: 'diagnosis',       width: 26 },
              { label: 'Catatan',   key: 'catatan',         width: 30 },
            ], C.orange, C.orangeLight);

            // Tulis file
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `petcare-data-${ts}${rangeSuffix}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            setDownloadDone(true);
          }).catch((err) => {
            console.error(err);
            alert('Gagal memuat library Excel. Pastikan koneksi internet aktif.');
          });
        }
      } finally {
        setDownloading(false);
      }
    }, 600);
  };

  const toggleDownloadSel = (key) => {
    setDownloadSelection(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const countSelected = Object.values(downloadSelection).filter(Boolean).length;

  const toggleNotif = (key) => {
    onSaveNotifSettings({ ...notifSettings, [key]: !notifSettings[key] });
  };

  const NOTIF_ITEMS = [
    { key: 'jadwal',    title: 'Pengingat Jadwal',       desc: 'Push notif & in-app saat jadwal hampir tiba', icon: Calendar },
    { key: 'kesehatan', title: 'Pemantauan Kesehatan',    desc: 'Alert skor IoT buruk dan kondisi darurat',    icon: HeartPulse },
    { key: 'vaksinasi', title: 'Vaksinasi & Kontrol',     desc: 'Pengingat jadwal vaksin dari rekam medis',    icon: Syringe },
    { key: 'tips',      title: 'Tips Harian',             desc: 'Tips perawatan harian berdasarkan hewan',     icon: BookOpen },
  ];

  const sections = [
    { id: 'profile',       label: 'Edit Profil',        icon: User },
    { id: 'notifications', label: 'Notifikasi',          icon: Bell },
    { id: 'download',      label: 'Download Data',       icon: Download },
    { id: 'bantuan',       label: 'Bantuan & Dukungan',  icon: Phone },
    { id: 'app',           label: 'Tentang',             icon: Info },
  ];

  const pushStatusInfo = {
    granted:     { label: 'Aktif', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    denied:      { label: 'Diblokir', cls: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
    default:     { label: 'Belum diizinkan', cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
    unsupported: { label: 'Tidak didukung', cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  };
  const psi = pushStatusInfo[pushPermission] || pushStatusInfo.unsupported;

  return (
    <div className="">
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

        <div className="lg:col-span-3 space-y-4">

          {/* ── PROFIL ── */}
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

          {/* ── NOTIFIKASI ── */}
          {section === 'notifications' && (
            <div className="space-y-4">
              {/* Browser Push Permission Card */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                    <Bell size={18} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-slate-800 text-sm">Notifikasi Push (Browser)</h4>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${psi.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${psi.dot}`} />
                        {psi.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Izin untuk kirim notifikasi ke perangkat</p>
                  </div>
                </div>
                {pushPermission === 'default' && (
                  <button onClick={requestPushPermission}
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2">
                    <Bell size={15} /> Izinkan Notifikasi Push
                  </button>
                )}
                {pushPermission === 'denied' && (
                  <div className="p-4 bg-rose-50 rounded-2xl text-sm text-rose-700 font-medium">
                    Notifikasi diblokir oleh browser. Buka <strong>Pengaturan browser → Situs → Notifikasi</strong> untuk mengaktifkan kembali.
                  </div>
                )}
                {pushPermission === 'granted' && (
                  <div className="p-4 bg-emerald-50 rounded-2xl text-sm text-emerald-700 font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" /> Notifikasi push aktif — pengingat jadwal akan dikirim otomatis.
                  </div>
                )}
              </div>

              {/* Per-type Toggle Settings */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-1">Jenis Notifikasi</h4>
                <p className="text-xs text-slate-500 mb-5">Pilih jenis notifikasi yang ingin diterima. Perubahan langsung tersimpan.</p>
                <div className="space-y-3">
                  {NOTIF_ITEMS.map(({ key, title, desc, icon: NIcon }) => (
                    <div key={key} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${notifSettings[key] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        <NIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                      <button onClick={() => toggleNotif(key)} className="transition-colors shrink-0">
                        {notifSettings[key]
                          ? <ToggleRight size={34} className="text-indigo-600" />
                          : <ToggleLeft size={34} className="text-slate-300" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-4 text-center">Pengaturan disimpan otomatis di perangkat ini</p>
              </div>
            </div>
          )}



          {/* ── BANTUAN & DUKUNGAN ── */}
          {section === 'bantuan' && (
            <div className="space-y-4">

              {/* Kontak Customer Service */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Hubungi Kami</h4>
                    <p className="text-xs text-slate-500">Tim kami siap membantu Anda</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {/* WhatsApp */}
                  {revealWa ? (
                    <a href="https://wa.me/6285257363635" target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                          <Phone size={16} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-emerald-800 text-sm">WhatsApp / Telepon</p>
                          <p className="text-sm text-emerald-700 font-mono">0852-5736-3635</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-emerald-500 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <button onClick={() => setRevealWa(true)}
                      className="w-full flex items-center justify-between gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all group text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                          <Phone size={16} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-emerald-800 text-sm">WhatsApp / Telepon</p>
                          <p className="text-sm text-emerald-600 tracking-widest">••••••••••••</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg shrink-0">Tampilkan</span>
                    </button>
                  )}
                  {/* Email */}
                  {revealEmail ? (
                    <a href="mailto:regiant2012@gmail.com"
                      className="flex items-center justify-between gap-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                          <Mail size={16} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-indigo-800 text-sm">Email</p>
                          <p className="text-sm text-indigo-700 break-all">regiant2012@gmail.com</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-indigo-500 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <button onClick={() => setRevealEmail(true)}
                      className="w-full flex items-center justify-between gap-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all group text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                          <Mail size={16} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-indigo-800 text-sm">Email</p>
                          <p className="text-sm text-indigo-600 tracking-widest">••••••••••••••••</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-lg shrink-0">Tampilkan</span>
                    </button>
                  )}
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded-2xl">
                  <p className="text-xs text-slate-500 text-center font-medium">⏰ Jam layanan: Senin – Sabtu, 08.00 – 17.00 WIB</p>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertCircle size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Kendala Umum & Solusi</h4>
                    <p className="text-xs text-slate-500">Tap untuk melihat solusi</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      q: 'Tidak bisa login / lupa password',
                      a: 'Klik "Lupa Password" di halaman login, lalu masukkan email yang terdaftar. Cek inbox email Anda untuk tautan reset password. Jika tidak muncul, cek folder Spam/Junk.'
                    },
                    {
                      q: 'Data hewan tidak tersimpan',
                      a: 'Pastikan koneksi internet stabil saat menyimpan. Jika masalah berlanjut, coba refresh halaman (tekan F5 atau tarik layar ke bawah di mobile), lalu ulangi. Pastikan semua kolom wajib (bintang *) sudah diisi.'
                    },
                    {
                      q: 'Notifikasi jadwal tidak muncul',
                      a: 'Buka Pengaturan → Notifikasi → pastikan izin Push sudah "Aktif". Di mobile, pastikan notifikasi browser tidak diblokir di pengaturan HP. Untuk PWA, instal aplikasi terlebih dahulu agar notifikasi lebih andal.'
                    },
                    {
                      q: 'Monitor IoT tidak menampilkan data sensor',
                      a: 'Pastikan perangkat ESP32 menyala dan terhubung ke WiFi. Cek apakah device_id di pengaturan hewan sudah sesuai dengan ID perangkat IoT. Tekan tombol Refresh (ikon panah melingkar) di halaman Monitor untuk menarik data terbaru.'
                    },
                    {
                      q: 'Tombol "Hibernasi" tidak berfungsi',
                      a: 'Pastikan hewan sudah dipilih dan perangkat IoT terhubung. Fitur hibernasi mengirim perintah ke ESP32 melalui database — ESP32 harus dalam kondisi aktif dan terhubung internet agar perintah dapat diterima.'
                    },
                    {
                      q: 'Halaman lambat atau tidak termuat',
                      a: 'Coba bersihkan cache browser: tekan Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac). Di mobile, buka pengaturan browser dan hapus cache situs. Pastikan koneksi internet stabil.'
                    },
                    {
                      q: 'Tidak bisa instal aplikasi (PWA)',
                      a: 'Di Android: buka di Chrome, tap ikon ⋮ pojok kanan atas → "Tambahkan ke layar utama". Di iPhone: buka di Safari, tap ikon Share → "Tambahkan ke Layar Utama". Browser selain Safari di iOS tidak mendukung PWA.'
                    },
                  ].map((item, i) => (
                    <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-semibold text-slate-700 pr-3">{item.q}</span>
                        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4 bg-amber-50 border-t border-amber-100">
                          <p className="text-sm text-slate-600 leading-relaxed pt-3">{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tutorial */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-violet-50 rounded-2xl flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-violet-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Tutorial Penggunaan</h4>
                    <p className="text-xs text-slate-500">Panduan lengkap fitur PetCare+</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      title: '🐾 Menambahkan Hewan Peliharaan',
                      steps: [
                        'Buka halaman Dashboard',
                        'Klik tombol "+ Tambah Hewan" di pojok kanan atas',
                        'Isi formulir: nama, spesies, ras, usia, berat, dan gender',
                        'Klik "Daftarkan Sekarang" — hewan langsung tersimpan',
                        'Hewan baru otomatis muncul di daftar dan bisa dipilih',
                      ]
                    },
                    {
                      title: '📅 Membuat Jadwal Kegiatan',
                      steps: [
                        'Buka menu "Jadwal Kegiatan" di navigasi',
                        'Klik tombol "+ Tambah" di pojok kanan atas',
                        'Pilih hewan, jenis kegiatan (Makan/Vaksinasi/Olahraga/dll)',
                        'Isi nama kegiatan, tanggal, dan jam',
                        'Atur pengulangan jika kegiatan rutin (harian/mingguan/bulanan)',
                        'Jadwal muncul di daftar dan akan mengirim notifikasi otomatis',
                      ]
                    },
                    {
                      title: '🏥 Mencatat Rekam Medis',
                      steps: [
                        'Buka menu "Rekam Medis" di navigasi',
                        'Klik "+ Tambah Catatan"',
                        'Pilih hewan dan jenis catatan (Pemeriksaan/Vaksinasi/Operasi/dll)',
                        'Isi judul, tanggal, dan deskripsi pemeriksaan',
                        'Tambahkan berat badan saat itu dan tanggal kunjungan berikutnya',
                        'Rekam medis tersimpan dan Smart Tips di Dashboard akan menyesuaikan',
                      ]
                    },
                    {
                      title: '📡 Memantau IoT (Monitor)',
                      steps: [
                        'Pastikan perangkat ESP32 sudah terpasang dan menyala',
                        'Buka menu "Monitor" di navigasi',
                        'Pilih hewan yang terhubung ke perangkat IoT',
                        'Data suhu, detak jantung, dan saturasi O₂ tampil real-time',
                        'Tekan Refresh untuk memuat data terbaru',
                        'Gunakan tombol "Hibernasi" untuk menghemat daya sensor saat tidak diperlukan',
                      ]
                    },
                    {
                      title: '🔔 Mengatur Notifikasi',
                      steps: [
                        'Buka Pengaturan → Notifikasi',
                        'Klik "Izinkan Notifikasi Push" jika belum diizinkan',
                        'Aktifkan/matikan jenis notifikasi sesuai kebutuhan',
                        'Pengingat jadwal akan dikirim 15 menit sebelum dan tepat saat jadwal tiba',
                        'Untuk pengalaman terbaik, instal PetCare+ sebagai aplikasi (PWA)',
                      ]
                    },
                    {
                      title: '📱 Instal sebagai Aplikasi (PWA)',
                      steps: [
                        'Di Android (Chrome): tap ikon ⋮ → "Tambahkan ke layar utama"',
                        'Di iPhone (Safari): tap ikon Share → "Tambahkan ke Layar Utama"',
                        'Di Desktop (Chrome/Edge): klik ikon ⊕ di address bar',
                        'Setelah terinstal, buka PetCare+ langsung dari ikon di layar utama',
                        'Aplikasi berjalan tanpa URL bar dan mendukung notifikasi lebih andal',
                      ]
                    },
                  ].map((tut, i) => (
                    <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setOpenTutorial(openTutorial === i ? null : i)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-semibold text-slate-700">{tut.title}</span>
                        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${openTutorial === i ? 'rotate-180' : ''}`} />
                      </button>
                      {openTutorial === i && (
                        <div className="px-4 pb-4 bg-violet-50 border-t border-violet-100">
                          <ol className="mt-3 space-y-2">
                            {tut.steps.map((step, si) => (
                              <li key={si} className="flex items-start gap-3">
                                <span className="w-5 h-5 bg-violet-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0 mt-0.5">{si + 1}</span>
                                <span className="text-sm text-slate-600 leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── DOWNLOAD DATA ── */}
          {section === 'download' && (
            <div className="space-y-4">

              {/* Header Card */}
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[28px] p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Download size={22} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg">Download Data Saya</h4>
                    <p className="text-indigo-100 text-xs">Ekspor seluruh data hewan & kesehatan</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    { label: `${(pets||[]).length} Hewan`, icon: PawPrint },
                    { label: `${(schedules||[]).length} Jadwal`, icon: Calendar },
                    { label: `${(records||[]).length} Rekam Medis`, icon: FileText },
                  ].map(({ label, icon: Icon }) => (
                    <span key={label} className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold">
                      <Icon size={12} />{label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pilih Data */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-1">Pilih Data yang Diunduh</h4>
                <p className="text-xs text-slate-500 mb-5">Centang kategori data yang ingin disertakan dalam file ekspor.</p>
                <div className="space-y-3">
                  {[
                    { key: 'profile',   label: 'Profil Pengguna',    desc: 'Nama, email, telepon, dan role akun',                    icon: User,      color: 'indigo' },
                    { key: 'pets',      label: 'Data Hewan Peliharaan', desc: `${(pets||[]).length} hewan: spesies, ras, usia, berat, gender`, icon: PawPrint,  color: 'amber'  },
                    { key: 'schedules', label: 'Jadwal Kegiatan',     desc: `${(schedules||[]).length} jadwal: makan, vaksinasi, olahraga, dll`, icon: Calendar,  color: 'emerald'},
                    { key: 'records',   label: 'Rekam Medis',         desc: `${(records||[]).length} catatan: pemeriksaan, vaksinasi, operasi`, icon: FileText,  color: 'rose'   },
                  ].map(({ key, label, desc, icon: Icon, color }) => {
                    const active = downloadSelection[key];
                    const colorMap = {
                      indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600', check: 'bg-indigo-600 border-indigo-600', ring: 'ring-indigo-100' },
                      amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600',   check: 'bg-amber-500 border-amber-500',   ring: 'ring-amber-100'  },
                      emerald:{ bg: 'bg-emerald-50',icon: 'bg-emerald-100 text-emerald-600',check: 'bg-emerald-600 border-emerald-600',ring: 'ring-emerald-100'},
                      rose:   { bg: 'bg-rose-50',   icon: 'bg-rose-100 text-rose-600',     check: 'bg-rose-500 border-rose-500',     ring: 'ring-rose-100'   },
                    };
                    const c = colorMap[color];
                    return (
                      <button key={key} onClick={() => toggleDownloadSel(key)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${active ? `${c.bg} border-current ring-2 ${c.ring}` : 'bg-slate-50 border-transparent'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${active ? `${c.check} text-white` : 'border-slate-300 bg-white'}`}>
                          {active && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── FILTER RENTANG TANGGAL ── */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={15} className="text-indigo-500" />
                  <h4 className="font-bold text-slate-800">Filter Rentang Tanggal</h4>
                </div>
                <p className="text-xs text-slate-500 mb-4">Batasi data jadwal &amp; rekam medis berdasarkan periode waktu.</p>

                {/* Opsi Cepat */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { key: 'all',    label: '📂 Semua Data',        desc: 'Tanpa batas waktu' },
                    { key: '30d',    label: '📅 30 Hari Terakhir',  desc: `Sejak ${(() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toLocaleDateString('id-ID',{day:'numeric',month:'short'}); })()}` },
                    { key: '3m',     label: '🗓️ 3 Bulan Terakhir', desc: `Sejak ${(() => { const d = new Date(); d.setMonth(d.getMonth()-3); return d.toLocaleDateString('id-ID',{day:'numeric',month:'short'}); })()}` },
                    { key: 'year',   label: `📆 Tahun ${new Date().getFullYear()}`, desc: `1 Jan – Hari ini` },
                  ].map(({ key, label, desc }) => (
                    <button key={key} onClick={() => setDownloadQuickRange(key)}
                      className={`flex flex-col items-start p-3.5 rounded-2xl border-2 text-left transition-all ${downloadQuickRange === key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}>
                      <p className={`text-xs font-black leading-snug ${downloadQuickRange === key ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</p>
                      <p className={`text-[10px] mt-0.5 ${downloadQuickRange === key ? 'text-indigo-500' : 'text-slate-400'}`}>{desc}</p>
                    </button>
                  ))}
                </div>

                {/* Rentang Kustom */}
                <button onClick={() => setDownloadQuickRange('custom')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl border-2 mb-3 transition-all ${downloadQuickRange === 'custom' ? 'border-violet-500 bg-violet-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${downloadQuickRange === 'custom' ? 'bg-violet-100 text-violet-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Edit3 size={13} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`text-xs font-black ${downloadQuickRange === 'custom' ? 'text-violet-700' : 'text-slate-600'}`}>✏️ Rentang Kustom</p>
                    <p className={`text-[10px] ${downloadQuickRange === 'custom' ? 'text-violet-500' : 'text-slate-400'}`}>Pilih tanggal mulai &amp; akhir sendiri</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${downloadQuickRange === 'custom' ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`}>
                    {downloadQuickRange === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>

                {/* Input kustom — hanya muncul saat mode custom */}
                {downloadQuickRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dari Tanggal</label>
                      <input type="date" value={downloadCustomStart} onChange={e => setDownloadCustomStart(e.target.value)}
                        max={downloadCustomEnd || undefined}
                        className="w-full px-3 py-2.5 text-xs font-semibold border-2 border-slate-200 rounded-xl focus:border-violet-400 focus:outline-none bg-slate-50 text-slate-700 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sampai Tanggal</label>
                      <input type="date" value={downloadCustomEnd} onChange={e => setDownloadCustomEnd(e.target.value)}
                        min={downloadCustomStart || undefined}
                        className="w-full px-3 py-2.5 text-xs font-semibold border-2 border-slate-200 rounded-xl focus:border-violet-400 focus:outline-none bg-slate-50 text-slate-700 transition-colors" />
                    </div>
                  </div>
                )}

                {/* Badge ringkasan rentang yang dipilih */}
                {downloadQuickRange !== 'all' && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <Clock size={12} className="text-indigo-500 shrink-0" />
                    <p className="text-xs font-semibold text-indigo-700">
                      {(() => {
                        const { label: rl } = getDateRange();
                        const sched = filterByDate(schedules, 'date').length;
                        const recs  = filterByDate(records, 'date').length;
                        return `${rl} · ${sched} jadwal, ${recs} rekam medis`;
                      })()}
                    </p>
                  </div>
                )}
              </div>

              {/* Format */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-1">Format File</h4>
                <p className="text-xs text-slate-500 mb-4">Pilih format yang sesuai kebutuhan Anda.</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { fmt: 'json', label: 'JSON', desc: 'Lengkap & terstruktur', icon: FileText, tip: 'Cocok untuk backup data atau developer' },
                    { fmt: 'csv',  label: 'XLSX', desc: 'Excel dengan desain tabel', icon: Activity, tip: 'Tabel berwarna, multi-sheet, siap dibuka di Excel/Sheets' },
                    { fmt: 'pdf',  label: 'PDF',  desc: 'Laporan siap cetak',     icon: FileText, tip: 'Cocok untuk laporan & arsip dokumen' },
                  ].map(({ fmt, label, desc, icon: FIcon, tip }) => (
                    <button key={fmt} onClick={() => setDownloadFormat(fmt)}
                      className={`flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all ${downloadFormat === fmt ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${downloadFormat === fmt ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                        <FIcon size={16} />
                      </div>
                      <p className={`font-black text-sm ${downloadFormat === fmt ? 'text-indigo-700' : 'text-slate-700'}`}>.{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">{tip}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Download Button */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{countSelected} kategori dipilih</p>
                    <p className="text-xs text-slate-500">Format: .{downloadFormat === 'csv' ? 'XLSX' : downloadFormat.toUpperCase()} · {getDateRange().label}</p>
                  </div>
                  {downloadDone && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={13} /> Berhasil diunduh
                    </span>
                  )}
                </div>
                <button
                  onClick={handleDownload}
                  disabled={downloading || countSelected === 0}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-indigo-200"
                >
                  {downloading
                    ? <><Loader2 size={16} className="animate-spin" /> Menyiapkan data...</>
                    : <><Download size={16} /> Unduh Data Sekarang</>
                  }
                </button>
                {countSelected === 0 && (
                  <p className="text-xs text-center text-rose-500 mt-3 font-medium">Pilih minimal satu kategori data terlebih dahulu.</p>
                )}
                <p className="text-[10px] text-slate-400 text-center mt-3 leading-relaxed">
                  Data diunduh langsung ke perangkat Anda. Tidak ada data yang dikirim ke server pihak ketiga.
                </p>
              </div>

              {/* Info */}
              <div className="bg-amber-50 border border-amber-100 rounded-[28px] p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800 text-sm mb-1">Informasi Privasi</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      File yang diunduh berisi data pribadi hewan dan kesehatan Anda. Simpan file ini dengan aman dan jangan bagikan kepada pihak yang tidak dipercaya.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── TENTANG ── */}
          {section === 'app' && (
            <div className="space-y-4">
              {pwaInstall && (
                <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-1">Instal Aplikasi</h4>
                  <p className="text-xs text-slate-500 mb-4">Tambahkan PetCare+ ke layar utama untuk akses lebih cepat.</p>
                  <PWAInstallButton {...pwaInstall} />
                </div>
              )}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Tentang Aplikasi</h4>
              {[['Versi', '2.0.0'], ['Framework', 'React 18'], ['Database', 'Supabase PostgreSQL'], ['Auth', 'Supabase Auth'], ['Hosting', 'Vercel']].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-500">{k}</span><span className="text-sm font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
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
    <div className="fixed right-4 top-[68px] w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50">
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
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-7 pt-7 pb-6 rounded-t-[32px] relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute right-8 bottom-0 w-14 h-14 bg-white/10 rounded-full" />
          <div className="flex justify-between items-start relative">
            <div>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Daftarkan Hewan</p>
              <h3 className="text-2xl font-black text-white">Tambah Anabul</h3>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"><X size={18} /></button>
          </div>
        </div>
        <form onSubmit={e => { e.preventDefault(); onAdd(form); }} className="space-y-4 p-7">
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
const MonitorPage = ({ pets, selectedPet, setSelectedPet, darkMode = false }) => {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [showHibernationModal, setShowHibernationModal] = useState(false);

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
    <div className="space-y-6">

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
              <p className={`font-black text-lg ${isKandang ? "text-amber-700" : "text-indigo-700"}`}>
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
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full">
              <Radio size={11} /> LIVE
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHibernationModal(true)}
              disabled={!selectedPet?.id}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-sm"
            >
              <Zap size={13} />
              <span className="hidden sm:inline">Hibernasi</span>
            </button>
            <button onClick={() => fetchData(selectedPet?.id)} disabled={loading}
              className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 border border-slate-200 shadow-sm transition-all shrink-0">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
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
                    ['Kucing',        '38.1 – 39.2', '120 – 140', '≥ 95'],
                    ['Anjing',        '37.5 – 39.2', '60 – 120',  '≥ 95'],
                    ['Kelinci',       '38.5 – 40.0', '120 – 150', '≥ 95'],
                    ['Hamster',       '37.0 – 38.5', '250 – 500', '≥ 95'],
                    ['Marmut',        '37.2 – 39.5', '150 – 250', '≥ 95'],
                    ['Ferret',        '37.8 – 40.0', '180 – 250', '≥ 95'],
                    ['Sugar Glider',  '36.0 – 37.5', '200 – 300', '≥ 95'],
                    ['Landak Mini',   '36.0 – 38.0', '100 – 300', '≥ 95'],
                  ].map(([sp, suhu, hr, spo2], idx) => {
                    const isSelected = selectedPet?.species === sp;
                    return (
                      <tr key={sp} className={`transition-colors ${isSelected ? 'bg-indigo-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-100'}`}>
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

        </>
      )}

      {/* ── Hibernation Control Modal ──────────────────────────────── */}
      <HibernationControlModal
        isOpen={showHibernationModal}
        onClose={() => setShowHibernationModal(false)}
        petId={selectedPet?.id}
        deviceId={selectedPet?.device_id || 'esp32-01'}
        petName={selectedPet?.name}
        darkMode={darkMode}
        onSuccess={() => {
          // Opsional: bisa tambahkan toast atau refresh data di sini
        }}
      />

    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
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
  const [streak, setStreak] = useState(0);
  const notifRef = useRef(null);

  // ── Dark mode ─────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('petcare_dark') === 'true');
  const toggleDark = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('petcare_dark', String(next));
      return next;
    });
  }, []);

  // ── PWA Install ───────────────────────────────────────────────────────
  const { deferredPrompt, isInstalled, platform, triggerInstall } = usePWAInstall();
  const [showPWAModal, setShowPWAModal] = useState(false);

  // ── Notification settings (App level so hook + Dashboard can read them) ─
  const NOTIF_DEFAULTS = { jadwal: true, kesehatan: true, tips: true, vaksinasi: true };
  const [notifSettings, setNotifSettings] = useState(() => {
    try { return { ...NOTIF_DEFAULTS, ...JSON.parse(localStorage.getItem('petcare_notif') || '{}') }; }
    catch { return NOTIF_DEFAULTS; }
  });
  const saveNotifSettings = useCallback((updated) => {
    setNotifSettings(updated);
    localStorage.setItem('petcare_notif', JSON.stringify(updated));
  }, []);

  // Push notification ke device untuk pengingat jadwal
  usePushNotifications(schedules, pets, notifSettings);

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
    // Cek URL hash dulu — Supabase reset password mengirim #type=recovery di URL
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const urlType = hashParams.get('type');

    // Gunakan local variable agar closure onAuthChange bisa baca nilai terbaru
    // (React state tidak bisa dibaca secara real-time di dalam closure)
    let recoveryDetected = urlType === 'recovery';

    if (recoveryDetected) {
      setIsRecovery(true);
      setShowChoice(true);
    }

    // Subscribe dulu sebelum getSession supaya PASSWORD_RECOVERY event tidak terlewat
    const { data: { subscription } } = authService.onAuthChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryDetected = true;
        setIsRecovery(true);
        setShowChoice(true);
        setSession(s);
        setLoading(false);
      } else if (event === 'SIGNED_IN') {
        setSession(s);
        if (!recoveryDetected) {
          // Bukan dari recovery flow — login normal
          setIsRecovery(false);
          setShowChoice(false);
        }
        setLoading(false);
      } else {
        if (!recoveryDetected) {
          setIsRecovery(false);
          setShowChoice(false);
        }
        setSession(s);
        setLoading(false);
      }
    });

    // Baca session yang sudah ada (non-recovery flow)
    if (!recoveryDetected) {
      authService.getSession().then(s => { setSession(s); setLoading(false); });
    }

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load all data
  useEffect(() => {
    if (!session) {
      setPets([]); setSelectedPet(null); setSchedules([]); setRecords([]); setNotifications([]); setProfile(null); setStreak(0);
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
      setStreak(prof?.login_streak || 0);
      setPets(pts);
      setSelectedPet(pts[0] || null);
      setSchedules(scheds);
      setRecords(recs);
      setNotifications(notifs);
      // Show PWA install modal for new users
      if (!isInstalled && !localStorage.getItem('petcare_pwa_dismissed')) {
        const isNewUser = !prof || (prof.login_streak || 0) <= 1;
        if (isNewUser) setTimeout(() => setShowPWAModal(true), 1500);
      }
      // Update streak harian (hanya Basic)
      if (prof?.role === 'Basic' || !prof?.role) {
        profileService.updateStreak(uid)
          .then(res => { if (res.changed) setStreak(res.streak); })
          .catch(() => {});
      }
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
      const { age_unit, ...petData } = form; // strip age_unit — not a DB column
      const newPet = await petService.create(session.user.id, petData);
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

  // Saat loading, kembalikan null — HTML splash di index.html sudah menangani tampilan awal.
  // Begitu root terisi (React mulai render), HTML splash otomatis fade-out.
  if (loading) return null;

  // Render auth page if not logged in
  if (showChoice && session) return (
    <RecoveryChoicePage
      onResetPassword={() => setShowChoice(false)}
      onGoToDashboard={() => {
        window.history.replaceState(null, '', window.location.pathname);
        setIsRecovery(false);
        setShowChoice(false);
      }}
    />
  );
  if (isRecovery && session) return <ResetPasswordPage onDone={() => {
    window.history.replaceState(null, '', window.location.pathname);
    setIsRecovery(false);
    setShowChoice(false);
  }} />;
  if (!session) return <AuthPage />;

  const NAV = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard',       mobileLabel: 'Dashboard' },
    { id: 'monitor',   icon: Cpu,             label: 'Monitor IoT',     mobileLabel: 'Monitor' },
    { id: 'schedule',  icon: Calendar,         label: 'Jadwal Kegiatan', mobileLabel: 'Kegiatan' },
    { id: 'medical',   icon: FileText,         label: 'Rekam Medis',     mobileLabel: 'Rekam Medis' },
    { id: 'settings',  icon: Settings,         label: 'Pengaturan',      mobileLabel: 'Pengaturan' },
  ];
  // Nav khusus mobile — tanpa Pengaturan (akses via avatar/header)
  const MOBILE_NAV = NAV.filter(n => n.id !== 'settings');

  const unreadCount = notifications.filter(n => n.unread).length;
  const pageTitles = { dashboard: 'Dashboard', monitor: 'Monitor IoT', schedule: 'Jadwal Kegiatan', medical: 'Rekam Medis', settings: 'Pengaturan' };



  return (
    <div data-dark={darkMode ? "true" : undefined} className={"flex bg-slate-50 text-slate-900 overflow-hidden"} style={{height: '100dvh'}}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* PWA Install Modal */}
      {showPWAModal && (
        <PWAInstallModal
          platform={platform}
          deferredPrompt={deferredPrompt}
          triggerInstall={triggerInstall}
          onDismiss={() => {
            setShowPWAModal(false);
            localStorage.setItem('petcare_pwa_dismissed', 'true');
          }}
        />
      )}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-5 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.svg" alt="PetCare+" className="w-10 h-10 rounded-xl shadow-md shadow-indigo-200" />
          <span className="text-lg font-black text-slate-800">PetCare<span className="text-indigo-500">+</span></span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map(item => (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all font-semibold ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
              <item.icon size={17} />{item.label}
            </button>
          ))}
        </nav>
        {/* PWA Install Prompt (sidebar) */}
        {!isInstalled && (
          <button onClick={() => setShowPWAModal(true)}
            className="mx-0 mb-3 w-full flex items-center gap-2.5 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-2xl transition-all group">
            <div className="w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Download size={13} className="text-white" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-bold text-indigo-700 leading-tight">Instal Aplikasi</p>
              <p className="text-[10px] text-indigo-500 leading-tight">Akses lebih cepat</p>
            </div>
          </button>
        )}
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
        <header className="h-16 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Mobile: logo + app name; Desktop: page title only */}
            <div className="flex md:hidden items-center gap-2">
              <img src="/logo.svg" alt="PetCare+" className="w-8 h-8 rounded-xl shadow-sm shadow-indigo-200" />
              <span className="text-base font-black text-slate-800">PetCare<span className="text-indigo-500">+</span></span>
            </div>
            <h2 className="hidden md:block text-lg font-black text-slate-800">{pageTitles[activeTab]}</h2>
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
            {/* Dark mode toggle — di samping notif */}
            <button onClick={toggleDark}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${darkMode ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              title={darkMode ? 'Mode Terang' : 'Mode Gelap'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
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
              {activeTab === 'dashboard' && <Dashboard pets={pets} selectedPet={selectedPet} setSelectedPet={setSelectedPet} onAddPet={() => setShowAddPet(true)} notifications={notifications} records={records} onAlert={(payload) => { if (payload.source === 'iot-health' && !notifSettings.kesehatan) return; addNotif(session.user.id, payload); }} onUpdatePet={handleUpdatePet} onDeletePet={handleDeletePet} streak={streak} profile={profile} />}
              {activeTab === 'monitor'   && <MonitorPage pets={pets} selectedPet={selectedPet} setSelectedPet={setSelectedPet} darkMode={darkMode} />}
              {activeTab === 'schedule' && <SchedulePage pets={pets} schedules={schedules} onAdd={handleAddSchedule} onToggle={handleToggleSchedule} onDelete={handleDeleteSchedule} darkMode={darkMode} />}
              {activeTab === 'medical' && <MedicalPage pets={pets} records={records} onAdd={handleAddRecord} onDelete={handleDeleteRecord} darkMode={darkMode} />}
              {activeTab === 'settings' && <SettingsPage user={session.user} profile={profile} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} pets={pets} onUpdatePet={handleUpdatePet} onDeletePet={handleDeletePet} darkMode={darkMode} onToggleDark={toggleDark} notifSettings={notifSettings} onSaveNotifSettings={saveNotifSettings} pwaInstall={{ platform, deferredPrompt, triggerInstall, isInstalled }} schedules={schedules} records={records} />}
            </div>
          )}
        </div>

        <nav className="md:hidden relative flex bg-white border-t border-slate-100 px-1 pt-1 pb-2 shrink-0" style={{paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))'}}>
          {/* Split nav: 2 item kiri - spacer FAB - 2 item kanan */}
          {MOBILE_NAV.slice(0, 2).map(item => (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`flex-1 flex items-center justify-center py-2 rounded-xl transition-all ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
              <item.icon size={21} />
            </button>
          ))}
          {/* Spacer tengah untuk FAB */}
          <div className="w-16 shrink-0" />
          {MOBILE_NAV.slice(2).map(item => (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`flex-1 flex items-center justify-center py-2 rounded-xl transition-all ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
              <item.icon size={21} />
            </button>
          ))}
          {/* FAB Darurat — melayang di atas navbar, tidak overlap dengan tombol nav */}
          <button onClick={handlePanggilDokter}
            className="absolute left-1/2 -translate-x-1/2 -top-7 flex items-center justify-center active:scale-95 transition-transform z-10">
            <div className="w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-xl shadow-rose-400/60 ring-4 ring-white">
              <Phone size={22} className="text-white" />
            </div>
          </button>
        </nav>
      </main>

      {showAddPet && <AddPetModal onClose={() => setShowAddPet(false)} onAdd={handleAddPet} loading={petLoading} />}
      <SpeedInsights />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  HeartPulse, LayoutDashboard, Calendar, Activity, Settings, Bell,
  Plus, Thermometer, Clock, X, CheckCircle2, LogOut, User, Edit3,
  Save, Cat, Dog, Rabbit, Bird, Trash2, ChevronRight, AlertCircle,
  Moon, Sun, Globe, Shield, Smartphone, Camera, FileText, Pill,
  Stethoscope, Syringe, Weight, Droplets, UtensilsCrossed, Dumbbell,
  LucideStar, Info, BookOpen, ToggleLeft, ToggleRight, Phone, Mail,
  Lock, Eye, EyeOff, Check
} from 'lucide-react';

// ─── DATA ────────────────────────────────────────────────────────────
const DEMO_USER = { email: 'demo@petcare.id', password: 'petcare123', name: 'Budi Santoso', phone: '081234567890', role: 'Premium' };

const PET_ICONS = { Kucing: Cat, Anjing: Dog, Kelinci: Rabbit, Burung: Bird };
const PET_COLORS = { Kucing: { bg: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-400' }, Anjing: { bg: 'bg-yellow-100', text: 'text-yellow-600', ring: 'ring-yellow-400' }, Kelinci: { bg: 'bg-pink-100', text: 'text-pink-600', ring: 'ring-pink-400' }, Burung: { bg: 'bg-sky-100', text: 'text-sky-600', ring: 'ring-sky-400' } };

const TIPS_DB = {
  Kucing: [
    { title: 'Sisir Bulu Rutin', body: 'Sisir bulu kucing setiap 2 hari sekali untuk mencegah hairball dan menjaga kebersihan.', icon: LucideStar },
    { title: 'Kotak Pasir Bersih', body: 'Bersihkan kotak pasir setiap hari agar kucing tidak menghindarinya dan tetap sehat.', icon: Shield },
    { title: 'Air Segar Selalu', body: 'Kucing membutuhkan air bersih yang selalu tersedia. Ganti air minimal 2x sehari.', icon: Droplets },
    { title: 'Waktu Bermain', body: 'Luangkan 15 menit bermain bersama kucing setiap hari untuk kesehatan mental dan fisiknya.', icon: Dumbbell },
    { title: 'Cek Gigi', body: 'Sikat gigi kucing seminggu sekali untuk mencegah penyakit gigi dan gusi.', icon: Stethoscope },
  ],
  Anjing: [
    { title: 'Jalan Pagi', body: 'Ajak anjing jalan kaki minimal 20-30 menit setiap pagi untuk kesehatan otot dan jantung.', icon: Dumbbell },
    { title: 'Mandi Rutin', body: 'Mandikan anjing setiap 2 minggu atau saat kotor. Gunakan sampo khusus anjing.', icon: Droplets },
    { title: 'Latihan Perintah', body: 'Latih perintah dasar seperti duduk dan diam 10 menit sehari untuk kesehatan mental.', icon: BookOpen },
    { title: 'Cek Kuku', body: 'Potong kuku anjing setiap 3-4 minggu agar tidak melukai kaki dan lantai rumah.', icon: Shield },
    { title: 'Gigi Sehat', body: 'Beri mainan kunyah khusus untuk menjaga kesehatan gigi dan gusi anjing Anda.', icon: Stethoscope },
  ],
  Kelinci: [
    { title: 'Jerami Segar', body: 'Berikan jerami timothy sebagai 80% makanan kelinci untuk kesehatan gigi dan pencernaan.', icon: UtensilsCrossed },
    { title: 'Area Gerak Bebas', body: 'Biarkan kelinci bermain di luar kandang minimal 3-4 jam sehari untuk kesehatan tulang.', icon: Dumbbell },
    { title: 'Hindari Panas', body: 'Kelinci sangat sensitif terhadap panas. Jaga suhu ruangan di bawah 29°C.', icon: Thermometer },
    { title: 'Sayur Segar', body: 'Berikan daun hijau segar seperti kangkung atau selada setiap hari sebagai suplemen.', icon: LucideStar },
  ],
  Burung: [
    { title: 'Cahaya Matahari', body: 'Jemur burung di pagi hari 30 menit untuk mendapatkan vitamin D alami.', icon: Sun },
    { title: 'Kandang Bersih', body: 'Bersihkan kandang setiap 2 hari dan ganti alas kandang untuk mencegah bakteri.', icon: Shield },
    { title: 'Variasi Pakan', body: 'Berikan variasi biji-bijian, buah, dan sayuran untuk nutrisi burung yang seimbang.', icon: UtensilsCrossed },
    { title: 'Stimulasi Mental', body: 'Sediakan mainan dan cermin di dalam kandang untuk menjaga kesehatan mental burung.', icon: BookOpen },
  ],
};

const SCHEDULE_TEMPLATES = [
  { type: 'Vaksinasi', icon: Syringe, color: 'text-violet-600', bg: 'bg-violet-50' },
  { type: 'Makan', icon: UtensilsCrossed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { type: 'Olahraga', icon: Dumbbell, color: 'text-blue-600', bg: 'bg-blue-50' },
  { type: 'Mandi', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { type: 'Dokter', icon: Stethoscope, color: 'text-rose-600', bg: 'bg-rose-50' },
  { type: 'Obat', icon: Pill, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

const INIT_PETS = [
  { id: 1, name: 'Luna', species: 'Kucing', breed: 'Persian', age: '2', weight: '4.5', gender: 'Betina', color: 'Putih', notes: 'Suka bermain bola' },
  { id: 2, name: 'Max', species: 'Anjing', breed: 'Golden Retriever', age: '4', weight: '28', gender: 'Jantan', color: 'Golden', notes: 'Aktif dan ceria' },
];

const INIT_SCHEDULES = [
  { id: 1, petId: 1, type: 'Makan', title: 'Makan Siang Luna', date: fmt(today), time: '12:00', notes: 'Royal Canin Persian Adult', done: false },
  { id: 2, petId: 2, type: 'Olahraga', title: 'Jalan Pagi Max', date: fmt(today), time: '06:30', notes: 'Rute taman komplek', done: true },
  { id: 3, petId: 1, type: 'Vaksinasi', title: 'Vaksin Tahunan Luna', date: fmt(addDays(today, 3)), time: '10:00', notes: 'Klinik Hewan Sehat', done: false },
  { id: 4, petId: 2, type: 'Dokter', title: 'Cek Kesehatan Max', date: fmt(addDays(today, 7)), time: '09:00', notes: 'Drh. Sari - kontrol rutin', done: false },
  { id: 5, petId: 1, type: 'Mandi', title: 'Mandi Luna', date: fmt(addDays(today, -2)), time: '14:00', notes: '', done: true },
];

const INIT_RECORDS = [
  { id: 1, petId: 1, date: fmt(addDays(today, -10)), type: 'Vaksinasi', title: 'Vaksin Rabies', doctor: 'Drh. Sari Indah', clinic: 'Klinik Hewan Sehat', weight: '4.5', temp: '38.5', notes: 'Kondisi baik, nafsu makan normal', nextVisit: fmt(addDays(today, 355)) },
  { id: 2, petId: 2, date: fmt(addDays(today, -5)), type: 'Pemeriksaan', title: 'Cek Rutin', doctor: 'Drh. Bima Putra', clinic: 'Pet Clinic Pro', weight: '28', temp: '38.8', notes: 'Berat badan ideal, gigi bersih', nextVisit: fmt(addDays(today, 90)) },
  { id: 3, petId: 1, date: fmt(addDays(today, -30)), type: 'Pengobatan', title: 'Infeksi Telinga', doctor: 'Drh. Sari Indah', clinic: 'Klinik Hewan Sehat', weight: '4.3', temp: '39.2', notes: 'Diberi ear drop selama 7 hari', nextVisit: fmt(addDays(today, -23)) },
];

const INIT_NOTIFS = [
  { id: 1, petId: 1, text: 'Waktunya makan siang untuk Luna', time: new Date(Date.now() - 5 * 60000), unread: true, type: 'info' },
  { id: 2, petId: 2, text: 'Vaksinasi Max 3 hari lagi!', time: new Date(Date.now() - 3600000), unread: true, type: 'warning' },
  { id: 3, petId: 1, text: 'Suhu tubuh Luna terpantau normal', time: new Date(Date.now() - 3 * 3600000), unread: false, type: 'success' },
  { id: 4, petId: 2, text: 'Jalan pagi Max berhasil dicatat', time: new Date(Date.now() - 5 * 3600000), unread: false, type: 'success' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff} dtk lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

const formatDate = (str) => {
  const d = new Date(str);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const isToday = (str) => str === fmt(today);
const isPast = (str) => str < fmt(today);

// ─── COMPONENTS ──────────────────────────────────────────────────────
const PetAvatar = ({ species, size = 'md', className = '' }) => {
  const Icon = PET_ICONS[species] || Cat;
  const col = PET_COLORS[species] || PET_COLORS['Kucing'];
  const sizes = { sm: 'w-9 h-9', md: 'w-14 h-14', lg: 'w-20 h-20', xl: 'w-24 h-24' };
  const iconSizes = { sm: 18, md: 28, lg: 38, xl: 46 };
  return (
    <div className={`${sizes[size]} ${col.bg} rounded-2xl flex items-center justify-center ${className}`}>
      <Icon size={iconSizes[size]} className={col.text} />
    </div>
  );
};

const UserAvatar = ({ name, size = 'md', className = '' }) => {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  return (
    <div className={`${sizes[size]} bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold ${className}`}>
      {initials}
    </div>
  );
};

const Toast = ({ message, type = 'success', onClose }) => {
  const colors = { success: 'bg-emerald-600', error: 'bg-rose-600', info: 'bg-indigo-600' };
  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  const Icon = icons[type];
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] ${colors[type]} text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 anim-slide-down`}>
      <Icon size={18} /><span className="font-bold text-sm">{message}</span>
    </div>
  );
};

// ─── LOGIN PAGE ───────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (email === DEMO_USER.email && pass === DEMO_USER.password) {
        onLogin({ ...DEMO_USER });
      } else {
        setError('Email atau password salah!');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md anim-zoom">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/40">
            <HeartPulse size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">PetCare<span className="text-indigo-400">+</span></h1>
          <p className="text-indigo-300 mt-2 font-medium">Platform kesehatan hewan peliharaan</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Masuk ke Akun</h2>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center gap-2 text-rose-300 text-sm anim-shake">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest block mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-indigo-400 rounded-2xl pl-10 pr-4 py-3.5 outline-none focus:border-indigo-400 focus:bg-white/20 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest block mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type={showPass ? 'text' : 'password'} required value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-indigo-400 rounded-2xl pl-10 pr-12 py-3.5 outline-none focus:border-indigo-400 focus:bg-white/20 transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-xs text-indigo-300 font-semibold mb-1">🔑 Akun Demo:</p>
            <p className="text-xs text-indigo-200">Email: <span className="font-bold">demo@petcare.id</span></p>
            <p className="text-xs text-indigo-200">Password: <span className="font-bold">petcare123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────
const Dashboard = ({ pets, selectedPet, setSelectedPet, onAddPet, notifications }) => {
  const stats = () => {
    const s = selectedPet.id;
    return [
      { label: 'Detak Jantung', value: `${100 + (s * 7) % 20} bpm`, status: 'Normal', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50' },
      { label: 'Suhu Tubuh', value: `${(38 + ((s * 3) % 10) / 10).toFixed(1)}°C`, status: 'Normal', icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-50' },
      { label: 'Aktivitas', value: `${70 + (s * 11) % 25}%`, status: 'Aktif', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'Istirahat', value: `${10 + (s * 5) % 5} Jam`, status: 'Cukup', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    ];
  };
  const bars = [50, 80, 45, 95, 60, 75, 85];
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const tips = TIPS_DB[selectedPet.species] || TIPS_DB['Kucing'];
  const todayTip = tips[new Date().getDate() % tips.length];
  const TipIcon = todayTip.icon;

  return (
    <div className="space-y-8 anim-slide-up">
      {/* Pet Selector */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Daftar Anabul
            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{pets.length}</span>
          </h3>
          <button onClick={onAddPet} className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
            <Plus size={14} /> Tambah
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {pets.map(pet => (
            <button key={pet.id} onClick={() => setSelectedPet(pet)}
              className={`flex items-center gap-3 min-w-[200px] p-4 rounded-3xl border-2 transition-all duration-200 ${selectedPet.id === pet.id ? 'bg-white border-indigo-500 shadow-xl -translate-y-1' : 'bg-white border-transparent hover:border-slate-200 hover:shadow-md'}`}>
              <PetAvatar species={pet.species} size="md" />
              <div className="text-left overflow-hidden">
                <p className="font-bold text-slate-800 truncate">{pet.name}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{pet.species} · {pet.breed}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{pet.age} thn · {pet.weight} kg</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats().map((s, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`${s.bg} ${s.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-3`}>
                  <s.icon size={20} />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-black mt-1">{s.value}</p>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 block">{s.status}</span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-bold text-slate-800">Tren Aktivitas Mingguan</h4>
                <p className="text-xs text-slate-400">Kondisi fisik {selectedPet.name} 7 hari terakhir</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Aktivitas</span>
              </div>
            </div>
            <div className="h-48 flex items-end justify-between gap-3">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-slate-50 rounded-2xl overflow-hidden" style={{ height: '168px' }}>
                    <div className="flex flex-col justify-end h-full">
                      <div
                        className={`w-full rounded-2xl bar-fill ${i === todayIdx ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${i === todayIdx ? 'text-indigo-600' : 'text-slate-400'}`}>{days[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          {/* Tips Card */}
          <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <TipIcon size={16} className="text-indigo-200" />
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Tips Hari Ini</span>
              </div>
              <h4 className="text-base font-black mb-2">{todayTip.title}</h4>
              <p className="text-xs text-indigo-100 leading-relaxed opacity-90">{todayTip.body}</p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </div>

          {/* Pet Info */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <PetAvatar species={selectedPet.species} size="md" />
              <div>
                <h4 className="font-bold text-slate-800">{selectedPet.name}</h4>
                <p className="text-xs text-slate-500">{selectedPet.species} · {selectedPet.breed}</p>
              </div>
            </div>
            {[['Usia', `${selectedPet.age} Tahun`], ['Berat', `${selectedPet.weight} kg`], ['Gender', selectedPet.gender], ['Warna', selectedPet.color]].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-500">{k}</span>
                <span className="text-xs font-bold text-slate-800">{v}</span>
              </div>
            ))}
            {selectedPet.notes && <p className="text-xs text-slate-400 mt-3 italic">"{selectedPet.notes}"</p>}
          </div>

          {/* Notif Preview */}
          {notifications.filter(n => n.unread).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-[24px]">
              <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1">
                <Bell size={12} /> {notifications.filter(n => n.unread).length} notifikasi belum dibaca
              </p>
              {notifications.filter(n => n.unread).slice(0, 2).map(n => (
                <p key={n.id} className="text-xs text-amber-700 py-1 border-b border-amber-100 last:border-0">{n.text}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── SCHEDULE ─────────────────────────────────────────────────────────
const SchedulePage = ({ pets, schedules, setSchedules, addNotif }) => {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ petId: pets[0]?.id || 1, type: 'Makan', title: '', date: fmt(today), time: '08:00', notes: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    const newSched = { id: Date.now(), ...form, petId: Number(form.petId), done: false };
    setSchedules(prev => [...prev, newSched]);
    const pet = pets.find(p => p.id === newSched.petId);
    addNotif({ text: `Jadwal "${newSched.title}" untuk ${pet?.name} ditambahkan`, type: 'success', petId: newSched.petId });
    setShowForm(false);
    setForm({ petId: pets[0]?.id || 1, type: 'Makan', title: '', date: fmt(today), time: '08:00', notes: '' });
  };

  const toggleDone = (id) => {
    setSchedules(prev => prev.map(s => {
      if (s.id !== id) return s;
      const pet = pets.find(p => p.id === s.petId);
      if (!s.done) addNotif({ text: `"${s.title}" untuk ${pet?.name} selesai ✓`, type: 'success', petId: s.petId });
      return { ...s, done: !s.done };
    }));
  };

  const deleteSchedule = (id) => setSchedules(prev => prev.filter(s => s.id !== id));

  const filtered = schedules.filter(s => {
    if (filter === 'today') return isToday(s.date);
    if (filter === 'upcoming') return s.date >= fmt(today) && !s.done;
    if (filter === 'done') return s.done;
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const getPet = (id) => pets.find(p => p.id === id);

  return (
    <div className="anim-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-800">Kalender Kegiatan</h3>
          <p className="text-sm text-slate-500 mt-0.5">{schedules.filter(s => isToday(s.date)).length} kegiatan hari ini</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
          <Plus size={16} /> Tambah Jadwal
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {[['all', 'Semua'], ['today', 'Hari Ini'], ['upcoming', 'Mendatang'], ['done', 'Selesai']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filter === v ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Tidak ada jadwal</p>
          </div>
        )}
        {filtered.map(s => {
          const sched = SCHEDULE_TEMPLATES.find(t => t.type === s.type) || SCHEDULE_TEMPLATES[0];
          const SchedIcon = sched.icon;
          const pet = getPet(s.petId);
          const dateLabel = isToday(s.date) ? 'Hari Ini' : isPast(s.date) ? formatDate(s.date) : formatDate(s.date);
          return (
            <div key={s.id} className={`bg-white rounded-3xl border p-5 flex items-center gap-4 transition-all hover:shadow-md ${s.done ? 'border-slate-100 opacity-70' : isToday(s.date) ? 'border-indigo-200 shadow-sm' : 'border-slate-100'}`}>
              <div className={`${sched.bg} w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`}>
                <SchedIcon size={22} className={sched.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-bold text-slate-800 ${s.done ? 'line-through text-slate-400' : ''}`}>{s.title}</p>
                  {isToday(s.date) && !s.done && <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Hari Ini</span>}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {pet && <div className="flex items-center gap-1"><PetAvatar species={pet.species} size="sm" className="!w-5 !h-5 !rounded-lg" /><span className="text-xs text-slate-500">{pet.name}</span></div>}
                  <span className="text-xs text-slate-400">{dateLabel} · {s.time}</span>
                </div>
                {s.notes && <p className="text-xs text-slate-400 mt-1 italic truncate">{s.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleDone(s.id)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${s.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'}`}>
                  <Check size={16} />
                </button>
                <button onClick={() => deleteSchedule(s.id)} className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white w-full max-w-md rounded-[32px] p-7 shadow-2xl anim-zoom">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Jadwal Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={22} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-style">Hewan</label>
                  <select value={form.petId} onChange={e => setForm({ ...form, petId: e.target.value })} className="input-style">
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-style">Jenis</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-style">
                    {SCHEDULE_TEMPLATES.map(t => <option key={t.type}>{t.type}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-style">Judul Kegiatan</label>
                <input required type="text" placeholder="Nama kegiatan..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-style" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-style">Tanggal</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-style" />
                </div>
                <div>
                  <label className="label-style">Waktu</label>
                  <input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="input-style" />
                </div>
              </div>
              <div>
                <label className="label-style">Catatan (opsional)</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Catatan tambahan..." className="input-style resize-none" />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Simpan Jadwal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MEDICAL RECORDS ──────────────────────────────────────────────────
const MedicalPage = ({ pets, records, setRecords, addNotif }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filterPet, setFilterPet] = useState('all');
  const [form, setForm] = useState({ petId: pets[0]?.id || 1, date: fmt(today), type: 'Pemeriksaan', title: '', doctor: '', clinic: '', weight: '', temp: '', notes: '', nextVisit: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    const newRec = { id: Date.now(), ...form, petId: Number(form.petId) };
    setRecords(prev => [...prev, newRec]);
    const pet = pets.find(p => p.id === newRec.petId);
    addNotif({ text: `Rekam medis ${pet?.name} berhasil ditambahkan`, type: 'success', petId: newRec.petId });
    setShowForm(false);
    setForm({ petId: pets[0]?.id || 1, date: fmt(today), type: 'Pemeriksaan', title: '', doctor: '', clinic: '', weight: '', temp: '', notes: '', nextVisit: '' });
  };

  const filtered = records.filter(r => filterPet === 'all' || r.petId === Number(filterPet))
    .sort((a, b) => b.date.localeCompare(a.date));

  const getPet = (id) => pets.find(p => p.id === id);
  const RECORD_TYPES = ['Pemeriksaan', 'Vaksinasi', 'Pengobatan', 'Operasi', 'Grooming'];

  return (
    <div className="anim-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-800">Rekam Medis</h3>
          <p className="text-sm text-slate-500 mt-0.5">{records.length} catatan tersimpan</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
          <Plus size={16} /> Tambah Catatan
        </button>
      </div>

      {/* Pet Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => setFilterPet('all')} className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filterPet === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>Semua</button>
        {pets.map(p => (
          <button key={p.id} onClick={() => setFilterPet(String(p.id))}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filterPet === String(p.id) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Belum ada rekam medis</p>
          </div>
        )}
        {filtered.map(r => {
          const pet = getPet(r.petId);
          const typeColors = { Pemeriksaan: 'bg-blue-50 text-blue-600', Vaksinasi: 'bg-violet-50 text-violet-600', Pengobatan: 'bg-amber-50 text-amber-600', Operasi: 'bg-rose-50 text-rose-600', Grooming: 'bg-emerald-50 text-emerald-600' };
          const col = typeColors[r.type] || 'bg-slate-50 text-slate-600';
          return (
            <div key={r.id} onClick={() => setSelectedRecord(r)} className="bg-white rounded-3xl border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="flex items-start gap-4">
                <div className={`${col.split(' ')[0]} w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`}>
                  <Stethoscope size={22} className={col.split(' ')[1]} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800">{r.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col}`}>{r.type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {pet && <span className="text-xs text-slate-500 flex items-center gap-1">{pet.name}</span>}
                    <span className="text-xs text-slate-400">{formatDate(r.date)}</span>
                    {r.doctor && <span className="text-xs text-slate-400">{r.doctor}</span>}
                  </div>
                  {r.notes && <p className="text-xs text-slate-400 mt-1.5 italic truncate">{r.notes}</p>}
                  {r.nextVisit && (
                    <p className={`text-xs font-semibold mt-2 ${r.nextVisit < fmt(today) ? 'text-rose-500' : 'text-emerald-600'}`}>
                      Kunjungan berikutnya: {formatDate(r.nextVisit)}
                    </p>
                  )}
                </div>
                <ChevronRight size={18} className="text-slate-300 shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setSelectedRecord(null)}>
          <div className="bg-white w-full max-w-md rounded-[32px] p-7 shadow-2xl anim-zoom">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800">{selectedRecord.title}</h3>
              <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={22} /></button>
            </div>
            <div className="space-y-3">
              {[
                ['Tanggal', formatDate(selectedRecord.date)],
                ['Jenis', selectedRecord.type],
                ['Dokter', selectedRecord.doctor || '-'],
                ['Klinik', selectedRecord.clinic || '-'],
                ['Berat', selectedRecord.weight ? `${selectedRecord.weight} kg` : '-'],
                ['Suhu', selectedRecord.temp ? `${selectedRecord.temp}°C` : '-'],
                ['Kunjungan Berikutnya', selectedRecord.nextVisit ? formatDate(selectedRecord.nextVisit) : '-'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-500 font-medium">{k}</span>
                  <span className="text-xs font-bold text-slate-800 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
              {selectedRecord.notes && (
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 mb-2">Catatan</p>
                  <p className="text-sm text-slate-700">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
            <button onClick={() => { setRecords(prev => prev.filter(r => r.id !== selectedRecord.id)); setSelectedRecord(null); }}
              className="mt-5 w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2">
              <Trash2 size={16} /> Hapus Catatan
            </button>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white w-full max-w-md rounded-[32px] p-7 shadow-2xl anim-zoom max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Catatan Medis Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={22} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-style">Hewan</label>
                  <select value={form.petId} onChange={e => setForm({ ...form, petId: e.target.value })} className="input-style">
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-style">Jenis</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-style">
                    {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-style">Judul</label>
                <input required type="text" placeholder="Nama prosedur/pemeriksaan..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-style" />
              </div>
              <div>
                <label className="label-style">Tanggal</label>
                <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-style" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-style">Dokter</label>
                  <input type="text" placeholder="Nama dokter..." value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} className="input-style" />
                </div>
                <div>
                  <label className="label-style">Klinik</label>
                  <input type="text" placeholder="Nama klinik..." value={form.clinic} onChange={e => setForm({ ...form, clinic: e.target.value })} className="input-style" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-style">Berat (kg)</label>
                  <input type="number" step="0.1" placeholder="0.0" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="input-style" />
                </div>
                <div>
                  <label className="label-style">Suhu (°C)</label>
                  <input type="number" step="0.1" placeholder="38.5" value={form.temp} onChange={e => setForm({ ...form, temp: e.target.value })} className="input-style" />
                </div>
              </div>
              <div>
                <label className="label-style">Catatan</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="input-style resize-none" placeholder="Diagnosis, instruksi, dsb..." />
              </div>
              <div>
                <label className="label-style">Kunjungan Berikutnya (opsional)</label>
                <input type="date" value={form.nextVisit} onChange={e => setForm({ ...form, nextVisit: e.target.value })} className="input-style" />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Simpan Catatan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SETTINGS ─────────────────────────────────────────────────────────
const SettingsPage = ({ user, setUser, onLogout, pets, setPets, addNotif }) => {
  const [section, setSection] = useState('profile');
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user.name, email: user.email, phone: user.phone || '' });
  const [editPetId, setEditPetId] = useState(null);
  const [petForm, setPetForm] = useState({});
  const [notifSettings, setNotifSettings] = useState({ jadwal: true, kesehatan: true, tips: true, vaksinasi: true });
  const [appSettings, setAppSettings] = useState({ darkMode: false, bahasa: 'Indonesia', suara: true });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const saveProfile = () => {
    setUser(prev => ({ ...prev, ...profileForm }));
    addNotif({ text: 'Profil berhasil diperbarui', type: 'success', petId: null });
    setEditProfile(false);
  };

  const startEditPet = (pet) => { setEditPetId(pet.id); setPetForm({ ...pet }); };
  const savePet = () => {
    setPets(prev => prev.map(p => p.id === editPetId ? { ...petForm, id: editPetId } : p));
    addNotif({ text: `Data ${petForm.name} berhasil diperbarui`, type: 'success', petId: editPetId });
    setEditPetId(null);
  };
  const deletePet = (id) => {
    const pet = pets.find(p => p.id === id);
    setPets(prev => prev.filter(p => p.id !== id));
    addNotif({ text: `${pet?.name} telah dihapus`, type: 'info', petId: null });
    setShowDeleteConfirm(null);
  };

  const sections = [
    { id: 'profile', label: 'Edit Profil', icon: User },
    { id: 'pets', label: 'Kelola Hewan', icon: Cat },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'app', label: 'Aplikasi', icon: Settings },
  ];

  return (
    <div className="anim-slide-up">
      <h3 className="text-xl font-black text-slate-800 mb-6">Pengaturan</h3>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${section === s.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
              <s.icon size={17} />{s.label}
            </button>
          ))}
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all mt-4">
            <LogOut size={17} /> Keluar
          </button>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* PROFILE */}
          {section === 'profile' && (
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-slate-800">Informasi Profil</h4>
                <button onClick={() => setEditProfile(!editProfile)}
                  className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all ${editProfile ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                  {editProfile ? <><X size={14} /> Batal</> : <><Edit3 size={14} /> Edit</>}
                </button>
              </div>
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-2xl">
                <UserAvatar name={user.name} size="lg" />
                <div>
                  <p className="font-black text-slate-800 text-lg">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1 uppercase">{user.role}</span>
                </div>
              </div>
              {editProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="label-style">Nama Lengkap</label>
                    <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="input-style" />
                  </div>
                  <div>
                    <label className="label-style">Email</label>
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="input-style" />
                  </div>
                  <div>
                    <label className="label-style">No. Telepon</label>
                    <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="input-style" placeholder="08xxxxxxxxxx" />
                  </div>
                  <button onClick={saveProfile} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all">
                    <Save size={16} /> Simpan Perubahan
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[['Nama', user.name], ['Email', user.email], ['Telepon', user.phone || '-'], ['Role', user.role]].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-500">{k}</span>
                      <span className="text-sm font-bold text-slate-800">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PETS */}
          {section === 'pets' && (
            <div className="space-y-4">
              {pets.map(pet => (
                <div key={pet.id} className="bg-white rounded-[28px] border border-slate-100 p-5 shadow-sm">
                  {editPetId === pet.id ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800">Edit {pet.name}</h4>
                        <button onClick={() => setEditPetId(null)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[['Nama', 'name', 'text'], ['Ras', 'breed', 'text'], ['Usia (Thn)', 'age', 'number'], ['Berat (kg)', 'weight', 'number']].map(([l, k, t]) => (
                          <div key={k}>
                            <label className="label-style">{l}</label>
                            <input type={t} value={petForm[k] || ''} onChange={e => setPetForm({ ...petForm, [k]: e.target.value })} className="input-style" />
                          </div>
                        ))}
                        <div>
                          <label className="label-style">Gender</label>
                          <select value={petForm.gender} onChange={e => setPetForm({ ...petForm, gender: e.target.value })} className="input-style">
                            <option>Jantan</option><option>Betina</option>
                          </select>
                        </div>
                        <div>
                          <label className="label-style">Warna</label>
                          <input type="text" value={petForm.color || ''} onChange={e => setPetForm({ ...petForm, color: e.target.value })} className="input-style" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="label-style">Catatan</label>
                        <textarea value={petForm.notes || ''} onChange={e => setPetForm({ ...petForm, notes: e.target.value })} rows={2} className="input-style resize-none" />
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button onClick={savePet} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                          <Save size={16} /> Simpan
                        </button>
                        <button onClick={() => setShowDeleteConfirm(pet.id)} className="py-3 px-5 bg-rose-50 text-rose-500 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <PetAvatar species={pet.species} size="md" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{pet.name}</p>
                        <p className="text-xs text-slate-500">{pet.species} · {pet.breed} · {pet.age} thn · {pet.weight} kg</p>
                      </div>
                      <button onClick={() => startEditPet(pet)} className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                  <div className="bg-white rounded-[28px] p-6 max-w-sm w-full shadow-2xl anim-zoom text-center">
                    <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-rose-500" /></div>
                    <h4 className="font-black text-slate-800 text-lg mb-2">Hapus Hewan?</h4>
                    <p className="text-sm text-slate-500 mb-6">Data {pets.find(p => p.id === showDeleteConfirm)?.name} akan dihapus permanen.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm">Batal</button>
                      <button onClick={() => deletePet(showDeleteConfirm)} className="flex-1 py-3 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600">Hapus</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {section === 'notifications' && (
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-6">Pengaturan Notifikasi</h4>
              <div className="space-y-4">
                {[
                  ['jadwal', 'Pengingat Jadwal', 'Notifikasi kegiatan dan jadwal hewan'],
                  ['kesehatan', 'Pemantauan Kesehatan', 'Update kondisi kesehatan real-time'],
                  ['tips', 'Tips Harian', 'Tips perawatan hewan setiap hari'],
                  ['vaksinasi', 'Vaksinasi & Kontrol', 'Pengingat vaksinasi dan kunjungan dokter'],
                ].map(([k, title, desc]) => (
                  <div key={k} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <button onClick={() => setNotifSettings(prev => ({ ...prev, [k]: !prev[k] }))}
                      className="transition-colors">
                      {notifSettings[k] ? <ToggleRight size={32} className="text-indigo-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APP SETTINGS */}
          {section === 'app' && (
            <div className="space-y-4">
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-5">Preferensi Aplikasi</h4>
                <div className="space-y-4">
                  {[
                    ['suara', 'Suara Notifikasi', 'Aktifkan suara untuk setiap notifikasi'],
                  ].map(([k, title, desc]) => (
                    <div key={k} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      <button onClick={() => setAppSettings(prev => ({ ...prev, [k]: !prev[k] }))} className="transition-colors">
                        {appSettings[k] ? <ToggleRight size={32} className="text-indigo-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                      </button>
                    </div>
                  ))}
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="font-semibold text-slate-800 text-sm mb-2">Bahasa</p>
                    <select value={appSettings.bahasa} onChange={e => setAppSettings(prev => ({ ...prev, bahasa: e.target.value }))} className="input-style text-sm">
                      <option>Indonesia</option><option>English</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Tentang Aplikasi</h4>
                {[['Versi', '2.0.0'], ['Developer', 'PetCare+ Team'], ['Lisensi', 'MIT License']].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-500">{k}</span>
                    <span className="text-sm font-bold text-slate-800">{v}</span>
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

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────
const NotifPanel = ({ notifications, setNotifications, onClose }) => {
  const markAll = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  const clearAll = () => setNotifications([]);
  const typeIcon = { success: CheckCircle2, warning: AlertCircle, info: Info };
  const typeColor = { success: 'text-emerald-500', warning: 'text-amber-500', info: 'text-indigo-500' };

  return (
    <div className="absolute right-0 top-14 w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 anim-slide-down">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <span className="font-black text-slate-800">Notifikasi <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full ml-1">{notifications.filter(n => n.unread).length}</span></span>
        <div className="flex gap-2">
          <button onClick={markAll} className="text-[10px] font-bold text-indigo-600 hover:underline">Baca semua</button>
          <span className="text-slate-300">·</span>
          <button onClick={clearAll} className="text-[10px] font-bold text-rose-500 hover:underline">Hapus semua</button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 && (
          <div className="py-10 text-center text-slate-400">
            <Bell size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Tidak ada notifikasi</p>
          </div>
        )}
        {notifications.map(n => {
          const Icon = typeIcon[n.type] || Info;
          return (
            <div key={n.id} className={`p-4 border-b border-slate-50 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${n.unread ? 'bg-indigo-50/40' : ''}`}
              onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}>
              <Icon size={16} className={`${typeColor[n.type]} mt-0.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm text-slate-700 leading-snug ${n.unread ? 'font-semibold' : ''}`}>{n.text}</p>
                <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.time)}</p>
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
const AddPetModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ name: '', species: 'Kucing', breed: '', age: '1', weight: '1', gender: 'Jantan', color: '', notes: '' });
  const handleSubmit = (e) => { e.preventDefault(); onAdd(form); };
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-md rounded-[32px] p-7 shadow-2xl anim-zoom max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800">Tambah Anabul</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-style">Nama Panggilan</label>
            <input required type="text" placeholder="Luna, Max, dsb..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-style" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-style">Spesies</label>
              <select value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} className="input-style">
                {Object.keys(PET_ICONS).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label-style">Gender</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="input-style">
                <option>Jantan</option><option>Betina</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-style">Jenis Ras</label>
            <input required type="text" placeholder="Persian, Golden, dsb..." value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} className="input-style" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-style">Usia (Tahun)</label>
              <input type="number" min="0" step="0.5" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className="input-style" />
            </div>
            <div>
              <label className="label-style">Berat (kg)</label>
              <input type="number" min="0" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="input-style" />
            </div>
          </div>
          <div>
            <label className="label-style">Warna</label>
            <input type="text" placeholder="Putih, hitam, dsb..." value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="input-style" />
          </div>
          <div>
            <label className="label-style">Catatan (opsional)</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="input-style resize-none" placeholder="Info tambahan tentang anabul Anda..." />
          </div>

          {/* Preview Icon */}
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
            <PetAvatar species={form.species} size="md" />
            <div>
              <p className="font-bold text-slate-700">{form.name || 'Nama Anabul'}</p>
              <p className="text-xs text-slate-500">{form.species} · {form.breed || 'Ras'}</p>
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            Daftarkan Sekarang
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── TIPS PAGE ────────────────────────────────────────────────────────
const TipsPage = ({ selectedPet }) => {
  const [activeSpecies, setActiveSpecies] = useState(selectedPet?.species || 'Kucing');
  const tips = TIPS_DB[activeSpecies] || TIPS_DB['Kucing'];
  const gradients = ['from-indigo-500 to-violet-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-sky-500 to-blue-600'];

  return (
    <div className="anim-slide-up">
      <h3 className="text-xl font-black text-slate-800 mb-2">Tips Perawatan</h3>
      <p className="text-sm text-slate-500 mb-6">Panduan merawat hewan peliharaan dengan baik</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.keys(TIPS_DB).map(s => {
          const Icon = PET_ICONS[s];
          const col = PET_COLORS[s];
          return (
            <button key={s} onClick={() => setActiveSpecies(s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${activeSpecies === s ? 'bg-indigo-600 text-white shadow-md' : `${col.bg} ${col.text} hover:opacity-80`}`}>
              <Icon size={16} />{s}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <div key={i} className={`bg-gradient-to-br ${gradients[i % gradients.length]} p-6 rounded-[28px] text-white shadow-lg hover:-translate-y-1 transition-all`}>
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Icon size={20} />
              </div>
              <h4 className="font-black text-lg mb-2">{tip.title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{tip.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState(INIT_PETS);
  const [selectedPet, setSelectedPet] = useState(INIT_PETS[0]);
  const [schedules, setSchedules] = useState(INIT_SCHEDULES);
  const [records, setRecords] = useState(INIT_RECORDS);
  const [notifications, setNotifications] = useState(INIT_NOTIFS);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotif, setShowNotif] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [toast, setToast] = useState(null);
  const notifRef = useRef(null);

  const addNotif = ({ text, type, petId }) => {
    const newN = { id: Date.now(), text, time: new Date(), unread: true, type, petId };
    setNotifications(prev => [newN, ...prev]);
    setToast({ message: text, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleAddPet = (form) => {
    const newPet = { id: Date.now(), ...form };
    setPets(prev => [...prev, newPet]);
    setSelectedPet(newPet);
    addNotif({ text: `${form.name} berhasil didaftarkan! 🐾`, type: 'success', petId: newPet.id });
    setShowAddPet(false);
  };

  const handleLogout = () => { setUser(null); setActiveTab('dashboard'); };

  if (!user) return <LoginPage onLogin={setUser} />;

  const NAV = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'schedule', icon: Calendar, label: 'Jadwal' },
    { id: 'medical', icon: FileText, label: 'Rekam Medis' },
    { id: 'tips', icon: BookOpen, label: 'Tips' },
    { id: 'settings', icon: Settings, label: 'Pengaturan' },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const pageTitle = { dashboard: 'Dashboard', schedule: 'Jadwal Kegiatan', medical: 'Rekam Medis', tips: 'Tips Perawatan', settings: 'Pengaturan' };

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
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all font-semibold ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
              <item.icon size={18} />{item.label}
            </button>
          ))}
        </nav>

        <div className="mt-4 p-4 bg-slate-900 rounded-3xl text-white">
          <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-widest">Darurat</p>
          <p className="text-xs font-bold mb-3">Butuh bantuan medis segera?</p>
          <button className="w-full py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2">
            <Phone size={13} /> Panggil Dokter
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between z-40 shrink-0">
          <h2 className="text-lg font-black text-slate-800">{pageTitle[activeTab]}</h2>
          <div className="flex items-center gap-3">
            {/* Notif */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setShowNotif(!showNotif)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center relative transition-all ${showNotif ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotif && <NotifPanel notifications={notifications} setNotifications={setNotifications} onClose={() => setShowNotif(false)} />}
            </div>

            <div className="h-6 w-px bg-slate-200" />

            {/* User */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('settings')}>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-800">{user.name.split(' ')[0]}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{user.role}</p>
              </div>
              <UserAvatar name={user.name} size="md" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard pets={pets} selectedPet={selectedPet} setSelectedPet={setSelectedPet} onAddPet={() => setShowAddPet(true)} notifications={notifications} />}
            {activeTab === 'schedule' && <SchedulePage pets={pets} schedules={schedules} setSchedules={setSchedules} addNotif={addNotif} />}
            {activeTab === 'medical' && <MedicalPage pets={pets} records={records} setRecords={setRecords} addNotif={addNotif} />}
            {activeTab === 'tips' && <TipsPage selectedPet={selectedPet} />}
            {activeTab === 'settings' && <SettingsPage user={user} setUser={setUser} onLogout={handleLogout} pets={pets} setPets={setPets} addNotif={addNotif} />}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex bg-white border-t border-slate-100 px-2 py-2 shrink-0">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
              <item.icon size={20} />
              <span className="text-[9px] font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>

      {/* Add Pet Modal */}
      {showAddPet && <AddPetModal onClose={() => setShowAddPet(false)} onAdd={handleAddPet} />}
    </div>
  );
}

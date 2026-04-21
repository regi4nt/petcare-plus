import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  HeartPulse, 
  Calendar, 
  Settings, 
  Bell, 
  Plus, 
  Activity, 
  Thermometer, 
  Clock, 
  X,
  CheckCircle2
} from 'lucide-react';

// Mock Data Awal
const INITIAL_PETS = [
  { id: 1, name: 'Luna', species: 'Kucing', breed: 'Persian', age: '2 Thn', weight: '4.5kg', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=100' },
  { id: 2, name: 'Max', species: 'Anjing', breed: 'Golden Retriever', age: '4 Thn', weight: '28kg', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=100' },
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: 'Waktunya makan siang untuk Luna', time: '5 mnt yang lalu', unread: true },
  { id: 2, text: 'Vaksinasi Max besok jam 10:00', time: '1 jam yang lalu', unread: true },
  { id: 3, text: 'Suhu tubuh Luna terpantau normal', time: '3 jam yang lalu', unread: false },
];

const App = () => {
  const [pets, setPets] = useState(INITIAL_PETS);
  const [selectedPet, setSelectedPet] = useState(INITIAL_PETS[0]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    species: 'Kucing',
    breed: '',
    age: ''
  });

  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddPet = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.breed) return;
    
    const newPet = {
      id: Date.now(),
      name: formData.name,
      species: formData.species,
      breed: formData.breed,
      age: formData.age || '1 Thn',
      weight: '0kg',
      image: formData.species === 'Anjing' 
        ? 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=100'
        : 'https://images.unsplash.com/photo-1573865667391-e0a03791a662?auto=format&fit=crop&q=80&w=100'
    };
    
    setPets([...pets, newPet]);
    setFormData({ name: '', species: 'Kucing', breed: '', age: '' });
    setIsModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const getHealthStats = () => {
    const seed = selectedPet.id;
    return [
      { label: 'Detak Jantung', value: `${100 + (seed % 20)} bpm`, status: 'Normal', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50' },
      { label: 'Suhu Tubuh', value: `${38 + (seed % 10)/10}°C`, status: 'Normal', icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-50' },
      { label: 'Aktivitas', value: `${70 + (seed % 25)}%`, status: 'Aktif', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'Istirahat', value: `${10 + (seed % 5)} Jam`, status: 'Cukup', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    ];
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* Toast Notifikasi */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={20} />
          <span className="font-bold">Anabul berhasil didaftarkan!</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <HeartPulse size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-indigo-900">PetCare+</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'schedule', icon: Calendar, label: 'Jadwal' },
            { id: 'history', icon: Activity, label: 'Rekam Medis' },
            { id: 'settings', icon: Settings, label: 'Pengaturan' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-slate-900 rounded-3xl text-white">
          <p className="text-xs text-slate-400 mb-2 font-medium">Layanan Darurat</p>
          <p className="text-sm font-bold mb-3 leading-snug">Butuh bantuan medis segera?</p>
          <button className="w-full py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2">
            Panggil Dokter
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-40">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' ? 'Dashboard Utama' : activeTab === 'schedule' ? 'Kalender Kegiatan' : 'Riwayat Medis'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-full relative transition-colors ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <Bell size={22} />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Notifikasi</span>
                    <button onClick={markAllRead} className="text-[10px] font-bold text-indigo-600 hover:underline">Tandai dibaca</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-slate-50 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${n.unread ? 'bg-indigo-50/30' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-indigo-500' : 'bg-transparent'}`}></div>
                        <div>
                          <p className="text-sm text-slate-700 leading-snug">{n.text}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full p-3 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors text-center border-t border-slate-100">
                    Lihat semua pemberitahuan
                  </button>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">Budi Santoso</p>
                <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block uppercase tracking-wider">Premium</p>
              </div>
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm object-cover" alt="User" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' ? (
              <div className="space-y-10">
                {/* Pet Selector */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      Daftar Anabul <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{pets.length}</span>
                    </h3>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      <Plus size={14} /> Tambah Hewan
                    </button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {pets.map(pet => (
                      <button 
                        key={pet.id}
                        onClick={() => setSelectedPet(pet)}
                        className={`flex items-center gap-4 min-w-[220px] p-4 rounded-3xl border-2 transition-all duration-300 ${selectedPet.id === pet.id ? 'bg-white border-indigo-600 shadow-xl -translate-y-1' : 'bg-white border-transparent hover:border-slate-200 hover:shadow-md'}`}
                      >
                        <img src={pet.image} alt={pet.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                        <div className="text-left overflow-hidden">
                          <p className="font-bold text-slate-800 truncate">{pet.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{pet.species} • {pet.breed}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Health Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {getHealthStats().map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4`}>
                            <stat.icon size={20} />
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
                          <p className="text-xl font-black mt-1">{stat.value}</p>
                          <span className="text-[10px] text-emerald-600 font-bold mt-2 block italic">{stat.status}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h4 className="font-bold text-slate-800">Tren Kesehatan Mingguan</h4>
                          <p className="text-xs text-slate-400">Analisis kondisi tubuh {selectedPet.name}</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Aktif</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-60 flex items-end justify-between gap-4">
                        {[50, 80, 45, 95, 60, 75, 85].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                            <div className="w-full bg-slate-50 rounded-2xl overflow-hidden h-full flex flex-col justify-end">
                              <div 
                                className={`w-full rounded-2xl transition-all duration-700 ${i === 3 ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}
                                style={{ height: `${h}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                      <div className="relative z-10">
                        <h4 className="text-lg font-bold mb-2">Tips Hari Ini</h4>
                        <p className="text-xs text-indigo-100 leading-relaxed mb-6 opacity-80 italic">
                          "{selectedPet.species === 'Anjing' ? 'Ajak jalan pagi minimal 15 menit agar otot kaki tetap kuat.' : 'Berikan sisiran bulu rutin agar tidak terjadi hairball pada pencernaannya.'}"
                        </p>
                        <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-2xl text-[10px] font-bold hover:bg-indigo-50 transition-colors uppercase tracking-widest">
                          Pelajari
                        </button>
                      </div>
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-4">Informasi {selectedPet.name}</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                          <span className="text-xs text-slate-500 font-medium">Jenis Ras</span>
                          <span className="text-xs font-bold text-slate-800">{selectedPet.breed}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                          <span className="text-xs text-slate-500 font-medium">Usia</span>
                          <span className="text-xs font-bold text-slate-800">{selectedPet.age}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                          <span className="text-xs text-slate-500 font-medium">Berat Badan</span>
                          <span className="text-xs font-bold text-slate-800">{selectedPet.weight}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                  <Activity size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Modul {activeTab}</h3>
                <p className="text-slate-400 text-center max-w-sm mb-8">Fitur ini sedang dipersiapkan untuk sinkronisasi data rekam medis anabul Anda.</p>
                <button onClick={() => setActiveTab('dashboard')} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                  Kembali ke Beranda
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Tambah Hewan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Anabul Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddPet} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Panggilan</label>
                <input 
                  type="text" 
                  required
                  placeholder="Milo, Luna, dsb..."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Spesies</label>
                  <select 
                    value={formData.species}
                    onChange={(e) => setFormData({...formData, species: e.target.value})}
                    className="w-full bg-slate-50 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none appearance-none cursor-pointer"
                  >
                    <option>Kucing</option>
                    <option>Anjing</option>
                    <option>Kelinci</option>
                    <option>Hamster</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Umur (Tahun)</label>
                  <input 
                    type="number" 
                    placeholder="1"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value + ' Thn'})}
                    className="w-full bg-slate-50 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Jenis Ras</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Persian, Golden, dsb..."
                  value={formData.breed}
                  onChange={(e) => setFormData({...formData, breed: e.target.value})}
                  className="w-full bg-slate-50 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition-all"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
              >
                Daftarkan Sekarang
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

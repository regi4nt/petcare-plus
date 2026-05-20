// ─── MONITOR PAGE (IoT) dengan Battery Status ───────────────────────────
const MonitorPage = ({ pets, selectedPet, setSelectedPet, darkMode = false, profile }) => {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [showHibernationModal, setShowHibernationModal] = useState(false);
  const liveTimerRef = React.useRef(null);

  // Nyalakan badge LIVE selama 8 detik setiap kali batch baru tiba
  const triggerLive = useCallback(() => {
    setIsLive(true);
    if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    liveTimerRef.current = setTimeout(() => setIsLive(false), 8000);
  }, []);

  const fetchData = useCallback(async (petId) => {
    if (!petId) return;
    setLoading(true);
    try {
      // Akun Demo: gunakan data IoT simulasi
      if (profile?.role === 'Demo') {
        const now = Date.now();
        const demoMon = Array.from({ length: 15 }, (_, i) => {
          const bl = Math.max(5, Math.min(100, Math.round(70 - i * 1.5 + Math.sin(i * 0.4) * 5)));
          const bs = bl >= 95 ? 'full' : bl >= 20 ? 'discharging' : bl >= 10 ? 'low' : 'critical';
          return {
            id: `demo-mon-${i}`,
            pet_id: petId,
            device_id: 'esp32-01',
            suhu: (38.0 + Math.sin(i * 0.5) * 0.8).toFixed(1),
            heart_rate: Math.round(85 + Math.sin(i * 0.3) * 15),
            spo2: Math.round(97 + Math.sin(i * 0.2) * 2),
            ax: (Math.random() * 2 - 1).toFixed(2),
            ay: (Math.random() * 2 - 1).toFixed(2),
            az: (Math.random() * 2 - 1).toFixed(2),
            mode: i % 5 === 0 ? 'kandang' : 'kalung',
            battery_level: bl,
            battery_status: bs,
            created_at: new Date(now - i * 3 * 60 * 1000).toISOString(),
          };
        });
        setLatest(demoMon[0]);
        setHistory([...demoMon].reverse());
        setLastUpdate(new Date());
        return;
      }
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
  }, [profile]);

  useEffect(() => {
    if (!selectedPet?.id) return;
    fetchData(selectedPet.id);
    // Debounce: batch upload mengirim 15 baris sekaligus → tunda 1.5 detik
    // agar hanya 1 fetch yang terjadi, bukan 15 fetch berturut-turut
    let debounceTimer = null;
    const channel = monitoringService.subscribe(selectedPet.id, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchData(selectedPet.id);
        triggerLive();
      }, 1500);
    });
    return () => {
      channel.unsubscribe();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
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

  // ── Fungsi helper untuk status baterai ──────────────────────────
  const getBatteryStatus = (level, status) => {
    if (level == null) return { icon: '🔋', label: 'Unknown', cls: 'bg-slate-100 text-slate-600' };
    if (status === 'critical' || level < 10) return { icon: '🪫', label: 'Kritis', cls: 'bg-rose-100 text-rose-700 font-bold' };
    if (status === 'low' || level < 20) return { icon: '⚠️', label: 'Rendah', cls: 'bg-amber-100 text-amber-700' };
    if (level >= 80) return { icon: '🔋', label: 'Penuh', cls: 'bg-emerald-100 text-emerald-700' };
    return { icon: '🔋', label: 'Normal', cls: 'bg-sky-100 text-sky-700' };
  };

  const batteryStatus = getBatteryStatus(latest?.battery_level, latest?.battery_status);
  const batteryPercent = latest?.battery_level ?? null;

  // ── Status perangkat: hitung berdasarkan umur data terakhir ──────
  // Deep Sleep: data masuk setiap 15 menit (batch), bukan real-time
  const deviceStatus = React.useMemo(() => {
    if (!latest?.created_at) return { label: '🔴 Menunggu', cls: 'bg-slate-500 text-slate-200', detail: 'Belum ada data dari ESP32' };
    const ageMin = (Date.now() - new Date(latest.created_at).getTime()) / 60000;
    if (ageMin < 20)  return { label: '🟢 Aktif',        cls: 'bg-emerald-400 text-white',   detail: `Data terbaru ${Math.round(ageMin)} mnt lalu` };
    if (ageMin < 60)  return { label: '🟡 Tidur',         cls: 'bg-amber-400 text-white',     detail: `Deep Sleep — siklus berikutnya ~${Math.round(20 - (ageMin % 15))} mnt lagi` };
    return              { label: '🔴 Offline',       cls: 'bg-rose-500 text-white',     detail: `Tidak ada data sejak ${Math.round(ageMin)} mnt lalu` };
  }, [latest]);

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
      <div className={`rounded-3xl p-5 flex items-center justify-between transition-all ${isCageMode ? "bg-amber-50 border border-amber-200" : "bg-indigo-50 border border-indigo-200"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCageMode ? "bg-amber-100" : "bg-indigo-100"}`}>
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
                ? "IoT aktif — baca sensor tiap 1 menit · batch upload tiap 15 menit"
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
          {/* ── STATUS BATERAI ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header strip warna sesuai level */}
            <div className={`px-5 py-3 flex items-center justify-between ${
              batteryPercent == null    ? 'bg-slate-100'
              : batteryPercent < 10    ? 'bg-rose-500'
              : batteryPercent < 20    ? 'bg-amber-400'
              : batteryPercent < 50    ? 'bg-sky-400'
              : 'bg-emerald-500'
            }`}>
              <div className="flex items-center gap-2">
                <Zap size={16} className={batteryPercent == null ? 'text-slate-400' : 'text-white'} />
                <span className={`text-xs font-black uppercase tracking-widest ${batteryPercent == null ? 'text-slate-500' : 'text-white'}`}>
                  Daya Baterai
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                batteryPercent == null    ? 'bg-slate-200 text-slate-500'
                : batteryPercent < 10    ? 'bg-rose-600 text-white'
                : batteryPercent < 20    ? 'bg-amber-500 text-white'
                : batteryPercent < 50    ? 'bg-sky-500 text-white'
                : 'bg-emerald-600 text-white'
              }`}>
                {batteryStatus.label}
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                {/* Angka persentase besar */}
                <div className="flex items-end gap-2">
                  <span className={`text-5xl font-black leading-none ${
                    batteryPercent == null    ? 'text-slate-300'
                    : batteryPercent < 10    ? 'text-rose-500'
                    : batteryPercent < 20    ? 'text-amber-500'
                    : batteryPercent < 50    ? 'text-sky-500'
                    : 'text-emerald-500'
                  }`}>
                    {batteryPercent != null ? `${batteryPercent.toFixed(0)}` : '—'}
                  </span>
                  {batteryPercent != null && (
                    <span className="text-xl font-bold text-slate-400 mb-1">%</span>
                  )}
                </div>
                {/* Ikon baterai visual */}
                <div className={`w-14 h-7 rounded-md border-2 relative flex items-center px-0.5 ${
                  batteryPercent == null    ? 'border-slate-300'
                  : batteryPercent < 10    ? 'border-rose-400'
                  : batteryPercent < 20    ? 'border-amber-400'
                  : batteryPercent < 50    ? 'border-sky-400'
                  : 'border-emerald-400'
                }`}>
                  {/* terminal baterai */}
                  <div className={`absolute -right-[5px] top-1/2 -translate-y-1/2 w-1.5 h-3 rounded-r-sm ${
                    batteryPercent == null ? 'bg-slate-300' : batteryPercent < 10 ? 'bg-rose-400' : batteryPercent < 20 ? 'bg-amber-400' : batteryPercent < 50 ? 'bg-sky-400' : 'bg-emerald-400'
                  }`} />
                  <div
                    className={`h-4 rounded-sm transition-all duration-700 ${
                      batteryPercent == null    ? 'bg-slate-200'
                      : batteryPercent < 10    ? 'bg-rose-400'
                      : batteryPercent < 20    ? 'bg-amber-400'
                      : batteryPercent < 50    ? 'bg-sky-400'
                      : 'bg-emerald-400'
                    }`}
                    style={{ width: batteryPercent != null ? `${Math.max(batteryPercent, 4)}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Progress bar tipis */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    batteryPercent == null    ? ''
                    : batteryPercent < 10    ? 'bg-rose-400'
                    : batteryPercent < 20    ? 'bg-amber-400'
                    : batteryPercent < 50    ? 'bg-sky-400'
                    : 'bg-emerald-400'
                  }`}
                  style={{ width: batteryPercent != null ? `${batteryPercent}%` : '0%' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">0%</span>
                <span className="text-[10px] text-slate-400">100%</span>
              </div>

              {/* Placeholder / peringatan */}
              {batteryPercent == null && (
                <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                  <Zap size={12} /> Menunggu data baterai dari ESP32...
                </p>
              )}
              {batteryPercent != null && batteryPercent < 10 && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle size={15} />
                  ⚡ Baterai kritis! Segera isi ulang atau aktifkan hibernasi.
                </div>
              )}
              {batteryPercent != null && batteryPercent < 20 && batteryPercent >= 10 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-semibold flex items-center gap-2">
                  <AlertCircle size={15} />
                  Baterai rendah. Pertimbangkan mengisi ulang atau atur hibernasi.
                </div>
              )}
            </div>
          </div>

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
                <MiniChart data={history} field="battery_level" color="bg-green-400" label="Baterai (%)" />
              </div>
            </div>
          )}

          {/* ── TABEL RIWAYAT DATA ── */}
          {history.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-white" />
                  <span className="text-sm font-black uppercase tracking-widest text-white">
                    Riwayat Data Monitoring
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">
                  {history.length} rekaman
                </span>
              </div>

              {/* Table wrapper dengan scroll horizontal untuk mobile */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Waktu</th>
                      <th className="text-center px-4 py-3 text-[11px] font-black text-amber-500 uppercase tracking-wider whitespace-nowrap">🌡 Suhu (°C)</th>
                      <th className="text-center px-4 py-3 text-[11px] font-black text-rose-500 uppercase tracking-wider whitespace-nowrap">❤️ BPM</th>
                      <th className="text-center px-4 py-3 text-[11px] font-black text-sky-500 uppercase tracking-wider whitespace-nowrap">💧 SpO₂ (%)</th>
                      <th className="text-center px-4 py-3 text-[11px] font-black text-emerald-500 uppercase tracking-wider whitespace-nowrap">🔋 Baterai (%)</th>
                      <th className="text-center px-4 py-3 text-[11px] font-black text-violet-500 uppercase tracking-wider whitespace-nowrap">📡 Gerak (mg)</th>
                      <th className="text-center px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().map((row, i) => {
                      const mag = (() => {
                        const ax = parseFloat(row.ax), ay = parseFloat(row.ay), az = parseFloat(row.az);
                        if (isNaN(ax) && isNaN(ay) && isNaN(az)) return null;
                        return Math.sqrt((isNaN(ax)?0:ax)**2 + (isNaN(ay)?0:ay)**2 + (isNaN(az)?0:az)**2).toFixed(0);
                      })();

                      const suhu = row.suhu != null ? parseFloat(row.suhu).toFixed(1) : null;
                      const hr   = row.heart_rate != null ? parseFloat(row.heart_rate).toFixed(0) : null;
                      const spo2 = row.spo2 != null ? parseFloat(row.spo2).toFixed(1) : null;
                      const bat  = row.battery_level != null ? parseFloat(row.battery_level).toFixed(0) : null;

                      // Status warna suhu
                      const suhuColor = suhu == null ? '' : suhu < 37.5 ? 'text-sky-600' : suhu <= 39.5 ? 'text-emerald-600' : 'text-rose-600';
                      const hrColor   = hr == null ? '' : hr < 60 ? 'text-sky-600' : hr <= 120 ? 'text-emerald-600' : 'text-rose-600';
                      const batColor  = bat == null ? '' : bat < 10 ? 'text-rose-600' : bat < 20 ? 'text-amber-600' : 'text-emerald-600';

                      const waktu = row.created_at
                        ? new Date(row.created_at).toLocaleString('id-ID', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                          })
                        : '—';

                      return (
                        <tr
                          key={row.id ?? i}
                          className={`border-b border-slate-50 transition-colors hover:bg-indigo-50/40 ${i === 0 ? 'bg-indigo-50/60 font-semibold' : ''}`}
                        >
                          <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap font-mono">
                            {i === 0 && (
                              <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black rounded-full uppercase">Terbaru</span>
                            )}
                            {waktu}
                          </td>
                          <td className={`px-4 py-2.5 text-center font-bold ${suhuColor || 'text-slate-400'}`}>
                            {suhu ?? <span className="text-slate-300">—</span>}
                          </td>
                          <td className={`px-4 py-2.5 text-center font-bold ${hrColor || 'text-slate-400'}`}>
                            {hr ?? <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold text-sky-700">
                            {spo2 ?? <span className="text-slate-300">—</span>}
                          </td>
                          <td className={`px-4 py-2.5 text-center font-bold ${batColor || 'text-slate-400'}`}>
                            {bat != null ? (
                              <span className="inline-flex items-center gap-1">
                                {bat}
                                <span className="w-8 h-1.5 rounded-full bg-slate-100 inline-block overflow-hidden align-middle">
                                  <span
                                    className={`h-full block rounded-full ${parseInt(bat) < 10 ? 'bg-rose-400' : parseInt(bat) < 20 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                    style={{ width: `${bat}%` }}
                                  />
                                </span>
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold text-violet-600">
                            {mag ?? <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.mode === 'kandang' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              {row.mode === 'kandang' ? '🏠 Kandang' : '🏷 Kalung'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer — legenda warna */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3 text-[10px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>Normal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400 inline-block"/>Rendah</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block"/>Tinggi / Kritis</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Perlu Perhatian</span>
              </div>
            </div>
          )}

          {/* ── STATUS KONEKSI PERANGKAT ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header strip biru/indigo — selalu konsisten */}
            <div className={`px-5 py-3 flex items-center justify-between ${latest ? 'bg-indigo-600' : 'bg-slate-400'}`}>
              <div className="flex items-center gap-2">
                {latest ? <Wifi size={16} className="text-white" /> : <WifiOff size={16} className="text-white" />}
                <span className="text-xs font-black uppercase tracking-widest text-white">
                  Koneksi Perangkat
                </span>
              </div>
              <div className="flex items-center gap-2">
                {lastUpdate && (
                  <span className="text-[10px] text-indigo-200 font-semibold">
                    Update: {lastUpdate.toLocaleTimeString("id-ID")}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${deviceStatus.cls}`}>
                  {deviceStatus.label}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ["Device ID",      latest?.device_id ?? "—"],
                  ["Mode Aktif",     mode ? (isKandang ? "Kandang" : "Kalung") : "—"],
                  ["Sumber Mode",    modeSource === 'iot' ? "Dari ESP32" : modeSource === 'species' ? `Default (${selectedPet?.species})` : "—"],
                  ["Baca Sensor",    "Tiap 1 menit"],
                  ["Batch Upload",   "Tiap 15 mnt (15 data)"],
                  ["Data Tersimpan", history.length + " rekaman"],
                  ["Firmware",       "esp32_iot_monitoring v4.0"],
                  ["Protokol",       "Deep Sleep + HTTPS Batch"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k}</p>
                    <p className="font-bold text-slate-700 mt-0.5 text-xs">{v}</p>
                  </div>
                ))}
              </div>

              {/* Banner bawah */}
              <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border ${
                latest
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                {latest
                  ? <><Wifi size={14} /> {deviceStatus.detail} — Supabase Realtime aktif, batch masuk tiap 15 menit</>
                  : <><WifiOff size={14} /> Menunggu data dari ESP32. Pastikan PET_ID di firmware sudah diisi.</>
                }
              </div>
            </div>
          </div>

        </>
      )}

      <HibernationControlModal
        isOpen={showHibernationModal}
        onClose={() => setShowHibernationModal(false)}
        petId={selectedPet?.id}
        deviceId={selectedPet?.device_id || 'esp32-01'}
        petName={selectedPet?.name}
        darkMode={darkMode}
        onSuccess={() => { }}
      />

    </div>
  );
};

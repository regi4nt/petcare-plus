// ─── MONITOR PAGE (IoT) dengan Battery Status ───────────────────────────
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
    if (!selectedPet?.id) return;
    fetchData(selectedPet.id);
    const channel = monitoringService.subscribe(selectedPet.id, () => {
      fetchData(selectedPet.id);
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
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${latest ? 'bg-emerald-400 text-white' : 'bg-slate-500 text-slate-200'}`}>
                  {latest ? '🟢 Terhubung' : '🔴 Menunggu'}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ["Device ID",      latest?.device_id ?? "—"],
                  ["Mode Aktif",     mode ? (isKandang ? "Kandang" : "Kalung") : "—"],
                  ["Sumber Mode",    modeSource === 'iot' ? "Dari ESP32" : modeSource === 'species' ? `Default (${selectedPet?.species})` : "—"],
                  ["Interval Kirim", mode ? (isKandang ? "5 detik" : "15 detik") : "—"],
                  ["Data Tersimpan", history.length + " rekaman"],
                  ["Firmware",       "esp32_iot_monitoring v2.1"],
                  ["Database",       "Supabase Realtime"],
                  ["Protokol",       "HTTPS + Realtime WS"],
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
                  ? <><Wifi size={14} /> Terhubung — Supabase Realtime aktif, data langsung dari ESP32</>
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

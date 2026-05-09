// ─── MONITOR PAGE (IoT) dengan Battery Status ───────────────────────────
const MonitorPage = ({ pets, selectedPet, setSelectedPet, darkMode = false }) =&gt; {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [showHibernationModal, setShowHibernationModal] = useState(false);

  const fetchData = useCallback(async (petId) =&gt; {
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

  useEffect(() =&gt; {
    if (!selectedPet?.id) return;
    fetchData(selectedPet.id);
    const channel = monitoringService.subscribe(selectedPet.id, () =&gt; {
      fetchData(selectedPet.id);
    });
    return () =&gt; { channel.unsubscribe(); };
  }, [selectedPet, fetchData]);

  const StatCard = ({ label, value, unit, icon: Icon, color, bg, status, statusColor }) =&gt; (
    &lt;div className=&#34;bg-white rounded-3xl p-5 shadow-sm border border-slate-100&#34;&gt;
      &lt;div className=&#34;flex items-start justify-between mb-3&#34;&gt;
        &lt;div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center`}&gt;
          &lt;Icon size={18} className={color} /&gt;
        &lt;/div&gt;
        {status &amp;&amp; (
          &lt;span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor || &#39;bg-emerald-100 text-emerald-700&#39;}`}&gt;
            {status}
          &lt;/span&gt;
        )}
      &lt;/div&gt;
      &lt;p className=&#34;text-xs text-slate-400 font-semibold mt-2&#34;&gt;{label}&lt;/p&gt;
      &lt;p className=&#34;text-2xl font-black text-slate-800 mt-0.5&#34;&gt;
        {value != null ? value : &lt;span className=&#34;text-slate-300&#34;&gt;--&lt;/span&gt;}
        {value != null &amp;&amp; &lt;span className=&#34;text-sm font-semibold text-slate-400 ml-1&#34;&gt;{unit}&lt;/span&gt;}
      &lt;/p&gt;
    &lt;/div&gt;
  );

  // ── Fungsi helper untuk status baterai ──────────────────────────
  const getBatteryStatus = (level, status) =&gt; {
    if (level == null) return { icon: &#39;🔋&#39;, label: &#39;Unknown&#39;, cls: &#39;bg-slate-100 text-slate-600&#39; };
    if (status === &#39;critical&#39; || level &lt; 10) return { icon: &#39;🪫&#39;, label: &#39;Kritis&#39;, cls: &#39;bg-rose-100 text-rose-700 font-bold&#39; };
    if (status === &#39;low&#39; || level &lt; 20) return { icon: &#39;⚠️&#39;, label: &#39;Rendah&#39;, cls: &#39;bg-amber-100 text-amber-700&#39; };
    if (level &gt;= 80) return { icon: &#39;🔋&#39;, label: &#39;Penuh&#39;, cls: &#39;bg-emerald-100 text-emerald-700&#39; };
    return { icon: &#39;🔋&#39;, label: &#39;Normal&#39;, cls: &#39;bg-sky-100 text-sky-700&#39; };
  };

  const batteryStatus = getBatteryStatus(latest?.battery_level, latest?.battery_status);
  const batteryPercent = latest?.battery_level ?? null;

  return (
    &lt;div className=&#34;space-y-6&#34;&gt;
      {/* Pet Selector */}
      &lt;div className=&#34;flex gap-2 overflow-x-auto pb-1 scrollbar-hide&#34;&gt;
        {pets.map(pet =&gt; {
          const Icon = PET_ICONS[pet.species] || Cat;
          const col  = PET_COLORS[pet.species] || PET_COLORS[&quot;Kucing&quot;];
          const active = selectedPet?.id === pet.id;
          return (
            &lt;button key={pet.id} onClick={() =&gt; setSelectedPet(pet)}
              className={`flex items-center gap-2.5 shrink-0 px-3.5 py-2.5 rounded-2xl border-2 transition-all duration-200 ${active ? &quot;border-indigo-500 bg-indigo-50 shadow-md&quot; : &quot;border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm&quot;}`}&gt;
              &lt;div className={`w-8 h-8 ${col.bg} rounded-xl flex items-center justify-center shrink-0`}&gt;
                &lt;Icon size={16} className={col.text} /&gt;
              &lt;/div&gt;
              &lt;div className=&#34;text-left&#34;&gt;
                &lt;p className={`text-sm font-bold leading-none ${active ? &quot;text-indigo-700&quot; : &quot;text-slate-700&quot;}`}&gt;{pet.name}&lt;/p&gt;
                &lt;p className=&#34;text-[10px] text-slate-400 mt-0.5&#34;&gt;{pet.species}&lt;/p&gt;
              &lt;/div&gt;
            &lt;/button&gt;
          );
        })}
      &lt;/div&gt;

      {/* Mode Status Bar */}
      &lt;div className={`rounded-3xl p-5 flex items-center justify-between transition-all ${isCageMode ? &quot;bg-amber-50 border border-amber-200&quot; : &quot;bg-indigo-50 border border-indigo-200&quot;}`}&gt;
        &lt;div className=&#34;flex items-center gap-3&#34;&gt;
          &lt;div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCageMode ? &quot;bg-amber-100&quot; : &quot;bg-indigo-100&quot;}`}&gt;
            {isKandang
              ? &lt;Home size={22} className=&#34;text-amber-600&#34; /&gt;
              : &lt;Tag  size={22} className=&#34;text-indigo-600&#34; /&gt;
            }
          &lt;/div&gt;
          &lt;div&gt;
            &lt;div className=&#34;flex items-center gap-2 flex-wrap&#34;&gt;
              &lt;p className={`font-black text-lg ${isKandang ? &quot;text-amber-700&quot; : &quot;text-indigo-700&quot;}`}&gt;
                Mode {isKandang ? &quot;Kandang&quot; : &quot;Kalung&quot;}
              &lt;/p&gt;
              {modeSource === &#39;iot&#39; &amp;&amp; (
                &lt;span className=&#34;text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1&#34;&gt;
                  &lt;Wifi size={9} /&gt; Dari IoT
                &lt;/span&gt;
              )}
              {modeSource === &#39;species&#39; &amp;&amp; (
                &lt;span className=&#34;text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center gap-1&#34;&gt;
                  ✦ Default Spesies
                &lt;/span&gt;
              )}
            &lt;/div&gt;
            &lt;p className={`text-xs font-semibold ${isKandang ? &quot;text-amber-600&quot; : &quot;text-indigo-500&quot;}`}&gt;
              {modeSource === &#39;iot&#39;
                ? isKandang
                  ? &quot;IoT terdeteksi di kandang — kirim data tiap 5 detik&quot;
                  : &quot;IoT terdeteksi bebas bergerak — kirim data tiap 15 detik&quot;
                : modeSource === &#39;species&#39;
                ? isKandang
                  ? `${selectedPet?.species} cenderung di kandang — menunggu konfirmasi IoT`
                  : `${selectedPet?.species} aktif di luar — menunggu konfirmasi IoT`
                : &quot;Menunggu data dari perangkat IoT...&quot;
              }
            &lt;/p&gt;
          &lt;/div&gt;
        &lt;/div&gt;
        &lt;div className=&#34;flex flex-col items-end gap-2 shrink-0&#34;&gt;
          {isLive &amp;&amp; (
            &lt;span className=&#34;flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full&#34;&gt;
              &lt;Radio size={11} /&gt; LIVE
            &lt;/span&gt;
          )}
          &lt;div className=&#34;flex items-center gap-2&#34;&gt;
            &lt;button
              onClick={() =&gt; setShowHibernationModal(true)}
              disabled={!selectedPet?.id}
              className=&#34;flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-sm&#34;
            &gt;
              &lt;Zap size={13} /&gt;
              &lt;span className=&#34;hidden sm:inline&#34;&gt;Hibernasi&lt;/span&gt;
            &lt;/button&gt;
            &lt;button onClick={() =&gt; fetchData(selectedPet?.id)} disabled={loading}
              className=&#34;w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 border border-slate-200 shadow-sm transition-all shrink-0&#34;&gt;
              &lt;RefreshCw size={15} className={loading ? &quot;animate-spin&quot; : &quot;&quot;} /&gt;
            &lt;/button&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      {loading &amp;&amp; !latest ? &lt;Spinner text=&#34;Mengambil data sensor dari Supabase...&#34; /&gt; : (
        &lt;&gt;
          {/* Battery Status Card — Prominent display */}
          {batteryPercent != null &amp;&amp; (
            &lt;div className={`rounded-3xl p-5 border ${
              batteryPercent &lt; 10 ? &#39;bg-rose-50 border-rose-200&#39; :
              batteryPercent &lt; 20 ? &#39;bg-amber-50 border-amber-200&#39; :
              batteryPercent &lt; 50 ? &#39;bg-sky-50 border-sky-200&#39; :
              &#39;bg-emerald-50 border-emerald-200&#39;
            }`}&gt;
              &lt;div className=&#34;flex items-center justify-between mb-3&#34;&gt;
                &lt;div className=&#34;flex items-center gap-3&#34;&gt;
                  &lt;span className=&#34;text-3xl leading-none&#34;&gt;{batteryStatus.icon}&lt;/span&gt;
                  &lt;div&gt;
                    &lt;p className={`font-black text-lg ${
                      batteryPercent &lt; 10 ? &#39;text-rose-700&#39; :
                      batteryPercent &lt; 20 ? &#39;text-amber-700&#39; :
                      batteryPercent &lt; 50 ? &#39;text-sky-700&#39; :
                      &#39;text-emerald-700&#39;
                    }`}&gt;Status Baterai&lt;/p&gt;
                    &lt;p className=&#34;text-xs text-slate-500 mt-0.5&#34;&gt;Daya perangkat IoT&lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
                &lt;div className=&#34;text-right&#34;&gt;
                  &lt;span className={`inline-block text-2xl font-black ${
                    batteryPercent &lt; 10 ? &#39;text-rose-600&#39; :
                    batteryPercent &lt; 20 ? &#39;text-amber-600&#39; :
                    batteryPercent &lt; 50 ? &#39;text-sky-600&#39; :
                    &#39;text-emerald-600&#39;
                  }`}&gt;{batteryPercent.toFixed(0)}%&lt;/span&gt;
                  &lt;span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 ${batteryStatus.cls}`}&gt;
                    {batteryStatus.label}
                  &lt;/span&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              
              {/* Battery progress bar */}
              &lt;div className=&#34;w-full h-3 bg-slate-200 rounded-full overflow-hidden&#34;&gt;
                &lt;div
                  className={`h-full transition-all duration-500 ${
                    batteryPercent &lt; 10 ? &#39;bg-rose-500&#39; :
                    batteryPercent &lt; 20 ? &#39;bg-amber-500&#39; :
                    batteryPercent &lt; 50 ? &#39;bg-sky-500&#39; :
                    &#39;bg-emerald-500&#39;
                  }`}
                  style={{ width: `${batteryPercent}%` }}
                /&gt;
              &lt;/div&gt;

              {/* Warning messages */}
              {batteryPercent &lt; 10 &amp;&amp; (
                &lt;div className=&#34;mt-3 p-3 bg-rose-100 rounded-xl text-sm text-rose-700 font-semibold flex items-center gap-2&#34;&gt;
                  &lt;AlertCircle size={16} /&gt;
                  ⚡ Baterai kritis! Segera isi ulang atau aktifkan hibernasi untuk menghemat daya.
                &lt;/div&gt;
              )}
              {batteryPercent &lt; 20 &amp;&amp; batteryPercent &gt;= 10 &amp;&amp; (
                &lt;div className=&#34;mt-3 p-3 bg-amber-100 rounded-xl text-sm text-amber-700 font-semibold flex items-center gap-2&#34;&gt;
                  &lt;AlertCircle size={16} /&gt;
                  Baterai rendah. Pertimbangkan mengisi ulang atau atur hibernasi.
                &lt;/div&gt;
              )}
            &lt;/div&gt;
          )}

          {/* Vital Signs Stat Cards */}
          &lt;div&gt;
            &lt;p className=&#34;text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2&#34;&gt;
              &lt;HeartPulse size={12} className=&#34;text-rose-400&#34; /&gt; Tanda Vital
            &lt;/p&gt;
            &lt;div className=&#34;grid grid-cols-2 lg:grid-cols-3 gap-4&#34;&gt;
              &lt;StatCard
                label=&#34;Suhu Tubuh&#34;
                value={latest?.suhu != null ? parseFloat(latest.suhu).toFixed(1) : null}
                unit=&#34;°C&#34; icon={Thermometer} color=&#34;text-amber-500&#34; bg=&#34;bg-amber-50&#34;
                status={suhuSt?.label} statusColor={suhuSt?.cls}
              /&gt;
              &lt;StatCard
                label=&#34;Detak Jantung&#34;
                value={latest?.heart_rate != null ? parseFloat(latest.heart_rate).toFixed(0) : null}
                unit=&#34;BPM&#34; icon={HeartPulse} color=&#34;text-rose-500&#34; bg=&#34;bg-rose-50&#34;
                status={hrSt?.label} statusColor={hrSt?.cls}
              /&gt;
              &lt;StatCard
                label=&#34;Saturasi O₂&#34;
                value={latest?.spo2 != null ? parseFloat(latest.spo2).toFixed(1) : null}
                unit=&#34;%&#34; icon={Activity} color=&#34;text-sky-500&#34; bg=&#34;bg-sky-50&#34;
                status={spo2St?.label} statusColor={spo2St?.cls}
              /&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          {/* Akselerasi / Gerakan Stat Cards */}
          &lt;div&gt;
            &lt;p className=&#34;text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2&#34;&gt;
              &lt;Dumbbell size={12} className=&#34;text-violet-400&#34; /&gt; Sensor Gerak (Akselerometer)
            &lt;/p&gt;
            &lt;div className=&#34;grid grid-cols-2 lg:grid-cols-4 gap-4&#34;&gt;
              &lt;StatCard label=&#34;Akselerasi X&#34; value={latest?.ax ?? null} unit=&#34;mg&#34; icon={Cpu} color=&#34;text-violet-500&#34; bg=&#34;bg-violet-50&#34; /&gt;
              &lt;StatCard label=&#34;Akselerasi Y&#34; value={latest?.ay ?? null} unit=&#34;mg&#34; icon={Cpu} color=&#34;text-purple-500&#34; bg=&#34;bg-purple-50&#34; /&gt;
              &lt;StatCard label=&#34;Akselerasi Z&#34; value={latest?.az ?? null} unit=&#34;mg&#34; icon={Cpu} color=&#34;text-fuchsia-500&#34; bg=&#34;bg-fuchsia-50&#34; /&gt;
              &lt;StatCard
                label=&#34;Intensitas Gerak&#34;
                value={(() =&gt; {
                  const ax = parseFloat(latest?.ax), ay = parseFloat(latest?.ay), az = parseFloat(latest?.az);
                  if (isNaN(ax) &amp;&amp; isNaN(ay) &amp;&amp; isNaN(az)) return null;
                  const mag = Math.sqrt((isNaN(ax)?0:ax)**2 + (isNaN(ay)?0:ay)**2 + (isNaN(az)?0:az)**2);
                  return mag.toFixed(0);
                })()}
                unit=&#34;mg&#34; icon={Radio} color=&#34;text-pink-500&#34; bg=&#34;bg-pink-50&#34;
              /&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          {/* Mini Charts */}
          {history.length &gt; 1 &amp;&amp; (
            &lt;div className=&#34;bg-white rounded-3xl p-6 shadow-sm border border-slate-100&#34;&gt;
              &lt;div className=&#34;flex items-center justify-between mb-5&#34;&gt;
                &lt;h3 className=&#34;font-black text-slate-800 flex items-center gap-2&#34;&gt;
                  &lt;Activity size={16} className=&#34;text-indigo-500&#34; /&gt; Grafik Histori Real-time
                &lt;/h3&gt;
                &lt;span className=&#34;text-xs text-slate-400 font-semibold&#34;&gt;{history.length} data terakhir&lt;/span&gt;
              &lt;/div&gt;
              &lt;div className=&#34;grid grid-cols-2 lg:grid-cols-4 gap-6&#34;&gt;
                &lt;MiniChart data={history} field=&#34;suhu&#34;       color=&#34;bg-amber-400&#34; label=&#34;Suhu (°C)&#34; /&gt;
                &lt;MiniChart data={history} field=&#34;heart_rate&#34; color=&#34;bg-rose-400&#34;  label=&#34;Detak Jantung (BPM)&#34; /&gt;
                &lt;MiniChart data={history} field=&#34;spo2&#34;       color=&#34;bg-sky-400&#34;   label=&#34;SpO₂ (%)&#34; /&gt;
                &lt;MiniChart data={history} field=&#34;battery_level&#34; color=&#34;bg-green-400&#34; label=&#34;Baterai (%)&#34; /&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          )}

          {/* Device Info */}
          &lt;div className=&#34;bg-white rounded-3xl p-5 shadow-sm border border-slate-100&#34;&gt;
            &lt;div className=&#34;flex items-center justify-between mb-4&#34;&gt;
              &lt;h3 className=&#34;font-black text-slate-800 flex items-center gap-2&#34;&gt;
                &lt;Wifi size={16} className=&#34;text-slate-400&#34; /&gt; Status Koneksi Perangkat
              &lt;/h3&gt;
              {lastUpdate &amp;&amp; (
                &lt;span className=&#34;text-xs text-slate-400 font-semibold&#34;&gt;
                  Update: {lastUpdate.toLocaleTimeString(&quot;id-ID&quot;)}
                &lt;/span&gt;
              )}
            &lt;/div&gt;
            &lt;div className=&#34;grid grid-cols-2 sm:grid-cols-4 gap-3&#34;&gt;
              {[
                [&quot;Device ID&quot;, latest?.device_id ?? &quot;—&quot;],
                [&quot;Mode Aktif&quot;, mode ? (isKandang ? &quot;Kandang&quot; : &quot;Kalung&quot;) : &quot;—&quot;],
                [&quot;Sumber Mode&quot;, modeSource === &#39;iot&#39; ? &quot;Dari ESP32&quot; : modeSource === &#39;species&#39; ? `Default (${selectedPet?.species})` : &quot;—&quot;],
                [&quot;Interval Kirim&quot;, mode ? (isKandang ? &quot;5 detik&quot; : &quot;15 detik&quot;) : &quot;—&quot;],
                [&quot;Data Tersimpan&quot;, history.length + &quot; rekaman&quot;],
                [&quot;Firmware&quot;, &quot;esp32_iot_monitoring v2.1&quot;],
                [&quot;Database&quot;, &quot;Supabase Realtime&quot;],
                [&quot;Status Koneksi&quot;, latest ? &quot;🟢 Terhubung&quot; : &quot;🔴 Menunggu&quot;],
              ].map(([k, v]) =&gt; (
                &lt;div key={k} className=&#34;bg-slate-50 rounded-2xl p-3&#34;&gt;
                  &lt;p className=&#34;text-[10px] font-bold text-slate-400 uppercase tracking-wider&#34;&gt;{k}&lt;/p&gt;
                  &lt;p className=&#34;font-bold text-slate-700 mt-0.5 text-xs&#34;&gt;{v}&lt;/p&gt;
                &lt;/div&gt;
              ))}
            &lt;/div&gt;
            &lt;div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold ${latest ? &quot;bg-emerald-50 text-emerald-700&quot; : &quot;bg-slate-100 text-slate-500&quot;}`}&gt;
              {latest
                ? &lt;&gt;&lt;Wifi size={14} /&gt; Terhubung — Supabase Realtime aktif, data langsung dari ESP32&lt;/&gt;
                : &lt;&gt;&lt;WifiOff size={14} /&gt; Menunggu data dari ESP32. Pastikan PET_ID di firmware sudah diisi.&lt;/&gt;
              }
            &lt;/div&gt;
          &lt;/div&gt;

        &lt;/&gt;
      )}

      &lt;HibernationControlModal
        isOpen={showHibernationModal}
        onClose={() =&gt; setShowHibernationModal(false)}
        petId={selectedPet?.id}
        deviceId={selectedPet?.device_id || &#39;esp32-01&#39;}
        petName={selectedPet?.name}
        darkMode={darkMode}
        onSuccess={() =&gt; { }}
      /&gt;

    &lt;/div&gt;
  );
};

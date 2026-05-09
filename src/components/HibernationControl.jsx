import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Zap, Moon, Sun, RotateCcw, Clock, History,
  CheckCircle2, AlertCircle, Loader2, Radio, BatteryLow,
  BatteryCharging, ChevronRight
} from 'lucide-react';
import { deviceCommandService } from '../lib/api';

// ─── STATUS BADGE ─────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    pending:  { label: '⏳ Tertunda',  cls: 'bg-amber-100 text-amber-700' },
    executed: { label: '✓ Berhasil',   cls: 'bg-emerald-100 text-emerald-700' },
    failed:   { label: '✗ Gagal',      cls: 'bg-rose-100 text-rose-700' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ─── COMMAND ICON ─────────────────────────────────────────────────────
const CommandIcon = ({ command }) => {
  if (command === 'hibernate') return <Moon size={14} className="text-indigo-500" />;
  if (command === 'resume')    return <Sun  size={14} className="text-emerald-500" />;
  if (command === 'restart')   return <RotateCcw size={14} className="text-amber-500" />;
  return <Zap size={14} className="text-slate-400" />;
};

// ─── FORMAT TIME ──────────────────────────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── DURATION PRESETS ─────────────────────────────────────────────────
const DURATION_PRESETS = [
  { label: '15 Menit',  value: 15,  emoji: '⏱️' },
  { label: '30 Menit',  value: 30,  emoji: '☕' },
  { label: '1 Jam',     value: 60,  emoji: '🌙' },
  { label: '2 Jam',     value: 120, emoji: '😴' },
  { label: '8 Jam',     value: 480, emoji: '🌛' },
  { label: 'Manual',    value: 0,   emoji: '⚙️' },
];

// ─── HIBERNATION CONTROL MODAL ─────────────────────────────────────────
export const HibernationControlModal = ({
  isOpen,
  onClose,
  petId,
  deviceId = 'esp32-01',
  petName = 'Hewan',
  onSuccess,
}) => {
  const [activeTab, setActiveTab]       = useState('kontrol');
  const [duration, setDuration]         = useState(30);
  const [customDur, setCustomDur]       = useState('');
  const [selectedPreset, setPreset]     = useState(30);
  const [isLoading, setIsLoading]       = useState(false);
  const [history, setHistory]           = useState([]);
  const [histLoading, setHistLoading]   = useState(false);
  const [feedback, setFeedback]         = useState(null); // { type: 'success'|'error', msg }
  const [isHibernating, setIsHibernating] = useState(false);

  // ── Fetch history ──────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!petId) return;
    setHistLoading(true);
    try {
      const rows = await deviceCommandService.getHistory(petId, 20);
      setHistory(rows);

      // Cek apakah ada command hibernate yang masih aktif
      const lastCmd = rows[0];
      if (lastCmd) {
        if (lastCmd.command === 'hibernate' && lastCmd.status !== 'failed') {
          // Cek apakah masih dalam durasi hibernasi
          const sentAt   = new Date(lastCmd.created_at).getTime();
          const durMs    = (lastCmd.payload?.duration_minutes || 30) * 60 * 1000;
          const stillOn  = (Date.now() - sentAt) < durMs;
          setIsHibernating(stillOn && lastCmd.status !== 'failed');
        } else if (['resume', 'restart'].includes(lastCmd.command)) {
          setIsHibernating(false);
        }
      }
    } catch (e) {
      console.error('Fetch history error', e);
    } finally {
      setHistLoading(false);
    }
  }, [petId]);

  // ── Subscribe realtime updates ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !petId) return;
    fetchHistory();
    const channel = deviceCommandService.subscribeStatus(petId, (updatedRow) => {
      setHistory(prev =>
        prev.map(r => r.id === updatedRow.id ? updatedRow : r)
      );
    });
    return () => { try { channel.unsubscribe(); } catch (_) {} };
  }, [isOpen, petId, fetchHistory]);

  // ── Send command ───────────────────────────────────────────────────
  const sendCommand = async (command) => {
    if (!petId) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const finalDuration = selectedPreset === 0
        ? parseInt(customDur, 10) || 30
        : selectedPreset;

      const payload = command === 'hibernate'
        ? { duration_minutes: finalDuration }
        : {};

      await deviceCommandService.send(petId, deviceId, command, payload);

      setFeedback({
        type: 'success',
        msg: command === 'hibernate'
          ? `✓ Perintah hibernasi ${finalDuration} menit terkirim ke ESP32!`
          : command === 'resume'
          ? '✓ Perintah bangun sensor terkirim ke ESP32!'
          : '✓ Perintah restart terkirim ke ESP32!',
      });

      if (command === 'hibernate') setIsHibernating(true);
      if (command === 'resume' || command === 'restart') setIsHibernating(false);

      await fetchHistory();
      onSuccess?.();
    } catch (e) {
      setFeedback({ type: 'error', msg: `✗ Gagal mengirim perintah: ${e.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden" style={{maxHeight: '90dvh'}}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 pt-6 pb-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <BatteryLow size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg leading-tight">Kontrol Hibernasi</h2>
              <p className="text-indigo-200 text-xs font-semibold">{petName} · {deviceId}</p>
            </div>
          </div>

          {/* Status indicator */}
          <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
            isHibernating
              ? 'bg-amber-400/30 text-amber-100'
              : 'bg-emerald-400/30 text-emerald-100'
          }`}>
            {isHibernating
              ? <><Moon size={12} /> Sensor sedang hibernasi — data berhenti dikirim</>
              : <><Radio size={12} /> Sensor aktif — data real-time berjalan</>
            }
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        <div className="flex border-b border-slate-100 px-6 pt-1 shrink-0">
          {[
            { id: 'kontrol', label: '⚡ Kontrol' },
            { id: 'riwayat', label: '📋 Riwayat' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'riwayat') fetchHistory(); }}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable content area ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

        {/* ── Feedback Banner ─────────────────────────────────── */}
        {feedback && (
          <div className={`mx-5 mt-4 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {feedback.type === 'success'
              ? <CheckCircle2 size={15} />
              : <AlertCircle size={15} />
            }
            {feedback.msg}
          </div>
        )}

        {/* ── TAB: KONTROL ─────────────────────────────────────── */}
        {activeTab === 'kontrol' && (
          <div className="px-6 py-5 space-y-5">

            {/* Durasi */}
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                Durasi Hibernasi
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DURATION_PRESETS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setPreset(p.value); setDuration(p.value); }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                      selectedPreset === p.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
              {selectedPreset === 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    placeholder="Menit (1–1440)"
                    value={customDur}
                    onChange={e => setCustomDur(e.target.value)}
                    className="flex-1 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:border-indigo-400 focus:outline-none transition-all"
                  />
                  <span className="text-sm text-slate-400 font-semibold">menit</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Hibernate */}
              <button
                onClick={() => sendCommand('hibernate')}
                disabled={isLoading || !petId}
                className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-4 rounded-2xl font-bold transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Moon size={16} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black">Hibernasi Sekarang</p>
                    <p className="text-xs text-indigo-200 font-semibold">
                      Matikan sensor selama {selectedPreset === 0 ? (customDur || '?') : selectedPreset} menit
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="opacity-60 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Resume */}
              <button
                onClick={() => sendCommand('resume')}
                disabled={isLoading || !petId}
                className="w-full flex items-center justify-between bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-4 rounded-2xl font-bold transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sun size={16} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black">⚡ Bangun Sensor Sekarang</p>
                    <p className="text-xs text-emerald-100 font-semibold">Aktifkan kembali semua sensor ESP32</p>
                  </div>
                </div>
                <ChevronRight size={16} className="opacity-60 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Restart */}
              <button
                onClick={() => sendCommand('restart')}
                disabled={isLoading || !petId}
                className="w-full flex items-center justify-between bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-4 rounded-2xl font-bold transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black">Restart ESP32</p>
                    <p className="text-xs text-amber-100 font-semibold">Reboot perangkat, sensor aktif kembali</p>
                  </div>
                </div>
                <ChevronRight size={16} className="opacity-60 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Info box */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 space-y-1.5 border border-slate-100">
              <p className="font-black text-slate-600 mb-2">ℹ️ Cara kerja hibernasi</p>
              <p>• Perintah dikirim ke database Supabase (tabel <code className="bg-slate-200 px-1 rounded">device_commands</code>)</p>
              <p>• ESP32 polling setiap 5 detik, lalu eksekusi perintah</p>
              <p>• Saat hibernasi: sensor berhenti baca data, LED merah berkedip</p>
              <p>• Auto-bangun setelah durasi habis atau perintah <em>resume</em></p>
            </div>
          </div>
        )}

        {/* ── TAB: RIWAYAT ─────────────────────────────────────── */}
        {activeTab === 'riwayat' && (
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Riwayat Perintah
              </p>
              <button
                onClick={fetchHistory}
                disabled={histLoading}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                {histLoading
                  ? <Loader2 size={12} className="animate-spin" />
                  : <History size={12} />
                }
                Refresh
              </button>
            </div>

            {histLoading && history.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Loader2 size={28} className="animate-spin mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold">Memuat riwayat...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <BatteryCharging size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">Belum ada riwayat perintah</p>
                <p className="text-xs mt-1">Kirim perintah pertama dari tab Kontrol</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((row, idx) => (
                  <div
                    key={row.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      idx === 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          row.command === 'hibernate' ? 'bg-indigo-100'
                          : row.command === 'resume'  ? 'bg-emerald-100'
                          : 'bg-amber-100'
                        }`}>
                          <CommandIcon command={row.command} />
                        </div>
                        <div>
                          <p className="font-black text-slate-700 text-sm capitalize">
                            {row.command === 'hibernate' ? '🌙 Hibernasi'
                             : row.command === 'resume'  ? '☀️ Resume'
                             : '🔄 Restart'}
                          </p>
                          {row.command === 'hibernate' && row.payload?.duration_minutes && (
                            <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Clock size={9} /> {row.payload.duration_minutes} menit
                            </p>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                      <div>
                        <span className="font-bold text-slate-400 uppercase">Dikirim</span>
                        <p className="font-semibold">{fmtDate(row.created_at)}</p>
                        <p className="font-mono">{fmtTime(row.created_at)}</p>
                      </div>
                      {row.executed_at && (
                        <div>
                          <span className="font-bold text-slate-400 uppercase">Dieksekusi</span>
                          <p className="font-semibold">{fmtDate(row.executed_at)}</p>
                          <p className="font-mono">{fmtTime(row.executed_at)}</p>
                        </div>
                      )}
                    </div>

                    {row.error_message && (
                      <p className="mt-2 text-[10px] text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl font-semibold">
                        ✗ {row.error_message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        </div>{/* end scrollable content */}

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-all"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default HibernationControlModal;

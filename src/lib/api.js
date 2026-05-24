import { supabase } from './supabase';

// ─── AUTH ─────────────────────────────────────────────────────────────

export const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email, password, name, phone) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });
    if (error) throw error;
    // Role 'Demo' di-set oleh trigger handle_new_user di Supabase (lihat migration SQL).
    // Tidak perlu update di sini — akan bentrok dengan RLS dan menyebabkan 500 error.
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async resetPassword(email) {
    // redirectTo harus sama persis dengan URL yang di-whitelist
    // di Supabase Dashboard > Authentication > URL Configuration
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};

// ─── PROFILES ─────────────────────────────────────────────────────────

export const profileService = {
  async get(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async update(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── Streak: hitung & perbarui streak login harian ─────────────────
  async updateStreak(userId) {
    const today = new Date().toISOString().split('T')[0];

    const { data: prof, error: fetchErr } = await supabase
      .from('profiles')
      .select('login_streak, last_login_date')
      .eq('id', userId)
      .single();
    if (fetchErr) throw fetchErr;

    const lastDate = prof?.last_login_date;

    // Sudah login hari ini → tidak perlu update
    if (lastDate === today) {
      return { streak: prof.login_streak || 1, changed: false };
    }

    // Hitung streak baru
    let newStreak = 1;
    if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (lastDate === yesterdayStr) {
        newStreak = (prof.login_streak || 0) + 1;
      }
      // else: lewat lebih dari 1 hari → reset ke 1
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ login_streak: newStreak, last_login_date: today })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return { streak: newStreak, changed: true, profile: data };
  },
};

// ─── PETS ─────────────────────────────────────────────────────────────

export const petService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(userId, pet) {
    const { data, error } = await supabase
      .from('pets')
      .insert({ ...pet, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(petId, updates) {
    const { data, error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', petId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(petId) {
    const { error } = await supabase.from('pets').delete().eq('id', petId);
    if (error) throw error;
  },
};

// ─── SCHEDULES ────────────────────────────────────────────────────────

export const scheduleService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(userId, schedule) {
    const { data, error } = await supabase
      .from('schedules')
      .insert({ ...schedule, user_id: userId, done: false })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async toggleDone(scheduleId, done) {
    const { data, error } = await supabase
      .from('schedules')
      .update({ done })
      .eq('id', scheduleId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(scheduleId) {
    const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
    if (error) throw error;
  },
};

// ─── MEDICAL RECORDS ──────────────────────────────────────────────────

export const recordService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(userId, record) {
    const { data, error } = await supabase
      .from('medical_records')
      .insert({ ...record, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(recordId) {
    const { error } = await supabase.from('medical_records').delete().eq('id', recordId);
    if (error) throw error;
  },
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────

export const notifService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async create(userId, notif) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ ...notif, user_id: userId, unread: true })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markAllRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ unread: false })
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteAll(userId) {
    const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
    if (error) throw error;
  },

  async markOneRead(notifId) {
    const { error } = await supabase
      .from('notifications')
      .update({ unread: false })
      .eq('id', notifId);
    if (error) throw error;
  },
};

// ─── MONITORING (IoT) ─────────────────────────────────────────────────

export const monitoringService = {
  /**
   * Ambil N data terbaru untuk pet tertentu.
   * @param {string} petId - UUID pet
   * @param {number} limit - jumlah data (default: 20)
   */
  async getLatest(petId, limit = 20) {
    const { data, error } = await supabase
      .from('monitoring')
      .select('*')
      .eq('pet_id', petId)
      // created_at DESC → batch terbaru dulu
      // reading_index DESC → dalam batch yang sama, baris terbaru (index 14) dulu
      .order('created_at', { ascending: false })
      .order('reading_index', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /**
   * Ambil 1 data terbaru untuk pet tertentu.
   * @param {string} petId - UUID pet
   */
  async getOne(petId) {
    const { data, error } = await supabase
      .from('monitoring')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })
      .order('reading_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Subscribe realtime ke data monitoring untuk pet tertentu.
   * Callback dipanggil setiap ada INSERT baru dari ESP32.
   * @param {string} petId
   * @param {function} onInsert - callback(newRow)
   * @returns channel (panggil channel.unsubscribe() untuk cleanup)
   */
  subscribe(petId, onInsert) {
    const channel = supabase
      .channel(`monitoring:${petId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'monitoring',
          filter: `pet_id=eq.${petId}`,
        },
        (payload) => {
          onInsert(payload.new);
        }
      )
      .subscribe();
    return channel;
  },

  /**
   * Ambil data terkalkulasi (rata-rata) dari N pembacaan terakhir.
   * Digunakan oleh Dashboard — bukan data raw langsung dari IoT.
   * @param {string} petId - UUID pet
   * @param {number} limit - jumlah pembacaan yang dikalkulasi (default: 20)
   * @returns {{ avg_suhu, avg_heart_rate, avg_spo2, latest_mode, reading_count, last_reading_at, ax_history } | null}
   */
  async getCalculated(petId, limit = 20) {
    const { data, error } = await supabase
      .from('monitoring')
      .select('suhu, heart_rate, spo2, ax, ay, az, mode, battery_level, battery_status, created_at')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (!data || data.length === 0) return null;

    const avg = (field) => {
      const vals = data.map(d => parseFloat(d[field])).filter(v => !isNaN(v));
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };

    // Kembalikan ax_history dalam urutan ascending (lama → baru) untuk bar chart
    const axHistory = data.slice().reverse().map(d => d.ax);

    return {
      avg_suhu: avg('suhu'),
      avg_heart_rate: avg('heart_rate'),
      avg_spo2: avg('spo2'),
      avg_battery_level: avg('battery_level'),
      latest_mode: data[0]?.mode,
      latest_battery_level: data[0]?.battery_level ?? null,
      latest_battery_status: data[0]?.battery_status ?? 'unknown',
      reading_count: data.length,
      last_reading_at: data[0]?.created_at,
      ax_history: axHistory,
    };
  },

  /**
   * Ambil riwayat skor kesehatan harian (7 hari terakhir = 6 hari lalu + hari ini).
   * Data dikelompokkan per hari, dikalkulasi rata-rata vital sign, lalu diberi skor 0-100.
   * @param {string} petId
   * @param {number} days - jumlah hari (default: 7)
   * @returns {Array<{ date, score, reading_count, avg_suhu, avg_hr, avg_spo2 }>}
   */
  async getDailyHealth(petId, days = 7) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (days - 1));
    fromDate.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('monitoring')
      .select('suhu, heart_rate, spo2, created_at')
      .eq('pet_id', petId)
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Bangun map untuk setiap hari
    const dayMap = {};
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];
      dayMap[key] = { date: key, readings: [] };
    }

    // Kelompokkan data per hari
    (data || []).forEach(row => {
      const key = (row.created_at || '').split('T')[0];
      if (dayMap[key]) dayMap[key].readings.push(row);
    });

    // Kalkulasi skor kesehatan per hari
    return Object.values(dayMap).map(({ date, readings }) => {
      if (!readings.length) return { date, score: null, reading_count: 0, avg_suhu: null, avg_hr: null, avg_spo2: null };

      const avg = (field) => {
        const vals = readings.map(r => parseFloat(r[field])).filter(v => !isNaN(v));
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      };

      const avg_suhu = avg('suhu');
      const avg_hr   = avg('heart_rate');
      const avg_spo2 = avg('spo2');

      // Skor kesehatan berbobot: suhu 35%, detak jantung 35%, SpO2 30%
      let tw = 0, ts = 0;
      if (avg_suhu != null) {
        tw += 35;
        if (avg_suhu >= 37.5 && avg_suhu <= 39.5) ts += 35;
        else if ((avg_suhu >= 36.0 && avg_suhu < 37.5) || (avg_suhu > 39.5 && avg_suhu <= 41.0)) ts += 20;
        else ts += 5;
      }
      if (avg_hr != null) {
        tw += 35;
        if (avg_hr >= 60 && avg_hr <= 140) ts += 35;
        else if ((avg_hr >= 50 && avg_hr < 60) || (avg_hr > 140 && avg_hr <= 160)) ts += 20;
        else ts += 5;
      }
      if (avg_spo2 != null) {
        tw += 30;
        if (avg_spo2 >= 95) ts += 30;
        else if (avg_spo2 >= 90) ts += 18;
        else ts += 5;
      }

      const score = tw > 0 ? Math.round((ts / tw) * 100) : null;
      return { date, score, reading_count: readings.length, avg_suhu, avg_hr, avg_spo2 };
    });
  },

  /**
   * Hapus semua data monitoring untuk pet tertentu.
   * @param {string} petId
   */
  async deleteAll(petId) {
    const { error } = await supabase
      .from('monitoring')
      .delete()
      .eq('pet_id', petId);
    if (error) throw error;
  },
};

// ─── DEVICE COMMANDS (Hibernasi ESP32) ────────────────────────────────

export const deviceCommandService = {
  /**
   * Kirim perintah ke ESP32 via tabel device_commands.
   * @param {string} petId     - UUID pet
   * @param {string} deviceId  - ID perangkat ESP32 (misal: 'esp32-01')
   * @param {string} command   - 'hibernate' | 'resume' | 'restart'
   * @param {object} payload   - config tambahan, misal { duration_minutes: 30 }
   * @returns {object} row yang baru dibuat
   */
  async send(petId, deviceId, command, payload = {}) {
    const { data, error } = await supabase
      .from('device_commands')
      .insert({
        pet_id:    petId,
        device_id: deviceId,
        command,
        payload,
        status:    'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Ambil riwayat perintah untuk pet tertentu.
   * @param {string} petId  - UUID pet
   * @param {number} limit  - jumlah data (default: 20)
   * @returns {Array} daftar perintah, diurutkan dari terbaru
   */
  async getHistory(petId, limit = 20) {
    const { data, error } = await supabase
      .from('device_commands')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /**
   * Ambil perintah aktif (status: pending) untuk perangkat tertentu.
   * Digunakan untuk cek apakah sedang ada hibernasi aktif.
   * @param {string} deviceId
   * @returns {object|null} perintah pending terakhir
   */
  async getPendingCommand(deviceId) {
    const { data, error } = await supabase
      .from('device_commands')
      .select('*')
      .eq('device_id', deviceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Subscribe realtime ke perubahan status perintah untuk pet tertentu.
   * Berguna untuk update UI saat ESP32 mengeksekusi perintah.
   * @param {string}   petId     - UUID pet
   * @param {function} onUpdate  - callback(updatedRow)
   * @returns channel (panggil channel.unsubscribe() untuk cleanup)
   */
  subscribeStatus(petId, onUpdate) {
    const channel = supabase
      .channel(`device_commands:${petId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',   // INSERT & UPDATE
          schema: 'public',
          table:  'device_commands',
          filter: `pet_id=eq.${petId}`,
        },
        (payload) => {
          onUpdate(payload.new);
        }
      )
      .subscribe();
    return channel;
  },
};

// ─── ADMIN SERVICE ────────────────────────────────────────────────────

export const adminService = {
  /**
   * Ambil semua profil pengguna (hanya Admin yang bisa).
   */
  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, phone, role, max_pets, created_at, login_streak, last_login_date')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[adminService.getAllProfiles] RLS error:', error.message);
      throw new Error(`Gagal ambil profiles: ${error.message}. Pastikan RLS policy sudah dijalankan dari migration SQL.`);
    }
    return data || [];
  },

  /**
   * Update role pengguna (Admin only).
   * @param {string} userId - UUID pengguna target
   * @param {string} role   - 'Subscribe' | 'Demo' | 'Admin'
   */
  async updateRole(userId, role) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── EXTENDED ADMIN SERVICE (append) ───────────────────────────────────────
// Patch adminService dengan fungsi tambahan
Object.assign(adminService, {
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMaxPets(userId, maxPets) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ max_pets: maxPets })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAllPets() {
    // Ambil data pets beserta device_id terbaru dari monitoring (jika kolom iot_device_id belum ada di pets)
    const { data: petsData, error: petsErr } = await supabase
      .from('pets')
      .select('id, name, species, breed, user_id, created_at')
      .order('created_at', { ascending: false });
    if (petsErr) throw petsErr;
    const pets = petsData || [];

    // Coba ambil kolom iot_device_id jika sudah ada (migrasi sudah dijalankan)
    const { data: iotData } = await supabase
      .from('pets')
      .select('id, iot_device_id')
      .not('iot_device_id', 'is', null);

    const iotMap = {};
    (iotData || []).forEach(p => { if (p.iot_device_id) iotMap[p.id] = p.iot_device_id; });

    // Fallback: ambil device_id terbaru dari monitoring per pet
    const { data: monData } = await supabase
      .from('monitoring')
      .select('pet_id, device_id, created_at')
      .order('created_at', { ascending: false });
    (monData || []).forEach(m => {
      if (m.pet_id && m.device_id && !iotMap[m.pet_id]) {
        iotMap[m.pet_id] = m.device_id;
      }
    });

    // iot_from_db = true  → nilai dari kolom iot_device_id di tabel pets (bisa diedit)
    // iot_from_db = false → nilai dari monitoring terbaru (read-only, hanya info)
    return pets.map(p => {
      const fromDb = (iotData || []).some(d => d.id === p.id && d.iot_device_id);
      return { ...p, iot_device_id: iotMap[p.id] || null, iot_from_db: fromDb };
    });
  },

  async updatePetIotId(petId, iotDeviceId) {
    const { data, error } = await supabase
      .from('pets')
      .update({ iot_device_id: iotDeviceId || null })
      .eq('id', petId)
      .select('id, iot_device_id')
      .single();
    if (error) {
      // Kolom iot_device_id belum ada — arahkan admin untuk menjalankan migrasi
      if (error.message?.includes('column') || error.code === '42703') {
        throw new Error('Kolom iot_device_id belum ada. Jalankan migrasi SQL: ALTER TABLE pets ADD COLUMN iot_device_id text;');
      }
      throw error;
    }
    return data;
  },

  async deletePet(petId) {
    const { error } = await supabase.from('pets').delete().eq('id', petId);
    if (error) throw error;
  },
});

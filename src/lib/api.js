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

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        phone,
        role: 'Basic',
      });
    }
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
      .order('created_at', { ascending: false })
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
      .select('suhu, heart_rate, spo2, ax, ay, az, mode, created_at')
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
      latest_mode: data[0]?.mode,
      reading_count: data.length,
      last_reading_at: data[0]?.created_at,
      ax_history: axHistory,
    };
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

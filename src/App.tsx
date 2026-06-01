import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useWarehouse } from './hooks/useWarehouse';
import WarehouseForm from './components/WarehouseForm';
import ZoneManager from './components/ZoneModal';
import SensorManager from './components/SensorManager';
import InventoryManager from './components/InventoryManager';
import AIDashboard from './components/AIDashboard';
import {
  Building2, Activity, Bell, MapPin,
  Plus, Layers, Box, RefreshCw, LogOut
} from 'lucide-react';
import type { Warehouse } from './types/database';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [showZoneManager, setShowZoneManager] = useState(false);
  const [showSensorManager, setShowSensorManager] = useState(false);
  const [showInventoryManager, setShowInventoryManager] = useState(false);

  const { warehouse, zones, inventory, sensors, alerts, refresh } = useWarehouse(selectedWarehouseId);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from('warehouses')
          .select('*')
          .eq('owner_id', session.user.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setWarehouses(data);
          setSelectedWarehouseId(data[0].id);
        }
      }
      setLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshWarehouses = async () => {
    if (user) {
      const { data } = await supabase
        .from('warehouses')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setWarehouses(data);
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { email } }
        });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWarehouses([]);
    setSelectedWarehouseId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Smart Warehouse</h1>
            <p className="text-slate-400 mt-2">AI asosida aqlli omborxona boshqaruvi</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              {authMode === 'login' ? 'Tizimga kirish' : 'Ro\'yxatdan o\'tish'}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Parol</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {authError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {authLoading ? 'Yuklanmoqda...' : authMode === 'login' ? 'Kirish' : 'Ro\'yxatdan o\'tish'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-emerald-400 hover:text-emerald-300 text-sm"
              >
                {authMode === 'login' ? 'Hisobingiz yo\'qmi? Ro\'yxatdan o\'ting' : 'Hisobingiz bormi? Tizimga kiring'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Smart Warehouse</h1>
                <p className="text-sm text-slate-400">AI tahlil tizimi</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {warehouses.length > 0 && (
                <select
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={selectedWarehouseId || ''}
                  onChange={(e) => setSelectedWarehouseId(e.target.value || null)}
                >
                  {warehouses.map(w => (
                    <option className='bg-slate-800' key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              )}

              {warehouse && (
                <button
                  onClick={refresh}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Ma'lumotlarni yangilash"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setShowWarehouseForm(true)}
                className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                title="Yangi omborxona"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                onClick={handleSignOut}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                title="Chiqish"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {warehouses.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Omborxonalar mavjud emas</h2>
            <p className="text-slate-500 mb-6">Boshlash uchun yangi omborxona yarating</p>
            <button
              onClick={() => setShowWarehouseForm(true)}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Yangi omborxona yaratish
            </button>
          </div>
        ) : warehouse ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-800">{warehouse.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      warehouse.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      warehouse.status === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {warehouse.status === 'active' ? 'Faol' : warehouse.status === 'maintenance' ? 'Ta\'mirlash' : 'Oflayn'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span>{warehouse.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-800">{warehouse.used_capacity}</p>
                  <p className="text-sm text-slate-500">/ {warehouse.total_capacity} birlik</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {((warehouse.used_capacity / warehouse.total_capacity) * 100).toFixed(1)}% ishlatilgan
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowZoneManager(true)}
                className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Layers className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-slate-800">Zonalar</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{zones.length}</p>
                <p className="text-xs text-slate-500">{zones.filter(z => z.status === 'active').length} faol</p>
              </button>

              <button
                onClick={() => setShowSensorManager(true)}
                className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                    <Activity className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="font-medium text-slate-800">Sensorlar</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{sensors.length}</p>
                <p className="text-xs text-slate-500">{sensors.filter(s => s.status === 'active').length} ishlamoqda</p>
              </button>

              <button
                onClick={() => setShowInventoryManager(true)}
                className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Box className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium text-slate-800">Inventar</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{inventory.length}</p>
                <p className="text-xs text-slate-500">{inventory.filter(i => i.quantity <= i.min_quantity).length} kam qolgan</p>
              </button>

              <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Bell className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="font-medium text-slate-800">Ogohlantirishlar</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{alerts.filter(a => !a.is_resolved).length}</p>
                <p className="text-xs text-slate-500">{alerts.filter(a => a.severity === 'critical').length} kritik</p>
              </div>
            </div>

            <AIDashboard
              warehouse={warehouse}
              zones={zones}
              inventory={inventory}
              sensors={sensors}
              alerts={alerts}
            />

            {sensors.filter(s => s.status === 'active').length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-600" />
                  So'ngi sensor o'lchovlari
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sensors.filter(s => s.status === 'active').slice(0, 4).map(sensor => (
                    <div key={sensor.id} className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600 truncate">{sensor.name}</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {sensor.last_reading !== null && sensor.last_reading !== undefined
                          ? `${sensor.last_reading.toFixed(1)}${sensor.unit || ''}`
                          : '--'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{sensor.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.filter(a => !a.is_resolved).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-red-500" />
                    Faol ogohlantirishlar
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {alerts.filter(a => !a.is_resolved).slice(0, 5).map(alert => (
                    <div
                      key={alert.id}
                      className={`p-4 ${
                        alert.severity === 'critical' ? 'bg-red-50 border-l-4 border-red-500' :
                        alert.severity === 'high' ? 'bg-orange-50 border-l-4 border-orange-500' :
                        alert.severity === 'medium' ? 'bg-amber-50 border-l-4 border-amber-500' :
                        'bg-blue-50 border-l-4 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{alert.title}</p>
                          <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(alert.created_at).toLocaleString('uz-UZ')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                          alert.severity === 'critical' ? 'bg-red-500 text-white' :
                          alert.severity === 'high' ? 'bg-orange-500 text-white' :
                          alert.severity === 'medium' ? 'bg-amber-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-slate-300 animate-spin mx-auto" />
            <p className="text-slate-500 mt-4">Yuklanmoqda...</p>
          </div>
        )}
      </main>

      {showWarehouseForm && (
        <WarehouseForm
          userId={user.id}
          onSuccess={() => {
            setShowWarehouseForm(false);
            refreshWarehouses();
          }}
          onCancel={() => setShowWarehouseForm(false)}
        />
      )}

      {showZoneManager && selectedWarehouseId && (
        <ZoneManager
          warehouseId={selectedWarehouseId}
          zones={zones}
          onUpdate={refresh}
          onClose={() => setShowZoneManager(false)}
        />
      )}

      {showSensorManager && selectedWarehouseId && (
        <SensorManager
          warehouseId={selectedWarehouseId}
          zones={zones}
          sensors={sensors}
          onUpdate={refresh}
          onClose={() => setShowSensorManager(false)}
        />
      )}

      {showInventoryManager && selectedWarehouseId && (
        <InventoryManager
          warehouseId={selectedWarehouseId}
          zones={zones}
          inventory={inventory}
          onUpdate={refresh}
          onClose={() => setShowInventoryManager(false)}
        />
      )}
    </div>
  );
}

export default App;

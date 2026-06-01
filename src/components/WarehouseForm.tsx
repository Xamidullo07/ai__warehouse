import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, MapPin, X, Save, Package } from 'lucide-react';

interface WarehouseFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function WarehouseForm({ userId, onSuccess, onCancel }: WarehouseFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    total_capacity: '1000',
    status: 'active' as 'active' | 'maintenance' | 'offline'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('warehouses')
        .insert([{
          name: formData.name,
          location: formData.location,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          total_capacity: parseInt(formData.total_capacity),
          used_capacity: 0,
          status: formData.status,
          owner_id: userId
        }]);

      if (error) throw error;
      onSuccess();
    } catch (err) {
      console.error('Error creating warehouse:', err);
      alert('Omborxona yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Yangi omborxona</h2>
              <p className="text-sm text-slate-500">Omborxona ma'lumotlarini kiriting</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Omborxona nomi *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Masalan: Toshkent Asosiy Omborxona"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Manzil *
              </label>
              <div className="flex gap-2">
                <MapPin className="w-5 h-5 text-slate-400 mt-3" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Toshkent, Mirzo Ulug'bek tumani"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Kenglik (Latitude)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="41.2995"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Uzunlik (Longitude)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="69.2401"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Umumiy sig'im (birlik) *
              </label>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={formData.total_capacity}
                  onChange={(e) => setFormData({ ...formData, total_capacity: e.target.value })}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Holat
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Faol</option>
                <option value="maintenance">Ta'mirlash</option>
                <option value="offline">Oflayn</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.location}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WarehouseForm;

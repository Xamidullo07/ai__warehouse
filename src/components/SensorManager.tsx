import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, X, Plus, Thermometer, Droplets, Flame, DoorOpen, Navigation, Weight, Battery, Edit2, Trash2 } from 'lucide-react';
import type { Sensor, WarehouseZone } from '../types/database';

interface SensorManagerProps {
  warehouseId: string;
  zones: WarehouseZone[];
  sensors: Sensor[];
  onUpdate: () => void;
  onClose: () => void;
}

function SensorManager({ warehouseId, zones, sensors, onUpdate, onClose }: SensorManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'temperature' as Sensor['type'],
    zone_id: '',
    unit: '',
    min_threshold: '',
    max_threshold: '',
    battery_level: '100'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sensorData = {
        name: formData.name,
        type: formData.type,
        zone_id: formData.zone_id || null,
        unit: formData.unit || null,
        min_threshold: formData.min_threshold ? parseFloat(formData.min_threshold) : null,
        max_threshold: formData.max_threshold ? parseFloat(formData.max_threshold) : null,
        battery_level: parseInt(formData.battery_level),
        status: 'active'
      };

      if (editingId) {
        const { error } = await supabase.from('sensors').update(sensorData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sensors').insert([{
          warehouse_id: warehouseId,
          ...sensorData
        }]);
        if (error) throw error;
      }

      setFormData({
        name: '',
        type: 'temperature',
        zone_id: '',
        unit: '',
        min_threshold: '',
        max_threshold: '',
        battery_level: '100'
      });
      setEditingId(null);
      setShowForm(false);
      onUpdate();
    } catch (err) {
      console.error('Error saving sensor:', err);
      alert('Sensor saqlanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sensor: Sensor) => {
    setFormData({
      name: sensor.name,
      type: sensor.type,
      zone_id: sensor.zone_id || '',
      unit: sensor.unit || '',
      min_threshold: sensor.min_threshold?.toString() || '',
      max_threshold: sensor.max_threshold?.toString() || '',
      battery_level: sensor.battery_level.toString()
    });
    setEditingId(sensor.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ushbu sensorni o\'chirmoqchisiz?')) return;

    try {
      const { error } = await supabase.from('sensors').delete().eq('id', id);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Error deleting sensor:', err);
      alert('Sensor o\'chirishda xatolik');
    }
  };

  const getSensorIcon = (type: Sensor['type']) => {
    const icons = {
      temperature: <Thermometer className="w-5 h-5 text-red-500" />,
      humidity: <Droplets className="w-5 h-5 text-blue-500" />,
      motion: <Activity className="w-5 h-5 text-purple-500" />,
      smoke: <Flame className="w-5 h-5 text-orange-500" />,
      door: <DoorOpen className="w-5 h-5 text-amber-500" />,
      weight: <Weight className="w-5 h-5 text-cyan-500" />,
      gps: <Navigation className="w-5 h-5 text-green-500" />
    };
    return icons[type];
  };

  const getSensorUnit = (type: Sensor['type']) => {
    const units = {
      temperature: '°C',
      humidity: '%',
      smoke: 'ppm',
      weight: 'kg',
      motion: '',
      door: '',
      gps: ''
    };
    return units[type];
  };

  const simulateReading = async (sensor: Sensor) => {
    let value: number;
    switch (sensor.type) {
      case 'temperature':
        value = 18 + Math.random() * 10;
        break;
      case 'humidity':
        value = 30 + Math.random() * 40;
        break;
      case 'smoke':
        value = Math.random() * 5;
        break;
      case 'weight':
        value = 100 + Math.random() * 500;
        break;
      default:
        value = Math.random() * 100;
    }

    try {
      await supabase.from('sensor_readings').insert([{
        sensor_id: sensor.id,
        value,
        unit: sensor.unit || getSensorUnit(sensor.type),
        is_anomaly: false
      }]);

      await supabase
        .from('sensors')
        .update({ last_reading: value, last_reading_at: new Date().toISOString() })
        .eq('id', sensor.id);

      onUpdate();
    } catch (err) {
      console.error('Error simulating reading:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Activity className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Sensorlarni boshqarish</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: '',
                type: 'temperature',
                zone_id: '',
                unit: '',
                min_threshold: '',
                max_threshold: '',
                battery_level: '100'
              });
              setShowForm(!showForm);
            }}
            className="w-full mb-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-amber-400 hover:text-amber-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {showForm ? 'Bekor qilish' : 'Yangi sensor qo\'shish'}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-slate-50 rounded-xl p-5 mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sensor nomi *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    placeholder="Masalan: Harorat sensori A1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sensor turi</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const type = e.target.value as Sensor['type'];
                      setFormData({
                        ...formData,
                        type,
                        unit: getSensorUnit(type)
                      });
                    }}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                  >
                    <option value="temperature">Harorat</option>
                    <option value="humidity">Namlik</option>
                    <option value="smoke">Tutun</option>
                    <option value="motion">Harakat</option>
                    <option value="door">Eshik</option>
                    <option value="weight">Og'irlik</option>
                    <option value="gps">GPS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Zona</label>
                  <select
                    value={formData.zone_id}
                    onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                  >
                    <option value="">Tanlanmagan</option>
                    {zones.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">O'lchov birligi</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    placeholder={getSensorUnit(formData.type)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Minimal chegara</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.min_threshold}
                    onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    placeholder="Masalan: 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Maksimal chegara</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.max_threshold}
                    onChange={(e) => setFormData({ ...formData, max_threshold: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    placeholder="Masalan: 30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.name}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
              >
                {loading ? 'Saqlanmoqda...' : editingId ? 'O\'zgartirishni saqlash' : 'Sensor yaratish'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setShowForm(false);
                    setFormData({
                      name: '',
                      type: 'temperature',
                      zone_id: '',
                      unit: '',
                      min_threshold: '',
                      max_threshold: '',
                      battery_level: '100'
                    });
                  }}
                  className="px-4 py-3 bg-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-400"
                >
                  Bekor
                </button>
              )}
            </form>
          )}

          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-3">Mavjud sensorlar ({sensors.length})</h3>
            {sensors.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">Sensorlar mavjud emas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sensors.map(sensor => {
                  const zone = zones.find(z => z.id === sensor.zone_id);
                  return (
                    <div
                      key={sensor.id}
                      className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getSensorIcon(sensor.type)}
                          <div>
                            <p className="font-semibold text-slate-800">{sensor.name}</p>
                            <p className="text-xs text-slate-500">
                              {zone ? zone.name : 'Belgilanmagan zona'} • {sensor.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800">
                              {sensor.last_reading !== null && sensor.last_reading !== undefined
                                ? `${sensor.last_reading.toFixed(1)}${sensor.unit || ''}`
                                : '--'}
                            </p>
                            <div className="flex items-center gap-2 justify-end">
                              <Battery className={`w-4 h-4 ${
                                sensor.battery_level > 50 ? 'text-emerald-500' :
                                sensor.battery_level > 20 ? 'text-amber-500' : 'text-red-500'
                              }`} />
                              <span className="text-xs text-slate-500">{sensor.battery_level}%</span>
                            </div>
                          </div>

                          <button
                            onClick={() => simulateReading(sensor)}
                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            O'lchash
                          </button>

                          <button
                            onClick={() => handleEdit(sensor)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="O'zgartirrish"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(sensor.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {sensor.min_threshold !== null && sensor.max_threshold !== null && (
                        <div className="mt-3">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{
                                width: sensor.last_reading !== null && sensor.last_reading !== undefined
                                  ? `${Math.min(100, Math.max(0, ((sensor.last_reading - (sensor.min_threshold || 0)) / ((sensor.max_threshold || 1) - (sensor.min_threshold || 0))) * 100))}%`
                                  : '0%'
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-slate-500">
                            <span>Min: {sensor.min_threshold}</span>
                            <span>Max: {sensor.max_threshold}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SensorManager;

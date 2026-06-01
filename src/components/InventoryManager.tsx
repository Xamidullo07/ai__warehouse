import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, X, Plus, Box, MapPin, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import type { InventoryItem, WarehouseZone } from '../types/database';

interface InventoryManagerProps {
  warehouseId: string;
  zones: WarehouseZone[];
  inventory: InventoryItem[];
  onUpdate: () => void;
  onClose: () => void;
}

function InventoryManager({ warehouseId, zones, inventory, onUpdate, onClose }: InventoryManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    quantity: '',
    min_quantity: '10',
    max_quantity: '1000',
    unit: 'dona',
    weight_kg: '',
    value: '',
    zone_id: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || null,
        quantity: parseInt(formData.quantity),
        min_quantity: parseInt(formData.min_quantity),
        max_quantity: parseInt(formData.max_quantity),
        unit: formData.unit,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        value: formData.value ? parseFloat(formData.value) : null,
        zone_id: formData.zone_id || null,
        status: parseInt(formData.quantity) <= parseInt(formData.min_quantity)
          ? 'low_stock'
          : parseInt(formData.quantity) === 0
          ? 'out_of_stock'
          : 'in_stock'
      };

      if (editingId) {
        const { error } = await supabase
          .from('inventory_items')
          .update(itemData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert([{ warehouse_id: warehouseId, ...itemData }]);

        if (error) throw error;
      }

      const newTotal = inventory.reduce((sum, item) => {
        if (editingId === item.id) return sum;
        return sum + item.quantity;
      }, 0) + parseInt(formData.quantity);

      await supabase
        .from('warehouses')
        .update({ used_capacity: newTotal })
        .eq('id', warehouseId);

      setFormData({
        name: '',
        sku: '',
        description: '',
        quantity: '',
        min_quantity: '10',
        max_quantity: '1000',
        unit: 'dona',
        weight_kg: '',
        value: '',
        zone_id: ''
      });
      setEditingId(null);
      setShowForm(false);
      onUpdate();
    } catch (err) {
      console.error('Error saving inventory:', err);
      alert('Inventar saqlanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setFormData({
      name: item.name,
      sku: item.sku,
      description: item.description || '',
      quantity: item.quantity.toString(),
      min_quantity: item.min_quantity.toString(),
      max_quantity: item.max_quantity.toString(),
      unit: item.unit,
      weight_kg: item.weight_kg?.toString() || '',
      value: item.value?.toString() || '',
      zone_id: item.zone_id || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ushbu mahsulotni o\'chirmoqchisiz?')) return;

    try {
      const item = inventory.find(i => i.id === id);
      if (!item) return;

      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const newTotal = inventory.reduce((sum, i) => sum + (i.id === id ? 0 : i.quantity), 0);
      await supabase
        .from('warehouses')
        .update({ used_capacity: newTotal })
        .eq('id', warehouseId);

      onUpdate();
    } catch (err) {
      console.error('Error deleting inventory:', err);
      alert('Inventar o\'chirishda xatolik');
    }
  };

  const getStatusColor = (item: InventoryItem) => {
    if (item.status === 'out_of_stock' || item.quantity === 0) return 'bg-red-100 text-red-700 border-red-300';
    if (item.quantity <= item.min_quantity) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Inventarni boshqarish</h2>
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
                sku: '',
                description: '',
                quantity: '',
                min_quantity: '10',
                max_quantity: '1000',
                unit: 'dona',
                weight_kg: '',
                value: '',
                zone_id: ''
              });
              setShowForm(!showForm);
            }}
            className="w-full mb-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-purple-400 hover:text-purple-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {showForm ? 'Bekor qilish' : 'Yangi mahsulot qo\'shish'}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-slate-50 rounded-xl p-5 mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mahsulot nomi *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    placeholder="Masalan: Kompyuter stoli"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg font-mono"
                    placeholder="SKU-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Miqdor *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    placeholder="100"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Minimal miqdor</label>
                  <input
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Maksimal miqdor</label>
                  <input
                    type="number"
                    value={formData.max_quantity}
                    onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">O'lchov birligi</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                  >
                    <option value="dona">Dona</option>
                    <option value="kg">Kilogramm</option>
                    <option value="l">Litr</option>
                    <option value="m">Metr</option>
                    <option value="quti">Quti</option>
                    <option value="paqir">Paqir</option>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Og'irlik (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    placeholder="2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Birlik narxi (so'm)</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    placeholder="500000"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tavsif</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    placeholder="Qisqacha tavsif..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !formData.name || !formData.sku || !formData.quantity}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
                >
                  {loading ? 'Saqlanmoqda...' : editingId ? 'O\'zgartirishni saqlash' : 'Mahsulot qo\'shish'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setShowForm(false);
                      setFormData({
                        name: '',
                        sku: '',
                        description: '',
                        quantity: '',
                        min_quantity: '10',
                        max_quantity: '1000',
                        unit: 'dona',
                        weight_kg: '',
                        value: '',
                        zone_id: ''
                      });
                    }}
                    className="px-4 py-3 bg-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-400"
                  >
                    Bekor
                  </button>
                )}
              </div>
            </form>
          )}

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-600">Mavjud mahsulotlar ({inventory.length})</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Mavjud: {inventory.filter(i => i.quantity > i.min_quantity).length}</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">Kam: {inventory.filter(i => i.quantity <= i.min_quantity && i.quantity > 0).length}</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Tugagan: {inventory.filter(i => i.quantity === 0).length}</span>
              </div>
            </div>

            {inventory.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <Box className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">Mahsulotlar mavjud emas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Mahsulot</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Zona</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Miqdor</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Holat</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Harakalar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map(item => {
                      const zone = zones.find(z => z.id === item.zone_id);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-slate-500 truncate max-w-xs">{item.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{item.sku}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {zone ? zone.name : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-semibold">{item.quantity} {item.unit}</p>
                            <p className="text-xs text-slate-500">min: {item.min_quantity} / max: {item.max_quantity}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item)}`}>
                              {item.quantity === 0 ? 'Tugagan' : item.quantity <= item.min_quantity ? 'Kam' : 'Mavjud'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="O'zgartirrish"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="O'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryManager;

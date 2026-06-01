import { X } from 'lucide-react';
import type { Warehouse } from '../types/database';

interface Zone {
  id: string;
  name: string;
  warehouse_id: string;
  created_at?: string;
}

interface ZoneManagerProps {
  warehouseId: string;
  zones: Zone[];
  onUpdate: () => void;
  onClose: () => void;
}

export default function ZoneManager({ warehouseId, zones, onUpdate, onClose }: ZoneManagerProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Manage Zones</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {zones && zones.length > 0 ? (
            <div className="space-y-2">
              {zones.map((zone) => (
                <div key={zone.id} className="p-3 bg-gray-50 rounded border">
                  <p className="font-medium">{zone.name}</p>
                  <p className="text-sm text-gray-600">{zone.id}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No zones available</p>
          )}
        </div>
      </div>
    </div>
  );
}

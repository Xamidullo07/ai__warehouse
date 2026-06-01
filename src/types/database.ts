export interface Warehouse {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  total_capacity: number;
  used_capacity: number;
  status: 'active' | 'maintenance' | 'offline';
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseZone {
  id: string;
  warehouse_id: string;
  name: string;
  type: 'storage' | 'loading' | 'processing' | 'cold_storage' | 'hazardous';
  area_sqm?: number;
  temperature_range_min?: number;
  temperature_range_max?: number;
  humidity_range_min?: number;
  humidity_range_max?: number;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
}

export interface InventoryItem {
  id: string;
  warehouse_id: string;
  zone_id?: string;
  name: string;
  sku: string;
  description?: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  unit: string;
  weight_kg?: number;
  value?: number;
  expiry_date?: string;
  last_updated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved';
}

export interface Sensor {
  id: string;
  warehouse_id: string;
  zone_id?: string;
  name: string;
  type: 'temperature' | 'humidity' | 'motion' | 'smoke' | 'door' | 'weight' | 'gps';
  unit?: string;
  min_threshold?: number;
  max_threshold?: number;
  location_x?: number;
  location_y?: number;
  status: 'active' | 'inactive' | 'error';
  last_reading?: number;
  last_reading_at?: string;
  battery_level: number;
  created_at: string;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  value: number;
  unit?: string;
  is_anomaly: boolean;
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  warehouse_id: string;
  analysis_type: 'inventory_optimization' | 'capacity_forecast' | 'maintenance_prediction' | 'efficiency_analysis' | 'risk_assessment';
  prediction: string;
  confidence: number;
  recommendations: string[];
  metrics: Record<string, number | string>;
  created_at: string;
}

export interface Alert {
  id: string;
  warehouse_id: string;
  sensor_id?: string;
  type: 'temperature' | 'humidity' | 'inventory_low' | 'inventory_high' | 'sensor_offline' | 'security' | 'maintenance' | 'fire' | 'motion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

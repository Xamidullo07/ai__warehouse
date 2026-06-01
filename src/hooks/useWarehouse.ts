import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Warehouse, WarehouseZone, InventoryItem, Sensor, SensorReading, Alert } from '../types/database';

export function useWarehouse(warehouseId: string | null) {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshRef = useRef(() => setRefreshTrigger(prev => prev + 1));

  useEffect(() => {
    if (!warehouseId) {
      setWarehouse(null);
      setZones([]);
      setInventory([]);
      setSensors([]);
      setAlerts([]);
      setLoading(false);
      return;
    }

    async function fetchWarehouseData() {
      setLoading(true);
      setError(null);

      try {
        const { data: warehouseData, error: warehouseError } = await supabase
          .from('warehouses')
          .select('*')
          .eq('id', warehouseId)
          .maybeSingle();

        if (warehouseError) throw warehouseError;
        setWarehouse(warehouseData);

        const { data: zonesData, error: zonesError } = await supabase
          .from('warehouse_zones')
          .select('*')
          .eq('warehouse_id', warehouseId);

        if (zonesError) throw zonesError;
        setZones(zonesData || []);

        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('warehouse_id', warehouseId)
          .order('last_updated', { ascending: false });

        if (inventoryError) throw inventoryError;
        setInventory(inventoryData || []);

        const { data: sensorsData, error: sensorsError } = await supabase
          .from('sensors')
          .select('*')
          .eq('warehouse_id', warehouseId);

        if (sensorsError) throw sensorsError;
        setSensors(sensorsData || []);

        const { data: alertsData, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .eq('warehouse_id', warehouseId)
          .eq('is_resolved', false)
          .order('created_at', { ascending: false });

        if (alertsError) throw alertsError;
        setAlerts(alertsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch warehouse data');
      } finally {
        setLoading(false);
      }
    }

    fetchWarehouseData();

    const channel = supabase.channel('warehouse-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouses', filter: `id=eq.${warehouseId}` },
        () => fetchWarehouseData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_zones', filter: `warehouse_id=eq.${warehouseId}` },
        () => fetchWarehouseData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items', filter: `warehouse_id=eq.${warehouseId}` },
        () => fetchWarehouseData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sensors', filter: `warehouse_id=eq.${warehouseId}` },
        () => fetchWarehouseData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `warehouse_id=eq.${warehouseId}` },
        () => fetchWarehouseData())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [warehouseId, refreshTrigger]);

  return { warehouse, zones, inventory, sensors, alerts, loading, error, refresh: refreshRef.current };
}

export function useSensorReadings(sensorId: string | null, limit: number = 100) {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sensorId) {
      setReadings([]);
      setLoading(false);
      return;
    }

    async function fetchReadings() {
      setLoading(true);
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('sensor_id', sensorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        setReadings(data);
      }
      setLoading(false);
    }

    fetchReadings();

    const channel = supabase.channel('sensor-readings')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_readings',
        filter: `sensor_id=eq.${sensorId}`
      }, (payload) => {
        setReadings(prev => [payload.new as SensorReading, ...prev].slice(0, limit));
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sensorId, limit]);

  return { readings, loading };
}

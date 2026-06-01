import type { Warehouse, WarehouseZone, InventoryItem, Sensor, SensorReading, Alert } from '../types/database';

export interface AnalysisResult {
  type: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  prediction: string;
  recommendations: string[];
  metrics: Record<string, number | string>;
}

export function analyzeWarehouseHealth(
  warehouse: Warehouse,
  zones: WarehouseZone[],
  inventory: InventoryItem[],
  sensors: Sensor[],
  alerts: Alert[]
): AnalysisResult {
  const metrics: Record<string, number | string> = {};
  const recommendations: string[] = [];
  let score = 100;

  const capacityUtilization = (warehouse.used_capacity / warehouse.total_capacity) * 100;
  metrics['Sig\'imdan foydalanish'] = capacityUtilization;

  if (capacityUtilization > 90) {
    score -= 15;
    recommendations.push('Omborxona sig\'imi 90% dan yuqori. Yangi joylar qo\'shish yoki inventarni optimallashtirish kerak.');
  } else if (capacityUtilization < 30) {
    score -= 5;
    recommendations.push('Omborxona sig\'imi past darajada ishlatilmoqda. Resurslardan samarali foydalanish uchun boshqa omborxonalar bilan integratsiyani ko\'rib chiqing.');
  }

  const activeZones = zones.filter(z => z.status === 'active').length;
  const totalZones = zones.length;
  const zoneEfficiency = totalZones > 0 ? (activeZones / totalZones) * 100 : 0;
  metrics['Zona samaradorligi'] = zoneEfficiency;

  if (zoneEfficiency < 80 && totalZones > 0) {
    score -= 10;
    recommendations.push(`${zones.filter(z => z.status !== 'active').length} zona ta\'mirlash yoki texnik xizmatga muhtoj.`);
  }

  const lowStockItems = inventory.filter(i => i.quantity <= i.min_quantity);
  const outOfStockItems = inventory.filter(i => i.status === 'out_of_stock');
  const inventoryHealth = inventory.length > 0
    ? ((inventory.length - lowStockItems.length - outOfStockItems.length) / inventory.length) * 100
    : 100;
  metrics['Inventar holati'] = inventoryHealth;

  if (lowStockItems.length > 0) {
    score -= Math.min(lowStockItems.length * 2, 15);
    recommendations.push(`${lowStockItems.length} mahsulot minimal miqdordan past. Zudlik bilan to\'ldirish kerak.`);
  }

  if (outOfStockItems.length > 0) {
    score -= Math.min(outOfStockItems.length * 3, 20);
    recommendations.push(`${outOfStockItems.length} mahsulot tugagan. Ta\'minot zanjirini tekshiring.`);
  }

  const activeSensors = sensors.filter(s => s.status === 'active').length;
  const offlineSensors = sensors.filter(s => s.status !== 'active').length;
  const sensorHealth = sensors.length > 0 ? (activeSensors / sensors.length) * 100 : 100;
  metrics['Sensor holati'] = sensorHealth;

  if (offlineSensors > 0) {
    score -= Math.min(offlineSensors * 3, 15);
    recommendations.push(`${offlineSensors} sensor ishlamayapti. Teknik xizmat ko'rsating.`);
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.is_resolved);
  const highAlerts = alerts.filter(a => a.severity === 'high' && !a.is_resolved);
  const activeAlertsCount = alerts.filter(a => !a.is_resolved).length;
  metrics['Faol ogohlantirishlar'] = activeAlertsCount;

  if (criticalAlerts.length > 0) {
    score -= Math.min(criticalAlerts.length * 10, 30);
    recommendations.push(`${criticalAlerts.length} KRITIK ogohlantirish mavjud! Zudlik bilan aralashing.`);
  }

  if (highAlerts.length > 0) {
    score -= Math.min(highAlerts.length * 5, 20);
    recommendations.push(`${highAlerts.length} yuqori darajali ogohlantirish mavjud.`);
  }

  score = Math.max(0, Math.min(100, score));
  let status: 'excellent' | 'good' | 'warning' | 'critical';

  if (score >= 90) status = 'excellent';
  else if (score >= 75) status = 'good';
  else if (score >= 50) status = 'warning';
  else status = 'critical';

  return {
    type: 'warehouse_health',
    score,
    status,
    prediction: status === 'excellent'
      ? 'Omborxona a\'lo holatda ishlamoqda. Keyingi 30 kun samaradorlik saqlanadi.'
      : status === 'good'
      ? 'Omborxona yaxshi holatda. Kichik muammolar mavjud lekin tizim barqaror.'
      : status === 'warning'
      ? 'Omborxonada muammolar mavjud. Xavfsizlik choralarini ko\'rish kerak.'
      : 'Omborxona kritik holatda! Zudlik bilan choralar ko\'rish shart!',
    recommendations,
    metrics
  };
}

export function detectAnomalies(readings: SensorReading[], threshold: number = 2): SensorReading[] {
  if (readings.length < 10) return [];

  const values = readings.map(r => r.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);

  if (stdDev === 0) return [];

  return readings.filter(reading => {
    const zScore = Math.abs((reading.value - mean) / stdDev);
    return zScore > threshold;
  });
}

export function predictInventoryTrend(items: InventoryItem[]): {
  items: Array<{ name: string; sku: string; current: number; predicted: number; daysUntilEmpty: number }>;
  overallTrend: 'increasing' | 'stable' | 'decreasing';
} {
  const itemPredictions = items.map(item => {
    const dailyUsage = (item.max_quantity - item.quantity) * 0.05;
    const daysUntilEmpty = dailyUsage > 0 ? Math.floor(item.quantity / dailyUsage) : 999;
    const predicted = Math.max(0, item.quantity - Math.round(dailyUsage * 7));

    return {
      name: item.name,
      sku: item.sku,
      current: item.quantity,
      predicted,
      daysUntilEmpty
    };
  });

  const itemsBelowMin = items.filter(i => i.quantity <= i.min_quantity).length;
  const totalItems = items.length;

  const overallTrend: 'increasing' | 'stable' | 'decreasing' =
    itemsBelowMin > totalItems * 0.3 ? 'decreasing'
    : itemsBelowMin > totalItems * 0.1 ? 'stable'
    : 'increasing';

  return { items: itemPredictions, overallTrend };
}

export function assessRisk(
  warehouse: Warehouse,
  zones: WarehouseZone[],
  sensors: Sensor[],
  alerts: Alert[]
): {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  riskScore: number;
  mitigationSteps: string[];
} {
  const riskFactors: string[] = [];
  const mitigationSteps: string[] = [];
  let riskScore = 0;

  if (warehouse.status === 'maintenance') {
    riskScore += 20;
    riskFactors.push('Omborxona texnik xizmat holatida');
    mitigationSteps.push('Texnik xizmatni tezlashtiring va jarayonlarni boshqa omborxonaga o\'tkazing.');
  }

  if (warehouse.status === 'offline') {
    riskScore += 50;
    riskFactors.push('Omborxona oflayn holatda');
    mitigationSteps.push('Zudlik bilan tizimni tikrang. Muqobil omborxonani faollashtiring.');
  }

  const hazardousZones = zones.filter(z => z.type === 'hazardous' && z.status === 'active');
  if (hazardousZones.length > 0) {
    riskScore += hazardousZones.length * 5;
    riskFactors.push(`${hazardousZones.length} xavfli zona faol`);
    mitigationSteps.push('Xavfli zonalarda xavfsizlik protokollarini kuchaytiring.');
  }

  const smokeSensors = sensors.filter(s => s.type === 'smoke');
  const offlineSmokeSensors = smokeSensors.filter(s => s.status !== 'active');
  if (offlineSmokeSensors.length > 0) {
    riskScore += offlineSmokeSensors.length * 15;
    riskFactors.push(`${offlineSmokeSensors.length} tutun sensori ishlamayapti`);
    mitigationSteps.push('Barcha xavfsizlik sensorlarini zudlik bilan tuzating.');
  }

  const fireAlerts = alerts.filter(a => a.type === 'fire' && !a.is_resolved);
  if (fireAlerts.length > 0) {
    riskScore += fireAlerts.length * 40;
    riskFactors.push('Yong\'in xavfi mavjud!');
    mitigationSteps.push('Zudlik bilan yong\'in xavfsizlik protokolini faollashtiring!');
  }

  const securityAlerts = alerts.filter(a => a.type === 'security' && !a.is_resolved);
  if (securityAlerts.length > 0) {
    riskScore += securityAlerts.length * 30;
    riskFactors.push('Xavfsizlik buzilishi aniqlangan');
    mitigationSteps.push('Xavfsizlik bo\'yicha o\'rinbosarlarni habardor qiling va monitoringni kuchaytiring.');
  }

  riskScore = Math.min(100, riskScore);

  const overallRisk: 'low' | 'medium' | 'high' | 'critical' =
    riskScore >= 70 ? 'critical'
    : riskScore >= 50 ? 'high'
    : riskScore >= 30 ? 'medium'
    : 'low';

  return { overallRisk, riskFactors, riskScore, mitigationSteps };
}

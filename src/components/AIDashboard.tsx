import React from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, CheckCircle, Shield, Activity, Gauge } from 'lucide-react';
import type { Warehouse, WarehouseZone, InventoryItem, Sensor, Alert } from '../types/database';
import { analyzeWarehouseHealth, predictInventoryTrend, assessRisk } from '../lib/aiAnalysis';

interface AIDashboardProps {
  warehouse: Warehouse;
  zones: WarehouseZone[];
  inventory: InventoryItem[];
  sensors: Sensor[];
  alerts: Alert[];
}

function AIDashboard({ warehouse, zones, inventory, sensors, alerts }: AIDashboardProps) {
  const healthAnalysis = analyzeWarehouseHealth(warehouse, zones, inventory, sensors, alerts);
  const inventoryTrend = inventory.length > 0 ? predictInventoryTrend(inventory) : null;
  const riskAssessment = assessRisk(warehouse, zones, sensors, alerts);

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-900 rounded-2xl shadow-xl text-white overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/20 rounded-lg">
              <Brain className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Tahlil Markazi</h2>
              <p className="text-sm text-slate-400">Real-vaqtda tahlil va bashorat</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Umumiy holat</span>
                <span className={`text-2xl font-bold ${
                  healthAnalysis.score >= 90 ? 'text-emerald-400' :
                  healthAnalysis.score >= 70 ? 'text-blue-400' :
                  healthAnalysis.score >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {healthAnalysis.score}
                </span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all ${getProgressColor(healthAnalysis.score)}`}
                  style={{ width: `${healthAnalysis.score}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{healthAnalysis.prediction}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Xavf darajasi</span>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                  riskAssessment.overallRisk === 'critical' ? 'bg-red-500 text-white' :
                  riskAssessment.overallRisk === 'high' ? 'bg-orange-500 text-white' :
                  riskAssessment.overallRisk === 'medium' ? 'bg-amber-500 text-white' :
                  'bg-emerald-500 text-white'
                }`}>
                  {riskAssessment.overallRisk}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className={`w-8 h-8 ${
                  riskAssessment.overallRisk === 'critical' || riskAssessment.overallRisk === 'high'
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`} />
                <div>
                  <p className="text-3xl font-bold">{riskAssessment.riskScore}</p>
                  <p className="text-xs text-slate-400">xavf bali</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Inventar tendensiyasi</span>
                {inventoryTrend && (
                  <div className={`flex items-center gap-1 ${
                    inventoryTrend.overallTrend === 'increasing' ? 'text-emerald-400' :
                    inventoryTrend.overallTrend === 'decreasing' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs uppercase font-medium">{inventoryTrend.overallTrend}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Jami mahsulotlar</span>
                  <span className="font-medium">{inventory.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Kam qolgan</span>
                  <span className="text-amber-400">{inventory.filter(i => i.quantity <= i.min_quantity).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tugagan</span>
                  <span className="text-red-400">{inventory.filter(i => i.quantity === 0).length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(healthAnalysis.metrics).map(([key, value]) => (
              <div key={key} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-slate-400 mb-1">{key}</p>
                <p className="text-xl font-bold">{typeof value === 'number' ? `${value.toFixed(1)}%` : value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {healthAnalysis.recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-800">AI Tavsiyalar</h3>
              <span className="ml-auto px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                {healthAnalysis.recommendations.length} ta
              </span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {healthAnalysis.recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 flex items-start gap-3">
                <div className={`p-1.5 rounded ${
                  idx === 0 ? 'bg-red-100' : 'bg-slate-100'
                }`}>
                  {idx === 0 ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Activity className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <p className="text-sm text-slate-700 flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {riskAssessment.riskFactors.length > 0 && (
        <div className={`rounded-xl p-5 border-2 ${
          riskAssessment.overallRisk === 'critical' ? 'bg-red-50 border-red-300' :
          riskAssessment.overallRisk === 'high' ? 'bg-orange-50 border-orange-300' :
          'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              riskAssessment.overallRisk === 'critical' ? 'bg-red-100' :
              riskAssessment.overallRisk === 'high' ? 'bg-orange-100' :
              'bg-amber-100'
            }`}>
              <Shield className={`w-6 h-6 ${
                riskAssessment.overallRisk === 'critical' ? 'text-red-600' :
                riskAssessment.overallRisk === 'high' ? 'text-orange-600' :
                'text-amber-600'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold mb-2 ${
                riskAssessment.overallRisk === 'critical' ? 'text-red-900' :
                riskAssessment.overallRisk === 'high' ? 'text-orange-900' :
                'text-amber-900'
              }`}>
                Xavf omillari aniqlandi
              </h3>
              <div className="space-y-2 mb-3">
                {riskAssessment.riskFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
              {riskAssessment.mitigationSteps.length > 0 && (
                <div className="mt-4 p-3 bg-white/50 rounded-lg">
                  <p className="text-xs font-medium text-slate-600 mb-2">Chora-tadbirlar:</p>
                  <ul className="space-y-1">
                    {riskAssessment.mitigationSteps.map((step, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {healthAnalysis.status === 'excellent' && healthAnalysis.recommendations.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-bold text-emerald-900 mb-1">Minimal tavsiyalar</h3>
          <p className="text-sm text-emerald-700">Omborxona ajoyib holatda ishlamoqda. Davom eting!</p>
        </div>
      )}
    </div>
  );
}

export default AIDashboard;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Settings2, 
  Info, 
  ChevronRight,
  RefreshCcw,
  DollarSign,
  Clock,
  Smartphone,
  Box
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ROIParams {
  mode: 'buy' | 'rent';
  d: number; // 设备单台成本 (buy) 或 每月租金 (rent)
  p: number; // 定价 元/小时
  t: number; // 每天预期出租时长
  v: number; // 期末残值 (单台)
  c: number; // 柜体成本
  n: number; // 每个柜体可存放设备数量
  k: number; // 柜体数量 (批量投入)
  r: number; // 资金成本 (年化 %)
  u: number; // 设备出勤率 (%)
  o: number; // 月运营杂费 (电费、场地、人工)
  f: number; // 支付手续费率 (%)
  l: number; // 风险损耗率 (%)
  y: number; // 预期设备寿命 (月)
  tax: number; // 综合税率 (%)
}

export default function App() {
  const [params, setParams] = useState<ROIParams>({
    mode: 'buy',
    d: 5000,
    p: 5,
    t: 4,
    v: 1500,
    c: 11000,
    n: 13,
    k: 1,
    r: 5,
    u: 60,
    o: 500,
    f: 1,
    l: 3,
    y: 24,
    tax: 6
  });

  const results = useMemo(() => {
    const { mode, d, p, t, v, c, n, k, r, u, o, f, l, y, tax } = params;
    
    const totalDevices = n * k;
    const activeDevices = totalDevices * (u / 100);
    const grossMonthlyRevenue = p * t * activeDevices * 30;

    // Advanced Deductions
    const paymentFees = grossMonthlyRevenue * (f / 100);
    const riskLoss = grossMonthlyRevenue * (l / 100);
    
    let totalInitialInvestment = 0;
    let totalResidualValue = 0;
    let monthlyOperatingCost = 0;
    let monthlyInterestCost = 0;

    if (mode === 'buy') {
      const totalDeviceCost = d * totalDevices;
      totalInitialInvestment = (c * k) + totalDeviceCost;
      totalResidualValue = v * totalDevices;
      monthlyInterestCost = totalInitialInvestment * (r / 100) / 12;
      monthlyOperatingCost = monthlyInterestCost + (o * k);
    } else {
      totalInitialInvestment = c * k;
      totalResidualValue = 0;
      monthlyInterestCost = totalInitialInvestment * (r / 100) / 12;
      const monthlyDeviceRent = d * totalDevices;
      monthlyOperatingCost = monthlyInterestCost + monthlyDeviceRent + (o * k);
    }

    // Tax calculation (simplified: on revenue after direct operating costs)
    const taxableIncome = Math.max(0, grossMonthlyRevenue - paymentFees - riskLoss - monthlyOperatingCost);
    const monthlyTax = taxableIncome * (tax / 100);
    
    const totalMonthlyDeductions = paymentFees + riskLoss + monthlyOperatingCost + monthlyTax;
    const netMonthlyRevenue = grossMonthlyRevenue - totalMonthlyDeductions;
    
    const netInvestment = totalInitialInvestment - totalResidualValue;
    
    // Payback period in months
    const m = netMonthlyRevenue > 0 ? netInvestment / netMonthlyRevenue : Infinity;
    
    // Generate chart data for 24 months
    const chartData = Array.from({ length: 25 }, (_, i) => {
      const revenue = grossMonthlyRevenue * i;
      const cost = totalMonthlyDeductions * i;
      const netProfit = revenue - cost - (totalInitialInvestment - (i >= m ? totalResidualValue : 0));
      return {
        month: i,
        revenue: Math.round(revenue),
        netProfit: Math.round(netProfit),
        investment: totalInitialInvestment,
      };
    });

    return {
      totalInitialInvestment,
      totalDeviceCost: mode === 'buy' ? d * totalDevices : 0,
      totalResidualValue,
      monthlyRevenue: grossMonthlyRevenue,
      netMonthlyRevenue,
      paymentFees,
      riskLoss,
      monthlyTax,
      monthlyInterestCost,
      monthlyDeviceRent: mode === 'rent' ? d * totalDevices : 0,
      monthlyOperatingCost: totalMonthlyDeductions,
      paybackMonths: m,
      isWarning: m > y,
      chartData
    };
  }, [params]);

  const handleParamChange = (key: keyof ROIParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-zinc-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 pb-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Calculator className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Investment Analysis</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight text-zinc-900">
                ROI <span className="italic font-serif">测算模型</span>
              </h1>
            </div>
            
            {/* Mode Switcher */}
            <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200">
              <button
                onClick={() => setParams(prev => ({ ...prev, mode: 'buy', d: 5000, v: 1500 }))}
                className={cn(
                  "px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                  params.mode === 'buy' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                购买设备
              </button>
              <button
                onClick={() => setParams(prev => ({ ...prev, mode: 'rent', d: 300, v: 0 }))}
                className={cn(
                  "px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                  params.mode === 'rent' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                租赁设备
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Last Updated</p>
            <p className="text-sm font-mono font-medium">2026.03.20</p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Parameters */}
          <section className="lg:col-span-4 space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
              <Settings2 className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">核心参数设定</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="p-4 bg-zinc-50 rounded-xl space-y-4">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">设备参数</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <Smartphone className="w-3 h-3" />
                          {params.mode === 'buy' ? '单台设备成本 (d)' : '单台月租金 (d)'}
                        </label>
                        <span className="text-sm font-mono font-semibold text-zinc-900">
                          ¥{params.d.toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="range" 
                        min={params.mode === 'buy' ? "500" : "50"} 
                        max={params.mode === 'buy' ? "15000" : "2000"} 
                        step={params.mode === 'buy' ? "100" : "10"}
                        value={params.d} onChange={(e) => handleParamChange('d', Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <DollarSign className="w-3 h-3" />
                          租赁定价 (p)
                        </label>
                        <span className="text-sm font-mono font-semibold text-zinc-900">
                          ¥{params.p}/小时
                        </span>
                      </div>
                      <input
                        type="range" min="1" max="100" step="0.5"
                        value={params.p} onChange={(e) => handleParamChange('p', Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          日均出租时长 (t)
                        </label>
                        <span className="text-sm font-mono font-semibold text-zinc-900">
                          {params.t}小时
                        </span>
                      </div>
                      <input
                        type="range" min="0.5" max="24" step="0.5"
                        value={params.t} onChange={(e) => handleParamChange('t', Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" />
                          设备出勤率 (u)
                        </label>
                        <div className="text-right">
                          <span className="text-sm font-mono font-semibold text-zinc-900 block">
                            {params.u}%
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            约 {(params.n * params.u / 100).toFixed(1)} 台/日
                          </span>
                        </div>
                      </div>
                      <input
                        type="range" min="0" max="100" step="1"
                        value={params.u} onChange={(e) => handleParamChange('u', Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>

                    {params.mode === 'buy' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            期末残值 (v)
                          </label>
                          <span className="text-sm font-mono font-semibold text-zinc-900">
                            ¥{params.v.toLocaleString()}
                          </span>
                        </div>
                        <input
                          type="range" min="0" max={params.d} step="100"
                          value={params.v} onChange={(e) => handleParamChange('v', Number(e.target.value))}
                          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-xl space-y-4">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">财务与运营参数</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" />
                          资金成本 (年化 r)
                        </label>
                        <span className="text-sm font-mono font-semibold text-zinc-900">
                          {params.r}%
                        </span>
                      </div>
                      <input
                        type="range" min="0" max="20" step="0.1"
                        value={params.r} onChange={(e) => handleParamChange('r', Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <DollarSign className="w-3 h-3" />
                          月运营杂费 (o)
                        </label>
                        <span className="text-sm font-mono font-semibold text-zinc-900">
                          ¥{params.o.toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="range" min="0" max="10000" step="100"
                        value={params.o} onChange={(e) => handleParamChange('o', Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">支付手续费 (%)</label>
                        <input
                          type="number" value={params.f} onChange={(e) => handleParamChange('f', Number(e.target.value))}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">风险损耗率 (%)</label>
                        <input
                          type="number" value={params.l} onChange={(e) => handleParamChange('l', Number(e.target.value))}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">设备寿命 (月)</label>
                        <input
                          type="number" value={params.y} onChange={(e) => handleParamChange('y', Number(e.target.value))}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">综合税率 (%)</label>
                        <input
                          type="number" value={params.tax} onChange={(e) => handleParamChange('tax', Number(e.target.value))}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-xl space-y-4">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">柜体参数</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <Box className="w-3 h-3" />
                          柜体成本 (c)
                        </label>
                        <span className="text-sm font-mono font-semibold text-zinc-900">
                          ¥{params.c.toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="range" min="1000" max="50000" step="500"
                        value={params.c} onChange={(e) => handleParamChange('c', Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <RefreshCcw className="w-3 h-3" />
                          存放设备数量 (n)
                        </label>
                        <span className="text-sm font-mono font-semibold text-zinc-900">
                          {params.n}台/柜
                        </span>
                      </div>
                      <input
                        type="range" min="1" max="30" step="1"
                        value={params.n} onChange={(e) => handleParamChange('n', Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <Box className="w-3 h-3" />
                          柜体投入数量 (k)
                        </label>
                        <span className="text-sm font-mono font-semibold text-zinc-900">
                          {params.k} 组
                        </span>
                      </div>
                      <input
                        type="range" min="1" max="100" step="1"
                        value={params.k} onChange={(e) => handleParamChange('k', Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setParams({ mode: 'buy', d: 5000, p: 5, t: 4, v: 1500, c: 11000, n: 13, k: 1, r: 5, u: 60, o: 500, f: 1, l: 3, y: 24, tax: 6 })}
                className="w-full py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-3 h-3" />
                重置所有参数
              </button>
            </div>
          </section>

          {/* Main Content - Results */}
          <section className="lg:col-span-8 space-y-8">
            {/* Key Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                layout
                className={cn(
                  "bg-white p-6 rounded-2xl border shadow-sm transition-colors",
                  results.isWarning ? "border-rose-200 bg-rose-50/30" : "border-zinc-100"
                )}
              >
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">回本周期 (m)</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-4xl font-light",
                    results.isWarning ? "text-rose-600" : "text-zinc-900"
                  )}>
                    {results.paybackMonths === Infinity ? '∞' : results.paybackMonths.toFixed(1)}
                  </span>
                  <span className="text-sm font-medium text-zinc-500">个月</span>
                </div>
                {results.isWarning && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-tighter">
                    ⚠️ 超过设备预期寿命 ({params.y}个月)
                  </p>
                )}
                <div className="mt-4 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (params.y / results.paybackMonths) * 100)}%` }}
                    className={cn(
                      "h-full rounded-full",
                      results.paybackMonths <= params.y / 2 ? "bg-emerald-500" : 
                      results.paybackMonths <= params.y ? "bg-amber-500" : "bg-rose-500"
                    )}
                  />
                </div>
              </motion.div>

              <motion.div 
                layout
                className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm"
              >
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">总初始投入</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light text-zinc-900">
                    ¥{results.totalInitialInvestment.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2">含{params.k}组柜体及{params.n * params.k}台设备</p>
              </motion.div>

              <motion.div 
                layout
                className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm"
              >
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">预期月度总营收</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light text-zinc-900">
                    ¥{results.monthlyRevenue.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2">基于{params.k}组柜体总体产出</p>
              </motion.div>

              <motion.div 
                layout
                className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm"
              >
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">预期月度净利润</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light text-emerald-600">
                    ¥{Math.round(results.netMonthlyRevenue).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2">扣除所有成本、风险及税费后</p>
              </motion.div>
            </div>

            {/* Chart Area */}
            <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">收益增长曲线</h3>
                  <p className="text-sm text-zinc-400">24个月累计营收与投入对比</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-900" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">累计营收</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-200" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">初始投入</span>
                  </div>
                </div>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#a1a1aa' }}
                      label={{ value: '月份', position: 'insideBottomRight', offset: -10, fontSize: 10, fill: '#a1a1aa' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#a1a1aa' }}
                      tickFormatter={(value) => `¥${value/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #f4f4f5',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => [`¥${value.toLocaleString()}`, '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#18181b" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="investment" 
                      stroke="#e4e4e7" 
                      strokeDasharray="5 5" 
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-zinc-400" />
                  测算逻辑说明
                </h3>
                <div className="space-y-3 text-sm text-zinc-500 leading-relaxed">
                  <p>
                    1. <span className="text-zinc-900 font-medium">总初始投入</span> = {params.mode === 'buy' ? '(柜体成本 (c) + 单台设备成本 (d) × 每柜台数 (n)) × 柜体数量 (k)' : '柜体成本 (c) × 柜体数量 (k)'}。
                  </p>
                  <p>
                    2. <span className="text-zinc-900 font-medium">月营收</span> = 定价 (p) × 日均时长 (t) × (总设备数 (n×k) × 出勤率 (u)) × 30天。
                  </p>
                  <p>
                    3. <span className="text-zinc-900 font-medium">月运营成本</span> = {params.mode === 'buy' ? '资金利息' : '资金利息 + 总设备月租金'} + (月运营杂费 (o) × k) + 支付手续费 + 风险损耗 + 税费。
                  </p>
                  <p>
                    4. <span className="text-zinc-900 font-medium">回本周期</span> = {params.mode === 'buy' ? '(总投入 - 总残值)' : '总投入'} / (月营收 - 月运营成本)。
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900 p-6 rounded-2xl text-white space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider">盈利能力评估</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs text-zinc-400">年化收益率 (ROI)</span>
                    <span className="text-lg font-mono">
                      {results.paybackMonths > 0 ? ((12 / results.paybackMonths) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs text-zinc-400">单台日产出</span>
                    <span className="text-lg font-mono">¥{(params.p * params.t).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">盈亏平衡点</span>
                    <span className="text-lg font-mono">第 {Math.ceil(results.paybackMonths)} 个月</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className={cn(
                    "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-center",
                    results.paybackMonths <= 12 ? "bg-emerald-500/20 text-emerald-400" : 
                    results.paybackMonths <= 24 ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
                  )}>
                    {results.paybackMonths <= 12 ? "极佳投资回报" : 
                     results.paybackMonths <= 24 ? "稳健投资回报" : "回报周期较长"}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Summary Section */}
            <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
                <Calculator className="w-5 h-5 text-zinc-400" />
                <h2 className="text-lg font-medium">数据汇总清单 (Data Summary)</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Input Parameters Summary */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-l-2 border-zinc-900 pl-2">输入参数 (Input Parameters)</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">{params.mode === 'buy' ? '单台设备成本 (d)' : '单台月租金 (d)'}</span>
                      <span className="font-semibold">¥{params.d.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">租赁定价 (p)</span>
                      <span className="font-semibold">¥{params.p}/小时</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">日均出租时长 (t)</span>
                      <span className="font-semibold">{params.t}小时</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">设备出勤率 (u)</span>
                      <span className="font-semibold">{params.u}%</span>
                    </div>
                    {params.mode === 'buy' && (
                      <div className="flex justify-between py-1 border-b border-zinc-50">
                        <span className="text-zinc-500">期末残值 (v)</span>
                        <span className="font-semibold">¥{params.v.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">柜体成本 (c)</span>
                      <span className="font-semibold">¥{params.c.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">每柜设备数量 (n)</span>
                      <span className="font-semibold">{params.n}台</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">柜体投入数量 (k)</span>
                      <span className="font-semibold">{params.k}组</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">总设备规模</span>
                      <span className="font-semibold">{params.n * params.k}台</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">年化资金成本 (r)</span>
                      <span className="font-semibold">{params.r}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">月运营杂费 (o)</span>
                      <span className="font-semibold">¥{params.o.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Calculated Results Summary */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-l-2 border-zinc-900 pl-2">测算结果 (Calculated Results)</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">总初始投入</span>
                      <span className="font-semibold text-zinc-900">¥{results.totalInitialInvestment.toLocaleString()}</span>
                    </div>
                    {params.mode === 'buy' && (
                      <>
                        <div className="flex justify-between py-1 border-b border-zinc-50">
                          <span className="text-zinc-500">设备总采购价</span>
                          <span className="font-semibold text-zinc-900">¥{results.totalDeviceCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-50">
                          <span className="text-zinc-500">期末总残值</span>
                          <span className="font-semibold text-emerald-600">+¥{results.totalResidualValue.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">有效营收设备数</span>
                      <span className="font-semibold text-zinc-900">{(params.n * params.k * params.u / 100).toFixed(1)}台</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">月营收 (Gross)</span>
                      <span className="font-semibold text-zinc-900">¥{results.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    
                    {/* Cost Breakdown */}
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">月资金利息支出</span>
                      <span className="font-semibold text-rose-500">-¥{results.monthlyInterestCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    {params.mode === 'rent' && (
                      <div className="flex justify-between py-1 border-b border-zinc-50">
                        <span className="text-zinc-500">设备总月租金</span>
                        <span className="font-semibold text-rose-500">-¥{results.monthlyDeviceRent.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">月运营杂费 (o)</span>
                      <span className="font-semibold text-rose-500">-¥{(params.o * params.k).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">支付手续费 ({params.f}%)</span>
                      <span className="font-semibold text-rose-500">-¥{results.paymentFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">风险损耗预提 ({params.l}%)</span>
                      <span className="font-semibold text-rose-500">-¥{results.riskLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">预估月综合税费 ({params.tax}%)</span>
                      <span className="font-semibold text-rose-500">-¥{results.monthlyTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    
                    <div className="flex justify-between py-1 border-b border-zinc-50 bg-zinc-50 px-2 -mx-2 rounded">
                      <span className="text-zinc-900 font-bold">净月营收 (Net)</span>
                      <span className="font-bold text-emerald-600">¥{(results.monthlyRevenue - results.monthlyOperatingCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">回本周期 (Payback)</span>
                      <span className="font-semibold text-zinc-900">{results.paybackMonths === Infinity ? '∞' : results.paybackMonths.toFixed(1)}个月</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500">年化收益率 (ROI)</span>
                      <span className="font-semibold text-zinc-900">{results.paybackMonths > 0 ? ((12 / results.paybackMonths) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="pt-8 border-t border-zinc-200 text-center">
          <p className="text-[10px] text-zinc-400 uppercase tracking-[0.3em]">
            &copy; 2026 3C Rental ROI Analysis Tool • Precision Modeling
          </p>
        </footer>
      </div>
    </div>
  );
}

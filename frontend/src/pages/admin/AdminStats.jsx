import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, Users, FileText, AlertTriangle, 
  CheckCircle, ArrowUpRight, ArrowDownRight, 
  Wallet, Calendar, Activity, Zap, Loader2
} from 'lucide-react';
import { getAdminStats } from '../../services/statsService';

const AdminStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await getAdminStats();
        setData(stats);
      } catch (error) {
        console.error("Erreur fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const COLORS = ['#7C3AED', '#4F46E5', '#3B82F6', '#8B5CF6'];

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[60vh] text-purple-600">
              <Loader2 className="animate-spin" size={48} />
              <span className="ml-4 font-black uppercase tracking-widest text-xs">Chargement des données réelles...</span>
          </div>
      );
  }

  const kpis = [
    { title: 'Budget Global', value: `${(data?.totalRemboursements || 0).toFixed(3)} TND`, growth: data?.growth?.cash || '0%', icon: Wallet, color: 'purple' },
    { title: 'Bulletins Traités', value: data?.totalBulletins || 0, growth: data?.growth?.bulletins || '0%', icon: FileText, color: 'indigo' },
    { title: 'Réclamations Actives', value: data?.reclamationsByStatus?.ouvertes || 0, growth: data?.growth?.reclamations || '0%', icon: AlertTriangle, color: 'amber' },
    { title: 'Utilisateurs', value: data?.totalUsers || 0, growth: 'Inscrits', icon: Users, color: 'emerald' },
  ];

  // Logic for Pie Chart using actual data (Distribution by care type)
  const categoryData = useMemo(() => {
    if (!data?.distributionByType || data.distributionByType.length === 0) {
      return [
        { name: 'Aucune donnée', value: 100 }
      ];
    }
    return data.distributionByType.map(item => ({
      name: item.type_dossier || 'Inconnu',
      value: parseInt(item.count || 0)
    }));
  }, [data]);

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      {/* HEADER ACTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-purple-600/10 rounded-xl">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 text-slate-900 dark:text-white">Back-Office Core</h2>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Finances & Performances</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-1">Analyse temps réel des flux et des opérations TT Assurance</p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
          <button className="px-5 py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all">
            Exporter Rapport
          </button>
          <div className="w-px h-8 bg-slate-100 dark:bg-white/5 mx-2" />
          <div className="flex items-center gap-2 px-4 py-2 text-slate-400">
            <Calendar size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Derniers 30 Jours</span>
          </div>
        </div>
      </motion.div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 group hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl bg-${kpi.color}-50 dark:bg-${kpi.color}-900/20 text-${kpi.color}-600 dark:text-${kpi.color}-400 shadow-inner`}>
                <kpi.icon size={28} />
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${kpi.growth.startsWith('+') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {kpi.growth.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.growth}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.title}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{kpi.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Flux financiers</h3>
              <p className="text-sm text-slate-400 font-medium">Evolution des remboursements (TND)</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="w-2 h-2 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Mensuel</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '900'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="cash" 
                  stroke="#7C3AED" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorCash)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center"
        >
          <div className="mb-8 w-full text-left">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">État des Réclamations</h3>
            <p className="text-sm text-slate-400 font-medium">Répartition par statut de traitement</p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '15px', border: 'none', fontWeight: '900' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mt-6">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.name}</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CHARTS ROW 2 - Mixed Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-purple-600/20 transition-all duration-700" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Activité Opérationnelle</h3>
              <p className="text-sm text-slate-400 font-medium tracking-tight">Bulletins vs Réclamations</p>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10">
              <Activity className="text-purple-400" size={32} />
            </div>
          </div>

          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyData} barGap={12}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 15 }}
                  contentStyle={{ borderRadius: '15px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }}
                />
                <Bar 
                  dataKey="bulletins" 
                  fill="#7C3AED" 
                  radius={[10, 10, 10, 10]} 
                  barSize={12}
                  animationDuration={2000}
                />
                <Bar 
                  dataKey="reclamations" 
                  fill="#F59E0B" 
                  radius={[10, 10, 10, 10]} 
                  barSize={12}
                  animationDuration={2500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-10 flex gap-8 relative z-10">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-600" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Bulletins</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Réclamations</span>
             </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl" />
          <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shadow-inner mb-8">
            <TrendingUp size={36} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center max-w-xs mb-4">Optimisez votre gestion avec l'IA</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-center max-w-md leading-relaxed mb-10">
            TT Assurance utilise désormais l'IA pour prédire les pics d'activité et automatiser la vérification des bulletins, réduisant le temps de traitement de 40%.
          </p>
          <button className="px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-purple-600 dark:hover:bg-purple-400 dark:hover:text-white transition-all active:scale-95">
            Activer Insights IA
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminStats;

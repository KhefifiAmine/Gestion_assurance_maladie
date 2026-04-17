import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, FileText, AlertTriangle, 
  ArrowUpRight, Wallet, Activity, Zap, Loader2
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

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[60vh] text-purple-600">
              <Loader2 className="animate-spin" size={48} />
              <span className="ml-4 font-black uppercase tracking-widest text-xs">Chargement...</span>
          </div>
      );
  }

  const kpis = [
    { title: 'Budget Global', value: `${(data?.totalRemboursements || 0).toFixed(3)} TND`, icon: Wallet, color: 'purple' },
    { title: 'Bulletins', value: data?.totalBulletins || 0, icon: FileText, color: 'indigo' },
    { title: 'Réclamations', value: data?.reclamationsByStatus?.ouvertes || 0, icon: AlertTriangle, color: 'amber' },
    { title: 'Utilisateurs', value: data?.totalUsers || 0, icon: Users, color: 'emerald' },
  ];

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Tableau de Bord</h1>
          <p className="text-slate-500 font-medium">Statistiques administratives TT Assurance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 group transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl bg-${kpi.color}-50 dark:bg-${kpi.color}-900/20 text-${kpi.color}-600 dark:text-${kpi.color}-400`}>
                <kpi.icon size={28} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.title}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Acceptés', amount: data?.totalAcceptedCash || 0, color: '#10B981' },
                    { label: 'En attente', amount: data?.totalPendingCash || 0, color: '#F59E0B' },
                    { label: 'Refusés', amount: data?.totalRefusedCash || 0, color: '#EF4444' },
                ].map((item, idx) => (
                    <div key={idx} className="p-8 rounded-[3.5rem] bg-white dark:bg-slate-900 border border-slate-100 shadow-xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.label}</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                            {(item.amount || 0).toFixed(3)} TND
                        </p>
                    </div>
                ))}
      </div>
      
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-100 h-[400px] relative overflow-hidden">
          <h3 className="text-xl font-black mb-10">Flux Financiers</h3>
          <ResponsiveContainer width="100%" height="100%" debounce={100} minWidth={0} minHeight={0}>
            <AreaChart data={data?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="cash" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminStats;

import React, { useState, useEffect, useMemo } from 'react';
import { 
    FileText, 
    Clock, 
    TrendingUp,
    ChevronDown,
    Activity,
    ArrowUpRight
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { getMyBulletins } from '../../services/bulletinService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const UserDashboard = () => {
    const navigate = useNavigate();
    const [bulletins, setBulletins] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBulletins = async () => {
        try {
            setLoading(true);
            const data = await getMyBulletins();
            setBulletins(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBulletins();
    }, []);

    const stats = useMemo(() => {
        const total = bulletins.length;
        const totalRembourse = 0; // Field removed from DB
        const enAttente = bulletins.filter(b => b.statut === 0 || b.statut === 1).length;
        return { total, totalRembourse, enAttente };
    }, [bulletins]);

    const chartData = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                month: d.getMonth(),
                year: d.getFullYear(),
                name: d.toLocaleString('fr-FR', { month: 'short' }).replace('.', ''),
                value: 0
            });
        }
        bulletins.forEach(b => {
            const bDate = new Date(b.date_depot);
            const monthEntry = months.find(entry => entry.month === bDate.getMonth() && entry.year === bDate.getFullYear());
            if (monthEntry) monthEntry.value += parseFloat(b.montant_total || 0);
        });
        return months.map(m => ({
            name: m.name.charAt(0).toUpperCase() + m.name.slice(1),
            value: Math.round(m.value)
        }));
    }, [bulletins]);

    const statCards = [
        { 
            title: 'Total Bulletins', 
            value: stats.total, 
            icon: FileText, 
            change: `${bulletins.filter(b => {
                const d = new Date(b.date_depot);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length} ce mois-ci`, 
            color: 'purple' 
        },
        { 
            title: 'Remboursements', 
            value: `${stats.totalRembourse.toFixed(3)} TND`, 
            icon: TrendingUp, 
            change: `${stats.totalRembourse > 0 ? 'Cumul des gains' : 'Aucun retour'}`, 
            color: 'emerald' 
        },
        { 
            title: 'En attente', 
            value: stats.enAttente, 
            icon: Clock, 
            change: stats.enAttente > 0 ? 'Traitement en cours' : 'Tous finalisés', 
            color: 'amber' 
        },
    ];

    return (
        <div className="p-6 lg:p-10 space-y-8 min-h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1"
            >
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Vue d'ensemble</h1>
                <div className="flex items-center gap-2">
                    <span className="w-8 h-1 rounded-full bg-purple-600"></span>
                    <p className="text-[10px] font-black opacity-40 dark:opacity-50 uppercase tracking-[0.2em] text-slate-900 dark:text-white">Tableau de bord de santé TT</p>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 flex flex-col gap-6 group hover:shadow-xl transition-all duration-500 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-2xl -mr-8 -mt-8" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className={`p-4 rounded-2xl shadow-inner flex items-center justify-center ${
                                stat.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20' :
                                stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                                'bg-amber-50 dark:bg-amber-900/20'
                            }`}>
                                <stat.icon size={26} className={
                                    stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                                    stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                                    'text-amber-600 dark:text-amber-400'
                                } />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-black tracking-widest px-3 py-1 rounded-full text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 uppercase border border-emerald-100 dark:border-emerald-800/30">
                                <ArrowUpRight size={10} /> Actif
                            </span>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.title}</p>
                            <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{stat.value}</h3>
                        </div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 relative z-10">{stat.change}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                {/* Area Chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 flex flex-col gap-6"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Activité de Remboursement</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">Derniers 6 mois</p>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                            <Activity size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)',
                                        fontWeight: '900',
                                        fontSize: '12px',
                                        backgroundColor: '#1e293b',
                                        color: '#fff'
                                    }} 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#7C3AED" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#purpleGradient)" 
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Recent History */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 flex flex-col gap-6"
                >
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Historique Récent</h3>
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[280px] pr-2">
                        {loading ? (
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 text-center uppercase py-10">Chargement...</p>
                        ) : bulletins.length === 0 ? (
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 text-center uppercase py-10">Aucun dossier</p>
                        ) : bulletins.slice(0, 5).map((b, i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-pointer p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-50 dark:bg-purple-900/20 group-hover:scale-110 transition-transform shadow-inner">
                                    <FileText size={20} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm tracking-tight text-slate-800 dark:text-slate-100 truncate">{b.numero_bulletin || 'BS-XXXX'}</p>
                                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{new Date(b.date_depot).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <ChevronDown size={14} className="opacity-20 -rotate-90 group-hover:opacity-100 text-slate-400 dark:text-slate-500 transition-opacity flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => navigate('/bulletins')}
                        className="w-full py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-100 dark:border-white/5 uppercase text-purple-600 dark:text-purple-400"
                    >
                        Tous les dossiers
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default UserDashboard;

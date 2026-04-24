import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText, TrendingUp, Activity, ArrowUpRight,
    MessageSquare, CheckCircle2, Wallet, BadgeDollarSign, Hourglass,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getMyBulletins } from '../../services/bulletinService';
import { getReclamations } from '../../services/reclamationService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const UserDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bulletins, setBulletins] = useState([]);
    const [reclamations, setReclamations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [bulletinData, reclamationData] = await Promise.all([
                getMyBulletins(),
                getReclamations()
            ]);
            setBulletins(bulletinData);
            setReclamations(reclamationData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const stats = useMemo(() => {
        const myBulletins    = bulletins.filter(b => !user?.id || b.userId === user.id);
        const myReclamations = reclamations.filter(r => !user?.id || r.userId === user.id);

        return {
            total:              myBulletins.length,
            enAttente:          myBulletins.filter(b => Number(b.statut) === 0).length,
            enCours:            myBulletins.filter(b => Number(b.statut) === 1).length,
            approuves:          myBulletins.filter(b => Number(b.statut) === 2).length,
            refuses:            myBulletins.filter(b => Number(b.statut) === 3).length,
            montantTotal:       myBulletins.reduce((s, b) => s + parseFloat(b.montant_total || 0), 0),
            montantRembours:    myBulletins.reduce((s, b) => s + parseFloat(b.montant_remboursement || 0), 0),
            totalReclamations:  myReclamations.length,
            reclamationsEnCours: myReclamations.filter(r => r.statut === 'Ouverte' || r.statut === 'En cours').length,
        };
    }, [bulletins, reclamations, user]);

    const chartData = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ month: d.getMonth(), year: d.getFullYear(), name: d.toLocaleString('fr-FR', { month: 'short' }).replace('.', ''), total: 0, approuves: 0 });
        }
        bulletins.forEach(b => {
            const bDate = new Date(b.date_depot || b.createdAt);
            const entry = months.find(m => m.month === bDate.getMonth() && m.year === bDate.getFullYear());
            if (entry) {
                entry.total += 1;
                if (Number(b.statut) === 2) {
                    entry.approuves += 1;
                }
            }
        });
        return months.map(m => ({ 
            name: m.name.charAt(0).toUpperCase() + m.name.slice(1), 
            Total: m.total,
            Approuvés: m.approuves
        }));
    }, [bulletins]);

    const lastAcceptedBulletin   = useMemo(() => bulletins.find(b => Number(b.statut) === 2), [bulletins]);
    const lastReclamation = useMemo(() => reclamations.length > 0 ? reclamations[0] : null, [reclamations]);

    const statCards = [
        { title: 'Total Bulletins', value: stats.total,             icon: FileText,     color: 'purple',  nav: '/bulletins' },
        { title: 'En attente',      value: stats.enAttente,          icon: Hourglass,    color: 'amber',   nav: '/bulletins', navState: { filter: 'En attente' } },
        { title: 'Approuvés',       value: stats.approuves,          icon: CheckCircle2, color: 'emerald', nav: '/bulletins', navState: { filter: 'Approuvée' } },
        { title: 'Réclamations',    value: stats.totalReclamations,  icon: MessageSquare,color: 'rose',    nav: '/reclamations' },
    ];

    const colorMap = {
        purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20',   text: 'text-purple-600 dark:text-purple-400',   blob: 'bg-purple-600'  },
        amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600 dark:text-amber-400',     blob: 'bg-amber-600'   },
        emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', blob: 'bg-emerald-600' },
        rose:    { bg: 'bg-rose-50 dark:bg-rose-900/20',       text: 'text-rose-600 dark:text-rose-400',       blob: 'bg-rose-600'    },
    };

    return (
        <div className="p-6 lg:p-10 space-y-10 min-h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">

            {/* Background Decorative */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-rose-600/5 dark:bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-600/20">Tableau de Bord</span>
                        <div className="w-8 h-[1px] bg-slate-300 dark:bg-slate-700" />
                        <p className="text-[10px] font-black opacity-40 dark:opacity-50 uppercase tracking-[0.2em] text-slate-900 dark:text-white">CareCover</p>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                        Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">{user?.prenom || 'Adhérent'}</span>
                    </h1>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Dernière mise à jour</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-end gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • Aujourd'hui
                    </p>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {statCards.map((stat, i) => {
                    const c = colorMap[stat.color];
                    return (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -5 }}
                            onClick={() => navigate(stat.nav, stat.navState ? { state: stat.navState } : undefined)}
                            className="p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl flex flex-col gap-6 group hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 relative cursor-pointer overflow-hidden shadow-sm"
                        >
                            <div className={`absolute -right-4 -top-4 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${c.blob}`} />
                            <div className={`p-4 rounded-2xl shadow-inner w-fit flex items-center justify-center transition-transform group-hover:rotate-12 duration-500 ${c.bg}`}>
                                <stat.icon size={26} className={c.text} />
                            </div>
                            <div className="space-y-1 relative z-10">
                                <h3 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:scale-110 transition-transform origin-left duration-500">
                                    {loading ? <span className="w-12 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse inline-block" /> : stat.value}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.title}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>



            {/* Chart & Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10 relative z-10">

                {/* Chart */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
                    className="lg:col-span-2 p-10 rounded-[3rem] shadow-xl border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Activité Financière</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-1">Évolution des dossiers soumis et acceptés (6 derniers mois)</p>
                        </div>
                        <div className="p-4 bg-purple-600 text-white rounded-[1.5rem] shadow-lg shadow-purple-600/20"><Activity size={20} /></div>
                    </div>
                    <div className="h-[280px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.08)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} dy={10} />
                                <YAxis hide domain={[0, 'auto']} />
                                <Tooltip
                                    cursor={{ stroke: '#7C3AED', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontWeight: '900', fontSize: '12px', backgroundColor: '#1e293b', color: '#fff', padding: '16px' }}
                                    formatter={(value, name) => [value, name === 'Total' ? 'Dossiers Soumis' : 'Dossiers Acceptés']}
                                />
                                <Area type="monotone" dataKey="Total" stroke="#7C3AED" strokeWidth={4} fillOpacity={1} fill="url(#purpleGradient)" animationDuration={2500} />
                                <Area type="monotone" dataKey="Approuvés" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#emeraldGradient)" animationDuration={2500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Sidebar */}
                <div className="flex flex-col gap-6">

                    {/* Dernier bulletin accepté — visible pour TOUS */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                        className="p-8 rounded-[2.5rem] shadow-xl border border-emerald-100 dark:border-emerald-900/20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl relative overflow-hidden flex flex-col gap-4 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center justify-between relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Dernier bulletin accepté</p>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        {lastAcceptedBulletin ? (
                            <div onClick={() => navigate('/bulletins')} className="flex items-center gap-4 p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-900/20 relative z-10 cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-slate-900 dark:text-white truncate">#{lastAcceptedBulletin.numero_bulletin}</p>
                                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Validé • {new Date(lastAcceptedBulletin.updatedAt).toLocaleDateString('fr-FR')}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{lastAcceptedBulletin.montant_remboursement?.toFixed(3) || '0.000'} TND remboursés</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center border-2 border-dashed border-slate-100 dark:border-white/10 rounded-[1.5rem]">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Aucun bulletin validé</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Dernière réclamation */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                        className="p-8 rounded-[2.5rem] shadow-xl border border-rose-100 dark:border-rose-900/20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl relative overflow-hidden flex flex-col gap-4 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center justify-between relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">Dernière Réclamation</p>
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        </div>
                        {lastReclamation ? (
                            <div onClick={() => navigate('/reclamations')} className="flex items-center gap-4 p-5 bg-rose-50/50 dark:bg-rose-900/10 rounded-[1.5rem] border border-rose-100 dark:border-rose-900/20 relative z-10 cursor-pointer hover:bg-rose-100/50 dark:hover:bg-rose-900/20 transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 shadow-sm">
                                    <MessageSquare size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-slate-900 dark:text-white truncate">{lastReclamation.objet || 'Sans objet'}</p>
                                    <p className="text-[10px] font-bold text-rose-600/70 uppercase">Statut : {lastReclamation.statut}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Le {new Date(lastReclamation.createdAt).toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center border-2 border-dashed border-slate-100 dark:border-white/10 rounded-[1.5rem]">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Aucune réclamation</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Dernière activité */}
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
                        onClick={() => navigate('/bulletins')}
                        className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 shadow-xl flex flex-col gap-5 relative overflow-hidden group cursor-pointer">
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-600/5 dark:bg-purple-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        <h3 className="text-lg font-black tracking-tight relative z-10">Dernière activité</h3>
                        {bulletins.length > 0 ? (
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/10 flex items-center justify-center shadow-inner border border-slate-100 dark:border-white/10 group-hover:rotate-12 transition-transform">
                                    <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-0.5">Dernier dépôt détecté</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-sm text-slate-900 dark:text-white">#{bulletins[0].numero_bulletin}</p>
                                        <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/20" />
                                        <p className="text-[10px] font-bold text-purple-600 dark:text-purple-200">Le {new Date(bulletins[0].date_depot).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                                <div className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                                    <ArrowUpRight size={16} />
                                </div>
                            </div>
                        ) : (
                            <p className="text-[10px] font-black opacity-40 uppercase">Aucune activité récente</p>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;

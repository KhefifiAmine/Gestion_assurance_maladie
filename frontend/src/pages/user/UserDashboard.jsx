import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText,
    Clock,
    TrendingUp,
    ChevronDown,
    Activity,
    ArrowUpRight,
    MessageSquare
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

    useEffect(() => {
        fetchData();
    }, []);

    const stats = useMemo(() => {
        // Filtrer pour s'assurer qu'on ne compte que les données de l'adhérent connecté
        const myBulletins = bulletins.filter(b => !user?.id || b.userId === user.id);
        const myReclamations = reclamations.filter(r => !user?.id || r.userId === user.id);

        const total = myBulletins.length;
        const totalReclamations = myReclamations.length;
        const enAttente = myBulletins.filter(b => Number(b.statut) === 0).length;
        const reclamationsEnCours = myReclamations.filter(r => r.statut === 'Ouverte' || r.statut === 'En cours').length;
        
        return { total, totalReclamations, enAttente, reclamationsEnCours };
    }, [bulletins, reclamations, user]);

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

    const lastAcceptedBulletin = useMemo(() => bulletins.find(b => b.statut === 2), [bulletins]);
    const lastTreatedReclamation = useMemo(() => reclamations.find(r => r.statut === 'Traitée'), [reclamations]);

    const statCards = [
        { title: 'Total Bulletins', value: stats.total, icon: FileText, color: 'purple' },
        { title: 'Réclamations', value: stats.totalReclamations, icon: MessageSquare, color: 'rose' },
        { title: 'Récl. en cours', value: stats.reclamationsEnCours, icon: Activity, color: 'indigo' },
        { title: 'Dossiers en attente', value: stats.enAttente, icon: Clock, color: 'amber' },
    ];

    return (
        <div className="p-6 lg:p-10 space-y-10 min-h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">

            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-rose-600/5 dark:bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header with Greeting */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-600/20">
                            Tableau de Bord
                        </span>
                        <div className="w-8 h-[1px] bg-slate-300 dark:bg-slate-700"></div>
                        <p className="text-[10px] font-black opacity-40 dark:opacity-50 uppercase tracking-[0.2em] text-slate-900 dark:text-white">Santé TT</p>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                        Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">{user?.prenom || 'Adhérent'}</span>
                    </h1>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Dernière mise à jour</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-end gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • Aujourd'hui
                    </p>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -5 }}
                        onClick={() => {
                            if (stat.title === 'Dossiers en attente') navigate('/bulletins', { state: { filter: 'En attente' } });
                            else if (stat.title === 'Total Bulletins') navigate('/bulletins');
                            else if (stat.title === 'Réclamations' || stat.title === 'Récl. en cours') navigate('/reclamations');
                        }}
                        className="p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl flex flex-col gap-6 group hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 relative cursor-pointer overflow-hidden shadow-sm"
                    >
                        <div className={`absolute -right-4 -top-4 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${stat.color === 'purple' ? 'bg-purple-600' :
                                stat.color === 'rose' ? 'bg-rose-600' :
                                    stat.color === 'indigo' ? 'bg-indigo-600' :
                                        'bg-amber-600'
                            }`} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className={`p-4 rounded-2xl shadow-inner flex items-center justify-center transition-transform group-hover:rotate-12 duration-500 ${stat.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20' :
                                    stat.color === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20' :
                                        stat.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20' :
                                            'bg-amber-50 dark:bg-amber-900/20'
                                }`}>
                                <stat.icon size={26} className={
                                    stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                                        stat.color === 'rose' ? 'text-rose-600 dark:text-rose-400' :
                                            stat.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                                                'text-amber-600 dark:text-amber-400'
                                } />
                            </div>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <h3 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:scale-110 transition-transform origin-left duration-500">{stat.value}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.title}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts & Highlights Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 p-10 rounded-[3rem] shadow-xl border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col gap-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Activité Financière</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-1">Évolution des remboursements</p>
                        </div>
                        <div className="p-4 bg-purple-600 text-white rounded-[1.5rem] shadow-lg shadow-purple-600/20">
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="h-[320px] w-full mt-4 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.08)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} dy={10} />
                                <YAxis hide domain={[0, 'auto']} />
                                <Tooltip
                                    cursor={{ stroke: '#7C3AED', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', fontWeight: '900', fontSize: '12px', backgroundColor: '#1e293b', color: '#fff', padding: '16px' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={4} fillOpacity={1} fill="url(#purpleGradient)" animationDuration={2500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <div className="flex flex-col gap-6">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="p-8 rounded-[2.5rem] shadow-xl border border-emerald-100 dark:border-emerald-900/20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl relative overflow-hidden flex flex-col gap-4 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center justify-between relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Dernier dossier accepté</p>
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                        {lastAcceptedBulletin ? (
                            <div className="flex items-center gap-4 p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-900/20 relative z-10 group-hover:bg-emerald-100/50 dark:group-hover:bg-emerald-900/20 transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm transition-transform group-hover:scale-110">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-slate-900 dark:text-white truncate">#{lastAcceptedBulletin.numero_bulletin}</p>
                                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Validé • {new Date(lastAcceptedBulletin.updatedAt).toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center border-2 border-dashed border-slate-100 dark:border-white/10 rounded-[1.5rem]">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Aucun dossier validé</p>
                            </div>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="p-8 rounded-[2.5rem] shadow-xl border border-purple-100 dark:border-purple-900/20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl relative overflow-hidden flex flex-col gap-4 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center justify-between relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Dernière récl. acceptée</p>
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        </div>
                        {lastTreatedReclamation ? (
                            <div className="flex items-center gap-4 p-5 bg-purple-50/50 dark:bg-purple-900/10 rounded-[1.5rem] border border-purple-100 dark:border-purple-900/20 relative z-10 group-hover:bg-purple-100/50 dark:group-hover:bg-purple-900/20 transition-colors">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-purple-500 shadow-sm transition-transform group-hover:scale-110">
                                    <MessageSquare size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-slate-900 dark:text-white truncate">{lastTreatedReclamation.objet}</p>
                                    <p className="text-[10px] font-bold text-purple-600/70 uppercase">Traitée • {new Date(lastTreatedReclamation.updatedAt).toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center border-2 border-dashed border-slate-100 dark:border-white/10 rounded-[1.5rem]">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Aucune récl. traitée</p>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        onClick={() => navigate('/bulletins')}
                        className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 shadow-xl flex flex-col gap-5 relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-600/5 dark:bg-purple-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <h3 className="text-lg font-black tracking-tight relative z-10">Dernière activité</h3>
                        {bulletins.length > 0 ? (
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/10 flex items-center justify-center backdrop-blur-md shadow-inner border border-slate-100 dark:border-white/10 group-hover:rotate-12 transition-transform">
                                    <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-0.5">Dernier dépôt détecté</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-sm text-slate-900 dark:text-white">#{bulletins[0].numero_bulletin}</p>
                                        <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/20"></div>
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

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, FileText, AlertTriangle,
  Wallet, Loader2, Lightbulb, Gauge,
} from 'lucide-react';
import { getAdminStats } from '../../services/statsService';

const PIE_COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6'];

const insightStyle = (type) => {
  switch (type) {
    case 'alert':
      return 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100';
    case 'warning':
      return 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100';
    case 'success':
      return 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100';
    default:
      return 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100';
  }
};

const SECTION_SCROLL_MARGIN = 'scroll-mt-24';

const navLinkClass =
  'inline-flex shrink-0 items-center rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-sm hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors';

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

  const bi = data?.bi;
  const pieData = (bi?.distributionCadreSoins || []).map((d) => ({
    name: d.label,
    value: d.count,
  }));

  const navItems = [
    { id: 'stats-vue-ensemble', label: "Vue d'ensemble" },
    { id: 'stats-flux', label: 'Flux financiers' },
    ...(bi ? [{ id: 'stats-bi', label: 'Business intelligence' }] : []),
    { id: 'stats-fraude', label: 'Fraude' },
  ];

  const goToSection = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Tableau de Bord</h1>
          <p className="text-slate-500 font-medium">Statistiques administratives CareCover</p>
        </div>
      </div>

      <nav
        aria-label="Sections du tableau de bord"
        className="sticky top-0 z-30 -mx-2 px-2 py-3 mb-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm"
      >
        <ul className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
          {navItems.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} onClick={goToSection(item.id)} className={navLinkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="stats-vue-ensemble" className={`space-y-12 ${SECTION_SCROLL_MARGIN}`}>
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
      </section>

      <div
        id="stats-flux"
        className={`bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-100 h-[400px] relative overflow-hidden ${SECTION_SCROLL_MARGIN}`}
      >
          <h3 className="text-xl font-black mb-10">Flux Financiers</h3>
          <ResponsiveContainer width="100%" height="100%" debounce={100} minWidth={0} minHeight={0}>
            <AreaChart data={data?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="cash" name="Volume déclaré (TND)" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} />
              <Area type="monotone" dataKey="cashAccepte" name="Montant accepté (TND)" stroke="#10B981" fill="#10B981" fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainer>
      </div>

      {bi && (
        <section id="stats-bi" className={`space-y-8 ${SECTION_SCROLL_MARGIN}`}>
          <div className="flex items-center gap-3">
            <Gauge className="text-violet-600" size={28} />
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Business intelligence</h2>
              <p className="text-sm text-slate-500 font-medium">Pipeline, répartition et signaux décisionnels</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-lg">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Taux d&apos;acceptation</p>
              <p className="text-2xl font-black text-emerald-600 tabular-nums">{bi.acceptanceRatePct ?? 0} %</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-lg">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">En attente / cours</p>
              <p className="text-2xl font-black text-amber-600 tabular-nums">{bi.pendingRatePct ?? 0} %</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-lg">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Réclamations / bulletins</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {(bi.reclamationRatio != null ? bi.reclamationRatio * 100 : 0).toFixed(1)} %
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-lg">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Délai moyen traitement</p>
              <p className="text-2xl font-black text-violet-600 tabular-nums">
                {bi.avgProcessingHours != null ? `${bi.avgProcessingHours} h` : '—'}
              </p>
            </div>
          </div>

          {bi.dossierQuality && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Confiance IA (moy.)</p>
                <p className="text-xl font-black">{bi.dossierQuality.avgConfianceScore ?? '—'}</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Score fraude (moy.)</p>
                <p className="text-xl font-black">{bi.dossierQuality.avgFraudScore ?? 0}</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Suspicion locale</p>
                <p className="text-xl font-black">{bi.dossierQuality.suspicionLocalePct ?? 0} %</p>
              </div>
            </div>
          )}

          {bi.insights?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="text-amber-500" size={22} />
                <h3 className="text-lg font-black">Insights</h3>
              </div>
              <ul className="space-y-3">
                {bi.insights.map((ins, i) => (
                  <li
                    key={i}
                    className={`text-sm font-medium p-4 rounded-xl border ${insightStyle(ins.type)}`}
                  >
                    {ins.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 h-[380px]">
              <h3 className="text-xl font-black mb-6">Pipeline par statut</h3>
              <ResponsiveContainer width="100%" height="82%">
                <BarChart data={bi.pipelineByStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Bulletins" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 h-[380px]">
              <h3 className="text-xl font-black mb-6">Répartition cadre de soins</h3>
              {pieData.length === 0 ? (
                <p className="text-slate-500 text-sm p-6">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height="82%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl">
            <h3 className="text-xl font-black mb-6">Top adhérents par volume déclaré</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/10">
                    <th className="pb-3 pr-4">Adhérent</th>
                    <th className="pb-3 pr-4">Matricule</th>
                    <th className="pb-3 pr-4">Bulletins</th>
                    <th className="pb-3">Montant total (TND)</th>
                  </tr>
                </thead>
                <tbody>
                  {(bi.topAdherentsBySpend || []).map((row) => (
                    <tr key={row.userId} className="border-b border-slate-50 dark:border-white/5">
                      <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">{row.nom}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{row.matricule || '—'}</td>
                      <td className="py-3 pr-4 tabular-nums">{row.bulletinCount}</td>
                      <td className="py-3 tabular-nums font-semibold">{(row.totalMontant || 0).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!bi.topAdherentsBySpend || bi.topAdherentsBySpend.length === 0) && (
                <p className="text-slate-500 text-sm py-4">Aucun bulletin</p>
              )}
            </div>
          </div>
        </section>
      )}

      <section id="stats-fraude" className={`space-y-6 ${SECTION_SCROLL_MARGIN}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-white/5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Alertes actives</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{data?.fraud?.activeAlertsCount || 0}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-white/5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Risque eleve</p>
          <h3 className="text-3xl font-black text-rose-600">{data?.fraud?.highRiskAlertsCount || 0}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-white/5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Top adhérents suspects</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{data?.fraud?.topSuspectDoctors?.length || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-white/5 h-[360px]">
          <h3 className="text-xl font-black mb-6">Evolution fraude</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={data?.fraud?.fraudMonthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgFraudScore" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-white/5">
          <h3 className="text-xl font-black mb-6">Top adhérents suspects</h3>
          <div className="space-y-3 max-h-[280px] overflow-auto pr-1">
            {(data?.fraud?.topSuspectDoctors || []).map((doc) => (
              <div
                key={doc.adherentId ?? doc.medecinId ?? doc.nom}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{doc.nom}</p>
                  <p className="text-xs text-slate-500">{doc.alertsCount} alertes</p>
                </div>
                <span className="text-sm font-black text-rose-600">{doc.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </section>
    </div>
  );
};

export default AdminStats;

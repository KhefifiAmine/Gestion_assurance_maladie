import React from 'react';
import { Link } from 'react-router-dom';
import { 
    HeartPulse, 
    LayoutDashboard, 
    Users, 
    FileText, 
    MessageCircle, 
    FileCheck, 
    Shield, 
    Building2, 
    Stethoscope, 
    BadgeCheck,
    Star
} from 'lucide-react';

const LandingPage = () => {
    return (
        <>

            {/* 2. SECTION HÉRO */}
            {/* 60% FOND DOMINANT - Léger fond violet très clair */}
            <section className="relative bg-purple-50/30 overflow-hidden pt-20 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        
                        {/* Colonne Gauche - Texte */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-amber-100/50 border border-amber-200">
                                {/* 10% ACCENT - Petite touche d'ambre pour attirer l'œil */}
                                <Star className="text-amber-500" size={16} fill="currentColor" />
                                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Nouveau : Analyse par IA</span>
                            </div>
                            
                            {/* 10% ACCENT - Gros titre très sombre pour contraste */}
                            <h1 className="text-5xl md:text-6xl font-black text-purple-900 tracking-tighter leading-tight mb-6">
                                Votre santé, vos démarches, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">simplifiées.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                CareCover centralise vos remboursements, la gestion de vos bénéficiaires et le suivi de vos bulletins de soins. Tout votre espace adhérent, au même endroit.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                {/* BOUTON 30% - Dégradé violet */}
                                <Link 
                                    to="/register" 
                                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-purple-600/30 hover:scale-105 transition-transform"
                                >
                                    Commencer maintenant
                                </Link>
                                {/* BOUTON 60% - Blanc/bordure */}
                                
                            </div>
                        </div>

                        {/* Colonne Droite - Visuel Abstrait */}
                        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
                            {/* Décoration abstraite avec fond violet très léger */}
                            <div className="aspect-square md:aspect-[4/3] rounded-[3rem] bg-gradient-to-br from-purple-100 via-white to-indigo-50 border border-white shadow-2xl relative overflow-hidden flex items-center justify-center p-8">
                                {/* Cercles décoratifs floutés (effets de lumière) */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                                
                                {/* Éléments centraux représentant l'application */}
                                <div className="relative w-full h-full flex flex-col items-center justify-center gap-8">
                                    <div className="flex justify-between w-full max-w-xs gap-4 relative z-10">
                                        <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
                                            <FileCheck className="text-purple-600" size={40} />
                                        </div>
                                        <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center translate-y-8 animate-bounce" style={{ animationDuration: '4s' }}>
                                            <Users className="text-indigo-600" size={40} />
                                        </div>
                                    </div>
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-700 shadow-2xl shadow-purple-600/40 flex items-center justify-center relative z-20 hover:scale-110 transition-transform cursor-pointer">
                                        <Shield className="text-white" size={48} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. SECTION FONCTIONNALITÉS */}
            <section id="features" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        {/* 10% ACCENT - Titre foncé centré */}
                        <h2 className="text-4xl font-black text-purple-900 tracking-tight mb-4">Pourquoi choisir CareCover ?</h2>
                        <p className="text-lg text-slate-600">Une gestion moderne, transparente et accélérée de votre couverture santé.</p>
                    </div>

                    {/* Grille 2x2 responsive */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Carte 1 */}
                        <div className="p-8 rounded-[2rem] bg-purple-50/50 border border-purple-100 hover:shadow-xl hover:bg-white transition-all group">
                            {/* 30% - Icône dans un cercle violet */}
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-600/30">
                                <LayoutDashboard className="text-white" size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-purple-900 mb-3">Vue d'ensemble</h3>
                            <p className="text-slate-600 leading-relaxed">Statistiques rapides sur vos bulletins et l'avancement de vos remboursements en un clin d'œil.</p>
                        </div>

                        {/* Carte 2 */}
                        <div className="p-8 rounded-[2rem] bg-purple-50/50 border border-purple-100 hover:shadow-xl hover:bg-white transition-all group">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-600/30">
                                <Users className="text-white" size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-purple-900 mb-3">Gestion Familiale</h3>
                            <p className="text-slate-600 leading-relaxed">Ajoutez facilement conjoint et enfants. Tous vos proches rattachés à votre assurance CareCover.</p>
                        </div>

                        {/* Carte 3 */}
                        <div className="p-8 rounded-[2rem] bg-purple-50/50 border border-purple-100 hover:shadow-xl hover:bg-white transition-all group">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-600/30">
                                <FileText className="text-white" size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-purple-900 mb-3">Soumission & IA</h3>
                            <p className="text-slate-600 leading-relaxed">Envoyez vos feuilles de soins en photo. Suivez leur état : En attente, Validé ou Rejeté.</p>
                        </div>

                        {/* Carte 4 */}
                        <div className="p-8 rounded-[2rem] bg-purple-50/50 border border-purple-100 hover:shadow-xl hover:bg-white transition-all group">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-600/30">
                                <MessageCircle className="text-white" size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-purple-900 mb-3">Support intégré</h3>
                            <p className="text-slate-600 leading-relaxed">Ouvrez un ticket d'assistance et suivez l'historique de vos réclamations directement depuis l'application.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. SECTION CONFIANCE (Social Proof) */}
            {/* 60% FOND DOMINANT - Variante de fond coloré */}
            <section className="py-20 bg-purple-50 border-y border-purple-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-xl md:text-2xl font-medium text-slate-700 mb-12">
                        Rejoignez plus de <span className="font-black text-purple-900">50 000 adhérents</span> qui nous font confiance.
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-3 font-black text-xl text-slate-800">
                            <Building2 className="text-purple-600" size={32} /> Partenaires
                        </div>
                        <div className="flex items-center gap-3 font-black text-xl text-slate-800">
                            <Stethoscope className="text-indigo-600" size={32} /> Cliniques
                        </div>
                        <div className="flex items-center gap-3 font-black text-xl text-slate-800">
                            <BadgeCheck className="text-purple-600" size={32} /> Certifié
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. CALL TO ACTION FINAL */}
            <section className="py-32 bg-white text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl md:text-5xl font-black text-purple-900 tracking-tight mb-8">
                        Prêt à simplifier votre gestion santé ?
                    </h2>
                    <Link 
                        to="/register" 
                        className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white text-xl font-black rounded-2xl shadow-2xl shadow-purple-600/40 hover:scale-105 hover:shadow-purple-600/60 transition-all"
                    >
                        Créer mon compte CareCover
                    </Link>
                </div>
            </section>

            {/* 6. FOOTER */}
            {/* 30% INVERSÉ - Fond foncé pour clore la page */}
            <footer className="bg-purple-950 text-purple-200 py-12 border-t border-purple-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <HeartPulse className="text-purple-400" size={24} />
                        <span className="text-xl font-black text-white tracking-tight">CareCover</span>
                    </div>
                    
                    <p className="text-sm">© 2025 CareCover. Tous droits réservés.</p>
                    
                    <div className="flex items-center gap-6 text-sm font-medium">
                        <a href="#privacy" className="hover:text-white transition-colors">Confidentialité</a>
                        <a href="#terms" className="hover:text-white transition-colors">Conditions</a>
                        <a href="#contact" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>

        </>
    );
};

export default LandingPage;

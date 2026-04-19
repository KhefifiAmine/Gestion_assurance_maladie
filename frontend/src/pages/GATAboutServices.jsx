import React, { useState } from 'react';
import { motion } from 'framer-motion';
const GAT_LOGO_URL = "https://www.un.org.tn/wp-content/uploads/2021/04/GAT-Assurances.jpg";
import { 
  Shield, 
  Home, 
  HeartPulse, 
  TrendingUp, 
  Umbrella, 
  Plane, 
  Globe, 
  Briefcase, 
  Building2, 
  Smartphone, 
  Apple, 
  Play, 
  ArrowRight,
  Award,
  Users,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const GATAboutServices = () => {
    const services = [
        {
            name: "Automobile",
            icon: <Shield className="w-8 h-8" />,
            description: "Protection complète pour votre véhicule, avec assistance 24/7 et expertise rapide.",
        },
        {
            name: "Habitation",
            icon: <Building2 className="w-8 h-8" />,
            description: "Sécurisez votre foyer et vos biens contre les imprévus avec nos garanties sur mesure.",
        },
        {
            name: "Santé",
            icon: <HeartPulse className="w-8 h-8" />,
            description: "Une couverture santé optimale pour vous et votre famille, incluant la téléconsultation.",
        },
        {
            name: "Vie & Épargne",
            icon: <TrendingUp className="w-8 h-8" />,
            description: "Préparez votre avenir et celui de vos proches avec nos solutions d'épargne fructueuses.",
        },
        {
            name: "Voyage",
            icon: <Globe className="w-8 h-8" />,
            description: "Partez l'esprit tranquille avec une assistance mondiale et une prise en charge médicale.",
        },
        {
            name: "Entreprise",
            icon: <Briefcase className="w-8 h-8" />,
            description: "Des solutions dédiées aux professionnels pour protéger votre activité et vos salariés.",
        }
    ];

    const stats = [
        { label: "45+ Ans d'Expérience", icon: <Award className="text-amber-500" />, value: "Depuis 1975" },
        { label: "+500k Clients", icon: <Users className="text-blue-500" />, value: "Confiance" },
        { label: "95% Satisfaction", icon: <CheckCircle2 className="text-emerald-500" />, value: "Engagement" }
    ];

    return (
        <div className="font-sans text-slate-800 bg-white selection:bg-blue-100">
            {/* Navigation / Header Logo */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <img 
                        src={GAT_LOGO_URL} 
                        alt="GAT Assurances Logo" 
                        className="h-10 md:h-12 w-auto object-contain rounded-lg"
                    />
                    <button className="hidden md:block bg-[#004B87] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#003a6a] transition-all transform hover:scale-105">
                        Espace Client
                    </button>
                    <button className="md:hidden text-[#004B87]">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* 1. Hero Header */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 -z-10 opacity-5">
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#004B87] rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-400 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2"></div>
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-6">
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="max-w-3xl"
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 text-[#004B87] text-xs font-black uppercase tracking-widest border border-blue-100">
                            Leader de l'assurance en Tunisie
                        </span>
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-[#004B87] mb-8 leading-[1.1] tracking-tight">
                            Protéger votre avenir <span className="text-blue-500">depuis 1975</span>
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                            Le Groupe des Assurances de Tunisie (GAT) vous accompagne à chaque étape de votre vie avec des solutions innovantes, une proximité humaine et une confiance inébranlable.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="bg-[#004B87] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#003a6a] transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2">
                                Découvrir nos offres <ArrowRight size={20} />
                            </button>
                            <button className="bg-white text-[#004B87] border-2 border-blue-100 px-8 py-4 rounded-2xl font-bold text-lg hover:border-blue-200 transition-all">
                                Qui sommes-nous ?
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. About GAT Grid */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div 
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                        >
                            <h2 className="text-3xl lg:text-4xl font-bold text-[#004B87] mb-6">Un engagement historique envers les tunisiens</h2>
                            <div className="space-y-4 text-slate-600 leading-relaxed text-lg">
                                <p>
                                    Fondé en 1975, GAT Assurances s'est imposé comme un acteur incontournable du paysage financier tunisien. Notre mission est d'apporter sérénité et sécurité à nos clients, qu'ils soient particuliers ou entreprises.
                                </p>
                                <p>
                                    Avec un réseau de plus de 150 agences réparties sur tout le territoire, nous privilégions la proximité et l'écoute pour offrir des conseils personnalisés et une réactivité exemplaire en cas de sinistre.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div 
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6"
                        >
                            {stats.map((stat, idx) => (
                                <motion.div 
                                    key={idx}
                                    variants={fadeIn}
                                    className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                                >
                                    <div className="mb-4 p-3 rounded-2xl bg-slate-50 w-fit group-hover:scale-110 transition-transform">
                                        {stat.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-1">{stat.label}</h3>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.value}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. Core Services Showcase */}
            <section className="py-24 lg:py-32">
                <div className="max-w-7xl mx-auto px-6 text-center mb-20 px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                    >
                        <h2 className="text-4xl lg:text-5xl font-black text-[#004B87] mb-6 tracking-tight">Nos Solutions d'Assurance</h2>
                        <div className="w-20 h-1.5 bg-blue-500 mx-auto rounded-full mb-8"></div>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            Nous avons conçu une large gamme de produits pour couvrir tous vos besoins de protection et vous permettre de vivre vos projets sans crainte.
                        </p>
                    </motion.div>
                </div>

                <div className="max-w-7xl mx-auto px-6">
                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {services.map((service, idx) => (
                            <motion.div 
                                key={idx}
                                variants={fadeIn}
                                whileHover={{ y: -10 }}
                                className="group p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                <div className="relative z-10">
                                    <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-50 text-[#004B87] mb-8 group-hover:bg-[#004B87] group-hover:text-white transition-colors duration-500">
                                        {service.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold text-[#004B87] mb-4">{service.name}</h3>
                                    <p className="text-slate-500 mb-8 leading-relaxed">
                                        {service.description}
                                    </p>
                                    <a href="#" className="inline-flex items-center gap-2 text-sm font-black text-[#004B87] hover:gap-3 transition-all">
                                        EN SAVOIR PLUS <ChevronRight size={16} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 4. Digital Advantage Card */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-gradient-to-br from-[#004B87] to-blue-600 rounded-[3rem] p-10 lg:p-20 relative overflow-hidden text-white">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

                        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <Smartphone className="w-8 h-8" />
                                    </div>
                                    <span className="text-xl font-bold tracking-tight">MyGAT Assurances</span>
                                </div>
                                <h2 className="text-4xl lg:text-5xl font-black mb-8 leading-tight">Gérez vos contrats <br/>où que vous soyez</h2>
                                <p className="text-blue-100 text-lg mb-12 max-w-xl leading-relaxed">
                                    Paiement en ligne sécurisé, assistance 24/7 en un clic et suivi des sinistres en temps réel. L'expérience GAT devient 100% digitale pour plus de simplicité.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <button className="bg-white text-[#004B87] px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-blue-50 transition-all transform hover:scale-105 active:scale-95 shadow-xl">
                                        <Apple className="fill-current" /> App Store
                                    </button>
                                    <button className="bg-black/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-white/30 transition-all transform hover:scale-105 active:scale-95">
                                        <Play className="fill-current" /> Google Play
                                    </button>
                                </div>
                            </div>
                            <div className="hidden lg:flex justify-center relative">
                                <motion.div 
                                    animate={{ y: [0, -15, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="bg-white/10 p-6 rounded-[2.5rem] backdrop-blur-xl border border-white/20 shadow-2xl"
                                >
                                    <div className="w-64 h-[500px] bg-slate-900 rounded-[2rem] border-4 border-slate-800 overflow-hidden relative">
                                        <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 flex justify-center items-center">
                                            <div className="w-10 h-1.5 bg-slate-700 rounded-full"></div>
                                        </div>
                                        <div className="p-6 pt-10">
                                            <div className="w-12 h-12 bg-[#004B87] rounded-xl mb-6"></div>
                                            <div className="h-4 bg-slate-700 rounded-full w-24 mb-3"></div>
                                            <div className="h-4 bg-slate-700 rounded-full w-32 mb-8 opacity-50"></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="h-20 bg-slate-800 rounded-2xl"></div>
                                                <div className="h-20 bg-slate-800 rounded-2xl"></div>
                                                <div className="h-20 bg-slate-800 rounded-2xl"></div>
                                                <div className="h-20 bg-slate-800 rounded-2xl"></div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Simple Footer/CTA Banner */}
            <section className="py-24 bg-[#004B87] text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight">Besoin d'un devis personnalisé ?</h2>
                            <p className="text-blue-100 text-lg">Nos conseillers sont à votre entière disposition pour vous guider.</p>
                        </div>
                        <button className="bg-white text-[#004B87] px-12 py-5 rounded-3xl font-black text-xl hover:bg-blue-50 transition-all shadow-2xl hover:shadow-white/20 transform hover:-translate-y-1">
                            Contactez un conseiller
                        </button>
                    </div>
                    
                    <div className="mt-24 pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between gap-8 text-blue-200/60 text-sm font-bold">
                        <div className="flex flex-wrap gap-8 items-center">
                            <img src={GAT_LOGO_URL} alt="Logo" className="h-8 brightness-0 invert opacity-50 grayscale contrast-200" />
                            <span>© 2026 GAT Assurances. Tous droits réservés.</span>
                        </div>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-white">Mentions légales</a>
                            <a href="#" className="hover:text-white">Confidentialité</a>
                            <a href="#" className="hover:text-white">Réseau d'agences</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default GATAboutServices;

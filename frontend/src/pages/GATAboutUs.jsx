import React from 'react';
import { motion } from 'framer-motion';
import { 
    Award, 
    Users, 
    CheckCircle2, 
    HeartHandshake, 
    Lightbulb, 
    BarChart3, 
    Smartphone, 
    Apple, 
    Play, 
    ArrowRight,
    ChevronRight,
    History,
    ShieldCheck,
    Globe2
} from 'lucide-react';

const GAT_LOGO_URL = "https://www.un.org.tn/wp-content/uploads/2021/04/GAT-Assurances.jpg";

// Animation Variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const GATAboutUs = () => {
    const values = [
        {
            title: "Proximité Humaine",
            description: "Nous plaçons l'humain au cœur de notre métier en étant toujours proches des familles tunisiennes pour les soutenir dans les moments qui comptent.",
            icon: <HeartHandshake className="w-10 h-10" />
        },
        {
            title: "Innovation Digitale",
            description: "Simplifier votre quotidien grâce à des solutions modernes comme MyGAT, permettant une gestion fluide et instantanée de vos contrats.",
            icon: <Lightbulb className="w-10 h-10" />
        },
        {
            title: "Solidité Financière",
            description: "Depuis 1975, nous garantissons une fiabilité et une sécurité financière inébranlable, socle de la confiance que nous portent nos assurés.",
            icon: <BarChart3 className="w-10 h-10" />
        }
    ];

    const stats = [
        { number: "45+", label: "Ans d'Expérience", value: "Expertise" },
        { number: "+500k", label: "Clients Satisfaits", value: "Confiance" },
        { number: "95%", label: "Taux de Satisfaction", value: "Qualité" }
    ];

    return (
        <div className="font-sans text-gray-800 bg-white selection:bg-purple-100 overflow-hidden">
            
            {/* 1. Hero Header */}
            <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <span className="inline-block px-5 py-2 mb-8 rounded-full bg-[#E53935]/10 text-[#E53935] text-xs font-black uppercase tracking-[0.2em] border border-[#E53935]/20 animate-pulse">
                            Confiance & Proximité
                        </span>
                        
                        <h1 className="text-5xl lg:text-7xl font-extrabold mb-8 leading-[1.1] tracking-tight bg-gradient-to-r from-[#6A1B6A] to-[#8A2C8A] bg-clip-text text-transparent">
                            Protéger votre avenir <br/> depuis 1975
                        </h1>
                        
                        <p className="text-xl text-gray-700 mb-10 leading-relaxed max-w-2xl mx-auto">
                            Leader de l'assurance en Tunisie, GAT vous accompagne à chaque étape de votre vie avec des solutions innovantes et une confiance inébranlable.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-5 justify-center">
                            <button className="bg-gradient-to-r from-[#6A1B6A] to-[#8A2C8A] text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-purple-900/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                                Nos Garanties <ArrowRight size={20} />
                            </button>
                            <button className="bg-white text-[#6A1B6A] border-2 border-gray-100 px-10 py-4 rounded-2xl font-bold text-lg hover:border-[#E53935]/30 transition-all">
                                Histoire de GAT
                            </button>
                        </div>
                    </motion.div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[#6A1B6A]/5 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[20%] right-[5%] w-96 h-96 bg-[#E53935]/5 rounded-full blur-[120px]"></div>
                </div>
            </section>

            {/* 2. About GAT Grid */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div 
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-12 h-1 bg-[#E53935] rounded-full"></span>
                                <span className="text-[#E53935] font-black uppercase text-sm tracking-widest">Qui sommes-nous</span>
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-[#6A1B6A] mb-8 leading-tight">
                                Plus de quatre décennies <br/> au service de la nation
                            </h2>
                            <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                                <p>
                                    Le Groupe des Assurances de Tunisie (GAT) est né en 1975 d'une volonté forte : offrir aux Tunisiens une protection fiable et moderne. Depuis lors, nous n'avons cessé d'innover pour répondre aux défis changeants de notre société.
                                </p>
                                <p>
                                    Notre engagement dépasse la simple indemnisation. Nous sommes des partenaires de vie, engagés socialement et économiquement pour le développement durable de la Tunisie.
                                </p>
 intellectual property properties is properly protected in all our service channels.
                            </div>
                        </motion.div>

                        <motion.div 
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6"
                        >
                            {stats.map((stat, idx) => (
                                <motion.div 
                                    key={idx}
                                    variants={fadeIn}
                                    whileHover={{ x: 10 }}
                                    className="p-8 bg-gray-50 rounded-[2.5rem] border border-[#8A2C8A]/10 hover:border-[#E53935]/30 hover:shadow-2xl hover:shadow-[#E53935]/10 transition-all duration-500 group"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-5xl font-black text-[#FBC02D] mb-1 group-hover:scale-110 transition-transform origin-left">{stat.number}</h3>
                                            <p className="text-lg font-bold text-[#6A1B6A] mb-1">{stat.label}</p>
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">{stat.value}</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl shadow-sm text-[#E53935]">
                                            {idx === 0 ? <History size={28}/> : idx === 1 ? <Users size={28}/> : <ShieldCheck size={28}/>}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. Core Values / Mission Showcase */}
            <section className="py-24 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20 px-6">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                        >
                            <h2 className="text-4xl lg:text-5xl font-black text-[#6A1B6A] mb-6 tracking-tight relative inline-block">
                                Nos Valeurs Fondamentales
                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-2 bg-[#E53935] rounded-full"></span>
                            </h2>
                            <p className="mt-12 text-gray-500 max-w-2xl mx-auto text-lg">
                                Notre philosophie repose sur trois piliers essentiels qui dirigent chacune de nos décisions et interactions.
                            </p>
                        </motion.div>
                    </div>

                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-3 gap-10"
                    >
                        {values.map((value, idx) => (
                            <motion.div 
                                key={idx}
                                variants={fadeIn}
                                whileHover={{ y: -12 }}
                                className="p-10 rounded-[3rem] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-[#E53935]/20 transition-all duration-500 group text-center"
                            >
                                <div className="w-20 h-20 flex items-center justify-center rounded-3xl bg-[#E53935]/5 text-[#E53935] mb-8 mx-auto group-hover:bg-[#E53935] group-hover:text-white transition-all duration-500 transform group-hover:rotate-6">
                                    {value.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-[#6A1B6A] mb-4">{value.title}</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    {value.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 4. Our Commitment to Tunisia */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#6A1B6A] to-[#8A2C8A] -z-10"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 -translate-x-1/2 -z-10"></div>
                
                <div className="max-w-7xl mx-auto px-6 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto"
                    >
                        <Globe2 className="w-16 h-16 mx-auto mb-8 text-[#FBC02D] animate-pulse" />
                        <h2 className="text-4xl lg:text-6xl font-black mb-8 leading-tight">Un engagement indéfectible <br/> pour la Tunisie</h2>
                        <p className="text-xl text-purple-100 mb-12 leading-relaxed font-medium">
                            En tant qu'entreprise citoyenne, GAT Assurances joue un rôle vital dans le soutien de l'économie locale. Nous investissons dans l'avenir de nos jeunes, soutenons la culture tunisienne et œuvrons pour un impact social positif à travers toutes nos activités.
                        </p>
                        <a href="#" className="inline-flex items-center gap-3 text-xl font-black text-[#FBC02D] border-b-2 border-[#FBC02D] pb-1 hover:gap-5 transition-all">
                            Découvrir notre bilan social <ChevronRight size={24} />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* 5. Digital Advantage Highlight */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-gray-50 rounded-[4rem] p-12 lg:p-24 grid lg:grid-cols-2 gap-20 items-center relative">
                        <div className="relative z-10">
                            <div className="p-3 bg-[#E53935] text-white rounded-2xl w-fit mb-8 shadow-lg shadow-[#E53935]/30">
                                <Smartphone size={32} />
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-[#6A1B6A] mb-8 leading-tight">
                                Votre dossier d'assurance <br/> au creux de votre main
                            </h2>
                            <p className="text-gray-600 text-lg mb-12 leading-relaxed">
                                Gérez vos contrats où que vous soyez avec l'application <strong>MyGAT Assurances</strong>. Simplifiez-vous la vie avec la déclaration de sinistre en temps réel et le paiement mobile sécurisé.
                            </p>
                            <div className="flex flex-wrap gap-5">
                                <button className="bg-[#D32F2F] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-[#E53935] hover:scale-105 transition-all shadow-xl shadow-red-900/10">
                                    <Apple className="fill-current" /> App Store
                                </button>
                                <button className="bg-[#D32F2F] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-[#E53935] hover:scale-105 transition-all shadow-xl shadow-red-900/10">
                                    <Play className="fill-current" /> Google Play
                                </button>
                            </div>
                        </div>
                        
                        <div className="relative flex justify-center items-center">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#6A1B6A]/10 to-[#E53935]/10 rounded-full blur-[80px]"></div>
                            <motion.div 
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="relative z-10 w-64 h-[500px] bg-white rounded-[3rem] p-4 shadow-2xl border-8 border-gray-900"
                            >
                                <div className="w-full h-full bg-gray-50 rounded-[2rem] overflow-hidden p-6">
                                    <div className="w-12 h-12 bg-gradient-to-r from-[#6A1B6A] to-[#8A2C8A] rounded-xl mb-6"></div>
                                    <div className="space-y-4">
                                        <div className="h-4 bg-gray-200 rounded-full w-2/3"></div>
                                        <div className="h-4 bg-gray-200 rounded-full w-full opacity-50"></div>
                                        <div className="h-40 bg-gray-100 rounded-3xl mt-8"></div>
                                        <div className="h-20 bg-[#E53935]/10 rounded-2xl"></div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Footer / Contact CTA Banner */}
            <section className="py-24 bg-gray-100 relative">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-[#6A1B6A] mb-6">Besoin d'un devis personnalisé ?</h2>
                    <p className="text-gray-500 text-lg mb-12 max-w-xl mx-auto">
                        Nos conseillers en assurance sont prêts à créer une solution sur mesure adaptée à vos besoins réels.
                    </p>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        <button className="bg-gradient-to-r from-[#6A1B6A] to-[#8A2C8A] text-white px-12 py-5 rounded-[2rem] font-black text-xl hover:shadow-2xl hover:shadow-purple-900/30 transition-all transform hover:-translate-y-1">
                            Simuler mon devis
                        </button>
                        <a href="tel:71123456" className="text-xl font-black text-[#E53935] hover:underline flex items-center gap-2">
                            Contactez un conseiller <ChevronRight size={20} />
                        </a>
                    </div>
                </div>
            </section>

            {/* Copyright area */}
            <div className="py-8 bg-gray-100 border-t border-gray-200 text-center px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm font-bold">
                    <img src={GAT_LOGO_URL} alt="Logo" className="h-8 grayscale opacity-50" />
                    <p>© 2026 GAT Assurances - Groupe des Assurances de Tunisie. Tous droits réservés.</p>
                </div>
            </div>
        </div>
    );
};

export default GATAboutUs;

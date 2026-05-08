import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import logoGat from '../assets/logo_gat.png';
import { 
    Shield, 
    Heart, 
    Car, 
    Home, 
    Building, 
    Umbrella, 
    CheckCircle2, 
    Clock, 
    MapPin, 
    Smartphone, 
    Apple, 
    Play, 
    Star, 
    Quote, 
    ChevronRight,
    ArrowRight,
    Zap,
    Users
} from 'lucide-react';

// --- Reusable CountUp Component ---
const StatCounter = ({ end, duration = 2 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView) {
            let start = 0;
            // Extract numeric value from string (e.g., "45+" -> 45)
            const target = parseInt(end.toString().replace(/\D/g, ''));
            const totalFrames = Math.round(duration * 60);
            const increment = target / totalFrames;

            const timer = setInterval(() => {
                start += increment;
                if (start >= target) {
                    setCount(target);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(start));
                }
            }, 1000 / 60);

            return () => clearInterval(timer);
        }
    }, [isInView, end, duration]);

    // Keep the suffix from the original string (e.g., "+" or "%")
    const suffix = end.toString().replace(/[0-9]/g, '');

    return <span ref={ref}>{count}{suffix}</span>;
};

// --- Animation Variants ---
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
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

const floatAnimation = {
    y: [0, -15, 0],
    rotate: [0, 5, 0],
    transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
    }
};

const GATVitrine = () => {
    const products = [
        { name: "Automobile", desc: "Protection complète pour votre véhicule contre tous les risques.", icon: <Car /> },
        { name: "Santé", desc: "Des soins de qualité accessibles avec des remboursements rapides.", icon: <Heart /> },
        { name: "Habitation", desc: "Assurez votre foyer et vos biens avec des garanties sur mesure.", icon: <Home /> },
        { name: "Voyage", desc: "Partez serein avec une assistance mondiale 24h/24 et 7j/7.", icon: <Umbrella /> }
    ];

    const whyGAT = [
        { title: "Innovation Digitale", desc: "Déclarez vos sinistres et suivez vos remboursements via MyGAT.", icon: <Smartphone /> },
        { title: "Proximité Humaine", desc: "Notre réseau de 120 agences vous assure un conseil de proximité.", icon: <MapPin /> },
        { title: "Solidité Financière", desc: "Un groupe de plus de 45 ans d'expertise au service des Tunisiens.", icon: <Zap /> }
    ];

    const testimonials = [
        { name: "Ahmed Ben Ali", role: "Client GAT depuis 10 ans", text: "Le meilleur service client que j'ai connu en Tunisie. Toujours à l'écoute." },
        { name: "Sonia Ghomri", role: "Adhérente Santé", text: "Les remboursements sont ultra rapides grace à l'application MyGAT. Je recommande !" },
        { name: "Mohamed Dridi", role: "Professionnel", text: "Une solidité rassurante pour mon entreprise. Un partenaire de confiance." }
    ];

    return (
        <div className="font-['Inter'] text-gray-800 bg-white selection:bg-purple-100">
            
            {/* 1. Hero Vitrine (NO NAVBAR) */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -z-10 skew-x-12 translate-x-1/4"></div>
                <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-[#6A1B6A]/5 rounded-full blur-[100px] -z-10"></div>
                
                <div className="max-w-7xl mx-auto px-6 w-full flex flex-col items-center">
                    {/* Top Logo Branding */}
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        className="text-center mb-12"
                    >
                        <motion.img 
                            src={logoGat} 
                            alt="Logo GAT"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-32 lg:h-48 w-auto object-contain mx-auto mb-10 filter drop-shadow-xl"
                        />
                    </motion.div>

                    <div className="w-full grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Content */}
                        <motion.div 
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                            className="text-center lg:text-left"
                        >
                            <h1 className="text-5xl lg:text-8xl font-black mb-8 leading-[1] tracking-tighter">
                                Votre Sérénité, <br/> 
                                <span className="bg-gradient-to-r from-[#6A1B6A] to-[#8A2C8A] bg-clip-text text-transparent">Notre Engagement</span>
                            </h1>
                        
                        <p className="text-xl text-gray-600 mb-6 max-w-xl leading-relaxed">
                            Leader de l'assurance en Tunisie depuis 1975, GAT Assurances s'appuie sur la confiance et l'innovation pour vous offrir une protection complète et des solutions sur mesure adaptées à chaque étape de votre vie.
                        </p>
                    </motion.div>

                    {/* Right: Floating Visuals */}
                    <div className="relative hidden lg:flex justify-center items-center h-[600px]">
                        <div className="absolute w-[450px] h-[450px] border-2 border-gray-100 rounded-full animate-[spin_20s_linear_infinite]"></div>
                        <div className="absolute w-[300px] h-[300px] border-2 border-gray-100 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>
                        
                        {/* Floating Icons */}
                        <motion.div animate={floatAnimation} className="absolute top-10 right-10 bg-white p-6 rounded-3xl shadow-xl text-[#6A1B6A] border border-gray-50">
                            <Shield size={48} />
                        </motion.div>
                        <motion.div animate={{...floatAnimation, transition: { ...floatAnimation.transition, delay: 0.5 }}} className="absolute bottom-20 left-10 bg-white p-6 rounded-3xl shadow-xl text-[#E53935] border border-gray-50">
                            <Heart size={48} />
                        </motion.div>
                        <motion.div animate={{...floatAnimation, transition: { ...floatAnimation.transition, delay: 1 }}} className="absolute top-1/2 left-0 -translate-y-1/2 bg-white p-8 rounded-[2.5rem] shadow-2xl text-[#8A2C8A] border-4 border-gray-50">
                            <Building size={64} />
                        </motion.div>
                        <motion.div animate={{...floatAnimation, transition: { ...floatAnimation.transition, delay: 1.5 }}} className="absolute top-1/3 right-0 bg-white p-6 rounded-3xl shadow-xl text-[#FBC02D] border border-gray-50">
                            <Car size={48} />
                        </motion.div>
                        <motion.div animate={{...floatAnimation, transition: { ...floatAnimation.transition, delay: 2 }}} className="absolute bottom-0 right-1/4 bg-white p-6 rounded-3xl shadow-xl text-blue-500 border border-gray-50">
                            <Home size={40} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>

            {/* 2. Bandeau Statistiques */}
            <section className="py-16 bg-gradient-to-r from-[#6A1B6A] to-[#8A2C8A] text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
                        <div>
                            <p className="text-[#FBC02D] text-5xl font-black mb-2 tracking-tighter">
                                <StatCounter end="45+" />
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Ans d'Expertise</p>
                        </div>
                        <div>
                            <p className="text-[#FBC02D] text-5xl font-black mb-2 tracking-tighter">
                                <StatCounter end="+500k" />
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Clients Protégés</p>
                        </div>
                        <div>
                            <p className="text-[#FBC02D] text-5xl font-black mb-2 tracking-tighter">
                                <StatCounter end="120" />
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Agences en Tunisie</p>
                        </div>
                        <div>
                            <p className="text-[#FBC02D] text-5xl font-black mb-2 tracking-tighter">
                                <StatCounter end="24/7" />
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Assistance</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Pourquoi Choisir GAT ? */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl lg:text-5xl font-black text-[#6A1B6A] mb-6 tracking-tight relative inline-block">
                            Pourquoi Choisir GAT ?
                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-2 bg-[#E53935] rounded-full"></span>
                        </h2>
                    </motion.div>

                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-3 gap-12"
                    >
                        {whyGAT.map((item, idx) => (
                            <motion.div 
                                key={idx}
                                variants={fadeInUp}
                                className="p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-2xl hover:shadow-[#6A1B6A]/10 transition-all duration-500 group text-center"
                            >
                                <div className="w-20 h-20 bg-white flex items-center justify-center rounded-3xl text-[#E53935] mx-auto mb-8 shadow-xl group-hover:bg-[#E53935] group-hover:text-white transition-all duration-500 transform group-hover:rotate-6">
                                    {React.cloneElement(item.icon, { size: 36 })}
                                </div>
                                <h3 className="text-2xl font-bold text-[#6A1B6A] mb-4">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 4. Nos Produits Phares */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-6">
                            <span className="bg-gradient-to-r from-[#6A1B6A] to-[#8A2C8A] bg-clip-text text-transparent">Des Solutions Pour Chaque Étape de Vie</span>
                        </h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            Que vous soyez un particulier ou un professionnel, nos offres d'assurance sont pensées pour votre sérénité totale.
                        </p>
                    </motion.div>

                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {products.map((product, idx) => (
                            <motion.div 
                                key={idx}
                                variants={fadeInUp}
                                whileHover={{ y: -10 }}
                                className="group p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-[#E53935]/20 transition-all duration-500"
                            >
                                <div className="text-[#E53935] mb-8 group-hover:scale-110 transition-transform origin-left">
                                    {React.cloneElement(product.icon, { size: 40, strokeWidth: 1.5 })}
                                </div>
                                <h3 className="text-2xl font-bold text-[#6A1B6A] mb-4">{product.name}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {product.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* 6. Témoignages Clients */}
            <section className="py-24 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl lg:text-5xl font-black text-[#6A1B6A] mb-10">Ils Nous Font Confiance</h2>
                    </motion.div>

                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-3 gap-10"
                    >
                        {testimonials.map((t, idx) => (
                            <motion.div 
                                key={idx}
                                variants={fadeInUp}
                                className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 relative group"
                            >
                                <Quote size={60} className="absolute top-6 right-6 text-[#E53935]/10 group-hover:text-[#E53935]/20 font-black transition-colors" />
                                <div className="flex gap-1 mb-8">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} size={16} className="fill-[#FBC02D] text-[#FBC02D]" />
                                    ))}
                                </div>
                                <p className="text-lg text-gray-600 mb-10 font-medium italic leading-relaxed">
                                    "{t.text}"
                                </p>
                                <div>
                                    <h4 className="text-xl font-bold text-[#6A1B6A]">{t.name}</h4>
                                    <p className="text-sm font-bold text-[#E53935] mt-1 uppercase tracking-widest">{t.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default GATVitrine;

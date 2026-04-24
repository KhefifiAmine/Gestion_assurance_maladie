import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, UserPlus, UploadCloud, Activity, CheckCircle, ArrowRight, Users } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            icon: UserPlus,
            title: "1. Créez votre compte",
            description: "Inscrivez-vous en quelques clics avec vos informations personnelles pour accéder à votre espace adhérent sécurisé.",
            color: "text-purple-600",
            bg: "bg-purple-100"
        },
        {
            icon: Users,
            title: "2. Ajoutez vos bénéficiaires",
            description: "Gérez les membres de votre famille (conjoint, enfants) pour qu'ils bénéficient également de la couverture CareCover.",
            color: "text-indigo-600",
            bg: "bg-indigo-100"
        },
        {
            icon: UploadCloud,
            title: "3. Déposez vos bulletins",
            description: "Prenez en photo vos feuilles de soins et téléchargez-les. Notre IA extraira automatiquement les informations nécessaires.",
            color: "text-purple-600",
            bg: "bg-purple-100"
        },
        {
            icon: Activity,
            title: "4. Suivez vos remboursements",
            description: "Consultez l'état d'avancement de vos dossiers (en attente, approuvé, refusé) en temps réel depuis votre tableau de bord.",
            color: "text-indigo-600",
            bg: "bg-indigo-100"
        }
    ];

    // Note: To avoid redefining imported icons, I'm using an inline SVG for 'Users' if it's missing, but I will import it above.
    return (
        <>

            {/* CONTENU PRINCIPAL */}
            <main className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-black text-purple-900 tracking-tight mb-6">
                            Comment fonctionne <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700">CareCover</span> ?
                        </h1>
                        <p className="text-lg text-slate-600">
                            Découvrez à quel point il est simple et rapide de gérer votre santé avec notre plateforme intuitive.
                        </p>
                    </div>

                    {/* Timeline des étapes */}
                    <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-purple-100 before:via-purple-300 before:to-indigo-100">
                        
                        {steps.map((step, index) => (
                            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Marqueur central */}
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${step.bg} text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                                    <step.icon size={18} className={step.color} />
                                </div>
                                
                                {/* Contenu de la carte */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-[2rem] bg-purple-50/50 border border-purple-100 hover:shadow-xl hover:bg-white transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-black text-xl text-purple-900">{step.title}</h3>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}

                    </div>

                    {/* CALL TO ACTION */}
                    <div className="mt-24 text-center bg-purple-50 rounded-[3rem] p-12 border border-purple-100">
                        <CheckCircle className="text-emerald-500 w-16 h-16 mx-auto mb-6" />
                        <h2 className="text-3xl font-black text-purple-900 mb-4">C'est aussi simple que ça !</h2>
                        <p className="text-slate-600 mb-8 max-w-lg mx-auto">
                            Rejoignez des milliers d'adhérents qui ont déjà simplifié la gestion de leurs frais médicaux.
                        </p>
                        <Link 
                            to="/register" 
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-transform"
                        >
                            Créer mon compte <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </main>
            
            {/* FOOTER */}
            <footer className="bg-purple-950 text-purple-200 py-8 border-t border-purple-900 text-center">
                <p className="text-sm">© 2025 CareCover. Tous droits réservés.</p>
            </footer>
        </>
    );
};

export default HowItWorks;

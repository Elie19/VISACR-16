
import React, { useState, useEffect, useCallback } from 'react';
import { StepId, AppState, ActivityType } from './types';
import { STEPS } from './constants';
import Welcome from './components/Welcome';
import GeneralInfoForm from './components/GeneralInfoForm';
import BesoinsForm from './components/BesoinsForm';
import FinancementForm from './components/FinancementForm';
import ChargesForm from './components/ChargesForm';
import RevenueForm from './components/RevenueForm';
import Report from './components/Report';

const INITIAL_STATE: AppState = {
  generalInfo: {
    prenomNom: '',
    intituleProjet: '',
    statutJuridique: '',
    activiteType: ActivityType.SERVICES,
    telephone: '',
    email: '',
    ville: '',
    descriptionProjet: '',
  },
  besoins: {},
  financements: [],
  charges: {},
  revenue: {
    caMode: 'mode1',
    caMensuel: Array(12).fill(0),
    tauxCroissance: [10, 10, 10, 10],
    caManuel: Array(5).fill(0).map(() => Array(12).fill(0)),
    tauxCoutMarchandises: 50,
    joursClients: 30,
    joursFournisseurs: 30,
    salairesEmp: [0, 0, 0, 0, 0],
    remunDir: [0, 0, 0, 0, 0],
    accre: false,
    produits: [],
  },
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<StepId>(StepId.WELCOME);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('financeStart_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    localStorage.setItem('financeStart_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    document.body.className = isDarkMode ? 'bg-[#1a1f2b] text-white' : 'bg-slate-50 text-slate-900';
  }, [isDarkMode]);

  const updateState = useCallback(<T extends keyof AppState>(key: T, value: AppState[T]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const navigateTo = (step: StepId) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      navigateTo(STEPS[currentIndex + 1].id as StepId);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      navigateTo(STEPS[currentIndex - 1].id as StepId);
    }
  };

  const resetAll = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser toutes vos données ?")) {
      setState(INITIAL_STATE);
      setCurrentStep(StepId.WELCOME);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case StepId.WELCOME: return <Welcome onStart={() => navigateTo(StepId.INFOS)} />;
      case StepId.INFOS: return <GeneralInfoForm data={state.generalInfo} onUpdate={(v) => updateState('generalInfo', v)} onNext={nextStep} />;
      case StepId.BESOINS: return <BesoinsForm data={state.besoins} onUpdate={(v) => updateState('besoins', v)} onNext={nextStep} onPrev={prevStep} />;
      case StepId.FINANCEMENT: return <FinancementForm state={state} onUpdate={(v) => updateState('financements', v)} onNext={nextStep} onPrev={prevStep} />;
      case StepId.CHARGES: return <ChargesForm data={state.charges} onUpdate={(v) => updateState('charges', v)} onNext={nextStep} onPrev={prevStep} />;
      case StepId.REVENUE: return <RevenueForm data={state.revenue} onUpdate={(v) => updateState('revenue', v)} onNext={nextStep} onPrev={prevStep} onReset={resetAll} />;
      case StepId.REPORT: return <Report state={state} onPrev={prevStep} onReset={resetAll} />;
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isDarkMode ? 'dark bg-[#1a1f2b] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-50 border-b ${isDarkMode ? 'bg-[#242b3d] border-slate-700' : 'bg-white border-slate-200'} no-print`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo(StepId.WELCOME)}>
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-lg">
              <span className="mb-0.5">📊</span>
            </div>
            <span className="font-poppins font-bold text-xl tracking-tight">FinanceStart</span>
            <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-bold uppercase ml-1">FCFA</span>
          </div>

          <nav className="hidden lg:flex items-center gap-2">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => navigateTo(s.id as StepId)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentStep === s.id 
                  ? 'bg-[#374151] text-white' 
                  : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="lg:hidden">
             <button className="p-2 text-slate-400">☰</button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {renderStep()}
        </div>
      </main>

      <footer className={`mt-auto border-t py-12 ${isDarkMode ? 'bg-[#1a1f2b] border-slate-800' : 'bg-white border-slate-200'} no-print`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-sm text-slate-400">
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase text-xs tracking-widest">FinanceStart</h3>
              <p className="leading-relaxed">Votre partenaire pour une gestion financière sereine dès le démarrage de votre projet.</p>
              <div className="flex items-center gap-2">
                 <span>📊</span>
                 <p>Calculs en <span className="text-white font-bold">Franc CFA (FCFA)</span></p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase text-xs tracking-widest">Contact</h3>
              <p className="flex items-center gap-2">📧 contact@financestart.fr</p>
              <p className="flex items-center gap-2">📞 +221 33 123 45 67</p>
              <p className="flex items-center gap-2">📍 Dakar, Sénégal</p>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase text-xs tracking-widest">Ressources</h3>
              <p className="flex items-center gap-2">📄 Guides PDF</p>
              <p className="flex items-center gap-2">📹 Vidéos tutorielles</p>
              <p className="flex items-center gap-2">🗓️ Webinaires</p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-center gap-4">
            <p>© 2024 FinanceStart. Tous droits réservés.</p>
            <button onClick={resetAll} className="hover:text-red-400 transition-colors">Réinitialiser les données</button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="hover:text-white transition-colors">Thème {isDarkMode ? 'clair' : 'sombre'}</button>
          </div>
        </div>
      </footer>

      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed bottom-6 right-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl z-[100] flex items-center gap-2 text-xs font-bold no-print transition-all"
      >
        <span>{isDarkMode ? '☀️' : '🌙'}</span>
        <span>{isDarkMode ? 'Mode clair' : 'Mode sombre'}</span>
      </button>
    </div>
  );
};

export default App;

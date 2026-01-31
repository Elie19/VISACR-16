
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('financeStart_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-theme bg-slate-900 text-white' : 'light-theme bg-slate-50 text-slate-900';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
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
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} backdrop-blur-sm no-print`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo(StepId.WELCOME)}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">📊</div>
            <span className="font-poppins font-bold text-xl tracking-tight hidden sm:inline">FinanceStart <span className="text-blue-600">Pro</span></span>
            <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">FCFA</span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => navigateTo(s.id as StepId)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  currentStep === s.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full border ${isDarkMode ? 'border-slate-800 text-yellow-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              title="Changer le thème"
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>
            <button 
              onClick={resetAll}
              className="hidden sm:block text-xs font-semibold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {renderStep()}
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-auto border-t py-8 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'} no-print`}>
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-4">
            <p>&copy; 2024 FinanceStart Pro. Tous droits réservés.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-blue-600">Confidentialité</a>
            <a href="#" className="hover:text-blue-600">Conditions</a>
            <a href="#" className="hover:text-blue-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

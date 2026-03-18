
import React from 'react';
import { GeneralInfo, ActivityType, Currency, AppState } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants';

interface Props {
  state: AppState;
  onUpdate: (data: GeneralInfo) => void;
  onUpdateCurrency: (currency: Currency) => void;
  onNext: () => void;
}

const GeneralInfoForm: React.FC<Props> = ({ state, onUpdate, onUpdateCurrency, onNext }) => {
  const data = state.generalInfo;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onUpdate({ ...data, [e.target.name]: e.target.value });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = SUPPORTED_CURRENCIES.find(c => c.code === e.target.value);
    if (selected) onUpdateCurrency(selected);
  };

  const InputLabel = ({ iconClass, label }: { iconClass: string, label: string }) => (
    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
      <i className={`${iconClass} text-indigo-400 w-4`}></i>
      <span className="uppercase tracking-wider">{label} :</span>
    </label>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <i className="fa-solid fa-circle-info"></i>
        </span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">A. Informations générales</h2>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm">Renseignez les informations de base de votre projet et la devise de référence.</p>

      <div className="bg-white dark:bg-[#242b3d] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl">
        <div className="flex items-center gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
           <i className="fa-solid fa-id-card text-indigo-400"></i>
           <h3 className="font-bold text-lg text-slate-900 dark:text-white">Identité du projet</h3>
        </div>

        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <InputLabel iconClass="fa-solid fa-user" label="Prénom, nom" />
              <input 
                required
                type="text" 
                name="prenomNom" 
                value={data.prenomNom} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div>
              <InputLabel iconClass="fa-solid fa-building" label="Intitulé de votre projet" />
              <input 
                required
                type="text" 
                name="intituleProjet" 
                value={data.intituleProjet} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="Ex: Création d'une boulangerie"
              />
            </div>
            <div>
              <InputLabel iconClass="fa-solid fa-gavel" label="Votre statut juridique" />
              <select 
                name="statutJuridique" 
                value={data.statutJuridique} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Sélectionnez un statut</option>
                <option value="ei" className="bg-white dark:bg-[#1a1f2b]">Entreprise Individuelle</option>
                <option value="sarl" className="bg-white dark:bg-[#1a1f2b]">SARL</option>
                <option value="sa" className="bg-white dark:bg-[#1a1f2b]">SA</option>
                <option value="sasu" className="bg-white dark:bg-[#1a1f2b]">SASU</option>
                <option value="auto" className="bg-white dark:bg-[#1a1f2b]">Auto-entrepreneur</option>
              </select>
            </div>
            <div>
              <InputLabel iconClass="fa-solid fa-shop" label="Vente de marchandises ou de services" />
              <select 
                name="activiteType" 
                value={data.activiteType} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value={ActivityType.SERVICES} className="bg-white dark:bg-[#1a1f2b]">Services uniquement</option>
                <option value={ActivityType.MARCHANDISES} className="bg-white dark:bg-[#1a1f2b]">Vente de marchandises</option>
                <option value={ActivityType.MIXTE} className="bg-white dark:bg-[#1a1f2b]">Activités mixtes</option>
              </select>
            </div>
            <div>
              <InputLabel iconClass="fa-solid fa-money-bill-wave" label="Devise du projet" />
              <select 
                value={state.currency.code} 
                onChange={handleCurrencyChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code} className="bg-white dark:bg-[#1a1f2b]">{c.name} ({c.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <InputLabel iconClass="fa-solid fa-location-dot" label="Votre ville d'activité" />
              <input 
                type="text" 
                name="ville" 
                value={data.ville} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="Ex: Dakar"
              />
            </div>
            <div>
              <InputLabel iconClass="fa-solid fa-percent" label="Taux d'IS (%)" />
              <input 
                type="number" 
                name="tauxIS" 
                value={data.tauxIS} 
                onChange={(e) => onUpdate({ ...data, tauxIS: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                min="0"
                max="100"
              />
              <p className="text-[10px] text-slate-500 mt-1 italic">Défaut zone FCFA : 30%</p>
            </div>
          </div>

          <div>
            <InputLabel iconClass="fa-solid fa-align-left" label="Description de votre activité" />
            <textarea 
              name="descriptionProjet" 
              value={data.descriptionProjet} 
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="Décrivez brièvement votre activité..."
            />
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="submit"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-3"
            >
              <span>Suivant</span> <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneralInfoForm;

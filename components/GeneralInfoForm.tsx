
import React from 'react';
import { GeneralInfo, ActivityType } from '../types';

interface Props {
  data: GeneralInfo;
  onUpdate: (data: GeneralInfo) => void;
  onNext: () => void;
}

const GeneralInfoForm: React.FC<Props> = ({ data, onUpdate, onNext }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onUpdate({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-10 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl">👤</div>
        <div>
          <h2 className="text-2xl font-bold">Informations Générales</h2>
          <p className="text-slate-500">Commençons par les bases de votre projet.</p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Prénom & Nom</label>
            <input 
              required
              type="text" 
              name="prenomNom" 
              value={data.prenomNom} 
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: Jean Dupont"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Intitulé du projet</label>
            <input 
              required
              type="text" 
              name="intituleProjet" 
              value={data.intituleProjet} 
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: Boulangerie artisanale"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Statut Juridique</label>
            <select 
              name="statutJuridique" 
              value={data.statutJuridique} 
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">Choisir un statut</option>
              <option value="ei">Entreprise Individuelle</option>
              <option value="sarl">SARL</option>
              <option value="sa">SA</option>
              <option value="sasu">SASU</option>
              <option value="auto">Auto-entrepreneur</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Type d'activité</label>
            <select 
              name="activiteType" 
              value={data.activiteType} 
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value={ActivityType.SERVICES}>Services uniquement</option>
              <option value={ActivityType.MARCHANDISES}>Vente de marchandises</option>
              <option value={ActivityType.MIXTE}>Activités mixtes</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Téléphone</label>
            <input 
              type="tel" 
              name="telephone" 
              value={data.telephone} 
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="+221..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ville</label>
            <input 
              type="text" 
              name="ville" 
              value={data.ville} 
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Dakar, Sénégal"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description du projet</label>
          <textarea 
            name="descriptionProjet" 
            value={data.descriptionProjet} 
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            placeholder="Décrivez brièvement votre activité et vos objectifs..."
          />
        </div>

        <div className="pt-6 flex justify-end">
          <button 
            type="submit"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            Continuer <span>➜</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default GeneralInfoForm;

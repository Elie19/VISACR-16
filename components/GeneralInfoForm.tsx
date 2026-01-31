
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

  const InputLabel = ({ icon, label }: { icon: string, label: string }) => (
    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
      <span>{icon}</span>
      <span className="uppercase tracking-wider">{label} :</span>
    </label>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white">ℹ️</span>
        <h2 className="text-2xl font-bold text-white">A. Informations générales</h2>
      </div>
      <p className="text-slate-400 text-sm">Renseignez les informations de base de votre projet</p>

      <div className="bg-[#242b3d] border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-8 border-b border-slate-800 pb-4">
           <span className="text-indigo-400"></span>
           <h3 className="font-bold text-lg text-white">Identité</h3>
        </div>

        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <InputLabel icon="" label="Prénom, nom" />
              <input 
                required
                type="text" 
                name="prenomNom" 
                value={data.prenomNom} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div>
              <InputLabel icon="" label="Intitulé de votre projet" />
              <input 
                required
                type="text" 
                name="intituleProjet" 
                value={data.intituleProjet} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="Ex: Création d'une boulangerie"
              />
            </div>
            <div>
              <InputLabel icon="" label="Votre statut juridique" />
              <select 
                name="statutJuridique" 
                value={data.statutJuridique} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Sélectionnez un statut</option>
                <option value="ei">Entreprise Individuelle</option>
                <option value="sarl">SARL</option>
                <option value="sa">SA</option>
                <option value="sasu">SASU</option>
                <option value="auto">Auto-entrepreneur</option>
              </select>
            </div>
            <div>
              <InputLabel icon="" label="Vente de marchandises ou de services" />
              <select 
                name="activiteType" 
                value={data.activiteType} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value={ActivityType.SERVICES}>Services uniquement</option>
                <option value={ActivityType.MARCHANDISES}>Vente de marchandises</option>
                <option value={ActivityType.MIXTE}>Activités mixtes</option>
              </select>
            </div>
            <div>
              <InputLabel icon="" label="Votre numéro de téléphone" />
              <input 
                type="tel" 
                name="telephone" 
                value={data.telephone} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="Ex: +221 77 123 45 67"
              />
            </div>
            <div>
              <InputLabel icon="" label="Votre adresse e-mail" />
              <input 
                type="email" 
                name="email" 
                value={data.email} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="Ex: contact@monprojet.com"
              />
            </div>
            <div>
              <InputLabel icon="" label="Votre ville ou commune d'activité" />
              <input 
                type="text" 
                name="ville" 
                value={data.ville} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="Ex: Dakar"
              />
            </div>
            <div>
              <InputLabel icon="" label="Votre devise" />
              <div className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-slate-400 flex items-center gap-2">
                 <span>🇸</span> Franc CFA (FCFA)
              </div>
            </div>
          </div>

          <div>
            <InputLabel icon="📄" label="Nom de votre projet ou description de votre activité" />
            <textarea 
              name="descriptionProjet" 
              value={data.descriptionProjet} 
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none placeholder:text-slate-600"
              placeholder="Décrivez brièvement votre activité..."
            />
          </div>

          <div className="pt-6 border-t border-slate-800">
            <button 
              type="submit"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <span>➜</span> Suivant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneralInfoForm;

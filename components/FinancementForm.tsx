
import React from 'react';
import { FinancingSource, AppState, BesoinItem } from '../types';

interface Props {
  state: AppState;
  onUpdate: (sources: FinancingSource[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

const FinancementForm: React.FC<Props> = ({ state, onUpdate, onNext, onPrev }) => {
  const totalBesoins = (Object.values(state.besoins) as BesoinItem[]).reduce((acc, b) => acc + b.montant, 0);
  const totalFinancement = state.financements.reduce((acc, f) => acc + f.montant, 0);
  const equilibre = totalFinancement - totalBesoins;

  const addSource = (type: 'apport' | 'pret' | 'subvention') => {
    const newSource: FinancingSource = {
      id: Math.random().toString(36).substr(2, 9),
      label: type === 'apport' ? 'Apport Personnel' : type === 'pret' ? 'Prêt Bancaire' : 'Subvention',
      montant: 0,
      taux: type === 'pret' ? 3.5 : undefined,
      duree: type === 'pret' ? 60 : undefined,
    };
    onUpdate([...state.financements, newSource]);
  };

  const updateSource = (id: string, field: keyof FinancingSource, value: any) => {
    const updated = state.financements.map(f => 
      f.id === id ? { ...f, [field]: field === 'label' ? value : parseFloat(value) || 0 } : f
    );
    onUpdate(updated);
  };

  const removeSource = (id: string) => {
    onUpdate(state.financements.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <i className="fa-solid fa-hand-holding-dollar"></i>
        </span>
        <h2 className="text-2xl font-bold text-white">2) Le financement de vos besoins de démarrage</h2>
      </div>
      <p className="text-slate-400 text-sm">Renseignez toutes vos sources de financement</p>

      <div className="bg-[#242b3d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1a1f2b] border-b border-slate-800">
                <th className="p-4 text-left text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sources de financement</th>
                <th className="p-4 text-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">Montant (FCFA)</th>
                <th className="p-4 text-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">Taux (%)</th>
                <th className="p-4 text-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">Durée (mois)</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {state.financements.length === 0 && (
                <tr>
                   <td colSpan={5} className="p-12 text-center text-slate-600 italic">
                      <i className="fa-solid fa-folder-open block text-3xl mb-4 opacity-20"></i>
                      Aucune source ajoutée. Utilisez les boutons ci-dessous.
                   </td>
                </tr>
              )}
              {state.financements.map((f) => (
                <tr key={f.id} className="hover:bg-[#1a1f2b]/50 transition-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <i className={f.taux !== undefined ? 'fa-solid fa-building-columns text-indigo-400' : 'fa-solid fa-user text-indigo-400/70'}></i>
                      <input 
                        type="text" 
                        value={f.label} 
                        onChange={(e) => updateSource(f.id, 'label', e.target.value)}
                        className="bg-transparent border-none text-white font-bold p-0 focus:ring-0 w-full text-sm outline-none"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <input 
                      type="number" 
                      value={f.montant || ''} 
                      onChange={(e) => updateSource(f.id, 'montant', e.target.value)}
                      className="w-full text-center px-4 py-2 rounded-lg bg-[#1a1f2b] border border-slate-700 text-white font-mono text-sm focus:border-indigo-500 outline-none transition-all"
                    />
                  </td>
                  <td className="p-4 text-center">
                    {f.taux !== undefined ? (
                      <input 
                        type="number" 
                        value={f.taux} 
                        onChange={(e) => updateSource(f.id, 'taux', e.target.value)}
                        className="w-20 text-center px-4 py-2 rounded-lg bg-[#1a1f2b] border border-slate-700 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                      />
                    ) : <span className="text-slate-600 font-mono text-xs">N/A</span>}
                  </td>
                  <td className="p-4 text-center">
                     {f.duree !== undefined ? (
                      <input 
                        type="number" 
                        value={f.duree} 
                        onChange={(e) => updateSource(f.id, 'duree', e.target.value)}
                        className="w-20 text-center px-4 py-2 rounded-lg bg-[#1a1f2b] border border-slate-700 text-white text-sm focus:border-indigo-500 outline-none transition-all"
                      />
                    ) : <span className="text-slate-600 font-mono text-xs">N/A</span>}
                  </td>
                  <td className="p-4">
                     <button onClick={() => removeSource(f.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                       <i className="fa-solid fa-trash-can"></i>
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-[#1a1f2b] border-t border-slate-800">
           <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-4 flex-1">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Total besoins :</span>
                    <span className="font-mono font-bold text-indigo-400">{totalBesoins.toLocaleString()} FCFA</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Total financement :</span>
                    <span className="font-mono font-bold text-indigo-400">{totalFinancement.toLocaleString()} FCFA</span>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-slate-800 font-bold">
                    <span className="text-white uppercase tracking-widest text-xs">Équilibre :</span>
                    <span className={equilibre >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                       {equilibre === 0 ? 'Parfaitement équilibré' : `${equilibre.toLocaleString()} FCFA`}
                    </span>
                 </div>
              </div>
              <div className="flex flex-col gap-3 justify-center">
                 <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-3 text-sm transition-all active:scale-95">
                    <i className="fa-solid fa-calculator"></i> <span>Calculer l'équilibre</span>
                 </button>
              </div>
           </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => addSource('pret')} className="px-5 py-2.5 border-2 border-slate-700 hover:bg-[#242b3d] rounded-xl text-xs font-bold transition-all text-indigo-400 flex items-center gap-2 group">
          <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i> Ajouter un prêt
        </button>
        <button onClick={() => addSource('subvention')} className="px-5 py-2.5 border-2 border-slate-700 hover:bg-[#242b3d] rounded-xl text-xs font-bold transition-all text-indigo-400 flex items-center gap-2 group">
          <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i> Ajouter une subvention
        </button>
        <button onClick={() => addSource('apport')} className="px-5 py-2.5 border-2 border-slate-700 hover:bg-[#242b3d] rounded-xl text-xs font-bold transition-all text-indigo-400 flex items-center gap-2 group">
          <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i> Ajouter autre financement
        </button>
      </div>

      <div className="pt-12 flex justify-between border-t border-slate-800">
        <button onClick={onPrev} className="px-8 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2">
          <i className="fa-solid fa-chevron-left text-xs"></i> <span>Précédent</span>
        </button>
        <button onClick={onNext} className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-2">
          <span>Suivant</span> <i className="fa-solid fa-chevron-right text-xs"></i>
        </button>
      </div>
    </div>
  );
};

export default FinancementForm;

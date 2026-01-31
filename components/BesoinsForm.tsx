
import React from 'react';
import { Besoins, BesoinItem } from '../types';
import { LISTE_BESOINS_KEYS } from '../constants';

interface Props {
  data: Besoins;
  onUpdate: (data: Besoins) => void;
  onNext: () => void;
  onPrev: () => void;
}

const BesoinsForm: React.FC<Props> = ({ data, onUpdate, onNext, onPrev }) => {
  const handleItemChange = (id: string, field: 'montant' | 'details' | 'amortissement', value: any) => {
    const current = data[id] || { montant: 0, details: '', amortissement: LISTE_BESOINS_KEYS.find(k => k.id === id)?.defaultAmort || 0 };
    onUpdate({
      ...data,
      [id]: { ...current, [field]: field === 'montant' || field === 'amortissement' ? parseFloat(value) || 0 : value }
    });
  };

  const total = (Object.values(data) as BesoinItem[]).reduce((acc, b) => acc + b.montant, 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white">📋</span>
        <h2 className="text-2xl font-bold text-white">1) Vos besoins de démarrage</h2>
      </div>
      <p className="text-slate-400 text-sm">Listez toutes les dépenses ou investissements que vous devrez faire avant même de démarrer l'activité</p>

      <div className="bg-[#242b3d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
         <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 m-8 flex items-start gap-3">
            <span className="text-orange-500 mt-1">⚠️</span>
            <div>
               <p className="text-sm font-bold text-orange-200">Important :</p>
               <p className="text-xs text-orange-200/80">Cochez chaque poste de dépense que vous aurez à réaliser avant le démarrage de l'activité</p>
            </div>
         </div>

        <div className="space-y-1 p-8 pt-0">
          {LISTE_BESOINS_KEYS.map((item) => (
            <div 
              key={item.id} 
              className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all ${
                (data[item.id]?.montant || 0) > 0 
                ? 'bg-[#1a1f2b] border-indigo-500/50' 
                : 'bg-[#1a1f2b]/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="text-lg">📄</span>
                <label className="text-sm font-bold text-slate-300">{item.label}</label>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-40 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">FCFA</span>
                  <input 
                    type="number"
                    placeholder="0"
                    value={data[item.id]?.montant || ''}
                    onChange={(e) => handleItemChange(item.id, 'montant', e.target.value)}
                    className="w-full pl-12 pr-4 py-2 rounded-lg bg-[#242b3d] border border-slate-700 text-white font-mono text-right text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
                {item.defaultAmort > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Amort.</span>
                    <input 
                      type="number"
                      value={data[item.id]?.amortissement ?? item.defaultAmort}
                      onChange={(e) => handleItemChange(item.id, 'amortissement', e.target.value)}
                      className="w-12 text-center py-2 rounded-lg bg-[#242b3d] border border-slate-700 text-white text-xs outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 no-print pointer-events-none">
        <div className="bg-[#1a1f2b] border border-indigo-500/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-white pointer-events-auto">
          <div className="flex items-center gap-6">
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Besoins</p>
                <p className="text-2xl font-mono font-bold text-indigo-400">{(total as any).toLocaleString('fr-FR')} <span className="text-xs">FCFA</span></p>
             </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onPrev} className="px-6 py-2 border border-slate-700 hover:bg-slate-800 rounded-xl text-sm font-bold transition-all">Précédent</button>
            <button onClick={onNext} className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all shadow-lg">Suivant ➜</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BesoinsForm;

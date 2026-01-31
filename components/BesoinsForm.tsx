
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

  // Fix: Explicitly cast Object.values to BesoinItem[] to avoid 'unknown' type inference on index signature objects
  const total = (Object.values(data) as BesoinItem[]).reduce((acc, b) => acc + b.montant, 0);

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-10 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-2xl">📋</div>
          <div>
            <h2 className="text-2xl font-bold">Besoins de Démarrage</h2>
            <p className="text-slate-500">Listez vos investissements et dépenses initiales.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {LISTE_BESOINS_KEYS.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 rounded-xl border transition-all ${
                  (data[item.id]?.montant || 0) > 0 
                  ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-900/10' 
                  : 'border-slate-100 dark:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">{item.label}</label>
                    <input 
                      type="text"
                      placeholder="Détails (ex: Nom du local, marque matériel...)"
                      value={data[item.id]?.details || ''}
                      onChange={(e) => handleItemChange(item.id, 'details', e.target.value)}
                      className="text-xs w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Montant (FCFA)</label>
                      <input 
                        type="number"
                        placeholder="0"
                        value={data[item.id]?.montant || ''}
                        onChange={(e) => handleItemChange(item.id, 'montant', e.target.value)}
                        className="w-full text-right px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-900 border-none font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {item.defaultAmort > 0 && (
                      <div className="w-20">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Amort. (ans)</label>
                        <input 
                          type="number"
                          value={data[item.id]?.amortissement ?? item.defaultAmort}
                          onChange={(e) => handleItemChange(item.id, 'amortissement', e.target.value)}
                          className="w-full text-center px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-900 border-none text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Total Sticky (only for this step) */}
        <div className="mt-8 sticky bottom-4 p-6 bg-slate-900 dark:bg-blue-600 rounded-2xl shadow-2xl flex items-center justify-between text-white transition-all transform hover:scale-[1.01]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70">Total Investissement</p>
            {/* Fix: Cast total to any to bypass potential environment-specific TypeScript lib restrictions for toLocaleString arguments */}
            <p className="text-3xl font-mono font-bold">{(total as any).toLocaleString('fr-FR')} <span className="text-sm">FCFA</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={onPrev} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all">Précédent</button>
            <button onClick={onNext} className="px-6 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-bold transition-all shadow-lg">Suivant</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BesoinsForm;

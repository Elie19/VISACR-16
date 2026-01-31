
import React from 'react';
import { FinancingSource, AppState, BesoinItem } from '../types';

interface Props {
  state: AppState;
  onUpdate: (sources: FinancingSource[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

const FinancementForm: React.FC<Props> = ({ state, onUpdate, onNext, onPrev }) => {
  // Fix: Cast Object.values to BesoinItem[] to resolve 'unknown' property access error
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-10 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl">💰</div>
        <div>
          <h2 className="text-2xl font-bold">Plan de Financement</h2>
          <p className="text-slate-500">Comment allez-vous financer vos besoins ?</p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-6 justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Besoins Totaux</span>
          <p className="text-xl font-bold font-mono">{totalBesoins.toLocaleString()} FCFA</p>
        </div>
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">Financement Actuel</span>
          <p className="text-xl font-bold font-mono text-blue-600">{totalFinancement.toLocaleString()} FCFA</p>
        </div>
        <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${equilibre >= 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          <div className="text-2xl">{equilibre >= 0 ? '✅' : '⚠️'}</div>
          <div>
            <span className="text-xs font-bold uppercase">Équilibre</span>
            <p className="text-xl font-bold font-mono">{Math.abs(equilibre).toLocaleString()} FCFA {equilibre >= 0 ? 'Excédent' : 'Manquant'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {state.financements.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            <p className="text-slate-400">Aucune source de financement ajoutée.</p>
          </div>
        )}
        {state.financements.map((f) => (
          <div key={f.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input 
                type="text" 
                value={f.label} 
                onChange={(e) => updateSource(f.id, 'label', e.target.value)}
                className="w-full font-bold bg-transparent border-none focus:ring-0 p-0"
              />
            </div>
            <div className="w-40">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Montant</label>
              <input 
                type="number" 
                value={f.montant || ''} 
                onChange={(e) => updateSource(f.id, 'montant', e.target.value)}
                className="w-full px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border-none font-mono focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {f.taux !== undefined && (
              <>
                <div className="w-20">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Taux %</label>
                  <input 
                    type="number" 
                    value={f.taux} 
                    onChange={(e) => updateSource(f.id, 'taux', e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="w-24">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Durée (mois)</label>
                  <input 
                    type="number" 
                    value={f.duree} 
                    onChange={(e) => updateSource(f.id, 'duree', e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
            <button onClick={() => removeSource(f.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">🗑️</button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-12">
        <button onClick={() => addSource('apport')} className="px-4 py-2 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-lg text-sm font-bold transition-all">➕ Apport</button>
        <button onClick={() => addSource('pret')} className="px-4 py-2 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-lg text-sm font-bold transition-all">🏦 Prêt</button>
        <button onClick={() => addSource('subvention')} className="px-4 py-2 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-lg text-sm font-bold transition-all">🎁 Subvention</button>
      </div>

      <div className="pt-6 flex justify-between border-t border-slate-100 dark:border-slate-700">
        <button onClick={onPrev} className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-all">Précédent</button>
        <button onClick={onNext} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">Suivant ➜</button>
      </div>
    </div>
  );
};

export default FinancementForm;

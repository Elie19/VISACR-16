
import React from 'react';
import { RevenueState, AppState } from '../types';
import { formatCurrency } from '../constants';

interface Props {
  state: AppState;
  onUpdate: (data: RevenueState) => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
}

const RevenueForm: React.FC<Props> = ({ state, onUpdate, onNext, onPrev }) => {
  const data = state.revenue;
  const currency = state.currency;
  const years = [0, 1, 2, 3, 4];

  const handleCaMensuelChange = (idx: number, val: string) => {
    const newCa = [...data.caMensuel];
    newCa[idx] = parseFloat(val) || 0;
    onUpdate({ ...data, caMensuel: newCa });
  };

  const handleSalaryChange = (idx: number, type: 'salairesEmp' | 'remunDir', val: string) => {
    const arr = [...data[type]];
    arr[idx] = parseFloat(val) || 0;
    onUpdate({ ...data, [type]: arr });
  };

  const handleTauxChange = (idx: number, val: string) => {
    const arr = [...data.tauxCroissance];
    arr[idx] = parseFloat(val) || 0;
    onUpdate({ ...data, tauxCroissance: arr });
  };

  const totalYear1 = data.caMensuel.reduce((acc, v) => acc + v, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <i className="fa-solid fa-arrow-up-right-dots"></i>
        </span>
        <h2 className="text-2xl font-bold text-white">4) Votre chiffre d'affaires sur 5 ans</h2>
      </div>
      <p className="text-slate-400 text-sm">Évaluez vos revenus prévisionnels en <span className="text-indigo-400 font-bold">{currency.code}</span>.</p>

      {/* Mode Selector Tabs */}
      <div className="flex bg-[#242b3d] border border-slate-800 rounded-2xl p-2 max-w-2xl">
         <button 
           onClick={() => onUpdate({...data, caMode: 'mode1'})}
           className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-bold transition-all ${data.caMode === 'mode1' ? 'bg-[#374151] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
         >
           <i className="fa-solid fa-pen-nib"></i>
           <span>Saisir année 1 + taux</span>
         </button>
         <button 
           onClick={() => onUpdate({...data, caMode: 'mode2'})}
           className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-bold transition-all ${data.caMode === 'mode2' ? 'bg-[#374151] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
         >
           <i className="fa-solid fa-keyboard"></i>
           <span>Saisie manuelle 5 ans</span>
         </button>
      </div>

      <div className="bg-[#242b3d] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-12">
        {/* Informations complémentaires */}
        <div>
          <h3 className="flex items-center gap-3 font-bold text-lg mb-6 border-b border-slate-800 pb-4">
            <i className="fa-solid fa-file-signature text-indigo-400"></i>
            <span>Détails opérationnels</span>
          </h3>
          <div className="space-y-6">
             <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
                   Description de votre modèle de revenus
                </label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white text-sm focus:border-indigo-500 outline-none resize-none transition-all"
                  placeholder={`Ex: Année 1 : Estimation basée sur 100 ventes/mois à un prix moyen unitaire en ${currency.symbol}...`}
                />
             </div>
          </div>
        </div>

        {/* Détail mensuel Année 1 */}
        <div>
          <h3 className="flex items-center gap-3 font-bold text-lg mb-6 border-b border-slate-800 pb-4">
            <i className="fa-solid fa-calendar-week text-indigo-400"></i>
            <span>Détail Mensuel - Année 1 ({currency.symbol})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {data.caMensuel.map((val, i) => (
              <div key={i} className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 block text-center">Mois {i+1}</label>
                <input 
                  type="number" 
                  step={currency.decimals > 0 ? (1 / Math.pow(10, currency.decimals)).toString() : "1"}
                  value={val || ''} 
                  onChange={(e) => handleCaMensuelChange(i, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1f2b] border border-slate-700 text-white font-mono text-xs focus:border-indigo-500 outline-none text-right transition-all"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20 flex justify-between items-center shadow-inner">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-chart-simple text-indigo-400"></i> Total CA Année 1 :
            </span>
            <span className="text-xl font-bold font-mono text-indigo-400">{formatCurrency(totalYear1, currency)} {currency.code}</span>
          </div>
        </div>

        {/* Paramètres d'analyse */}
        <div className="pt-12 border-t border-slate-800">
          <h3 className="flex items-center gap-3 font-bold text-lg mb-8">
            <i className="fa-solid fa-magnifying-glass-chart text-indigo-400"></i>
            <span>Paramètres RH & Délais</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-6">
                <div>
                   <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Coût d'achat marchandises (% du CA)</label>
                   <div className="relative">
                      <input 
                        type="number" 
                        value={data.tauxCoutMarchandises} 
                        onChange={(e) => onUpdate({...data, tauxCoutMarchandises: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white font-bold text-sm focus:border-indigo-500 outline-none pr-10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">%</span>
                   </div>
                </div>
             </div>
             
             <div className="space-y-6">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Masse salariale annuelle ({currency.symbol})</label>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                   <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-[#1a1f2b] text-slate-600 border-b border-slate-800">
                           <th className="py-2 px-3 text-left">Poste</th>
                           {years.map(y => <th key={y} className="py-2">A{y+1}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-800/50">
                           <td className="py-2 px-3 text-slate-400 font-medium">Salariés</td>
                           {[0,1,2,3,4].map(idx => (
                              <td key={idx} className="p-1">
                                 <input 
                                   type="number" 
                                   step={currency.decimals > 0 ? (1 / Math.pow(10, currency.decimals)).toString() : "1"}
                                   value={data.salairesEmp[idx] || ''} 
                                   onChange={(e) => handleSalaryChange(idx, 'salairesEmp', e.target.value)}
                                   className="w-12 bg-[#1a1f2b] border border-slate-800 rounded p-1 text-center text-white focus:border-indigo-500 outline-none"
                                 />
                              </td>
                           ))}
                        </tr>
                        <tr>
                           <td className="py-2 px-3 text-slate-400 font-medium">Direction</td>
                           {[0,1,2,3,4].map(idx => (
                              <td key={idx} className="p-1">
                                 <input 
                                   type="number" 
                                   step={currency.decimals > 0 ? (1 / Math.pow(10, currency.decimals)).toString() : "1"}
                                   value={data.remunDir[idx] || ''} 
                                   onChange={(e) => handleSalaryChange(idx, 'remunDir', e.target.value)}
                                   className="w-12 bg-[#1a1f2b] border border-slate-800 rounded p-1 text-center text-white focus:border-indigo-500 outline-none"
                                 />
                              </td>
                           ))}
                        </tr>
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="pt-12 flex justify-between border-t border-slate-800">
        <button onClick={onPrev} className="px-8 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2">
          <i className="fa-solid fa-chevron-left text-xs"></i> <span>Précédent</span>
        </button>
        <button onClick={onNext} className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-2xl transition-all active:scale-95 text-lg flex items-center gap-4">
          <span>Analyser la rentabilité</span> <i className="fa-solid fa-rocket text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default RevenueForm;


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

  const handleCaManuelChange = (yearIdx: number, monthIdx: number, val: string) => {
    const newCaManuel = data.caManuel.map((year, yIdx) => 
      yIdx === yearIdx ? year.map((m, mIdx) => mIdx === monthIdx ? parseFloat(val) || 0 : m) : year
    );
    onUpdate({ ...data, caManuel: newCaManuel });
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

  const totalYear1 = data.caMode === 'mode1' 
    ? data.caMensuel.reduce((acc, v) => acc + v, 0)
    : (data.caManuel[0] || []).reduce((acc, v) => acc + v, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <i className="fa-solid fa-arrow-up-right-dots"></i>
        </span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">4) Votre chiffre d'affaires sur 5 ans</h2>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm">Évaluez vos revenus prévisionnels en <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currency.code}</span>.</p>

      {/* Mode Selector Tabs */}
      <div className="flex bg-white dark:bg-[#242b3d] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 max-w-2xl shadow-sm dark:shadow-none">
         <button 
           onClick={() => onUpdate({...data, caMode: 'mode1'})}
           className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-bold transition-all ${data.caMode === 'mode1' ? 'bg-slate-100 dark:bg-[#374151] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
         >
           <i className="fa-solid fa-pen-nib"></i>
           <span>Saisir année 1 + taux</span>
         </button>
         <button 
           onClick={() => onUpdate({...data, caMode: 'mode2'})}
           className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-bold transition-all ${data.caMode === 'mode2' ? 'bg-slate-100 dark:bg-[#374151] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
         >
           <i className="fa-solid fa-keyboard"></i>
           <span>Saisie manuelle 5 ans</span>
         </button>
      </div>

      <div className="bg-white dark:bg-[#242b3d] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl space-y-12">
        {/* Informations complémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="flex items-center gap-3 font-bold text-lg mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 text-slate-900 dark:text-white">
              <i className="fa-solid fa-file-signature text-indigo-500 dark:text-indigo-400"></i>
              <span>Détails opérationnels</span>
            </h3>
            <div className="space-y-6">
               <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
                     Description de votre modèle de revenus
                  </label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-indigo-500 outline-none resize-none transition-all"
                    placeholder={`Ex: Année 1 : Estimation basée sur 100 ventes/mois à un prix moyen unitaire en ${currency.symbol}...`}
                  />
               </div>
            </div>
          </div>
          <div>
            <h3 className="flex items-center gap-3 font-bold text-lg mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 text-slate-900 dark:text-white">
              <i className="fa-solid fa-shield-halved text-indigo-500 dark:text-indigo-400"></i>
              <span>Avantages fiscaux</span>
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-[#1a1f2b] rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox"
                    checked={data.accre}
                    onChange={(e) => onUpdate({...data, accre: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Bénéficiaire de l'ACCRE</span>
                  <p className="text-[10px] text-slate-500">Réduction des charges sociales la première année.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Détail mensuel Année 1 ou 5 ans */}
        {data.caMode === 'mode1' ? (
          <div className="space-y-8">
            <div>
              <h3 className="flex items-center gap-3 font-bold text-lg mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 text-slate-900 dark:text-white">
                <i className="fa-solid fa-calendar-week text-indigo-500 dark:text-indigo-400"></i>
                <span>Détail Mensuel - Année 1 ({currency.symbol})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {data.caMensuel.map((val, i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-600 block text-center">Mois {i+1}</label>
                    <input 
                      type="number" 
                      step={currency.decimals > 0 ? (1 / Math.pow(10, currency.decimals)).toString() : "1"}
                      value={val || ''} 
                      onChange={(e) => handleCaMensuelChange(i, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:border-indigo-500 outline-none text-right transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-3 font-bold text-lg mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 text-slate-900 dark:text-white">
                <i className="fa-solid fa-arrow-trend-up text-indigo-500 dark:text-indigo-400"></i>
                <span>Taux de croissance annuel (%)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {data.tauxCroissance.map((val, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Année {i+1} → {i+2}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={val} 
                        onChange={(e) => handleTauxChange(i, e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:border-indigo-500 outline-none pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 font-bold">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="flex items-center gap-3 font-bold text-lg mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 text-slate-900 dark:text-white">
              <i className="fa-solid fa-table-list text-indigo-500 dark:text-indigo-400"></i>
              <span>Saisie Manuelle sur 5 ans ({currency.symbol})</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#1a1f2b] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 px-3 text-left sticky left-0 bg-slate-50 dark:bg-[#1a1f2b]">Année</th>
                    {Array.from({length: 12}).map((_, i) => <th key={i} className="py-2 px-2 text-center">M{i+1}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.caManuel.map((year, yIdx) => (
                    <tr key={yIdx}>
                      <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-[#242b3d]">A{yIdx+1}</td>
                      {year.map((val, mIdx) => (
                        <td key={mIdx} className="p-1">
                          <input 
                            type="number" 
                            value={val || ''} 
                            onChange={(e) => handleCaManuelChange(yIdx, mIdx, e.target.value)}
                            className="w-14 bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 rounded p-1 text-right text-slate-900 dark:text-white font-mono text-[9px] focus:border-indigo-500 outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20 flex justify-between items-center shadow-inner">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-chart-simple text-indigo-600 dark:text-indigo-400"></i> Total CA Année 1 :
          </span>
          <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{formatCurrency(totalYear1, currency)} {currency.code}</span>
        </div>


        {/* Paramètres d'analyse */}
        <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
          <h3 className="flex items-center gap-3 font-bold text-lg mb-8 text-slate-900 dark:text-white">
            <i className="fa-solid fa-magnifying-glass-chart text-indigo-500 dark:text-indigo-400"></i>
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
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:border-indigo-500 outline-none pr-10"
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 font-bold">%</span>
                  </div>
               </div>
               
               <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Délais de paiement (BFR)</h4>
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Délai clients (jours)</label>
                        <input 
                          type="number" 
                          value={data.joursClients} 
                          onChange={(e) => onUpdate({...data, joursClients: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-indigo-500 outline-none"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Délai fournisseurs (jours)</label>
                        <input 
                          type="number" 
                          value={data.joursFournisseurs} 
                          onChange={(e) => onUpdate({...data, joursFournisseurs: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-indigo-500 outline-none"
                        />
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="space-y-6">
               <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Masse salariale annuelle ({currency.symbol})</label>
               <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-[10px]">
                     <thead>
                       <tr className="bg-slate-50 dark:bg-[#1a1f2b] text-slate-500 dark:text-slate-600 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2 px-3 text-left">Poste</th>
                          {years.map(y => <th key={y} className="py-2">A{y+1}</th>)}
                       </tr>
                     </thead>
                     <tbody>
                       <tr className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">Salariés</td>
                          {[0,1,2,3,4].map(idx => (
                             <td key={idx} className="p-1">
                                <input 
                                  type="number" 
                                  step={currency.decimals > 0 ? (1 / Math.pow(10, currency.decimals)).toString() : "1"}
                                  value={data.salairesEmp[idx] || ''} 
                                  onChange={(e) => handleSalaryChange(idx, 'salairesEmp', e.target.value)}
                                  className="w-12 bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-800 rounded p-1 text-center text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                                />
                             </td>
                          ))}
                       </tr>
                       <tr>
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">Direction</td>
                          {[0,1,2,3,4].map(idx => (
                             <td key={idx} className="p-1">
                                <input 
                                  type="number" 
                                  step={currency.decimals > 0 ? (1 / Math.pow(10, currency.decimals)).toString() : "1"}
                                  value={data.remunDir[idx] || ''} 
                                  onChange={(e) => handleSalaryChange(idx, 'remunDir', e.target.value)}
                                  className="w-12 bg-slate-50 dark:bg-[#1a1f2b] border border-slate-200 dark:border-slate-800 rounded p-1 text-center text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
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

      <div className="pt-12 flex justify-between border-t border-slate-200 dark:border-slate-800">
        <button onClick={onPrev} className="px-8 py-3 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
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

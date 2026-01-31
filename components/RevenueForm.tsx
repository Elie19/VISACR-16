
import React from 'react';
import { RevenueState } from '../types';

interface Props {
  data: RevenueState;
  onUpdate: (data: RevenueState) => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
}

const RevenueForm: React.FC<Props> = ({ data, onUpdate, onNext, onPrev }) => {
  // Define years array for mapping the 5-year table columns to fix the "Cannot find name 'years'" error.
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
        <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white">📈</span>
        <h2 className="text-2xl font-bold text-white">4) Votre chiffre d'affaires sur 5 ans</h2>
      </div>
      <p className="text-slate-400 text-sm">Choisissez votre méthode de saisie</p>

      {/* Mode Selector Tabs */}
      <div className="flex bg-[#242b3d] border border-slate-800 rounded-2xl p-2 max-w-2xl">
         <button 
           onClick={() => onUpdate({...data, caMode: 'mode1'})}
           className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${data.caMode === 'mode1' ? 'bg-[#374151] text-white' : 'text-slate-500 hover:text-slate-300'}`}
         >
           <span>📍</span> Mode 1 : Saisir année 1 + taux de croissance
         </button>
         <button 
           onClick={() => onUpdate({...data, caMode: 'mode2'})}
           className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${data.caMode === 'mode2' ? 'bg-[#374151] text-white' : 'text-slate-500 hover:text-slate-300'}`}
         >
           <span>📍</span> Mode 2 : Saisir manuellement les 5 années
         </button>
      </div>

      <div className="bg-[#242b3d] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-12">
        {/* Informations complémentaires */}
        <div>
          <h3 className="flex items-center gap-2 font-bold text-lg mb-6 border-b border-slate-800 pb-4">
            <span>📄</span> Informations complémentaires
          </h3>
          <div className="space-y-6">
             <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Description de votre chiffre d'affaires</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white text-sm focus:border-indigo-500 outline-none resize-none"
                  placeholder="Ex: Année 1 : 50 clients/mois à 20 000 FCFA. Croissance de 10% grâce à l'ouverture d'une 2e agence en année 2..."
                />
             </div>
          </div>
        </div>

        {/* Détail mensuel Année 1 */}
        <div>
          <h3 className="flex items-center gap-2 font-bold text-lg mb-6 border-b border-slate-800 pb-4">
            <span>🗓️</span> Chiffre d'affaires - Année 1
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {data.caMensuel.map((val, i) => (
              <div key={i} className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600">Mois {i+1}</label>
                <input 
                  type="number" 
                  value={val || ''} 
                  onChange={(e) => handleCaMensuelChange(i, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1f2b] border border-slate-700 text-white font-mono text-xs focus:border-indigo-500 outline-none text-right"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Année 1 estimé :</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{totalYear1.toLocaleString()} FCFA</span>
          </div>
        </div>

        {/* Croissance */}
        <div>
           <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Taux de croissance annuels souhaités (%)</label>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
             {data.tauxCroissance.map((t, i) => (
                <div key={i} className="bg-[#1a1f2b] p-4 rounded-xl border border-slate-800 space-y-2">
                   <p className="text-[10px] font-bold text-slate-500">Année {i+1} ➔ {i+2}</p>
                   <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={t} 
                        onChange={(e) => handleTauxChange(i, e.target.value)}
                        className="w-full bg-transparent border-none text-white font-bold p-0 focus:ring-0 text-xl"
                      />
                      <span className="text-indigo-500 font-bold">%</span>
                   </div>
                </div>
             ))}
           </div>
           <button className="mt-8 px-6 py-2 bg-[#374151] hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-2">
              Calculer les 5 années
           </button>
        </div>

        {/* Paramètres d'analyse */}
        <div className="pt-12 border-t border-slate-800">
          <h3 className="flex items-center gap-2 font-bold text-lg mb-8">
            <span></span> Analyse de rentabilité & trésorerie
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-6">
                <div>
                   <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Coût d'achat des marchandises (% du CA)</label>
                   <input 
                    type="number" 
                    value={data.tauxCoutMarchandises} 
                    onChange={(e) => onUpdate({...data, tauxCoutMarchandises: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1f2b] border border-slate-700 text-white font-bold text-sm focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-600 mt-2 italic">Quel est, en % du prix de vente, le coût d'achat de vos marchandises ?</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase">Délai client (jours)</label>
                      <input 
                        type="number" 
                        value={data.joursClients} 
                        onChange={(e) => onUpdate({...data, joursClients: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-lg bg-[#1a1f2b] border border-slate-700 text-white text-xs"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase">Délai fourniss. (jours)</label>
                      <input 
                        type="number" 
                        value={data.joursFournisseurs} 
                        onChange={(e) => onUpdate({...data, joursFournisseurs: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-2 rounded-lg bg-[#1a1f2b] border border-slate-700 text-white text-xs"
                      />
                   </div>
                </div>
             </div>
             
             <div className="space-y-6">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Salaires et rémunération du dirigeant</label>
                <div className="overflow-x-auto">
                   <table className="w-full text-[10px]">
                      <thead>
                        <tr className="text-slate-600 border-b border-slate-800">
                           <th className="py-2 text-left">Poste</th>
                           {years.map(y => <th key={y}>A{y+1}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-800/50">
                           <td className="py-2 text-slate-400">Salaires employés</td>
                           {[0,1,2,3,4].map(idx => (
                              <td key={idx} className="p-1">
                                 <input 
                                   type="number" 
                                   value={data.salairesEmp[idx] || ''} 
                                   onChange={(e) => handleSalaryChange(idx, 'salairesEmp', e.target.value)}
                                   className="w-12 bg-[#1a1f2b] border border-slate-800 rounded p-1 text-center"
                                 />
                              </td>
                           ))}
                        </tr>
                        <tr>
                           <td className="py-2 text-slate-400">Rémun. Dirigeant</td>
                           {[0,1,2,3,4].map(idx => (
                              <td key={idx} className="p-1">
                                 <input 
                                   type="number" 
                                   value={data.remunDir[idx] || ''} 
                                   onChange={(e) => handleSalaryChange(idx, 'remunDir', e.target.value)}
                                   className="w-12 bg-[#1a1f2b] border border-slate-800 rounded p-1 text-center"
                                 />
                              </td>
                           ))}
                        </tr>
                      </tbody>
                   </table>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#1a1f2b] rounded-xl border border-slate-800">
                   <span className="text-xs text-slate-400">Exonération ACCRE ?</span>
                   <div className="flex gap-4">
                      <button onClick={() => onUpdate({...data, accre: true})} className={`text-xs font-bold px-3 py-1 rounded ${data.accre ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>Oui</button>
                      <button onClick={() => onUpdate({...data, accre: false})} className={`text-xs font-bold px-3 py-1 rounded ${!data.accre ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>Non</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="pt-12 flex justify-between border-t border-slate-800">
        <button onClick={onPrev} className="px-8 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 transition-all">← Précédent</button>
        <button onClick={onNext} className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-2xl transition-all active:scale-95 text-lg">Analyser la rentabilité ➜</button>
      </div>
    </div>
  );
};

export default RevenueForm;

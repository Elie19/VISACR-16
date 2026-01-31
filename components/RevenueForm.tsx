
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-10 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl">📈</div>
        <div>
          <h2 className="text-2xl font-bold">Chiffre d’affaires & Personnel</h2>
          <p className="text-slate-500">Anticipez vos revenus et vos charges salariales.</p>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">🗓️ Année 1 - Détail mensuel</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {data.caMensuel.map((val, i) => (
            <div key={i} className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Mois {i+1}</label>
              <input 
                type="number" 
                value={val || ''} 
                onChange={(e) => handleCaMensuelChange(i, e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border-none font-mono text-xs focus:ring-1 focus:ring-blue-500 text-right"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl flex justify-between items-center">
          <span className="font-bold text-slate-500">Total Année 1</span>
          <span className="text-xl font-bold font-mono text-blue-600">{totalYear1.toLocaleString()} FCFA</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        <div>
          <h3 className="text-lg font-bold mb-4">🚀 Croissance Annuelle</h3>
          <div className="space-y-4">
            {data.tauxCroissance.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-sm font-medium">Vers Année {i+2}</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={t} 
                    onChange={(e) => handleTauxChange(i, e.target.value)}
                    className="w-20 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">⚙️ Paramètres</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Coût d'achat marchandises (% du CA)</label>
              <input 
                type="number" 
                value={data.tauxCoutMarchandises} 
                onChange={(e) => onUpdate({...data, tauxCoutMarchandises: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="checkbox" 
                checked={data.accre} 
                onChange={(e) => onUpdate({...data, accre: e.target.checked})}
                id="accre"
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="accre" className="text-sm font-semibold">Bénéficie de l'exonération sociale (ACCRE/Equiv.)</label>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-lg font-bold mb-4">👥 Salaires & Rémunération (Annuel Net)</h3>
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-slate-400 text-center">
                  <th className="text-left py-2">Poste</th>
                  <th>A1</th><th>A2</th><th>A3</th><th>A4</th><th>A5</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-3 font-medium text-sm">Salaires Employés (Total)</td>
                  {[0,1,2,3,4].map(idx => (
                    <td key={idx} className="p-1">
                      <input 
                        type="number" 
                        value={data.salairesEmp[idx] || ''} 
                        onChange={(e) => handleSalaryChange(idx, 'salairesEmp', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border-none font-mono text-xs text-right"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 font-medium text-sm">Rémunération Dirigeants</td>
                  {[0,1,2,3,4].map(idx => (
                    <td key={idx} className="p-1">
                      <input 
                        type="number" 
                        value={data.remunDir[idx] || ''} 
                        onChange={(e) => handleSalaryChange(idx, 'remunDir', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border-none font-mono text-xs text-right"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-between border-t border-slate-100 dark:border-slate-700">
        <button onClick={onPrev} className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-all">Précédent</button>
        <button onClick={onNext} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Voir mon plan financier</button>
      </div>
    </div>
  );
};

export default RevenueForm;

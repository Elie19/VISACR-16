
import React from 'react';
import { ChargeAnnee } from '../types';
import { LISTE_CHARGES_KEYS } from '../constants';

interface Props {
  data: ChargeAnnee;
  onUpdate: (data: ChargeAnnee) => void;
  onNext: () => void;
  onPrev: () => void;
}

const ChargesForm: React.FC<Props> = ({ data, onUpdate, onNext, onPrev }) => {
  const handleChargeChange = (chargeId: string, annee: number, val: string) => {
    onUpdate({ ...data, [`${chargeId}-${annee}`]: parseFloat(val) || 0 });
  };

  const getAnneeTotal = (anneeIdx: number) => {
    return LISTE_CHARGES_KEYS.reduce((acc, c) => acc + (data[`${c.id}-${anneeIdx}`] || 0), 0);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-10 border border-slate-100 dark:border-slate-700 overflow-x-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-2xl">📉</div>
        <div>
          <h2 className="text-2xl font-bold">Charges Fixes Prévisionnelles</h2>
          <p className="text-slate-500">Estimez vos frais de fonctionnement sur 5 ans (en FCFA).</p>
        </div>
      </div>

      <table className="w-full min-w-[800px] border-collapse">
        <thead>
          <tr className="text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700">
            <th className="py-4 text-left">Poste de dépense</th>
            {[1, 2, 3, 4, 5].map(a => <th key={a} className="py-4 text-center px-2">Année {a}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {LISTE_CHARGES_KEYS.map((charge) => (
            <tr key={charge.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
              <td className="py-3 pr-4 font-medium text-slate-700 dark:text-slate-300">{charge.label}</td>
              {[0, 1, 2, 3, 4].map(aIdx => (
                <td key={aIdx} className="py-2 px-1">
                  <input 
                    type="number"
                    placeholder="0"
                    value={data[`${charge.id}-${aIdx}`] || ''}
                    onChange={(e) => handleChargeChange(charge.id, aIdx, e.target.value)}
                    className="w-full text-right px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 border-none font-mono text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-slate-900 text-white font-bold">
            <td className="py-4 px-4 rounded-l-xl">TOTAL ANNUEL</td>
            {[0, 1, 2, 3, 4].map(aIdx => (
              <td key={aIdx} className={`py-4 text-right px-4 font-mono ${aIdx === 4 ? 'rounded-r-xl' : ''}`}>
                {getAnneeTotal(aIdx).toLocaleString()}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="mt-12 pt-6 flex justify-between border-t border-slate-100 dark:border-slate-700">
        <button onClick={onPrev} className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-all">Précédent</button>
        <button onClick={onNext} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">Suivant ➜</button>
      </div>
    </div>
  );
};

export default ChargesForm;

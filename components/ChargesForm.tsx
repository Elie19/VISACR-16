
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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <i className="fa-solid fa-file-invoice-dollar"></i>
        </span>
        <h2 className="text-2xl font-bold text-white">3) Vos charges fixes</h2>
      </div>
      <p className="text-slate-400 text-sm">Les charges courantes récurrentes, hors taxes</p>

      <div className="bg-[#242b3d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1a1f2b] border-b border-slate-800">
                <th className="p-4 text-left text-[10px] uppercase font-bold text-slate-500 tracking-wider">Charges fixes</th>
                {[1, 2, 3, 4, 5].map(a => (
                   <th key={a} className="p-4 text-center text-[10px] uppercase font-bold text-slate-500 tracking-wider min-w-[120px]">
                      <i className="fa-solid fa-calendar-days text-[8px] opacity-40 mr-1"></i> Année {a}
                   </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {LISTE_CHARGES_KEYS.map((charge) => (
                <tr key={charge.id} className="hover:bg-[#1a1f2b]/50 transition-colors">
                  <td className="p-4 flex items-center gap-3 whitespace-nowrap">
                    <i className="fa-solid fa-caret-right text-indigo-500/40"></i>
                    <span className="text-xs font-bold text-slate-300">{charge.label}</span>
                  </td>
                  {[0, 1, 2, 3, 4].map(aIdx => (
                    <td key={aIdx} className="p-2">
                      <div className="relative group">
                         <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-600 font-mono opacity-0 group-focus-within:opacity-100 transition-opacity">FCFA</span>
                         <input 
                           type="number"
                           placeholder="0"
                           value={data[`${charge.id}-${aIdx}`] || ''}
                           onChange={(e) => handleChargeChange(charge.id, aIdx, e.target.value)}
                           className="w-full text-right px-4 py-2 rounded-lg bg-[#1a1f2b] border border-slate-700 text-white font-mono text-xs focus:border-indigo-500 outline-none transition-all"
                         />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              
              {/* Total Row */}
              <tr className="bg-[#1a1f2b] font-bold">
                <td className="p-4 uppercase text-[10px] tracking-[0.2em] text-white">
                   <i className="fa-solid fa-sigma mr-2 text-indigo-500"></i> TOTAL
                </td>
                {[0, 1, 2, 3, 4].map(aIdx => (
                  <td key={aIdx} className="p-4 text-right font-mono text-indigo-400 border-l border-slate-800/50">
                    {getAnneeTotal(aIdx).toLocaleString()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-[#1a1f2b] border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4 text-slate-400 text-xs italic">
              <span className="w-8 h-8 flex items-center justify-center bg-indigo-500/10 rounded-lg text-indigo-400">
                <i className="fa-solid fa-lightbulb"></i>
              </span>
              <p>CFE = Cotisation Foncière des Entreprises (taxe annuelle)</p>
           </div>
           <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-3 transition-all active:scale-95">
              <i className="fa-solid fa-calculator"></i> <span>Calculer les totaux par année</span>
           </button>
        </div>
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

export default ChargesForm;

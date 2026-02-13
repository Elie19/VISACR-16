import React, { useMemo } from 'react';
import { AppState, BesoinItem } from '../types';
import { LISTE_CHARGES_KEYS, LISTE_BESOINS_KEYS, formatCurrency } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  state: AppState;
  onPrev: () => void;
  onReset: () => void;
}

const Report: React.FC<Props> = ({ state, onPrev, onReset }) => {
  const years = [0, 1, 2, 3, 4];
  const months = Array.from({ length: 12 }, (_, i) => i);
  const currency = state.currency;
  
  const totalInvestissement = (Object.values(state.besoins || {}) as BesoinItem[]).reduce((a, b) => a + (b?.montant || 0), 0);
  const totalFinancement = (state.financements || []).reduce((a, f) => a + (f?.montant || 0), 0);
  const tresorerieInitiale = totalFinancement - totalInvestissement;

  // --- CALCULS FINANCIERS ANNUELS ---
  const financialData = useMemo(() => {
    const caArr: number[] = [];
    
    if (state.revenue?.caMode === 'mode2') {
      for (let i = 0; i < 5; i++) {
        const yearSum = (state.revenue.caManuel?.[i] || Array(12).fill(0)).reduce((a, b) => a + b, 0);
        caArr.push(yearSum);
      }
    } else {
      const year1Ca = (state.revenue?.caMensuel || []).reduce((a, b) => a + b, 0);
      caArr.push(year1Ca);
      for (let i = 0; i < 4; i++) {
        caArr.push(caArr[i] * (1 + (state.revenue?.tauxCroissance?.[i] || 0) / 100));
      }
    }

    let cumulCaf = 0;

    return years.map((y, idx) => {
      const ca = caArr[idx] || 0;
      const costOfGoods = ca * ((state.revenue?.tauxCoutMarchandises || 0) / 100);
      const margin = ca - costOfGoods;
      
      const chargesDetail = LISTE_CHARGES_KEYS.reduce((acc, c) => {
        acc[c.id] = state.charges?.[`${c.id}-${idx}`] || 0;
        return acc;
      }, {} as Record<string, number>);

      const fixedCosts = Object.values(chargesDetail).reduce((a, b) => a + b, 0);
      
      const amortDetails = LISTE_BESOINS_KEYS.reduce((acc, bKey) => {
        const item = state.besoins?.[bKey.id];
        if (item && item.amortissement > 0 && idx < item.amortissement) {
          acc[bKey.id] = item.montant / item.amortissement;
        } else {
          acc[bKey.id] = 0;
        }
        return acc;
      }, {} as Record<string, number>);

      const dotAmort = Object.values(amortDetails).reduce((a, b) => a + b, 0);

      const interestRate = (state.financements || [])
        .filter(f => f.taux && f.taux > 0)
        .reduce((acc, f) => acc + (f.montant * (f.taux || 0) / 100), 0);
      
      const chargesFin = Math.max(0, interestRate * (1 - (idx * 0.2)));
      
      const totalEmprunts = (state.financements || []).filter(f => f.taux !== undefined).reduce((a, f) => a + f.montant, 0);
      const remboursementEmprunt = idx < 5 ? totalEmprunts / 5 : 0;

      const va = margin - fixedCosts;
      
      const tauxChargesDir = (state.revenue?.accre && idx === 0) ? 0.05 : 0.15;
      const chargesSocDir = (state.revenue?.remunDir?.[idx] || 0) * tauxChargesDir;
      const chargesSocEmp = (state.revenue?.salairesEmp?.[idx] || 0) * 0.30;
      const totalSalairesEtCharges = (state.revenue?.salairesEmp?.[idx] || 0) + (state.revenue?.remunDir?.[idx] || 0) + chargesSocDir + chargesSocEmp;
      
      const ebe = va - totalSalairesEtCharges;
      const resExploit = ebe - dotAmort;
      const resAvantImpots = resExploit - chargesFin;
      const is = resAvantImpots > 0 ? resAvantImpots * 0.25 : 0;
      const netResult = resAvantImpots - is;
      const caf = netResult + dotAmort;

      const creditClient = ca * ((state.revenue?.joursClients || 0) / 360);
      const detteFournisseur = costOfGoods * ((state.revenue?.joursFournisseurs || 0) / 360);
      const bfr = creditClient - detteFournisseur;

      const tauxMarge = ca > 0 ? (margin / ca) : 0;
      const chargesFixesTotales = fixedCosts + totalSalairesEtCharges;
      const seuilRentabilite = tauxMarge > 0 ? chargesFixesTotales / tauxMarge : 0;

      cumulCaf += caf;
      const soldeTresorerieFinAnnee = tresorerieInitiale + cumulCaf - bfr - (remboursementEmprunt * (idx + 1));

      return {
        year: idx + 1,
        ca,
        costOfGoods,
        margin,
        va,
        fixedCosts,
        chargesDetail,
        amortDetails,
        salairesEmp: state.revenue?.salairesEmp?.[idx] || 0,
        remunDir: state.revenue?.remunDir?.[idx] || 0,
        chargesSocDir,
        chargesSocEmp,
        ebe,
        dotAmort,
        resExploit,
        chargesFin,
        resAvantImpots,
        is,
        netResult,
        caf,
        remboursementEmprunt,
        creditClient,
        detteFournisseur,
        bfr,
        seuilRentabilite,
        tauxMarge,
        soldeTresorerieFinAnnee
      };
    });
  }, [state, years, tresorerieInitiale]);

  // --- CALCULS MENSUELS ANNEE 1 POUR LE BUDGET ---
  const monthlyDataYear1 = useMemo(() => {
    let soldeCumule = tresorerieInitiale;
    return months.map(m => {
      const ca = state.revenue?.caMensuel?.[m] || 0;
      const costOfGoods = ca * ((state.revenue?.tauxCoutMarchandises || 0) / 100);
      const fixedCharges = LISTE_CHARGES_KEYS.reduce((acc, c) => acc + (state.charges?.[`${c.id}-0`] || 0) / 12, 0);
      const salaires = (state.revenue?.salairesEmp?.[0] || 0) / 12 + (state.revenue?.remunDir?.[0] || 0) / 12;
      const chargesSoc = salaires * 0.20; 

      const encaissements = ca;
      const decaissements = costOfGoods + fixedCharges + salaires + chargesSoc;
      const fluxMois = encaissements - decaissements;
      soldeCumule += fluxMois;

      return {
        mois: m + 1,
        encaissements,
        decaissements,
        fluxMois,
        soldeCumule
      };
    });
  }, [state, tresorerieInitiale]);

  if (!currency) return <div className="p-20 text-center">Chargement des données monétaires...</div>;

  const formatVal = (v: number) => (v === 0 ? '-' : formatCurrency(v, currency));

  // Helper for Section Headers in Print
  const PrintSectionHeader = ({ title }: { title: string }) => (
    <div className="border-4 border-black p-4 mb-4 text-center bg-white avoid-break">
      <h2 className="text-2xl font-bold uppercase tracking-wide">{title}</h2>
    </div>
  );

  const ProjectInfoBlock = () => (
    <div className="mb-4 text-xs font-bold flex flex-col gap-1 border-b border-black pb-1 avoid-break">
      <p>Projet : <span className="font-normal">{state.generalInfo?.intituleProjet}</span></p>
      <p>Porteur de projet : <span className="font-normal">{state.generalInfo?.prenomNom}</span></p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* --- VUE WEB --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <i className="fa-solid fa-file-invoice text-indigo-500 text-2xl"></i>
             <h2 className="text-3xl font-bold">Rapport Expert Prévisionnel (5 ans)</h2>
          </div>
          <p className="text-slate-500">Planification configurée en <span className="text-indigo-400 font-bold">{currency.name} ({currency.code})</span></p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-3">
            <i className="fa-solid fa-print"></i> <span>Imprimer le Dossier</span>
          </button>
          <button onClick={onPrev} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-2">
            <i className="fa-solid fa-pen-to-square text-xs"></i> <span>Ajuster les données</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        <div className="bg-[#242b3d] border border-slate-800 p-8 rounded-3xl h-80 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              <i className="fa-solid fa-chart-column text-indigo-400"></i> Performance Annuelle ({currency.code})
           </div>
           <ResponsiveContainer width="100%" height="85%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => formatCurrency(v, currency)} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '10px'}} 
                  itemStyle={{fontSize: '12px'}} 
                  formatter={(v: any) => [formatCurrency(v, currency) + ' ' + currency.symbol, '']} 
                />
                <Bar dataKey="ca" fill="#6366f1" name="CA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netResult" fill="#10b981" name="Bénéfice" radius={[4, 4, 0, 0]} />
              </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="bg-[#242b3d] border border-slate-800 p-8 rounded-3xl h-80 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              <i className="fa-solid fa-chart-line text-indigo-400"></i> Flux de Trésorerie (CAF)
           </div>
           <ResponsiveContainer width="100%" height="85%">
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => formatCurrency(v, currency)} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '10px'}} 
                  itemStyle={{fontSize: '12px'}} 
                  formatter={(v: any) => [formatCurrency(v, currency) + ' ' + currency.symbol, '']} 
                />
                <Line type="monotone" dataKey="caf" stroke="#8b5cf6" strokeWidth={3} name="CAF" dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* --- STRUCTURE DU PDF (PRINT ONLY) --- */}
      <div className="print-only hidden text-black bg-white w-full">
        
        {/* PAGE 1 : PAGE DE GARDE */}
        <div className="flex flex-col justify-between items-center text-center p-8 min-h-[90vh] bg-white border-0">
           <div className="w-full border-4 border-black p-6 mt-12">
              <p className="text-base font-bold mb-2 uppercase tracking-widest">Informations Accompagnement Conseil</p>
              <h1 className="text-5xl font-black uppercase mb-6 tracking-tighter">Création d'entreprise</h1>
           </div>

           <div className="w-full border-4 border-black p-10 my-6 flex flex-col items-center justify-center flex-grow">
              <h2 className="text-4xl font-black mb-4">Etude financière</h2>
              <h2 className="text-4xl font-black mb-8">prévisionnelle sur 5 ans</h2>
              <div className="flex gap-10 text-lg mt-6">
                 <p className="font-bold">Dévise</p>
                 <p className="font-bold">{currency.name}</p>
              </div>
           </div>

           <div className="w-full border-4 border-black p-6 flex justify-center mt-auto">
              <p className="text-xl font-bold">{new Date().toLocaleDateString(currency.locale)}</p>
           </div>
           <p className="text-right w-full text-xs font-bold mt-2 italic">1</p>
        </div>

        {/* PAGE 2 : INVESTISSEMENTS ET FINANCEMENTS */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Investissements et financements" />
          <ProjectInfoBlock />

          <div className="mb-6 avoid-break">
            <table className="w-full border-collapse border-2 border-black">
               <thead className="bg-slate-200">
                  <tr>
                     <th className="border-2 border-black p-1.5 text-left w-2/3 uppercase text-[10px]">INVESTISSEMENTS</th>
                     <th className="border-2 border-black p-1.5 text-center uppercase text-[10px]">Montant hors taxes</th>
                  </tr>
               </thead>
               <tbody>
                  <tr className="bg-slate-50 font-bold border-t-2 border-black">
                    <td className="border-2 border-black p-1.5 text-[10px]">Immobilisations incorporelles</td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px]">-</td>
                  </tr>
                  {LISTE_BESOINS_KEYS.filter(k => k.id.includes('frais') || k.id.includes('logiciels') || k.id.includes('droit') || k.id.includes('caution') || k.id.includes('depot')).map(k => (
                    <tr key={k.id}>
                      <td className="border-x-2 border-black p-1 text-[9px] pl-6 italic">{k.label}</td>
                      <td className="border-x-2 border-black p-1 text-right text-[9px] font-mono">{state.besoins?.[k.id]?.montant ? formatVal(state.besoins[k.id].montant) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t-2 border-black">
                    <td className="border-2 border-black p-1.5 text-[10px]">Immobilisations corporelles</td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px]">-</td>
                  </tr>
                  {LISTE_BESOINS_KEYS.filter(k => k.id.includes('achat-immo') || k.id.includes('travaux') || k.id.includes('materiel') || k.id.includes('enseigne')).map(k => (
                    <tr key={k.id}>
                      <td className="border-x-2 border-black p-1 text-[9px] pl-6 italic">{k.label}</td>
                      <td className="border-x-2 border-black p-1 text-right text-[9px] font-mono">{state.besoins?.[k.id]?.montant ? formatVal(state.besoins[k.id].montant) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black">
                    <td className="border-2 border-black p-1.5 text-[10px] font-bold">Stock de matières et produits</td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px] font-mono">{state.besoins?.['stock']?.montant ? formatVal(state.besoins['stock'].montant) : '-'}</td>
                  </tr>
                  <tr>
                    <td className="border-2 border-black p-1.5 text-[10px] font-bold">Trésorerie de départ</td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px] font-mono">{state.besoins?.['tresorerie-depart']?.montant ? formatVal(state.besoins['tresorerie-depart'].montant) : '-'}</td>
                  </tr>
                  <tr className="bg-slate-200">
                     <td className="border-2 border-black p-1.5 font-black text-[10px] uppercase text-right">TOTAL BESOINS</td>
                     <td className="border-2 border-black p-1.5 text-right text-[10px] font-black font-mono">{formatVal(totalInvestissement)}</td>
                  </tr>
               </tbody>
            </table>
          </div>

          <div className="avoid-break">
            <table className="w-full border-collapse border-2 border-black">
               <thead className="bg-slate-200">
                  <tr>
                     <th className="border-2 border-black p-1.5 text-left w-2/3 uppercase text-[10px]">FINANCEMENT DES INVESTISSEMENTS</th>
                     <th className="border-2 border-black p-1.5 text-center uppercase text-[10px]">Montant hors taxes</th>
                  </tr>
               </thead>
               <tbody>
                  <tr className="bg-slate-50 font-bold">
                    <td className="border-2 border-black p-1.5 text-[10px]">Apport personnel</td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px] font-mono">{formatVal((state.financements || []).filter(f => !f.taux).reduce((a,f)=>a+(f?.montant||0),0))}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="border-2 border-black p-1.5 text-[10px] flex justify-between">
                      <span>Emprunt</span>
                      <span className="font-normal text-[8px] italic">taux / durée mois</span>
                    </td>
                    <td className="border-2 border-black p-1.5 text-right text-[10px] font-mono">{formatVal((state.financements || []).filter(f => f.taux).reduce((a,f)=>a+(f?.montant||0),0))}</td>
                  </tr>
                  {(state.financements || []).filter(f => f.taux).map((f, i) => (
                    <tr key={f.id}>
                      <td className="border-x-2 border-black p-1 text-[9px] pl-6 flex justify-between">
                        <span>{f.label || `Prêt n°${i+1}`}</span>
                        <span>{f.taux}% / {f.duree} mois</span>
                      </td>
                      <td className="border-x-2 border-black p-1 text-right text-[9px] font-mono">{formatVal(f.montant)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-200">
                     <td className="border-2 border-black p-1.5 font-black text-[10px] uppercase text-right">TOTAL RESSOURCES</td>
                     <td className="border-2 border-black p-1.5 text-right text-[10px] font-black font-mono">{formatVal(totalFinancement)}</td>
                  </tr>
               </tbody>
            </table>
          </div>
          <p className="text-right w-full text-xs font-bold mt-4 italic">2</p>
        </div>

        {/* PAGE 3 : SALAIRES ET CHARGES SOCIALES + AMORTISSEMENTS */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Salaires et charges sociales" />
          <ProjectInfoBlock />
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-[10px] font-bold border-b border-black pb-1 avoid-break">
            <p>Statut juridique : <span className="font-normal">{state.generalInfo?.statutJuridique || 'EI'}</span></p>
            <p>Bénéfice de l'Accre : <span className="font-normal">{state.revenue?.accre ? 'Oui' : 'Non'}</span></p>
            <p className="col-span-2">Statut social du/des dirigeants : <span className="font-normal">Travailleur non salarié</span></p>
          </div>

          <div className="avoid-break mb-8">
            <table className="w-full border-collapse border-2 border-black text-[9px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1.5"></th>
                  {years.map(y => <th key={y} className="border-2 border-black p-1.5">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold">
                  <td className="border-2 border-black p-1.5">Rémunération du (des) dirigeants</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.remunDir)}</td>)}
                </tr>
                <tr>
                  <td className="border-2 border-black p-1.5 pl-4 italic">Charges sociales du (des) dirigeant(s)</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.chargesSocDir)}</td>)}
                </tr>
                <tr className="font-bold border-t-2 border-black">
                  <td className="border-2 border-black p-1.5">Salaires des employés</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.salairesEmp)}</td>)}
                </tr>
                <tr>
                  <td className="border-2 border-black p-1.5 pl-4 italic">Charges sociales employés</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.chargesSocEmp)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="avoid-break">
            <PrintSectionHeader title="Détail des amortissements" />
            <table className="w-full border-collapse border-2 border-black text-[8px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1.5 text-left"></th>
                  {years.map(y => <th key={y} className="border-2 border-black p-1.5">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1" colSpan={6}>Amortissements incorporels</td></tr>
                {LISTE_BESOINS_KEYS.filter(k => k.defaultAmort > 0 && (k.id.includes('frais') || k.id.includes('logiciels'))).map(k => (
                  <tr key={k.id}>
                    <td className="border-2 border-black p-1 pl-4 italic">{k.label}</td>
                    {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.amortDetails?.[k.id] || 0)}</td>)}
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold border-t-2 border-black"><td className="border-2 border-black p-1" colSpan={6}>Amortissements corporels</td></tr>
                {LISTE_BESOINS_KEYS.filter(k => k.defaultAmort > 0 && (k.id.includes('achat-immo') || k.id.includes('travaux') || k.id.includes('materiel') || k.id.includes('enseigne'))).map(k => (
                  <tr key={k.id}>
                    <td className="border-2 border-black p-1 pl-4 italic">{k.label}</td>
                    {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.amortDetails?.[k.id] || 0)}</td>)}
                  </tr>
                ))}
                <tr className="bg-slate-200 font-black uppercase">
                  <td className="border-2 border-black p-1 text-right">Total amortissements</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.dotAmort)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-right w-full text-xs font-bold mt-4 italic">3</p>
        </div>

        {/* PAGE 4 : COMPTE DE RESULTATS PREVISIONNEL */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Compte de résultats prévisionnel" />
          <ProjectInfoBlock />

          <table className="w-full border-collapse border-2 border-black text-[8px]">
             <thead className="bg-slate-200">
                <tr>
                   <th className="border-2 border-black p-1 text-left w-1/3"></th>
                   {years.map(y => <th key={y} className="border-2 border-black p-1 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr className="bg-slate-50 font-bold">
                   <td className="border-2 border-black p-1">Produits d'exploitation</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td>)}
                </tr>
                <tr><td className="border-2 border-black p-1 pl-4 italic">Chiffre d'affaires HT</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td>)}</tr>
                
                <tr className="bg-slate-50 font-bold">
                   <td className="border-2 border-black p-1">Charges d'exploitation</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods + d.fixedCosts + d.salairesEmp + d.remunDir + d.chargesSocDir + d.chargesSocEmp)}</td>)}
                </tr>
                <tr><td className="border-2 border-black p-1 pl-4 italic">Achats consommés</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods)}</td>)}</tr>
                <tr className="bg-slate-200 font-black"><td className="border-2 border-black p-1">Marge brute</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.margin)}</td>)}</tr>
                
                <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1">Charges externes</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fixedCosts)}</td>)}</tr>
                {LISTE_CHARGES_KEYS.map(c => (
                  <tr key={c.id} className="text-[7px]">
                    <td className="border-2 border-black p-0.5 pl-6 italic">{c.label}</td>
                    {financialData.map(d => <td key={d.year} className="border-2 border-black p-0.5 text-right font-mono">{formatVal(d.chargesDetail?.[c.id] || 0)}</td>)}
                  </tr>
                ))}

                <tr className="bg-slate-200 font-black"><td className="border-2 border-black p-1">Valeur ajoutée</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.va)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1 pl-4 italic">Impôts et taxes</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">-</td>)}</tr>
                <tr><td className="border-2 border-black p-1 pl-4 italic">Salaires employés</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.salairesEmp)}</td>)}</tr>
                <tr className="bg-slate-300 font-black"><td className="border-2 border-black p-1 uppercase">Excédent brut d'exploitation</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ebe)}</td>)}</tr>
                
                <tr><td className="border-2 border-black p-1 pl-4 italic">Frais bancaires, charges financières</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.chargesFin)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1 pl-4 italic">Dotations aux amortissements</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.dotAmort)}</td>)}</tr>
                
                <tr className="bg-slate-400 text-white font-black"><td className="border-2 border-white p-1 uppercase">Résultat avant impôts</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.resAvantImpots)}</td>)}</tr>
                <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1 uppercase">Résultat net comptable</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.netResult)}</td>)}</tr>
             </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-4 italic">4</p>
        </div>

        {/* PAGE 6 : SOLDES INTERMEDIAIRES DE GESTION + CAF */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Soldes intermédiaires de gestion" />
          <ProjectInfoBlock />

          <div className="avoid-break mb-8">
            <table className="w-full border-collapse border-2 border-black text-[8px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1 text-left">Indicateur</th>
                  {years.map(y => <React.Fragment key={y}><th className="border-2 border-black p-1">Année {y+1}</th><th className="border-2 border-black p-1">%</th></React.Fragment>)}
                </tr>
              </thead>
              <tbody>
                <tr><td className="border-2 border-black p-1 font-bold">Chiffre d'affaires</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td><td className="border-2 border-black p-1 text-center">100%</td></React.Fragment>)}</tr>
                <tr><td className="border-2 border-black p-1 italic pl-4">Achats consommés</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods)}</td><td className="border-2 border-black p-1 text-center">{d.ca > 0 ? ((d.costOfGoods/d.ca)*100).toFixed(0) : '0'}%</td></React.Fragment>)}</tr>
                <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1">Marge globale</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border-2 border-black p-1 text-right font-mono">{formatVal(d.margin)}</td><td className="border-2 border-black p-1 text-center">{d.ca > 0 ? ((d.margin/d.ca)*100).toFixed(0) : '0'}%</td></React.Fragment>)}</tr>
                <tr className="bg-slate-200 font-black"><td className="border-2 border-black p-1 uppercase">Valeur ajoutée</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border-2 border-black p-1 text-right font-mono">{formatVal(d.va)}</td><td className="border-2 border-black p-1 text-center">{d.ca > 0 ? ((d.va/d.ca)*100).toFixed(0) : '0'}%</td></React.Fragment>)}</tr>
                <tr className="bg-slate-300 font-black"><td className="border-2 border-black p-1 uppercase">E.B.E.</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ebe)}</td><td className="border-2 border-black p-1 text-center">{d.ca > 0 ? ((d.ebe/d.ca)*100).toFixed(0) : '0'}%</td></React.Fragment>)}</tr>
                <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1 uppercase">Capacité autofinancement</td>{financialData.map(d => <React.Fragment key={d.year}><td className="border-2 border-white p-1 text-right font-mono">{formatVal(d.caf)}</td><td className="border-2 border-white p-1 text-center">{d.ca > 0 ? ((d.caf/d.ca)*100).toFixed(0) : '0'}%</td></React.Fragment>)}</tr>
              </tbody>
            </table>
          </div>

          <div className="avoid-break">
            <PrintSectionHeader title="Capacité d'autofinancement" />
            <table className="w-full border-collapse border-2 border-black text-[8px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1.5"></th>
                  {years.map(y => <th key={y} className="border-2 border-black p-1.5">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr><td className="border-2 border-black p-1.5">Résultat de l'exercice</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.netResult)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1.5 italic">+ Dotation amortissements</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.dotAmort)}</td>)}</tr>
                <tr className="bg-slate-200 font-black"><td className="border-2 border-black p-1.5 uppercase">Capacité d'autofinancement</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.caf)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1.5 italic">- Remboursement emprunts</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1.5 text-right font-mono">{formatVal(d.remboursementEmprunt)}</td>)}</tr>
                <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1.5 uppercase">Autofinancement net</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1.5 text-right font-mono">{formatVal(d.caf - d.remboursementEmprunt)}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <p className="text-right w-full text-xs font-bold mt-4 italic">5</p>
        </div>

        {/* PAGE 8 : SEUIL DE RENTABILITE + BFR */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Seuil de rentabilité économique" />
          <ProjectInfoBlock />

          <div className="avoid-break mb-8">
            <table className="w-full border-collapse border-2 border-black text-[8px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1.5 text-left w-1/3"></th>
                  {years.map(y => <th key={y} className="border-2 border-black p-1.5 text-center">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold border-t-2 border-black"><td className="border-2 border-black p-1">Ventes + Production réelle</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td>)}</tr>
                <tr><td className="border-2 border-black p-1 italic pl-4">Achats consommés</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods)}</td>)}</tr>
                <tr className="bg-slate-100 font-bold border-t-2 border-black"><td className="border-2 border-black p-1">Marge sur coûts variables</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.margin)}</td>)}</tr>
                <tr className="bg-slate-200 font-black"><td className="border-2 border-black p-1">Taux de marge sur coûts variables</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-center font-mono">{(d.tauxMarge * 100).toFixed(0)}%</td>)}</tr>
                <tr><td className="border-2 border-black p-1 italic">Coûts fixes</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fixedCosts + d.salairesEmp + d.remunDir + d.chargesSocDir + d.chargesSocEmp)}</td>)}</tr>
                <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1 uppercase">Seuil de rentabilité (chiffre d'affaires)</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.seuilRentabilite)}</td>)}</tr>
              </tbody>
            </table>
          </div>

          <div className="avoid-break">
            <PrintSectionHeader title="Besoin en fonds de roulement" />
            <table className="w-full border-collapse border-2 border-black text-[8px]">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border-2 border-black p-1 text-left">Analyse clients / fournisseurs :</th>
                  <th className="border-2 border-black p-1">délai jours</th>
                  {years.map(y => <th key={y} className="border-2 border-black p-1 text-center">Année {y+1}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={7}>Besoins</td></tr>
                <tr>
                  <td className="border-2 border-black p-1 italic pl-4">Volume crédit client HT</td>
                  <td className="border-2 border-black p-1 text-center">{state.revenue?.joursClients || 0}</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.creditClient)}</td>)}
                </tr>
                <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={7}>Ressources</td></tr>
                <tr>
                  <td className="border-2 border-black p-1 italic pl-4">Volume dettes fournisseurs HT</td>
                  <td className="border-2 border-black p-1 text-center">{state.revenue?.joursFournisseurs || 0}</td>
                  {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.detteFournisseur)}</td>)}
                </tr>
                <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1 uppercase" colSpan={2}>Besoin en fonds de roulement</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.bfr)}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <p className="text-right w-full text-xs font-bold mt-4 italic">6</p>
        </div>

        {/* PAGE 10 : PLAN DE FINANCEMENT A 5 ANS */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Plan de financement à cinq ans" />
          <ProjectInfoBlock />

          <table className="w-full border-collapse border-2 border-black text-[8px]">
            <thead className="bg-slate-200">
              <tr>
                <th className="border-2 border-black p-1.5 text-left"></th>
                {years.map(y => <th key={y} className="border-2 border-black p-1.5">Année {y+1}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr><td className="border-2 border-black p-1">Immobilisations (investissements)</td><td className="border-2 border-black p-1 text-right font-mono">{formatVal(totalInvestissement)}</td><td colSpan={4} className="border-2 border-black"></td></tr>
              <tr><td className="border-2 border-black p-1">Variation du Besoin en fonds de roulement</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.bfr)}</td>)}</tr>
              <tr><td className="border-2 border-black p-1">Remboursement d'emprunts</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.remboursementEmprunt)}</td>)}</tr>
              <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1 uppercase">Total des besoins</td>{financialData.map((d, i) => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal((i === 0 ? totalInvestissement : 0) + d.bfr + d.remboursementEmprunt)}</td>)}</tr>
              
              <tr className="border-t-4 border-black"><td className="border-2 border-black p-1">Apport personnel</td><td className="border-2 border-black p-1 text-right font-mono">{formatVal((state.financements || []).filter(f => !f.taux).reduce((a,f)=>a+(f?.montant||0),0))}</td><td colSpan={4} className="border-2 border-black"></td></tr>
              <tr><td className="border-2 border-black p-1">Emprunts</td><td className="border-2 border-black p-1 text-right font-mono">{formatVal((state.financements || []).filter(f => f.taux).reduce((a,f)=>a+(f?.montant||0),0))}</td><td colSpan={4} className="border-2 border-black"></td></tr>
              <tr><td className="border-2 border-black p-1">Capacité d'auto-financement</td>{financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.caf)}</td>)}</tr>
              <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1 uppercase">Total des ressources</td>{financialData.map((d, i) => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal((i === 0 ? totalFinancement : 0) + d.caf)}</td>)}</tr>
              
              <tr className="bg-black text-white font-black border-t-2 border-white"><td className="border-2 border-white p-1 uppercase">Excédent de trésorerie</td>{financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.soldeTresorerieFinAnnee)}</td>)}</tr>
            </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-4 italic">7</p>
        </div>

        {/* PAGE 11 : BUDGET DE TRESORERIE (PARTIE 1 - MOIS 1-6) */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Budget prévisionnel de trésorerie" />
          <ProjectInfoBlock />
          <p className="text-[10px] font-bold mb-2 uppercase">Première année</p>

          <table className="w-full border-collapse border-2 border-black text-[7px]">
            <thead className="bg-slate-200">
              <tr>
                <th className="border-2 border-black p-1 text-left"></th>
                {months.slice(0,6).map(m => <th key={m} className="border-2 border-black p-1">Mois {m+1}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={7}>Encaissements</td></tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Vente de marchandises / services</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.encaissements)}</td>)}</tr>
              <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1 uppercase">Total des encaissements</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.encaissements)}</td>)}</tr>
              
              <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={7}>Décaissements</td></tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Achats de marchandises</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.decaissements * 0.6)}</td>)}</tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Charges externes (fixes)</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.decaissements * 0.2)}</td>)}</tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Salaires et charges sociales</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.decaissements * 0.2)}</td>)}</tr>
              <tr className="bg-slate-100 font-bold"><td className="border-2 border-black p-1 uppercase">Total des décaissements</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.decaissements)}</td>)}</tr>
              
              <tr className="border-t-2 border-black bg-slate-200 font-black"><td className="border-2 border-black p-1">Solde du mois</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fluxMois)}</td>)}</tr>
              <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1">Solde de trésorerie (cumul)</td>{monthlyDataYear1.slice(0,6).map(d => <td key={d.mois} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.soldeCumule)}</td>)}</tr>
            </tbody>
          </table>
          <div className="mt-4 text-[7px] italic border-t border-black pt-1 avoid-break">
            Ce tableau ne prend pas en compte les flux de TVA ni le besoin en fonds de roulement.
          </div>
          <p className="text-right w-full text-xs font-bold mt-4 italic">8</p>
        </div>

        {/* PAGE 12 : BUDGET DE TRESORERIE (PARTIE 2 - MOIS 7-12 + TOTAL) */}
        <div className="page-break p-8">
          <PrintSectionHeader title="Budget prévisionnel de trésorerie (suite)" />
          <ProjectInfoBlock />

          <table className="w-full border-collapse border-2 border-black text-[7px]">
            <thead className="bg-slate-200">
              <tr>
                <th className="border-2 border-black p-1 text-left"></th>
                {months.slice(6,12).map(m => <th key={m} className="border-2 border-black p-1">Mois {m+1}</th>)}
                <th className="border-2 border-black p-1 bg-black text-white">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={8}>Encaissements</td></tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Vente de marchandises / services</td>{monthlyDataYear1.slice(6,12).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.encaissements)}</td>)}<td className="border-2 border-black p-1 text-right font-black font-mono">{formatVal(financialData[0]?.ca || 0) || '-'}</td></tr>
              
              <tr className="bg-slate-50 font-bold"><td className="border-2 border-black p-1 uppercase" colSpan={8}>Décaissements</td></tr>
              <tr><td className="border-2 border-black p-1 italic pl-4">Total décaissements mensuels</td>{monthlyDataYear1.slice(6,12).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.decaissements)}</td>)}<td className="border-2 border-black p-1 text-right font-black font-mono">{formatVal(monthlyDataYear1.reduce((a,d)=>a+d.decaissements,0)) || '-'}</td></tr>
              
              <tr className="border-t-2 border-black bg-slate-200 font-black"><td className="border-2 border-black p-1">Solde du mois</td>{monthlyDataYear1.slice(6,12).map(d => <td key={d.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fluxMois)}</td>)}<td className="border-2 border-black p-1"></td></tr>
              <tr className="bg-black text-white font-black"><td className="border-2 border-white p-1">Solde de trésorerie (cumul)</td>{monthlyDataYear1.slice(6,12).map(d => <td key={d.mois} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.soldeCumule)}</td>)}<td className="border-2 border-white p-1 text-right font-black font-mono">{formatVal(financialData[0]?.soldeTresorerieFinAnnee || 0) || '-'}</td></tr>
            </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-4 italic">9</p>
        </div>
      </div>

      <div className="no-print pt-10 border-t border-slate-800 flex justify-between">
        <button onClick={onPrev} className="px-8 py-3 border border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2">
          <i className="fa-solid fa-arrow-left text-xs"></i> <span>Ajuster les saisies</span>
        </button>
        <button onClick={onReset} className="px-6 py-3 bg-red-500/10 border border-red-500/50 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
          <i className="fa-solid fa-trash-can text-xs"></i> <span>Effacer les données</span>
        </button>
      </div>
    </div>
  );
};

export default Report;
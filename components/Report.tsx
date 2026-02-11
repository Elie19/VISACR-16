
import React, { useMemo } from 'react';
import { AppState, BesoinItem } from '../types';
import { LISTE_CHARGES_KEYS, LISTE_BESOINS_KEYS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  state: AppState;
  onPrev: () => void;
  onReset: () => void;
}

const Report: React.FC<Props> = ({ state, onPrev, onReset }) => {
  const years = [0, 1, 2, 3, 4];
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  const totalInvestissement = (Object.values(state.besoins) as BesoinItem[]).reduce((a, b) => a + (b.montant || 0), 0);
  const totalFinancement = state.financements.reduce((a, f) => a + (f.montant || 0), 0);
  const tresorerieInitiale = totalFinancement - totalInvestissement;

  // --- CALCULS FINANCIERS ANNUELS ---
  const financialData = useMemo(() => {
    const caArr: number[] = [];
    
    if (state.revenue.caMode === 'mode2') {
      for (let i = 0; i < 5; i++) {
        const yearSum = (state.revenue.caManuel[i] || Array(12).fill(0)).reduce((a, b) => a + b, 0);
        caArr.push(yearSum);
      }
    } else {
      const year1Ca = state.revenue.caMensuel.reduce((a, b) => a + b, 0);
      caArr.push(year1Ca);
      for (let i = 0; i < 4; i++) {
        caArr.push(caArr[i] * (1 + (state.revenue.tauxCroissance[i] || 0) / 100));
      }
    }

    let cumulCaf = 0;

    return years.map((y, idx) => {
      const ca = caArr[idx];
      const costOfGoods = ca * (state.revenue.tauxCoutMarchandises / 100);
      const margin = ca - costOfGoods;
      
      const chargesDetail = LISTE_CHARGES_KEYS.reduce((acc, c) => {
        acc[c.id] = state.charges[`${c.id}-${idx}`] || 0;
        return acc;
      }, {} as Record<string, number>);

      const fixedCosts = Object.values(chargesDetail).reduce((a, b) => a + b, 0);
      
      const amortDetails = LISTE_BESOINS_KEYS.reduce((acc, bKey) => {
        const item = state.besoins[bKey.id];
        if (item && item.amortissement > 0 && idx < item.amortissement) {
          acc[bKey.id] = item.montant / item.amortissement;
        } else {
          acc[bKey.id] = 0;
        }
        return acc;
      }, {} as Record<string, number>);

      const dotAmort = Object.values(amortDetails).reduce((a, b) => a + b, 0);

      const interestRate = state.financements
        .filter(f => f.taux && f.taux > 0)
        .reduce((acc, f) => acc + (f.montant * (f.taux || 0) / 100), 0);
      
      const chargesFin = Math.max(0, interestRate * (1 - (idx * 0.2)));
      
      // Calcul remboursement emprunt simplifié pour le plan de financement
      const totalEmprunts = state.financements.filter(f => f.taux !== undefined).reduce((a, f) => a + f.montant, 0);
      const remboursementEmprunt = idx < 5 ? totalEmprunts / 5 : 0;

      const va = margin - fixedCosts;
      
      const tauxChargesDir = (state.revenue.accre && idx === 0) ? 0.05 : 0.15;
      const chargesSocDir = (state.revenue.remunDir[idx] || 0) * tauxChargesDir;
      const chargesSocEmp = (state.revenue.salairesEmp[idx] || 0) * 0.30;
      const totalSalairesEtCharges = (state.revenue.salairesEmp[idx] || 0) + (state.revenue.remunDir[idx] || 0) + chargesSocDir + chargesSocEmp;
      
      const ebe = va - totalSalairesEtCharges;
      const resExploit = ebe - dotAmort;
      const resAvantImpots = resExploit - chargesFin;
      const is = resAvantImpots > 0 ? resAvantImpots * 0.25 : 0;
      const netResult = resAvantImpots - is;
      const caf = netResult + dotAmort;

      const creditClient = ca * (state.revenue.joursClients / 360);
      const detteFournisseur = costOfGoods * (state.revenue.joursFournisseurs / 360);
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
        salairesEmp: state.revenue.salairesEmp[idx] || 0,
        remunDir: state.revenue.remunDir[idx] || 0,
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

  const treasuryMonthly = useMemo(() => {
    let soldePrecedent = 0;
    const y1 = financialData[0];
    
    return months.map(m => {
      const caMois = state.revenue.caMensuel[m] || 0;
      const apportInitial = m === 0 ? totalFinancement : 0;
      const encaissements = caMois + apportInitial;

      const investissement = m === 0 ? totalInvestissement : 0;
      const chargeMois = y1.fixedCosts / 12;
      const salaireMois = (y1.salairesEmp + y1.remunDir + y1.chargesSocDir + y1.chargesSocEmp) / 12;
      const achatMois = caMois * (state.revenue.tauxCoutMarchandises / 100);
      
      const decaissements = investissement + chargeMois + salaireMois + achatMois;
      const soldeDuMois = encaissements - decaissements;
      const cumul = soldePrecedent + soldeDuMois;
      soldePrecedent = cumul;

      return {
        mois: m + 1,
        ca: caMois,
        totalEnc: encaissements,
        totalDec: decaissements,
        solde: soldeDuMois,
        cumul: cumul
      };
    });
  }, [state, financialData, totalInvestissement, totalFinancement, months]);

  const formatVal = (v: number) => (v === 0 ? '-' : Math.round(v).toLocaleString());

  const PdfPageHeader = ({ title }: { title: string }) => (
    <div className="mb-8 border-b-2 border-slate-300 pb-2">
      <div className="flex justify-between items-end mb-2">
        <h1 className="text-2xl font-bold uppercase tracking-tight">{title}</h1>
        <div className="text-right text-[8px] font-bold text-slate-400">
           Projet: {state.generalInfo.intituleProjet || "N/A"}<br/>
           Porteur: {state.generalInfo.prenomNom || "N/A"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* HEADER WEB NO-PRINT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <i className="fa-solid fa-file-invoice text-indigo-500 text-2xl"></i>
             <h2 className="text-3xl font-bold">Rapport Expert Prévisionnel (5 ans)</h2>
          </div>
          <p className="text-slate-500">Analyse complète de {state.generalInfo.intituleProjet || "votre projet"}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-3">
            <i className="fa-solid fa-print"></i> <span>Imprimer le Dossier Complet</span>
          </button>
          <button onClick={onPrev} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-2">
            <i className="fa-solid fa-pen-to-square text-xs"></i> <span>Ajuster les données</span>
          </button>
        </div>
      </div>

      {/* DASHBOARDS WEB NO-PRINT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        <div className="bg-[#242b3d] border border-slate-800 p-8 rounded-3xl h-80 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              <i className="fa-solid fa-chart-column text-indigo-400"></i> Croissance du CA vs Résultat Net
           </div>
           <ResponsiveContainer width="100%" height="85%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '10px'}} itemStyle={{fontSize: '12px'}} formatter={(v: any) => v.toLocaleString()} />
                <Bar dataKey="ca" fill="#6366f1" name="CA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netResult" fill="#10b981" name="Bénéfice" radius={[4, 4, 0, 0]} />
              </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="bg-[#242b3d] border border-slate-800 p-8 rounded-3xl h-80 shadow-xl">
           <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              <i className="fa-solid fa-chart-line text-indigo-400"></i> Cash-Flow Prévisionnel (CAF)
           </div>
           <ResponsiveContainer width="100%" height="85%">
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '10px'}} itemStyle={{fontSize: '12px'}} formatter={(v: any) => v.toLocaleString()} />
                <Line type="monotone" dataKey="caf" stroke="#8b5cf6" strokeWidth={3} name="CAF" dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* --- STRUCTURE DU PDF (PRINT ONLY) --- */}
      <div className="print-only hidden text-black bg-white">
        
        {/* PAGE 1 : PAGE DE GARDE */}
        <div className="page-break p-12 min-h-screen flex flex-col justify-between items-center text-center">
           <div className="w-full border-4 border-black p-8 mt-10">
              <p className="text-sm font-bold mb-1">Informations</p>
              <p className="text-sm font-bold mb-1">Accompagnement</p>
              <p className="text-sm font-bold mb-4">Conseil</p>
              <h1 className="text-5xl font-black uppercase mb-10">Création d'entreprise</h1>
           </div>

           <div className="w-full border-4 border-black p-12 my-10 flex flex-col items-center justify-center flex-grow">
              <h2 className="text-4xl font-bold mb-4">Etude financière</h2>
              <h2 className="text-4xl font-bold mb-8">prévisionnelle sur 5 ans</h2>
              <div className="flex gap-10 mt-10">
                 <p className="text-xl font-bold">Dévise</p>
                 <p className="text-xl font-bold">Franc CFA</p>
              </div>
           </div>

           <div className="w-full border-4 border-black p-8 mb-10 flex justify-center">
              <p className="text-lg font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
           </div>
           <p className="text-right w-full text-xs font-bold">1</p>
        </div>

        {/* PAGE 2 : INVESTISSEMENTS ET FINANCEMENTS */}
        <div className="page-break p-12 min-h-screen">
          <div className="border-4 border-black p-4 mb-10 text-center">
             <h2 className="text-3xl font-bold uppercase">Investissements et financements</h2>
          </div>
          
          <div className="mb-10 text-sm font-bold">
             <p>Projet : {state.generalInfo.intituleProjet}</p>
             <p>Porteur de projet : {state.generalInfo.prenomNom}</p>
          </div>

          <table className="w-full border-collapse border-2 border-black mb-10">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-2 text-left w-2/3 uppercase text-xs">INVESTISSEMENTS</th>
                   <th className="border-2 border-black p-2 text-center uppercase text-xs">Montant hors taxes</th>
                </tr>
             </thead>
             <tbody>
                <tr className="bg-slate-50"><td className="border-2 border-black p-2 font-bold text-xs" colSpan={2}>Immobilisations incorporelles</td></tr>
                {LISTE_BESOINS_KEYS.filter(k => k.defaultAmort > 0 && k.defaultAmort <= 5 && k.id !== 'materiel' && k.id !== 'materiel-bureau' && k.id !== 'achat-immobilier').map(k => (
                   <tr key={k.id}>
                      <td className="border-2 border-black p-1 text-[10px] pl-6 italic">{k.label}</td>
                      <td className="border-2 border-black p-1 text-right text-[10px] font-mono">{formatVal(state.besoins[k.id]?.montant || 0)}</td>
                   </tr>
                ))}
                <tr className="bg-slate-50"><td className="border-2 border-black p-2 font-bold text-xs" colSpan={2}>Immobilisations corporelles</td></tr>
                {LISTE_BESOINS_KEYS.filter(k => k.id === 'materiel' || k.id === 'materiel-bureau' || k.id === 'achat-immobilier' || k.id === 'travaux-amenagement' || k.id === 'enseigne-communication').map(k => (
                   <tr key={k.id}>
                      <td className="border-2 border-black p-1 text-[10px] pl-6 italic">{k.label}</td>
                      <td className="border-2 border-black p-1 text-right text-[10px] font-mono">{formatVal(state.besoins[k.id]?.montant || 0)}</td>
                   </tr>
                ))}
                <tr>
                   <td className="border-2 border-black p-1 text-[10px] font-bold">Stock de matières et produits</td>
                   <td className="border-2 border-black p-1 text-right text-[10px] font-mono">{formatVal(state.besoins['stock']?.montant || 0)}</td>
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 text-[10px] font-bold">Trésorerie de départ</td>
                   <td className="border-2 border-black p-1 text-right text-[10px] font-mono">{formatVal(state.besoins['tresorerie-depart']?.montant || 0)}</td>
                </tr>
                <tr className="bg-slate-200">
                   <td className="border-2 border-black p-2 font-black text-xs uppercase text-right">TOTAL BESOINS</td>
                   <td className="border-2 border-black p-2 text-right text-xs font-black font-mono">{formatVal(totalInvestissement)}</td>
                </tr>
             </tbody>
          </table>

          <table className="w-full border-collapse border-2 border-black">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-2 text-left w-2/3 uppercase text-xs">FINANCEMENT DES INVESTISSEMENTS</th>
                   <th className="border-2 border-black p-2 text-center uppercase text-xs">Montant hors taxes</th>
                </tr>
             </thead>
             <tbody>
                {state.financements.map(f => (
                   <tr key={f.id}>
                      <td className="border-2 border-black p-1 text-[10px] pl-6 italic">
                         {f.label} {f.taux ? `(taux: ${f.taux}%, durée: ${f.duree} mois)` : ''}
                      </td>
                      <td className="border-2 border-black p-1 text-right text-[10px] font-mono">{formatVal(f.montant)}</td>
                   </tr>
                ))}
                <tr className="bg-slate-200">
                   <td className="border-2 border-black p-2 font-black text-xs uppercase text-right">TOTAL RESSOURCES</td>
                   <td className="border-2 border-black p-2 text-right text-xs font-black font-mono">{formatVal(totalFinancement)}</td>
                </tr>
             </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-auto">2</p>
        </div>

        {/* PAGE 3 : SALAIRES ET AMORTISSEMENTS */}
        <div className="page-break p-12 min-h-screen">
          <div className="border-4 border-black p-4 mb-10 text-center">
             <h2 className="text-3xl font-bold uppercase">Salaires et charges sociales</h2>
          </div>
          
          <div className="mb-6 text-[10px] font-bold space-y-1">
             <p>Statut juridique : {state.generalInfo.statutJuridique}</p>
             <p>Bénéfice de l'Accre : {state.revenue.accre ? 'Oui' : 'Non'}</p>
             <p>Statut social du/des dirigeants : Travailleur non salarié</p>
          </div>

          <table className="w-full border-collapse border-2 border-black mb-10 text-[9px]">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-2 text-left">Poste</th>
                   {years.map(y => <th key={y} className="border-2 border-black p-2 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr>
                   <td className="border-2 border-black p-1 font-bold">Rémunération du (des) dirigeants</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.remunDir)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 italic pl-4">Charges sociales du (des) dirigeant(s)</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.chargesSocDir)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 font-bold">Salaires des employés</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.salairesEmp)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 italic pl-4">Charges sociales employés</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.chargesSocEmp)}</td>)}
                </tr>
             </tbody>
          </table>

          <div className="border-4 border-black p-4 mb-10 text-center">
             <h2 className="text-3xl font-bold uppercase">Détail des amortissements</h2>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[9px]">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-2 text-left">Poste</th>
                   {years.map(y => <th key={y} className="border-2 border-black p-2 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr className="bg-slate-100"><td colSpan={6} className="border-2 border-black p-1 font-bold">Amortissements incorporels</td></tr>
                {LISTE_BESOINS_KEYS.filter(k => k.defaultAmort > 0 && k.defaultAmort <= 5 && k.id !== 'materiel' && k.id !== 'materiel-bureau' && k.id !== 'achat-immobilier').map(k => (
                   <tr key={k.id}>
                      <td className="border-2 border-black p-1 pl-4">{k.label}</td>
                      {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.amortDetails[k.id] || 0)}</td>)}
                   </tr>
                ))}
                <tr className="bg-slate-100"><td colSpan={6} className="border-2 border-black p-1 font-bold">Amortissements corporels</td></tr>
                {LISTE_BESOINS_KEYS.filter(k => k.id === 'materiel' || k.id === 'materiel-bureau' || k.id === 'achat-immobilier' || k.id === 'travaux-amenagement' || k.id === 'enseigne-communication').map(k => (
                   <tr key={k.id}>
                      <td className="border-2 border-black p-1 pl-4">{k.label}</td>
                      {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.amortDetails[k.id] || 0)}</td>)}
                   </tr>
                ))}
                <tr className="bg-slate-200">
                   <td className="border-2 border-black p-1 font-black text-right uppercase">Total amortissements</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-black font-mono">{formatVal(d.dotAmort)}</td>)}
                </tr>
             </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-auto">3</p>
        </div>

        {/* PAGE 4 : COMPTE DE RESULTATS */}
        <div className="page-break p-12 min-h-screen">
          <div className="border-4 border-black p-4 mb-10 text-center">
             <h2 className="text-2xl font-bold uppercase">Compte de résultats prévisionnel sur 5 ans</h2>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[8px]">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-2 text-left w-1/4">POSTES</th>
                   {years.map(y => <th key={y} className="border-2 border-black p-2 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr className="bg-slate-50 font-bold">
                   <td className="border-2 border-black p-1">Produits d'exploitation</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td>)}
                </tr>
                <tr className="bg-slate-50 font-bold">
                   <td className="border-2 border-black p-1">Charges d'exploitation</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods + d.fixedCosts + d.salairesEmp + d.remunDir + d.chargesSocDir + d.chargesSocEmp)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4 italic">Achats consommés</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods)}</td>)}
                </tr>
                <tr className="bg-slate-200 font-black">
                   <td className="border-2 border-black p-1 uppercase">Marge brute</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.margin)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 font-bold">Charges externes</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fixedCosts)}</td>)}
                </tr>
                {LISTE_CHARGES_KEYS.slice(0, 8).map(c => (
                   <tr key={c.id}>
                      <td className="border-2 border-black p-0.5 pl-6 text-[7px]">{c.label}</td>
                      {financialData.map(d => <td key={d.year} className="border-2 border-black p-0.5 text-right font-mono">{formatVal(d.chargesDetail[c.id])}</td>)}
                   </tr>
                ))}
                <tr className="bg-slate-200 font-black">
                   <td className="border-2 border-black p-1 uppercase">Valeur ajoutée</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.va)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Impôts et taxes</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.chargesDetail['taxes'] || 0)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Salaires employés</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.salairesEmp)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Charges sociales employés</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.chargesSocEmp)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Prélèvement dirigeant(s)</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.remunDir)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Charges sociales dirigeant(s)</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.chargesSocDir)}</td>)}
                </tr>
                <tr className="bg-slate-300 font-black">
                   <td className="border-2 border-black p-1 uppercase">Excédent brut d'exploitation</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ebe)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Frais bancaires, charges financières</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.chargesFin)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Dotations aux amortissements</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.dotAmort)}</td>)}
                </tr>
                <tr className="bg-slate-100 font-bold">
                   <td className="border-2 border-black p-1">Résultat avant impôts</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.resAvantImpots)}</td>)}
                </tr>
                <tr className="bg-black text-white font-black">
                   <td className="border-2 border-white p-1 uppercase">Résultat net comptable</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-white p-1 text-right font-mono">{formatVal(d.netResult)}</td>)}
                </tr>
             </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-auto">4</p>
        </div>

        {/* PAGE 6 : SOLDES INTERMEDIAIRES DE GESTION & CAF */}
        <div className="page-break p-12 min-h-screen">
          <div className="border-4 border-black p-4 mb-6 text-center">
             <h2 className="text-2xl font-bold uppercase">Soldes intermédiaires de gestion</h2>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[8px] mb-10">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-1 text-left">Rubriques</th>
                   {years.map(y => <th key={y} colSpan={2} className="border-2 border-black p-1 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr>
                   <td className="border-2 border-black p-1 font-bold">Chiffre d'affaires</td>
                   {financialData.map(d => (
                      <React.Fragment key={d.year}>
                         <td className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td>
                         <td className="border-2 border-black p-1 text-center font-mono">100%</td>
                      </React.Fragment>
                   ))}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Achats consommés</td>
                   {financialData.map(d => (
                      <React.Fragment key={d.year}>
                         <td className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods)}</td>
                         <td className="border-2 border-black p-1 text-center font-mono">{Math.round((d.costOfGoods/d.ca)*100)}%</td>
                      </React.Fragment>
                   ))}
                </tr>
                <tr className="bg-slate-100 font-bold">
                   <td className="border-2 border-black p-1">Valeur ajoutée</td>
                   {financialData.map(d => (
                      <React.Fragment key={d.year}>
                         <td className="border-2 border-black p-1 text-right font-mono">{formatVal(d.va)}</td>
                         <td className="border-2 border-black p-1 text-center font-mono">{Math.round((d.va/d.ca)*100)}%</td>
                      </React.Fragment>
                   ))}
                </tr>
                <tr className="bg-slate-200 font-black">
                   <td className="border-2 border-black p-1 uppercase">E.B.E.</td>
                   {financialData.map(d => (
                      <React.Fragment key={d.year}>
                         <td className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ebe)}</td>
                         <td className="border-2 border-black p-1 text-center font-mono">{Math.round((d.ebe/d.ca)*100)}%</td>
                      </React.Fragment>
                   ))}
                </tr>
                <tr className="bg-black text-white font-black">
                   <td className="border-2 border-white p-1 uppercase">Capacité autofinancement</td>
                   {financialData.map(d => (
                      <React.Fragment key={d.year}>
                         <td className="border-2 border-white p-1 text-right font-mono">{formatVal(d.caf)}</td>
                         <td className="border-2 border-white p-1 text-center font-mono">{Math.round((d.caf/d.ca)*100)}%</td>
                      </React.Fragment>
                   ))}
                </tr>
             </tbody>
          </table>

          <div className="border-4 border-black p-4 mb-6 text-center">
             <h2 className="text-2xl font-bold uppercase">Capacité d'autofinancement</h2>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[9px]">
             <thead>
                <tr className="bg-slate-100">
                   <th className="border-2 border-black p-2 text-left">Indicateurs</th>
                   {years.map(y => <th key={y} className="border-2 border-black p-2 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr>
                   <td className="border-2 border-black p-1">Résultat de l'exercice</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.netResult)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">+ Dotation amortissements</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.dotAmort)}</td>)}
                </tr>
                <tr className="bg-slate-100 font-bold">
                   <td className="border-2 border-black p-1">Capacité d'autofinancement</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono font-black">{formatVal(d.caf)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">- Remboursement emprunts</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">({formatVal(d.remboursementEmprunt)})</td>)}
                </tr>
                <tr className="bg-slate-200 font-black">
                   <td className="border-2 border-black p-1 uppercase">Autofinancement net</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono font-black">{formatVal(d.caf - d.remboursementEmprunt)}</td>)}
                </tr>
             </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-auto">5</p>
        </div>

        {/* PAGE 8 : SEUIL DE RENTABILITE & BFR */}
        <div className="page-break p-12 min-h-screen">
          <div className="border-4 border-black p-4 mb-10 text-center">
             <h2 className="text-2xl font-bold uppercase">Seuil de rentabilité économique</h2>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[9px] mb-12">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-2 text-left">Indicateurs</th>
                   {years.map(y => <th key={y} className="border-2 border-black p-2 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr>
                   <td className="border-2 border-black p-1 font-bold">Chiffre d'affaires HT</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.ca)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Achats consommés</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.costOfGoods)}</td>)}
                </tr>
                <tr className="bg-slate-100">
                   <td className="border-2 border-black p-1 font-bold">Marge sur coûts variables</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.margin)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 italic">Taux de marge sur coûts variables</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-center font-mono">{Math.round(d.tauxMarge * 100)}%</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Coûts fixes</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.fixedCosts + d.salairesEmp + d.remunDir + d.chargesSocDir + d.chargesSocEmp)}</td>)}
                </tr>
                <tr className="bg-black text-white font-black">
                   <td className="border-2 border-white p-2 uppercase">Seuil de rentabilité (CA)</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-white p-2 text-right font-mono font-black">{formatVal(d.seuilRentabilite)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Point mort (jours ouvrés)</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-center font-mono">{Math.round((d.seuilRentabilite/d.ca)*360) || '-'}</td>)}
                </tr>
             </tbody>
          </table>

          <div className="border-4 border-black p-4 mb-6 text-center">
             <h2 className="text-2xl font-bold uppercase">Besoin en fonds de roulement</h2>
          </div>

          <div className="mb-4 text-[10px] italic">Analyse clients / fournisseurs :</div>

          <table className="w-full border-collapse border-2 border-black text-[9px]">
             <thead>
                <tr className="bg-slate-100">
                   <th className="border-2 border-black p-2 text-left">Postes</th>
                   <th className="border-2 border-black p-2 text-center">Délai (j)</th>
                   {years.map(y => <th key={y} className="border-2 border-black p-2 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr>
                   <td className="border-2 border-black p-1 font-bold">Besoins (Crédit client HT)</td>
                   <td className="border-2 border-black p-1 text-center">{state.revenue.joursClients}</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.creditClient)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 font-bold">Ressources (Dettes fourniss. HT)</td>
                   <td className="border-2 border-black p-1 text-center">{state.revenue.joursFournisseurs}</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.detteFournisseur)}</td>)}
                </tr>
                <tr className="bg-slate-200 font-black">
                   <td className="border-2 border-black p-2 uppercase" colSpan={2}>Besoin en fonds de roulement</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-2 text-right font-mono font-black">{formatVal(d.bfr)}</td>)}
                </tr>
             </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-auto">6</p>
        </div>

        {/* PAGE 10 : PLAN DE FINANCEMENT A 5 ANS */}
        <div className="page-break p-12 min-h-screen">
          <div className="border-4 border-black p-4 mb-10 text-center">
             <h2 className="text-2xl font-bold uppercase">Plan de financement à cinq ans</h2>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[9px] mb-10">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-2 text-left">Besoins</th>
                   {years.map(y => <th key={y} className="border-2 border-black p-2 text-center">Année {y+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr>
                   <td className="border-2 border-black p-1">Investissements (Immobilisations)</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{d.year === 1 ? formatVal(totalInvestissement) : '-'}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Variation du BFR</td>
                   {financialData.map((d, i) => {
                      const prevBfr = i === 0 ? 0 : financialData[i-1].bfr;
                      const vBfr = d.bfr - prevBfr;
                      return <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(vBfr)}</td>
                   })}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Remboursement d'emprunts</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.remboursementEmprunt)}</td>)}
                </tr>
                <tr className="bg-slate-100 font-bold">
                   <td className="border-2 border-black p-2 uppercase">Total des besoins</td>
                   {financialData.map((d, i) => {
                      const prevBfr = i === 0 ? 0 : financialData[i-1].bfr;
                      const vBfr = d.bfr - prevBfr;
                      const totalB = (d.year === 1 ? totalInvestissement : 0) + vBfr + d.remboursementEmprunt;
                      return <td key={d.year} className="border-2 border-black p-2 text-right font-mono font-bold">{formatVal(totalB)}</td>
                   })}
                </tr>
                <tr className="bg-slate-200"><td colSpan={6} className="border-2 border-black p-1 font-bold text-center uppercase">Ressources</td></tr>
                <tr>
                   <td className="border-2 border-black p-1">Apports personnels & Emprunts initiaux</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{d.year === 1 ? formatVal(totalFinancement) : '-'}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1">Capacité d'autofinancement (CAF)</td>
                   {financialData.map(d => <td key={d.year} className="border-2 border-black p-1 text-right font-mono">{formatVal(d.caf)}</td>)}
                </tr>
                <tr className="bg-slate-100 font-bold">
                   <td className="border-2 border-black p-2 uppercase">Total des ressources</td>
                   {financialData.map(d => {
                      const totalR = (d.year === 1 ? totalFinancement : 0) + d.caf;
                      return <td key={d.year} className="border-2 border-black p-2 text-right font-mono font-bold">{formatVal(totalR)}</td>
                   })}
                </tr>
                <tr className="bg-black text-white font-black">
                   <td className="border-2 border-white p-2 uppercase">Excédent de trésorerie</td>
                   {financialData.map((d, i) => {
                      const totalR = (d.year === 1 ? totalFinancement : 0) + d.caf;
                      const prevBfr = i === 0 ? 0 : financialData[i-1].bfr;
                      const vBfr = d.bfr - prevBfr;
                      const totalB = (d.year === 1 ? totalInvestissement : 0) + vBfr + d.remboursementEmprunt;
                      return <td key={d.year} className="border-2 border-white p-2 text-right font-mono font-black">{formatVal(totalR - totalB)}</td>
                   })}
                </tr>
             </tbody>
          </table>
          <p className="text-[10px] italic">Rappel trésorerie début année 1 : 0 FCFA</p>
          <p className="text-right w-full text-xs font-bold mt-auto">7</p>
        </div>

        {/* PAGE 11 : BUDGET TRESORERIE MENSUEL */}
        <div className="page-break p-12 min-h-screen">
          <div className="border-4 border-black p-4 mb-10 text-center">
             <h2 className="text-2xl font-bold uppercase">Budget prévisionnel de trésorerie</h2>
          </div>

          <p className="mb-4 font-bold text-sm">Première année</p>

          <table className="w-full border-collapse border-2 border-black text-[7px]">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-1 text-left w-1/4">RUBRIQUES</th>
                   {months.slice(0, 6).map(m => <th key={m} className="border-2 border-black p-1 text-center">Mois {m+1}</th>)}
                </tr>
             </thead>
             <tbody>
                <tr className="bg-slate-50"><td className="border-2 border-black p-1 font-bold" colSpan={7}>ENCAISSEMENTS</td></tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4">CA Mensuel</td>
                   {treasuryMonthly.slice(0, 6).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(t.ca)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4">Apport & Financement initial</td>
                   {treasuryMonthly.slice(0, 6).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(t.mois === 1 ? totalFinancement : 0)}</td>)}
                </tr>
                <tr className="bg-slate-100 font-bold">
                   <td className="border-2 border-black p-1">Total des encaissements</td>
                   {treasuryMonthly.slice(0, 6).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(t.totalEnc)}</td>)}
                </tr>
                <tr className="bg-slate-50"><td className="border-2 border-black p-1 font-bold" colSpan={7}>DECAISSEMENTS</td></tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4">Investissements</td>
                   {treasuryMonthly.slice(0, 6).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(t.mois === 1 ? totalInvestissement : 0)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4">Achats de marchandises</td>
                   {treasuryMonthly.slice(0, 6).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(t.ca * (state.revenue.tauxCoutMarchandises/100))}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4">Charges fixes mensuelles</td>
                   {treasuryMonthly.slice(0, 6).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(financialData[0].fixedCosts / 12)}</td>)}
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4">Salaires & Charges sociales</td>
                   {treasuryMonthly.slice(0, 6).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal((financialData[0].salairesEmp + financialData[0].remunDir + financialData[0].chargesSocDir + financialData[0].chargesSocEmp)/12)}</td>)}
                </tr>
                <tr className="bg-slate-100 font-bold">
                   <td className="border-2 border-black p-1">Total des décaissements</td>
                   {treasuryMonthly.slice(0, 6).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono font-bold">({formatVal(t.totalDec)})</td>)}
                </tr>
                <tr className="bg-slate-200 font-black">
                   <td className="border-2 border-black p-1 uppercase">Solde du mois</td>
                   {treasuryMonthly.slice(0, 6).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono font-black">{formatVal(t.solde)}</td>)}
                </tr>
                <tr className="bg-black text-white font-black">
                   <td className="border-2 border-white p-1 uppercase">Solde cumulé</td>
                   {treasuryMonthly.slice(0, 6).map(t => <td key={t.mois} className="border-2 border-white p-1 text-right font-mono font-black">{formatVal(t.cumul)}</td>)}
                </tr>
             </tbody>
          </table>
          <p className="text-[8px] mt-10">Ce tableau ne prend pas en compte les flux de TVA ni le besoin en fonds de roulement dans le détail mensuel.</p>
          <p className="text-right w-full text-xs font-bold mt-auto">8</p>
        </div>

        {/* PAGE 12 : BUDGET TRESORERIE MENSUEL (SUITE) */}
        <div className="page-break p-12 min-h-screen">
          <div className="border-4 border-black p-4 mb-10 text-center">
             <h2 className="text-2xl font-bold uppercase">Budget prévisionnel de trésorerie (suite)</h2>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[7px]">
             <thead>
                <tr className="bg-slate-200">
                   <th className="border-2 border-black p-1 text-left w-1/4">RUBRIQUES</th>
                   {months.slice(6, 12).map(m => <th key={m} className="border-2 border-black p-1 text-center">Mois {m+1}</th>)}
                   <th className="border-2 border-black p-1 text-center font-bold">TOTAL</th>
                </tr>
             </thead>
             <tbody>
                <tr className="bg-slate-50"><td className="border-2 border-black p-1 font-bold" colSpan={8}>ENCAISSEMENTS</td></tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4">CA Mensuel</td>
                   {treasuryMonthly.slice(6, 12).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(t.ca)}</td>)}
                   <td className="border-2 border-black p-1 text-right font-mono font-bold">{formatVal(financialData[0].ca)}</td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                   <td className="border-2 border-black p-1">Total des encaissements</td>
                   {treasuryMonthly.slice(6, 12).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(t.totalEnc)}</td>)}
                   <td className="border-2 border-black p-1 text-right font-mono font-bold">{formatVal(financialData[0].ca + totalFinancement)}</td>
                </tr>
                <tr className="bg-slate-50"><td className="border-2 border-black p-1 font-bold" colSpan={8}>DECAISSEMENTS</td></tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4">Achats de marchandises</td>
                   {treasuryMonthly.slice(6, 12).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(t.ca * (state.revenue.tauxCoutMarchandises/100))}</td>)}
                   <td className="border-2 border-black p-1 text-right font-mono">{formatVal(financialData[0].costOfGoods)}</td>
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4">Charges fixes</td>
                   {treasuryMonthly.slice(6, 12).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal(financialData[0].fixedCosts / 12)}</td>)}
                   <td className="border-2 border-black p-1 text-right font-mono">{formatVal(financialData[0].fixedCosts)}</td>
                </tr>
                <tr>
                   <td className="border-2 border-black p-1 pl-4">Salaires & Charges</td>
                   {treasuryMonthly.slice(6, 12).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono">{formatVal((financialData[0].salairesEmp + financialData[0].remunDir + financialData[0].chargesSocDir + financialData[0].chargesSocEmp)/12)}</td>)}
                   <td className="border-2 border-black p-1 text-right font-mono">{formatVal(financialData[0].salairesEmp + financialData[0].remunDir + financialData[0].chargesSocDir + financialData[0].chargesSocEmp)}</td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                   <td className="border-2 border-black p-1">Total des décaissements</td>
                   {treasuryMonthly.slice(6, 12).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono font-bold">({formatVal(t.totalDec)})</td>)}
                   <td className="border-2 border-black p-1 text-right font-mono font-bold">({formatVal(financialData[0].costOfGoods + financialData[0].fixedCosts + financialData[0].salairesEmp + financialData[0].remunDir + financialData[0].chargesSocDir + financialData[0].chargesSocEmp + totalInvestissement)})</td>
                </tr>
                <tr className="bg-slate-200 font-black">
                   <td className="border-2 border-black p-1 uppercase">Solde du mois</td>
                   {treasuryMonthly.slice(6, 12).map(t => <td key={t.mois} className="border-2 border-black p-1 text-right font-mono font-black">{formatVal(t.solde)}</td>)}
                   <td className="border-2 border-black p-1 text-right font-mono font-black">{formatVal(treasuryMonthly[11].solde)}</td>
                </tr>
                <tr className="bg-black text-white font-black">
                   <td className="border-2 border-white p-1 uppercase">Solde cumulé</td>
                   {treasuryMonthly.slice(6, 12).map(t => <td key={t.mois} className="border-2 border-white p-1 text-right font-mono font-black">{formatVal(t.cumul)}</td>)}
                   <td className="border-2 border-white p-1 text-right font-mono font-black">{formatVal(treasuryMonthly[11].cumul)}</td>
                </tr>
             </tbody>
          </table>
          <p className="text-right w-full text-xs font-bold mt-auto">9</p>
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

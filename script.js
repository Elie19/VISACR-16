// ===== RÉINITIALISER TOUTES LES DONNÉES SAISIES =====
function clearAllData() {
    if (confirm("⚠️ Attention !\n\nVous allez effacer toutes les données saisies dans les formulaires (étapes 1 à 5).\n\nLe site, le footer et les styles resteront intacts.\n\nVoulez-vous continuer ?")) {
        localStorage.clear();
        sessionStorage.clear();
        alert("✅ Toutes vos données ont été réinitialisées.");
        location.reload();
    }
}

// ===== FONCTION DE SAUVEGARDE AMÉLIORÉE =====
function saveForm(formId, key) {
    const form = document.getElementById(formId);
    if (!form) return;
    const data = {};
    const inputs = form.querySelectorAll('input:not([type="radio"]), select, textarea');
    inputs.forEach(input => {
        if (input.type === 'checkbox') data[input.id] = input.checked;
        else data[input.id] = input.value;
    });
    const radios = form.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        if (radio.checked) data[radio.name] = radio.value;
    });
    localStorage.setItem(`financeStart_${key}`, JSON.stringify(data));
}

// ===== FONCTION D'AFFICHAGE DE DEVISE =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('XOF', 'FCFA');
}

// ===== CHARGEMENT DES DONNÉES =====
function loadAllData() {
    const keys = ['generalInfo', 'besoins', 'financement', 'charges', 'chiffreAffaires'];
    keys.forEach(key => {
        const data = localStorage.getItem(`financeStart_${key}`);
        if (data) {
            const obj = JSON.parse(data);
            Object.keys(obj).forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (el.type === 'checkbox') {
                        el.checked = obj[id];
                        if (el.checked) el.dispatchEvent(new Event('change'));
                    } else if (el.type === 'radio') {
                        if (el.value === obj[el.name]) {
                            el.checked = true;
                            el.dispatchEvent(new Event('change'));
                        }
                    } else {
                        el.value = obj[id];
                    }
                }
            });
        }
    });

    // ✅ Mettre à jour le total besoins dans la page de financement
    if (document.getElementById('totalBesoinsFinancement')) {
        calculerTotalBesoins();
    }
}

// ===== CALCULS EXISTANTS (besoins, financement, charges) =====
function calculerTotalBesoins() {
    let total = 0;
    const ids = [
        'frais-etablissement', 'frais-compteurs', 'logiciels-formations', 'droits-entrees',
        'achat-fonds-commerce', 'depot-marque', 'droit-bail', 'caution', 'frais-dossier',
        'frais-notaire', 'enseigne-communication', 'achat-immobilier', 'travaux-amenagement',
        'materiel', 'materiel-bureau', 'stock', 'tresorerie-depart'
    ];
    ids.forEach(id => {
        const cb = document.getElementById(id);
        if (cb && cb.checked) {
            const input = document.getElementById(`montant-${id}`);
            if (input) total += parseFloat(input.value) || 0;
        }
    });
    const autres = document.getElementById('autres-depenses');
    if (autres && autres.checked) {
        const input = document.getElementById('montant-autres-depenses');
        if (input) total += parseFloat(input.value) || 0;
    }
    const formatted = formatCurrency(total);
    document.getElementById('totalBesoinsDemarrage').textContent = formatted;
    document.getElementById('totalBesoinsFinancement').textContent = formatted;
}

function calculerEquilibreFinancement() {
    const besoinsText = document.getElementById('totalBesoinsFinancement').textContent;
    const besoins = parseFloat(besoinsText.replace(/FCFA| |[^\d.-]/g, '')) || 0;
    let financement = 0;
    ['apport-personnel', 'apports-nature'].forEach(id => {
        financement += parseFloat(document.getElementById(id)?.value || 0);
    });
    for (let i = 1; i <= 10; i++) {
        financement += parseFloat(document.getElementById(`montant-pret${i}`)?.value || 0);
    }
    for (let i = 1; i <= 5; i++) {
        financement += parseFloat(document.getElementById(`montant-subvention${i}`)?.value || 0);
    }
    for (let i = 1; i <= 5; i++) {
        financement += parseFloat(document.getElementById(`montant-autre-financement${i}`)?.value || 0);
    }

    const eq = financement - besoins;
    const eqEl = document.getElementById('equilibreFinancement');
    if (eq > 0) {
        eqEl.textContent = `EXCÉDENT: ${formatCurrency(Math.abs(eq))}`;
        eqEl.className = 'balance-result positive';
    } else if (eq < 0) {
        eqEl.textContent = `DÉFICIT: ${formatCurrency(Math.abs(eq))}`;
        eqEl.className = 'balance-result negative';
    } else {
        eqEl.textContent = 'ÉQUILIBRE: 0 FCFA';
        eqEl.className = 'balance-result';
    }
    document.getElementById('totalFinancementProjet').textContent = formatCurrency(financement);
}

function calculerTotalCharges() {
    const annees = [1,2,3,4,5];
    const charges = ['assurances','telephone','abonnements','carburant','deplacement','energie','autorites','fournitures','entretien','nettoyage','publicite','loyer','expert','bancaires','taxes'];
    annees.forEach(annee => {
        let total = 0;
        charges.forEach(c => {
            total += parseFloat(document.getElementById(`${c}-a${annee}`)?.value || 0);
        });
        for (let i = 1; i <= 10; i++) {
            total += parseFloat(document.getElementById(`autre${i}-a${annee}`)?.value || 0);
        }
        document.getElementById(`total-annee${annee}`).textContent = formatCurrency(total);
    });
}

// ===== AJOUTS DYNAMIQUES =====
let pretCounter = 4;
let subventionCounter = 3;
let autreCounter = 2;
let chargeCounter = 4;
let produitCounter = 2;

function initAjoutsFinancement() {
    document.getElementById('btn-ajouter-pret')?.addEventListener('click', () => {
        const tbody = document.querySelector('#financementForm table tbody');
        const lastStaticRow = tbody.querySelector('tr:nth-last-child(4)');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>
                <div class="financement-label">
                    <i class="fas fa-university" aria-hidden="true"></i>
                    <div>
                        <span>Prêt n°${pretCounter}</span>
                        <input type="text" name="banque-pret${pretCounter}" placeholder="Nom de la banque" class="bank-name">
                    </div>
                </div>
            </td>
            <td><input type="number" name="montant-pret${pretCounter}" placeholder="0" min="0" step="1000"></td>
            <td><input type="number" name="taux-pret${pretCounter}" placeholder="3.0" min="0" max="100" step="0.1" value="3.0"></td>
            <td>
                <select name="duree-pret${pretCounter}">
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="36" selected>36</option>
                    <option value="48">48</option>
                    <option value="60">60</option>
                    <option value="72">72</option>
                    <option value="84">84</option>
                    <option value="96">96</option>
                    <option value="108">108</option>
                    <option value="120">120</option>
                </select>
            </td>
        `;
        tbody.insertBefore(newRow, lastStaticRow);
        pretCounter++;
    });

    document.getElementById('btn-ajouter-subvention')?.addEventListener('click', () => {
        const tbody = document.querySelector('#financementForm table tbody');
        const lastStaticRow = tbody.querySelector('tr:nth-last-child(3)');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>
                <div class="financement-label">
                    <i class="fas fa-gift" aria-hidden="true"></i>
                    <div>
                        <span>Subvention n°${subventionCounter}</span>
                        <input type="text" name="source-subvention${subventionCounter}" placeholder="Source" class="bank-name">
                    </div>
                </div>
            </td>
            <td><input type="number" name="montant-subvention${subventionCounter}" placeholder="0" min="0" step="1000"></td>
            <td>-</td>
            <td>-</td>
        `;
        tbody.insertBefore(newRow, lastStaticRow);
        subventionCounter++;
    });

    document.getElementById('btn-ajouter-autre')?.addEventListener('click', () => {
        const tbody = document.querySelector('#financementForm table tbody');
        const lastStaticRow = tbody.querySelector('tr:nth-last-child(2)');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>
                <div class="financement-label">
                    <i class="fas fa-money-bill-wave" aria-hidden="true"></i>
                    <div>
                        <span>Autre financement</span>
                        <input type="text" name="source-autre-financement${autreCounter}" placeholder="Source" class="bank-name">
                    </div>
                </div>
            </td>
            <td><input type="number" name="montant-autre-financement${autreCounter}" placeholder="0" min="0" step="1000"></td>
            <td>-</td>
            <td>-</td>
        `;
        tbody.insertBefore(newRow, lastStaticRow);
        autreCounter++;
    });
}

function initAjoutsCharges() {
    document.getElementById('btn-ajouter-charge')?.addEventListener('click', () => {
        const tbody = document.querySelector('#chargesForm table tbody');
        const totalRow = document.querySelector('.total-row');
        const newRow = document.createElement('tr');
        newRow.className = 'other-charge';
        newRow.innerHTML = `
            <td>
                <input type="text" name="libelle-autre${chargeCounter}" placeholder="Libellé autre charge ${chargeCounter}" class="charge-label-input">
            </td>
            <td><input type="number" name="autre${chargeCounter}-a1" placeholder="0" min="0" step="1000"></td>
            <td><input type="number" name="autre${chargeCounter}-a2" placeholder="0" min="0" step="1000"></td>
            <td><input type="number" name="autre${chargeCounter}-a3" placeholder="0" min="0" step="1000"></td>
            <td><input type="number" name="autre${chargeCounter}-a4" placeholder="0" min="0" step="1000"></td>
            <td><input type="number" name="autre${chargeCounter}-a5" placeholder="0" min="0" step="1000"></td>
        `;
        tbody.insertBefore(newRow, totalRow);
        chargeCounter++;
    });
}

// ===== GESTION PRODUITS (SIMPLIFIÉE) =====
function initProduits() {
    document.getElementById('btn-ajouter-produit')?.addEventListener('click', () => {
        const tbody = document.getElementById('produitsBody');
        const newRow = document.createElement('tr');
        newRow.className = 'produit-row';
        newRow.innerHTML = `
            <td><input type="text" name="produit-nom-${produitCounter}" placeholder="Ex: Produit ou service"></td>
            <td><input type="number" name="produit-prix-${produitCounter}" placeholder="0" min="0" step="100"></td>
            <td><input type="number" name="produit-cout-${produitCounter}" placeholder="0" min="0" step="100"></td>
        `;
        tbody.appendChild(newRow);
        produitCounter++;
    });
}

// ===== ANALYSE DE RENTABILITÉ =====
function analyserRentabilite() {
    let caTotal = 0;
    for (let i = 1; i <= 12; i++) {
        caTotal += parseFloat(document.getElementById(`ca-a1-m${i}`)?.value || 0);
    }

    const tauxCout = parseFloat(document.getElementById('taux-cout-marchandises')?.value || 50) / 100;
    const coutMarchandises = caTotal * tauxCout;

    let chargesFixes = 0;
    const charges = ['assurances','telephone','abonnements','carburant','deplacement','energie','autorites','fournitures','entretien','nettoyage','publicite','loyer','expert','bancaires','taxes'];
    charges.forEach(c => {
        chargesFixes += parseFloat(document.getElementById(`${c}-a1`)?.value || 0);
    });
    for (let i = 1; i <= 10; i++) {
        chargesFixes += parseFloat(document.getElementById(`autre${i}-a1`)?.value || 0);
    }

    const salairesEmp = parseFloat(document.getElementById('salaire-emp-a1')?.value || 0);
    const remunDir = parseFloat(document.getElementById('remun-dir-a1')?.value || 0);

    const accre = document.querySelector('input[name="accre"]:checked')?.value || 'Non';
    const tauxDir = accre === 'Oui' ? 0.10 : 0.45;
    const chargesSocialesDir = remunDir * tauxDir;

    const margeBrute = caTotal - coutMarchandises;
    const chargesTotales = chargesFixes + salairesEmp + remunDir + chargesSocialesDir;
    const rentable = margeBrute >= chargesTotales;

    const joursClients = parseFloat(document.getElementById('jours-clients')?.value || 30);
    const joursFournisseurs = parseFloat(document.getElementById('jours-fournisseurs')?.value || 30);
    const bfr = (caTotal * joursClients - coutMarchandises * joursFournisseurs) / 360;
    const tresorerieDepart = parseFloat(document.getElementById('tresorerie-depart')?.value || 0);
    const tresorerieAdequate = tresorerieDepart >= bfr;

    document.getElementById('rentabilite-result').textContent = rentable ? '✅ Rentable' : '❌ Non rentable';
    document.getElementById('tresorerie-result').textContent = tresorerieAdequate ? '✅ Adéquate' : '⚠️ Insuffisante';

    const message = document.getElementById('message-conseil');
    if (rentable && tresorerieAdequate) {
        message.textContent = 'Félicitations ! Votre projet est rentable et bien financé.';
        message.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
        message.style.color = '#28a745';
    } else {
        message.textContent = '⚠️ Veuillez améliorer vos chiffres !';
        message.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
        message.style.color = '#dc3545';
    }

    document.getElementById('analyse-resultat').style.display = 'block';
}

// ===== INITIALISATION COMPLÈTE =====
document.addEventListener('DOMContentLoaded', function() {
    // Navigation etape 1 → 2
    document.getElementById('btn-suivant-1')?.addEventListener('click', () => {
        saveForm('generalInfoForm', 'generalInfo');
        window.location.href = 'etape2-besoins-demarrage.html';
    });
    document.getElementById('btn-precedent-2')?.addEventListener('click', () => {
        window.location.href = 'etape1-informations-generales.html';
    });

    // Étape 2 → 3
    document.getElementById('btn-suivant-2')?.addEventListener('click', () => {
        saveForm('besoinsForm', 'besoins');
        window.location.href = 'etape3-financement.html';
    });
    document.getElementById('btn-precedent-3')?.addEventListener('click', () => {
        saveForm('besoinsForm', 'besoins');
        window.location.href = 'etape2-besoins-demarrage.html';
    });

    // Étape 3 → 4
    document.getElementById('btn-suivant-3')?.addEventListener('click', () => {
        saveForm('financementForm', 'financement');
        window.location.href = 'etape4-charges-fixes.html';
    });
    document.getElementById('btn-precedent-3')?.addEventListener('click', () => {
        saveForm('financementForm', 'financement');
        window.location.href = 'etape2-besoins-demarrage.html';
    });

    // Étape 4 → 5
    document.getElementById('btn-precedent-4')?.addEventListener('click', () => {
        saveForm('financementForm', 'financement');
        window.location.href = 'etape3-financement.html';
    });
    document.getElementById('btn-suivant-4')?.addEventListener('click', () => {
        saveForm('chargesForm', 'charges');
        window.location.href = 'etape5-chiffre-affaires.html';
    });

    // Étape 5 → ÉTAPE 6
    document.getElementById('btn-precedent-5')?.addEventListener('click', () => {
        saveForm('chargesForm', 'charges');
        window.location.href = 'etape4-charges-fixes.html';
    });

    // ✅ BOUTON "VOIR LE PLAN À IMPRIMER" → REDIRIGE VERS ÉTAPE 6
    document.getElementById('btn-vue-plan')?.addEventListener('click', () => {
        saveForm('caForm', 'chiffreAffaires');
        window.location.href = 'etape6-plan-financier.html';
    });

    // Modes CA
    const modeRadios = document.querySelectorAll('input[name="ca-mode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            document.getElementById('mode1-section').style.display = this.value === 'mode1' ? 'block' : 'none';
            document.getElementById('mode2-section').style.display = this.value === 'mode2' ? 'block' : 'none';
        });
    });

    // Calcul CA
    document.getElementById('btn-calculer-ca')?.addEventListener('click', function () {
        let annee1 = [];
        for (let i = 1; i <= 12; i++) {
            const val = parseFloat(document.getElementById(`ca-a1-m${i}`)?.value) || 0;
            annee1.push(val);
        }

        const t1 = parseFloat(document.getElementById('taux-a1-a2')?.value) || 0;
        const t2 = parseFloat(document.getElementById('taux-a2-a3')?.value) || 0;
        const t3 = parseFloat(document.getElementById('taux-a3-a4')?.value) || 0;
        const t4 = parseFloat(document.getElementById('taux-a4-a5')?.value) || 0;

        const total1 = annee1.reduce((a, b) => a + b, 0);
        const total2 = total1 * (1 + t1 / 100);
        const total3 = total2 * (1 + t2 / 100);
        const total4 = total3 * (1 + t3 / 100);
        const total5 = total4 * (1 + t4 / 100);

        const mois2 = total2 / 12;
        const mois3 = total3 / 12;
        const mois4 = total4 / 12;
        const mois5 = total5 / 12;

        const inputs = [
            { id: 'ca-a2-m', value: mois2 },
            { id: 'ca-a3-m', value: mois3 },
            { id: 'ca-a4-m', value: mois4 },
            { id: 'ca-a5-m', value: mois5 }
        ];

        inputs.forEach(({ id, value }) => {
            for (let i = 1; i <= 12; i++) {
                const el = document.getElementById(`${id}${i}-manual`);
                if (el) el.value = Math.round(value);
            }
        });

        let preview = document.getElementById('ca-result-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'ca-result-preview';
            preview.style.marginTop = '20px';
            preview.style.padding = '15px';
            preview.style.backgroundColor = 'var(--bg-tertiary)';
            preview.style.borderRadius = '8px';
            preview.style.border = '1px solid var(--border-color)';
            const form = document.getElementById('caForm');
            form.appendChild(preview);
        }
        preview.innerHTML = `<p style="color:var(--success-color); margin:0;"><strong>✅ Calcul terminé :</strong> Années 2 à 5 remplies automatiquement.</p>`;

        document.querySelector('input[value="mode2"]').checked = true;
        document.getElementById('mode1-section').style.display = 'none';
        document.getElementById('mode2-section').style.display = 'block';
    });

    // Chargement + autres
    loadAllData();
    document.getElementById('calculerBesoinsBtn')?.addEventListener('click', calculerTotalBesoins);
    document.getElementById('calculerFinancementBtn')?.addEventListener('click', calculerEquilibreFinancement);
    document.getElementById('calculerChargesBtn')?.addEventListener('click', calculerTotalCharges);

    document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function() {
            const details = this.closest('.checklist-item').querySelector('.checklist-details');
            if (this.checked) {
                details.style.display = 'grid';
            } else {
                details.style.display = 'none';
                details.querySelectorAll('input, textarea').forEach(el => el.value = '');
            }
        });
    });

    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.main-header')) {
                mainNav.classList.remove('active');
            }
        });
    }

    initAjoutsFinancement();
    initAjoutsCharges();
    initProduits();
    document.getElementById('btn-analyser')?.addEventListener('click', analyserRentabilite);
    document.getElementById('btn-reinitialiser-page')?.addEventListener('click', clearAllData);
});
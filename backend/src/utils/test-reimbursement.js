const { calculateReimbursement } = require('./calculateReimbursement');

const tests = [
    {
        name: "Consultation Généraliste (C1)",
        input: { acte: "Consultation", cote: "C1", honoraires: 50 },
        expected: 35
    },
    {
        name: "Consultation Spécialiste (C2)",
        input: { acte: "Consultation", cote: "C2", honoraires: 60 },
        expected: 45
    },
    {
        name: "Consultation Agrégé (C3)",
        input: { acte: "Consultation", cote: "C3", honoraires: 80 },
        expected: 50
    },
    {
        name: "Pharmacie Standard (90%)",
        input: { acte: "Pharmacie", honoraires: 100 },
        expected: 90
    },
    {
        name: "Pharmacie Vitamines (90% - Bien-être)",
        input: { acte: "Vitamines", honoraires: 50 },
        expected: 45
    },
    {
        name: "Analyses avec coefficient (B 20)",
        input: { acte: "Analyse", code_acte: "B20", honoraires: 100 },
        expected: 6 // 20 * 0.300
    },
    {
        name: "Chirurgie avec coefficient (KC 100)",
        input: { acte: "Chirurgie", code_acte: "KC100", honoraires: 2000 },
        expected: 900 // 100 * 9.000
    },
    {
        name: "Chirurgie sans coefficient (90%)",
        input: { acte: "Chirurgie", honoraires: 1000 },
        expected: 900
    },
    {
        name: "Optique - Monture (Plafond 250)",
        input: { acte: "Optique Monture", honoraires: 400 },
        expected: 250
    },
    {
        name: "Optique - Verres (90% de 100)",
        input: { acte: "Optique Verre", honoraires: 100 },
        expected: 90
    },
    {
        name: "Accouchement simple (Forfait 500)",
        input: { acte: "Accouchement simple", honoraires: 2000 },
        expected: 500
    },
    {
        name: "Accouchement Gémellaire (Forfait 600)",
        input: { acte: "Accouchement Gémellaire", honoraires: 2500 },
        expected: 600
    },
    {
        name: "Stérilité (Forfait 1500)",
        input: { acte: "Traitement Stérilité", honoraires: 3000 },
        expected: 1500
    },
    {
        name: "Hospitalisation Clinique (Max honoraires)",
        input: { acte: "Clinique", honoraires: 100 },
        expected: 100 // rules.hospitalisation.clinique is 110, but honoraires is 100
    },
    {
        name: "Hospitalisation Clinique (Max plafond)",
        input: { acte: "Clinique", honoraires: 500 },
        expected: 110
    }
];

console.log("--- Début des tests de remboursement 2026 ---\n");

let passed = 0;
tests.forEach(t => {
    const result = calculateReimbursement(t.input);
    const isOk = result === t.expected;
    if (isOk) {
        passed++;
        console.log(`✅ [PASS] ${t.name}`);
    } else {
        console.log(`❌ [FAIL] ${t.name}`);
        console.log(`   Input: ${JSON.stringify(t.input)}`);
        console.log(`   Expected: ${t.expected}, Got: ${result}`);
    }
});

console.log(`\n--- Résultat final : ${passed}/${tests.length} tests réussis ---`);

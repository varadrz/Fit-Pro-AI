import { analyzeFoodLocal } from './ai-engine.js';

// Register DataLabels plugin globally
Chart.register(ChartDataLabels);

const analyzeBtn = document.querySelector("#analyze-btn");
const foodInput = document.querySelector("#food-input");
const riskContainer = document.querySelector("#risk-summary-container");
const supplementsContainer = document.querySelector("#supplements-container");
const clinicalResultsCard = document.querySelector("#clinical-results-card");
const quickPills = document.querySelectorAll(".quick-meal-pill");

// Persistence Key
const METABOLIC_LOG_KEY = 'vitality_daily_log';

class LogManager {
    static getLog() {
        const today = new Date().toLocaleDateString();
        const storedDate = localStorage.getItem('vitality_log_date');
        
        // Reset if date changed (Midnight logic)
        if (storedDate && storedDate !== today) {
            this.clear();
        }
        
        localStorage.setItem('vitality_log_date', today);
        const raw = localStorage.getItem(METABOLIC_LOG_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    static saveLog(log) {
        localStorage.setItem(METABOLIC_LOG_KEY, JSON.stringify(log));
    }

    static addEntry(entry) {
        const log = this.getLog();
        const newEntry = { 
            ...entry, 
            id: Date.now(), 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        log.push(newEntry);
        this.saveLog(log);
        return log;
    }

    static removeEntry(id) {
        const log = this.getLog().filter(e => e.id !== id);
        this.saveLog(log);
        return log;
    }

    static clear() {
        localStorage.removeItem(METABOLIC_LOG_KEY);
        localStorage.removeItem('vitality_log_date');
        return [];
    }
}

let lastAnalysis = null;

quickPills.forEach(p => {
    p.addEventListener('click', () => {
        foodInput.value = p.innerText;
        // Visual feedback for selection
        p.style.borderColor = "var(--apple-blue)";
        p.style.background = "rgba(0, 113, 227, 0.1)";
        setTimeout(() => {
            p.style.borderColor = "";
            p.style.background = "";
        }, 300);
    });
});

function parseMealInput(text) {
    const items = text.split(',').map(item => {
        const parts = item.trim().split(' ');
        let quantity = 1;
        let unit = 'piece';
        let food = item.trim();

        if (parts.length > 1) {
            const first = parts[0].toLowerCase();
            if (!isNaN(first)) {
                quantity = parseFloat(first);
                food = parts.slice(1).join(' ');
            } else if (first === 'half') {
                quantity = 0.5;
                food = parts.slice(1).join(' ');
            }
            
            const units = ['bowl', 'cup', 'glass', 'plate', 'gram', 'g', 'ml'];
            if (parts.length > 2 && units.includes(parts[1].toLowerCase())) {
                unit = parts[1].toLowerCase();
                food = parts.slice(2).join(' ');
            }
        }
        return { food, quantity, unit };
    });
    return items;
}

// BMI & Macro Comparison Logic
const weightInput = document.querySelector("#weight");
const heightInput = document.querySelector("#height");
const ageInput = document.querySelector("#age");
const sexInput = document.querySelector("#sex");
const lifestyleInput = document.querySelector("#lifestyle");
const bmiDisplay = document.querySelector("#bmi-display");

let targetChart = null;
let actualChart = null;

function calculateDailyMacros() {
    const w = parseFloat(weightInput.value);
    const h = parseFloat(heightInput.value);
    const a = parseFloat(ageInput.value);
    const s = sexInput.value;
    const l = lifestyleInput.value;

    if (!w || !h || !a) return null;

    // BMR (Mifflin-St Jeor)
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = (s === 'male') ? bmr + 5 : bmr - 161;

    // Activity Multiplier
    const multi = { sedentary: 1.2, moderate: 1.55, active: 1.725 };
    const tdee = bmr * (multi[l] || 1.2);

    // Target Split (Balanced: 25% P, 30% F, 45% C)
    return {
        calories: Math.round(tdee),
        protein: Math.round((tdee * 0.25) / 4),
        fats: Math.round((tdee * 0.30) / 9),
        carbs: Math.round((tdee * 0.45) / 4)
    };
}

function initCharts(targetData, actualData = null) {
    const ctxT = document.getElementById('targetChart').getContext('2d');
    const ctxA = document.getElementById('actualChart').getContext('2d');

    const commonOptions = {
        responsive: true,
        plugins: { 
            legend: { display: false },
            datalabels: {
                color: '#fff',
                font: { weight: 'bold', size: 10 },
                formatter: (value, ctx) => {
                    const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                    if (total < 1) return '';
                    const pct = Math.round((value / total) * 100);
                    return pct > 5 ? `${pct}%` : '';
                }
            }
        },
        cutout: '65%',
        animation: { animateRotate: true, animateScale: true }
    };

    const vibrantColors = ['#06b6d4', '#f59e0b', '#f43f5e']; // Cyan, Amber, Rose

    if (targetChart) targetChart.destroy();
    targetChart = new Chart(ctxT, {
        type: 'doughnut',
        data: {
            labels: ['Protein', 'Carbohydrates', 'Fats'],
            datasets: [{
                data: [targetData.protein * 4, targetData.carbs * 4, targetData.fats * 9],
                backgroundColor: vibrantColors,
                borderWidth: 0
            }]
        },
        options: commonOptions
    });

    if (actualChart) actualChart.destroy();
    actualChart = new Chart(ctxA, {
        type: 'doughnut',
        data: {
            labels: ['Protein', 'Carbohydrates', 'Fats'],
            datasets: [{
                data: actualData ? [actualData.protein * 4, actualData.carbs * 4, actualData.fats * 9] : [0.1, 0.1, 0.1],
                backgroundColor: vibrantColors,
                borderWidth: 0
            }]
        },
        options: commonOptions
    });
}

function refreshMetabolics() {
    // 1. BMI
    const w = parseFloat(weightInput.value);
    const h = parseFloat(heightInput.value) / 100;
    if (w > 0 && h > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        let status = "Normal";
        let color = "#34c759";
        if (bmi < 18.5) { status = "Underweight"; color = "#64d2ff"; }
        else if (bmi >= 25 && bmi < 30) { status = "Overweight"; color = "#ff9f0a"; }
        else if (bmi >= 30) { status = "Obese"; color = "#ff3b30"; }
        bmiDisplay.innerText = `BMI: ${bmi}`;
        bmiDisplay.style.color = color;
    }

    // 2. Target Charts
    const targets = calculateDailyMacros();
    if (targets) initCharts(targets);
}

[weightInput, heightInput, ageInput, sexInput, lifestyleInput].forEach(el => {
    el.addEventListener('input', refreshMetabolics);
});

function renderLedger() {
    const log = LogManager.getLog();
    const body = document.querySelector("#ledger-body");
    const totals = { cal: 0, prot: 0, carb: 0, fat: 0 };
    
    body.innerHTML = "";
    
    log.forEach(entry => {
        totals.cal += entry.calories || 0;
        totals.prot += entry.protein || 0;
        totals.carb += entry.carbs || 0;
        totals.fat += entry.fats || 0;

        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        row.innerHTML = `
            <td style="padding: 12px; opacity: 0.6;">${entry.timestamp}</td>
            <td style="padding: 12px; font-weight: 600;">${entry.food}</td>
            <td style="padding: 12px; text-align: right; opacity: 0.8;">${entry.quantity || 1}</td>
            <td style="padding: 12px; opacity: 0.6;">${entry.unit || 'pc'}</td>
            <td style="padding: 12px; text-align: right; font-weight: 700;">${entry.calories}</td>
            <td style="padding: 12px; text-align: right; color: var(--accent); font-weight: 700;">${entry.protein}g</td>
            <td style="padding: 12px; text-align: right;">${entry.carbs}g</td>
            <td style="padding: 12px; text-align: right;">${entry.fats}g</td>
            <td style="padding: 12px; text-align: center;">
                <button class="delete-entry-btn" data-id="${entry.id}" style="background: none; border: none; color: #ff3b30; cursor: pointer; padding: 5px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        `;
        body.appendChild(row);
    });

    // Update Totals Row
    document.getElementById('total-cals').innerText = Math.round(totals.cal);
    document.getElementById('total-prot').innerText = Math.round(totals.prot) + "g";
    document.getElementById('total-carbs').innerText = Math.round(totals.carb) + "g";
    document.getElementById('total-fats').innerText = Math.round(totals.fat) + "g";

    // Update Protein Progress
    const targets = calculateDailyMacros();
    if (targets) {
        const progress = Math.min((totals.prot / targets.protein) * 100, 100);
        document.getElementById('protein-progress-bar').style.width = progress + "%";
        const remaining = Math.max(targets.protein - totals.prot, 0);
        document.getElementById('protein-remaining').innerText = `${Math.round(remaining)}g REMAINING`;
    }

    // Add delete listeners
    document.querySelectorAll(".delete-entry-btn").forEach(btn => {
        btn.onclick = () => {
            LogManager.removeEntry(Number(btn.dataset.id));
            renderLedger();
        };
    });
}

// Initial
refreshMetabolics();
renderLedger();

// Clear Ledger
document.querySelector("#reset-day-btn").onclick = () => {
    if (confirm("Clear all entries for today?")) {
        LogManager.clear();
        renderLedger();
    }
};

// Add to Log Button
document.querySelector("#add-to-log-btn").onclick = () => {
    if (!lastAnalysis) return alert("Please analyze food first.");
    
    // We take the first item for simplicity in the table view if it was a combined input, 
    // or we could log the whole "raw" string. The user asked for "Food Item".
    const rawInput = foodInput.value;
    const items = parseMealInput(rawInput);
    
    LogManager.addEntry({
        food: items.map(i => i.food).join(", "),
        quantity: items[0].quantity,
        unit: items[0].unit,
        calories: lastAnalysis.calories,
        protein: lastAnalysis.protein,
        carbs: lastAnalysis.carbs,
        fats: lastAnalysis.fats
    });
    
    renderLedger();
    foodInput.value = "";
    lastAnalysis = null;
    alert("Logged successfully!");
};

analyzeBtn.addEventListener("click", async () => {
    const foodData = foodInput.value;
    const userProfile = {
        age: ageInput.value,
        weight_kg: weightInput.value,
        lifestyle: lifestyleInput.value,
        sex: sexInput.value
    };

    if (!foodData) return alert("Please type your meal.");

    const parsedLog = parseMealInput(foodData);

    analyzeBtn.disabled = true;
    analyzeBtn.innerText = "Analyzing Risk...";
    clinicalResultsCard.classList.add('pulse-loading');
    clinicalResultsCard.style.display = 'block'; // Ensure it's shown
    riskContainer.innerHTML = "<p style='text-align:center; opacity:0.6;'>Calculating metabolic impact...</p>";

    try {
        const data = await analyzeFoodLocal({ raw: foodData, parsed: parsedLog }, userProfile);

        if (data.error) {
            riskContainer.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
            return;
        }

        // Update Values
        document.getElementById('cal-val').innerText = data.calories + " kcal";
        document.getElementById('protein-val').innerText = data.protein + "g";
        document.getElementById('carbs-val').innerText = data.carbs + "g";
        document.getElementById('fats-val').innerText = data.fats + "g";
        
        // Progress Bars
        const targets = calculateDailyMacros();
        const calPct = targets ? Math.min((data.calories / targets.calories) * 100, 100) : 0;
        const protPct = targets ? Math.min((data.protein / targets.protein) * 100, 100) : 0;
        const carbPct = targets ? Math.min((data.carbs / targets.carbs) * 100, 100) : 0;
        const fatPct = targets ? Math.min((data.fats / targets.fats) * 100, 100) : 0;

        document.getElementById('cal-bar').style.width = calPct + "%";
        document.getElementById('prot-bar').style.width = protPct + "%";
        document.getElementById('carb-bar').style.width = carbPct + "%";
        document.getElementById('fat-bar').style.width = fatPct + "%";

        // Update Charts
        if (targets) initCharts(targets, data);

        const ps = document.getElementById('protein-status');
        ps.innerText = data.protein_status.toUpperCase();
        ps.style.color = data.protein_status === 'adequate' ? '#34c759' : '#ff9f0a';

        riskContainer.innerHTML = "";
        if (data.risk_summary) {
            data.risk_summary.forEach(r => {
                const dv = document.createElement('div');
                dv.className = 'risk-card';
                if(r.risk_level === 'high') dv.style.borderLeftColor = '#ff3b30';
                else if(r.risk_level === 'moderate') dv.style.borderLeftColor = '#ff9f0a';
                else dv.style.borderLeftColor = '#34c759';

                dv.innerHTML = `
                    <span class="risk-level ${r.risk_level}">${r.risk_level} Risk</span>
                    <strong>${r.condition}</strong>
                    <p style="font-size:0.8rem; color:var(--text-muted); opacity:0.8;">${r.reason}</p>
                `;
                riskContainer.appendChild(dv);
            });
        }

        supplementsContainer.innerHTML = "";
        if (data.supplements && data.supplements.length > 0) {
            supplementsContainer.innerHTML = "<h4 style='font-size:0.75rem; margin-bottom:10px; text-transform:uppercase; color:var(--text-muted);'>Recommended Support</h4>";
            data.supplements.forEach(s => {
                supplementsContainer.innerHTML += `<span style="display:inline-block; margin:4px; padding:6px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:100px; font-size:0.7rem; color:#fff; font-weight:500;">${s}</span>`;
            });
        }
        
        lastAnalysis = data; // Store for logging


    } catch (err) {
        console.error("Analysis failure:", err);
        riskContainer.innerHTML = "Analysis engine timed out.";
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerText = "Analyze Health Risks";
        clinicalResultsCard.classList.remove('pulse-loading');
    }
});



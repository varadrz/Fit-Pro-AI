const analyzeBtn = document.querySelector("#analyze-btn");
const foodInput = document.querySelector("#food-input");
const riskContainer = document.querySelector("#risk-summary-container");
const supplementsContainer = document.querySelector("#supplements-container");
const btnEx = document.querySelectorAll(".quick-meal-btn");

btnEx.forEach(b => {
    b.addEventListener('click', () => {
        foodInput.value = b.innerText;
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

analyzeBtn.addEventListener("click", async () => {
    const foodData = foodInput.value;
    const userProfile = {
        age: document.querySelector("#age").value,
        weight_kg: document.querySelector("#weight").value,
        lifestyle: document.querySelector("#lifestyle").value,
    };

    if (!foodData) return alert("Please type your meal.");

    const parsedLog = parseMealInput(foodData);

    analyzeBtn.disabled = true;
    analyzeBtn.innerText = "Analyzing Risk...";
    riskContainer.innerHTML = "<p>Connecting to AI...</p>";

    try {
        const response = await fetch("/api/analyze-food", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ foodData: JSON.stringify({ raw: foodData, parsed: parsedLog }), userProfile })
        });
        const data = await response.json();

        if (data.error) {
            riskContainer.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
            return;
        }

        document.getElementById('cal-val').innerText = data.calories + " kcal";
        document.getElementById('protein-val').innerText = data.protein + "g";
        const ps = document.getElementById('protein-status');
        ps.innerText = data.protein_status.toUpperCase();
        ps.style.color = data.protein_status === 'adequate' ? '#22c55e' : '#facc15';

        riskContainer.innerHTML = "";
        if (data.risk_summary) {
            data.risk_summary.forEach(r => {
                const dv = document.createElement('div');
                dv.className = 'risk-card';
                dv.innerHTML = `
                    <span class="risk-level ${r.risk_level}">${r.risk_level} Risk</span>
                    <strong>${r.condition}</strong>
                    <p style="font-size:0.8rem">${r.reason}</p>
                `;
                riskContainer.appendChild(dv);
            });
        }

        supplementsContainer.innerHTML = "";
        if (data.supplements && data.supplements.length > 0) {
            supplementsContainer.innerHTML = "<h4>Optional Supplements (Consult Doctor)</h4>";
            data.supplements.forEach(s => {
                supplementsContainer.innerHTML += `<span style="display:inline-block; margin:5px; padding:5px 10px; background:rgba(255,255,255,0.1); border-radius:5px; font-size:0.8rem;">${s}</span>`;
            });
        }

    } catch (err) {
        riskContainer.innerHTML = "Server connection failed.";
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerText = "Analyze Health Risks";
    }
});

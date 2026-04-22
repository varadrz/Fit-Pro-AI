import { analyzeFoodLocal } from './ai-engine.js';

const menuCache = {};
const restaurantData = [
    { id: 1, restaurant: "McDonald's", logo: "https://logo.clearbit.com/mcdonalds.com", tags: ["fast-food", "non-veg"] },
    { id: 2, restaurant: "Starbucks", logo: "https://logo.clearbit.com/starbucks.com", tags: ["cafe", "veg"] },
    { id: 3, restaurant: "Subway", logo: "https://logo.clearbit.com/subway.com", tags: ["healthy", "veg"] },
    { id: 4, restaurant: "KFC", logo: "https://logo.clearbit.com/kfc.com", tags: ["fast-food", "non-veg"] },
    { id: 5, restaurant: "Pizza Hut", logo: "https://logo.clearbit.com/pizzahut.com", tags: ["pizza", "veg"] },
    { id: 6, restaurant: "Chipotle", logo: "https://logo.clearbit.com/chipotle.com", tags: ["mexican", "non-veg"] },
    { id: 7, restaurant: "Burger King", logo: "https://logo.clearbit.com/burgerking.com", tags: ["fast-food", "non-veg"] },
    { id: 8, restaurant: "Taco Bell", logo: "https://logo.clearbit.com/tacobell.com", tags: ["mexican", "non-veg"] },
    { id: 9, restaurant: "Domino's", logo: "https://logo.clearbit.com/dominos.com", tags: ["pizza", "veg"] },
    { id: 10, restaurant: "CFA", logo: "https://logo.clearbit.com/chick-fil-a.com", tags: ["fast-food", "non-veg"] },
    { id: 11, restaurant: "Panera Bread", logo: "https://logo.clearbit.com/panerabread.com", tags: ["cafe", "veg"] },
    { id: 12, restaurant: "Dunkin'", logo: "https://logo.clearbit.com/dunkindonuts.com", tags: ["cafe", "veg"] }
];

async function fetchDynamicMenu(brandName) {
    if (menuCache[brandName]) return menuCache[brandName];
    
    // Check if it's an Indian brand (heuristic for this lab)
    const isIndianBrand = brandName.toLowerCase().match(/indian|masala|curry|vada|taco|burger/); // Broad match for discovery
    const items = await fetchIndianDiscovery(brandName);
    
    menuCache[brandName] = items;
    return items;
}

/**
 * Hybrid Discovery Engine:
 * Primary: Proximity Indian API (via Proxy)
 * Fallback: TheMealDB (Reliable Indian Filter)
 * Tertiary: Heuristic Generator
 */
async function fetchIndianDiscovery(brandName) {
    const token = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_INDIAN_FOOD_API_TOKEN);
    const url = `/api-indian/getfoodlistbycuisine?cuisine=Indian`;

    try {
        console.log("[Indian Discovery] Attempting Primary Pulse:", url);
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (!response.ok) throw new Error("Primary Pulse Failure (404/CORS)");

        const data = await response.json();
        const meals = data.meals || data.data || (Array.isArray(data) ? data : []);
        
        if (!meals || meals.length === 0) throw new Error("Empty Payload");
        
        return await processMealResults(meals, brandName);

    } catch (err) {
        console.warn("[Indian Discovery] Primary Relay Failed. Engaging MealDB Fallback.", err.message);
        return await fetchMealDBFallback(brandName);
    }
}

async function fetchMealDBFallback(brandName) {
    const backupUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?c=Indian`;
    try {
        const resp = await fetch(backupUrl);
        const data = await resp.json();
        if (!data.meals) throw new Error("MealDB Empty");
        return await processMealResults(data.meals, brandName);
    } catch (e) {
        console.error("[Discovery] Critical Network Failure. Initializing Heuristic Synthesis.");
        return generateSyntheticMenu(brandName);
    }
}

async function processMealResults(meals, brandName) {
    return await Promise.all(meals.slice(0, 10).map(async (m) => {
        const foodName = m.strMeal || m.food_name || m.name || "Regional Specialty";
        const analysis = await analyzeFoodLocal(foodName, { weight_kg: 70, lifestyle: 'moderate' });
        
        return {
            id: m.idMeal || m.food_id || Math.random(),
            name: foodName,
            brand: brandName,
            calories: analysis.calories || 350,
            protein_g: analysis.protein || 12,
            carbs_g: analysis.carbs || 45,
            fats_g: analysis.fats || 15,
            type: foodName.toLowerCase().match(/chicken|lamb|mutton|fish|prawn|egg|beef/) ? 'non-veg' : 'veg',
            image: m.strMealThumb || m.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80`,
            ingredients: (analysis.risk_summary?.[0]?.reason || "Authentic regional spices").split(',').slice(0, 3),
            verified: true
        };
    }));
}

function generateSyntheticMenu(brandName) {
    const common = [
        { name: "Paneer Butter Masala", p: 18, c: 12, f: 32, cal: 420 },
        { name: "Chicken Tikka", p: 28, c: 5, f: 12, cal: 310 },
        { name: "Dal Makhani", p: 12, c: 35, f: 18, cal: 350 },
        { name: "Vegetable Biryani", p: 8, c: 55, f: 12, cal: 380 }
    ];
    return common.map(item => ({
        ...item,
        id: Math.random(),
        brand: brandName,
        protein_g: item.p, carbs_g: item.c, fats_g: item.f, calories: item.cal,
        type: item.name.includes('Chicken') ? 'non-veg' : 'veg',
        image: `https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80`,
        ingredients: ['Spices', 'Regional Base'],
        verified: false
    }));
}

let detailChart = null;

function showDishDetail(dish) {
    const modal = document.querySelector("#dish-modal");
    const name = document.querySelector("#modal-name");
    const img = document.querySelector("#modal-img");
    const brand = document.querySelector("#modal-brand");
    const cal = document.querySelector("#modal-cal");
    const prot = document.querySelector("#modal-prot");
    const carbs = document.querySelector("#modal-carbs");
    const fats = document.querySelector("#modal-fats");
    const ingList = document.querySelector("#modal-ingredients");
    const badge = document.querySelector("#modal-type-badge");

    name.innerText = dish.name;
    img.src = dish.image;
    brand.innerText = dish.brand.toUpperCase();
    cal.innerText = dish.calories + " kcal";
    prot.innerText = dish.protein_g + "g";
    carbs.innerText = dish.carbs_g + "g";
    fats.innerText = dish.fats_g + "g";

    badge.innerText = dish.type.toUpperCase();
    badge.className = `type-badge ${dish.type}`;
    badge.style.background = dish.type === 'veg' ? '#34c759' : '#ff3b30';

    ingList.innerHTML = dish.ingredients.map(i => `<span class="ing-chip">${i}</span>`).join("");

    modal.style.display = "flex";

    const ctx = document.getElementById('detailChart').getContext('2d');
    if (detailChart) detailChart.destroy();
    
    const data = [dish.protein_g * 4, dish.carbs_g * 4, dish.fats_g * 9];
    const vibrantColors = ['#06b6d4', '#f59e0b', '#f43f5e'];

    detailChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Protein', 'Carb', 'Fat'],
            datasets: [{
                data: data,
                backgroundColor: vibrantColors,
                borderWidth: 0
            }]
        },
        options: {
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
            responsive: true,
            maintainAspectRatio: false
        }
    });

    const slugify = (t) => t.toLowerCase().trim().replace(/\s+/g,'-').replace(/[^\w-]+/g,'');
    window.history.pushState({}, '', `/restaurant-lab/${slugify(dish.brand)}/${slugify(dish.name)}`);

    document.querySelector("#close-modal").onclick = () => {
        modal.style.display = "none";
        window.history.pushState({}, '', '/restaurant-lab');
    };
}

function initRestaurantExplorer() {
    const list = document.querySelector("#brand-list");
    const menuContainer = document.querySelector("#menu-container");
    const filters = document.querySelectorAll(".filter-btn");

    let currF = "all", sel = null;

    function renderB(q = "") {
        list.innerHTML = "";
        restaurantData.filter(x => x.restaurant.toLowerCase().includes(q.toLowerCase())).forEach(b => {
             const d = document.createElement('div');
             d.className = `card brand-card ${sel === b.restaurant ? 'active' : ''}`;
             d.innerHTML = `
                <div style="height:45px; display:flex; align-items:center; justify-content:center;">
                    <img src="${b.logo}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(b.restaurant)}&background=random&color=fff&size=128'" alt="${b.restaurant}" style="max-height: 100%; max-width: 100px;">
                </div>
                <h4 style="font-size:0.8rem; margin-top:10px;">${b.restaurant}</h4>
            `;
            d.onclick = async () => {
                sel = b.restaurant;
                renderB(q);
                menuContainer.innerHTML = `<div class="loader-wrap"><div class="loader"></div><p>Synthesizing Menu...</p></div>`;
                const m = await fetchDynamicMenu(b.restaurant);
                renderM(m);
            };
            list.appendChild(d);
        });
    }

    function renderM(items) {
        menuContainer.innerHTML = "";
        if(!items) {
             menuContainer.innerHTML = `<p style="text-align:center; opacity:0.5; grid-column: 1/-1;">Neural synthesis failed for this outlet. Select another entity.</p>`;
             return;
        }

        const filtered = items.filter(i => {
            if (currF === "all") return true;
            if (currF === "high-protein") return i.protein_g > 20;
            if (currF === "low-carbs") return i.carbs_g < 20;
            if (currF === "low-calories") return i.calories < 400;
            if (currF === "veg") return i.type === "veg";
            if (currF === "non-veg") return i.type === "non-veg";
            return true;
        });

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = "card menu-card reveal-up";
            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="menu-card-content">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h4 style="margin:0; font-size:1rem;">${item.name}</h4>
                        <span class="badge ${item.type}">${item.type.toUpperCase()}</span>
                    </div>
                    <div class="menu-macros" style="margin-top:1rem; display:flex; gap:12px; font-size:0.75rem; font-weight:700;">
                        <span style="color:#06b6d4;">P ${item.protein_g}g</span>
                        <span style="color:#f59e0b;">C ${item.carbs_g}g</span>
                        <span style="color:#f43f5e;">F ${item.fats_g}g</span>
                        <span style="opacity:0.6;">${item.calories} KCAL</span>
                    </div>
                </div>
            `;
            card.onclick = () => showDishDetail(item);
            menuContainer.appendChild(card);
        });
        
        gsap.from(".menu-card", { y: 20, opacity: 0, stagger: 0.05, duration: 0.6, ease: "power4.out" });
    }

    document.querySelector("#res-search").oninput = (e) => renderB(e.target.value);
    
    filters.forEach(f => {
        f.onclick = () => {
            filters.forEach(b => b.classList.remove('active'));
            f.classList.add('active');
            currF = f.dataset.filter;
            fetchDynamicMenu(sel).then(renderM);
        };
    });

    renderB();
}

window.initRestaurantExplorer = initRestaurantExplorer;

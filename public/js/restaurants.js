import { analyzeFoodLocal } from './ai-engine.js';

const restaurantData = [
    {
        "restaurant": "California Burrito",
        "logo": "https://www.californiaburrito.in/images/logo.png"
    },
    {
        "restaurant": "Haldiram's",
        "logo": "https://www.logo.wine/a/logo/Haldiram's/Haldiram's-Logo.wine.svg"
    },
    {
        "restaurant": "Subway",
        "logo": "https://www.logo.wine/a/logo/Subway_(restaurant)/Subway_(restaurant)-Logo.wine.svg"
    },
    {
        "restaurant": "McDonald's",
        "logo": "https://www.logo.wine/a/logo/McDonald's/McDonald's-Logo.wine.svg"
    },
    {
        "restaurant": "Domino's",
        "logo": "https://www.logo.wine/a/logo/Domino's_Pizza/Domino's_Pizza-Logo.wine.svg"
    },
    {
        "restaurant": "KFC",
        "logo": "https://www.logo.wine/a/logo/KFC/KFC-Logo.wine.svg"
    },
    {
        "restaurant": "Pizza Hut",
        "logo": "https://www.pngall.com/wp-content/uploads/15/Pizza-Hut-Logo-PNG-File.png"
    }
];

const menuCache = {};

async function fetchDynamicMenu(brandName) {
    if (menuCache[brandName]) return menuCache[brandName];

    const isIndianBrand = brandName.toLowerCase().includes('haldiram') || brandName.toLowerCase().includes('burrito');
    if (isIndianBrand) return await fetchIndianDiscovery(brandName);

    const apiKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_USDA_API_KEY) || "DEMO_KEY";
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(brandName)}&pageSize=24&dataType=Branded`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("FDC API Error");
        const data = await response.json();
        if (!data.foods || data.foods.length === 0) return null;

        const items = data.foods.map(f => {
            const nuts = f.foodNutrients || [];
            const getNut = (id) => Math.round(nuts.find(n => n.nutrientId === id || n.nutrientNumber === id.toString())?.value || 0);
            
            // Refined Veg/Non-Veg logic using ingredient list
            const ing = (f.ingredients || "").toLowerCase();
            const nvKeywords = ['chicken', 'beef', 'pork', 'lamb', 'egg', 'fish', 'meat', 'turkey', 'gelatin', 'whey'];
            const isNV = nvKeywords.some(k => ing.includes(k)) || f.description.toLowerCase().includes('chicken') || f.description.toLowerCase().includes('beef');

            return {
                name: f.description.replace(new RegExp(brandName, 'gi'), '').trim() || f.description,
                brand: brandName,
                calories: getNut(1008) || getNut(208),
                protein_g: getNut(1003),
                carbs_g: getNut(1005),
                fats_g: getNut(1004),
                type: isNV ? 'non-veg' : 'veg',
                ingredients: f.ingredients ? f.ingredients.split(',').map(s => s.trim().replace(/\.$/, '')) : [],
                image: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop&sig=${Math.random()}`
            };
        }).filter(item => item.calories > 0);

        if (items.length > 0) menuCache[brandName] = items;
        return items;
    } catch (err) {
        console.warn(`[USDA Sync] Failed for ${brandName}:`, err.message);
        return null;
    }
}

async function fetchIndianDiscovery(brandName) {
    const token = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_INDIAN_FOOD_API_TOKEN);
    const url = `https://indian-food-db.herokuapp.com/api/getfoodlistbycuisine?cuisine=Indian`; // Standardized endpoint

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        let data = await response.json();
        
        // Handle variations in API response structure (Standardizing to array)
        const meals = data.meals || data.data || (Array.isArray(data) ? data : null);
        if (!meals) return null;

        const dishes = await Promise.all(meals.slice(0, 12).map(async (m) => {
            const foodName = m.strMeal || m.food_name || m.name;
            const analysis = await analyzeFoodLocal(foodName, { weight_kg: 70 });
            
            // Extraction logic for ingredients vary by API; mapping standard formats
            const ings = m.ingredients ? 
                         (Array.isArray(m.ingredients) ? m.ingredients.join(', ') : m.ingredients) : 
                         "Authentic regional spices, base protein, aromatic base.";

            return {
                name: foodName,
                brand: brandName,
                calories: analysis.calories || 350,
                protein_g: analysis.protein || 12,
                carbs_g: analysis.carbs || 45,
                fats_g: analysis.fats || 15,
                type: foodName.toLowerCase().match(/chicken|lamb|mutton|fish|prawn|egg|beef/) ? 'non-veg' : 'veg',
                image: m.strMealThumb || m.image || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80`,
                ingredients: ings,
                verified: true
            };
        }));

        menuCache[brandName] = dishes;
        return dishes;
    } catch (err) {
        console.error("[Indian Discovery] API Error using VITE_INDIAN_FOOD_API_TOKEN:", err);
        return null;
    }
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

    // Chart.js Pie Chart
    const ctx = document.getElementById('detailChart').getContext('2d');
    if (detailChart) detailChart.destroy();
    
    const data = [dish.protein_g * 4, dish.carbs_g * 4, dish.fats_g * 9];
    const vibrantColors = ['#06b6d4', '#f59e0b', '#f43f5e']; // Cyan, Amber, Rose

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

    // Update URL logic
    const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
    const brandSlug = slugify(dish.brand);
    const itemSlug = slugify(dish.name);
    window.history.pushState({ path: '/restaurant-lab' }, '', `/restaurant-lab/${brandSlug}/${itemSlug}`);

    document.querySelector("#close-modal").onclick = () => {
        modal.style.display = "none";
        window.history.pushState({ path: '/restaurant-lab' }, '', '/restaurant-lab');
    };
}

// Handle Browser Back Button
window.addEventListener('popstate', (e) => {
    const modal = document.querySelector("#dish-modal");
    if (modal) modal.style.display = "none";
});

function initRestaurantExplorer() {
    const list = document.querySelector("#brand-list");
    const menuContainer = document.querySelector("#menu-container");
    const filters = document.querySelectorAll(".filter-btn");

    let currF = "all", sel = null;

    function renderB(q = "") {
        list.innerHTML = "";
        const filtered = restaurantData.filter(x => x.restaurant.toLowerCase().includes(q.toLowerCase()));
        filtered.forEach(b => {
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
                await renderM(); 
            };
            list.appendChild(d);
        });
    }

    async function renderM() {
        if (!sel) return menuContainer.innerHTML = "<p style='grid-column: 1/-1; text-align: center; opacity: 0.5;'>Select a brand to discover real-time menu data</p>";
        
        menuContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <p class="pulse-loading" style="font-size: 0.9rem; color: var(--text-muted);">Syncing with Food Database...</p>
            </div>
        `;

        let items = await fetchDynamicMenu(sel);
        
        if (!items || items.length === 0) {
            return menuContainer.innerHTML = "<p style='grid-column: 1/-1; text-align: center; opacity: 0.5;'>No direct menu records found. Try searching for a specific item.</p>";
        }

        // Apply filters
        let fItems = [...items];
        if(currF === 'veg') fItems = fItems.filter(i=>i.type==='veg');
        if(currF === 'non-veg') fItems = fItems.filter(i=>i.type==='non-veg');
        if(currF === 'high-protein') fItems.sort((a,b)=>b.protein_g - a.protein_g);
        if(currF === 'low-carbs') fItems.sort((a,b)=>a.carbs_g - b.carbs_g);
        if(currF === 'low-calories') fItems.sort((a,b)=>a.calories - b.calories);

        menuContainer.innerHTML = "";
        fItems.forEach((i, idx) => {
            const div = document.createElement('div');
            div.className = "card menu-item-card";
            div.style = `opacity: 0; transform: translateY(10px); animation: fadeInEntry 0.5s ease forwards ${idx * 0.05}s; cursor:pointer; padding:0; overflow:hidden;`;
            div.innerHTML = `
                <div style="position:relative; height:180px;">
                    <img src="${i.image}" class="menu-img" onerror="this.src='https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80'" alt="${i.name}" style="width:100%; height:100%; object-fit:cover;">
                    <span style="position:absolute; top:12px; right:12px; font-size:1.2rem; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${i.type==='veg'?'🟩':'🟥'}</span>
                    ${i.verified ? '<span style="position:absolute; bottom:12px; left:12px; background:var(--apple-blue); color:white; font-size:9px; padding:3px 8px; border-radius:100px; font-weight:700; letter-spacing:0.5px;">AI ANALYZED</span>' : ''}
                </div>
                <div style="padding:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                        <div style="text-align:center;"><div style="font-size:0.6rem; opacity:0.5; margin-bottom:2px;">KCAL</div><div style="font-size:0.85rem; font-weight:700;">${i.calories}</div></div>
                        <div style="text-align:center;"><div style="font-size:0.6rem; opacity:0.5; margin-bottom:2px; color:#06b6d4;">PROTEIN</div><div style="font-size:0.85rem; font-weight:700; color:#06b6d4;">${i.protein_g}g</div></div>
                        <div style="text-align:center;"><div style="font-size:0.6rem; opacity:0.5; margin-bottom:2px; color:#f59e0b;">NET CARBS</div><div style="font-size:0.85rem; font-weight:700; color:#f59e0b;">${i.carbs_g}g</div></div>
                        <div style="text-align:center;"><div style="font-size:0.6rem; opacity:0.5; margin-bottom:2px; color:#f43f5e;">FATS</div><div style="font-size:0.85rem; font-weight:700; color:#f43f5e;">${i.fats_g}g</div></div>
                    </div>
                    <h4 style="margin:0; font-size:0.95rem; line-height:1.2; font-weight:600; color:#fff;">${i.name}</h4>
                </div>
            `;
            div.onclick = () => showDishDetail(i);
            menuContainer.appendChild(div);
        });
    }

    const searchInput = document.querySelector("#res-search");
    if(searchInput) {
        searchInput.oninput = (e) => renderB(e.target.value);
    }
    
    filters.forEach(btn => {
        btn.onclick = async () => {
            filters.forEach(x => x.classList.remove('active'));
            btn.classList.add('active');
            currF = btn.dataset.filter;
            await renderM();
        };
    });

    renderB();
}

window.initRestaurantExplorer = initRestaurantExplorer;


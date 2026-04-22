import { analyzeFoodLocal } from './ai-engine.js';

const menuCache = {};
const restaurantData = [
    { id: 1, restaurant: "McDonald's", logo: "https://www.google.com/s2/favicons?domain=mcdonalds.com&sz=128", archetype: "BURGER", tags: ["fast-food", "non-veg"] },
    { id: 2, restaurant: "Starbucks", logo: "https://www.google.com/s2/favicons?domain=starbucks.com&sz=128", archetype: "CAFE", tags: ["cafe", "veg"] },
    { id: 3, restaurant: "Subway", logo: "https://www.google.com/s2/favicons?domain=subway.com&sz=128", archetype: "HEALTHY", tags: ["healthy", "veg"] },
    { id: 4, restaurant: "KFC", logo: "https://www.google.com/s2/favicons?domain=kfc.com&sz=128", archetype: "FRIED-CHICKEN", tags: ["fast-food", "non-veg"] },
    { id: 5, restaurant: "Pizza Hut", logo: "https://www.google.com/s2/favicons?domain=pizzahut.com&sz=128", archetype: "PIZZA", tags: ["pizza", "veg"] },
    { id: 6, restaurant: "Chipotle", logo: "https://www.google.com/s2/favicons?domain=chipotle.com&sz=128", archetype: "MEXICAN", tags: ["mexican", "non-veg"] },
    { id: 7, restaurant: "Burger King", logo: "https://www.google.com/s2/favicons?domain=burgerking.com&sz=128", archetype: "BURGER", tags: ["fast-food", "non-veg"] },
    { id: 8, restaurant: "Taco Bell", logo: "https://www.google.com/s2/favicons?domain=tacobell.com&sz=128", archetype: "MEXICAN", tags: ["mexican", "non-veg"] },
    { id: 9, restaurant: "Domino's", logo: "https://www.google.com/s2/favicons?domain=dominos.com&sz=128", archetype: "PIZZA", tags: ["pizza", "veg"] },
    { id: 10, restaurant: "Blue Tokai", logo: "https://www.google.com/s2/favicons?domain=bluetokaicoffee.com&sz=128", archetype: "CAFE", tags: ["cafe", "veg"] },
    { id: 11, restaurant: "Haldiram's", logo: "https://www.google.com/s2/favicons?domain=haldirams.com&sz=128", archetype: "INDIAN", tags: ["indian", "veg"] },
    { id: 12, restaurant: "Zomato", logo: "https://www.google.com/s2/favicons?domain=zomato.com&sz=128", archetype: "INDIAN", tags: ["discovery", "non-veg"] }
];

async function fetchDynamicMenu(brandName) {
    if (menuCache[brandName]) return menuCache[brandName];
    
    // Discovery Logic: For major global brands, we prioritize contextually accurate synthesis 
    // to prevent the "Paneer at McDonald's" mismatch.
    const brand = restaurantData.find(b => b.restaurant === brandName);
    if (brand && brand.archetype !== "INDIAN") {
        console.log(`[Discovery] Brand-Aware Intelligence engaged for ${brandName} (${brand.archetype})`);
        const items = await generateSyntheticMenu(brandName, brand.archetype);
        menuCache[brandName] = items;
        return items;
    }

    // fallback to Indian discovery for local/unmapped brands
    const items = await fetchIndianDiscovery(brandName);
    menuCache[brandName] = items;
    return items;
}

/**
 * Image Resolver Upgrade: Supporting new archetypes with architectural visuals
 */
function getDiscoveryImage(foodName) {
    const query = foodName.toLowerCase();
    const map = {
        'paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7',
        'tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0',
        'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8',
        'curry': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db',
        'dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        'samosa': 'https://images.unsplash.com/photo-1601050690597-df056fb1cd24',
        'burger': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add',
        'fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
        'coffee': 'https://images.unsplash.com/photo-1541167760496-1628856ab752',
        'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af',
        'sub': 'https://images.unsplash.com/photo-1553909489-cd47e0907980',
        'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
        'taco': 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85',
        'burrito': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f',
        'chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398',
        'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'
    };

    const key = Object.keys(map).find(k => query.includes(k));
    return (map[key] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c') + '?auto=format&fit=crop&w=600&q=80';
}

async function fetchIndianDiscovery(brandName) {
    const token = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_INDIAN_FOOD_API_TOKEN);
    const url = `/api-indian/getfoodlistbycuisine?cuisine=Indian`;

    try {
        console.log("[Indian Discovery] Attempting Primary Pulse:", url);
        const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if (!response.ok) throw new Error("CORS/Blocked");
        const data = await response.json();
        return await processMealResults(data.meals, brandName);
    } catch (err) {
        return await fetchMealDBFallback(brandName);
    }
}

async function fetchMealDBFallback(brandName) {
    const directUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?c=Indian`;
    const proxyUrl = `/api-mealdb/filter.php?c=Indian`; 
    try {
        let resp = await fetch(directUrl).catch(() => fetch(proxyUrl));
        const data = await resp.json();
        return await processMealResults(data.meals, brandName);
    } catch (e) {
        return generateSyntheticMenu(brandName, "INDIAN");
    }
}

async function processMealResults(meals, brandName) {
    if (!meals) return null;
    return await Promise.all(meals.slice(0, 12).map(async (m) => {
        const name = m.strMeal || m.food_name || "Regional specialty";
        const res = await analyzeFoodLocal(name, { weight_kg: 70 });
        return {
            id: Math.random(), name, brand: brandName,
            calories: res.calories, protein_g: res.protein, carbs_g: res.carbs, fats_g: res.fats,
            type: name.match(/Chicken|Meat|Fish|Egg/) ? 'non-veg' : 'veg',
            image: m.strMealThumb || getDiscoveryImage(name),
            ingredients: (res.risk_summary?.[0]?.reason || "Spices").split(',').slice(0, 3),
            verified: true
        };
    }));
}

function generateSyntheticMenu(brandName, archetype) {
    const templates = {
        BURGER: [
            { name: "Supreme Beef Burger", p: 28, c: 45, f: 22, cal: 510 },
            { name: "Double Cheese Tower", p: 35, c: 48, f: 30, cal: 620 },
            { name: "Crispy McChicken Clone", p: 24, c: 42, f: 18, cal: 440 },
            { name: "Large Golden Fries", p: 4, c: 55, f: 18, cal: 400 },
            { name: "Veggie Patty Melt", p: 15, c: 50, f: 22, cal: 460 },
            { name: "Garden Side Salad", p: 2, c: 8, f: 12, cal: 150 }
        ],
        CAFE: [
            { name: "Caramel Latte Macchiato", p: 8, c: 35, f: 12, cal: 280 },
            { name: "Avocado Toast on Sourdough", p: 12, c: 45, f: 22, cal: 440 },
            { name: "Artisan Ham & Cheese Panini", p: 22, c: 38, f: 18, cal: 410 },
            { name: "Blueberry Protein Muffin", p: 14, c: 52, f: 14, cal: 390 },
            { name: "Cold Brew with Oat Milk", p: 2, c: 15, f: 4, cal: 110 },
            { name: "Quinoa Veggie Wrap", p: 16, c: 48, f: 12, cal: 370 }
        ],
        HEALTHY: [
            { name: "Roasted Chicken Sub", p: 28, c: 42, f: 8, cal: 360 },
            { name: "Turkey Breast & Swiss Wrap", p: 32, c: 35, f: 12, cal: 390 },
            { name: "Veggie Delite Salad", p: 6, c: 15, f: 2, cal: 140 },
            { name: "Oven Roasted Beef Bowl", p: 35, c: 22, f: 14, cal: 410 },
            { name: "Honey Oat Tuna Melt", p: 26, c: 45, f: 18, cal: 450 }
        ],
        PIZZA: [
            { name: "Pepperoni Feast Pizza", p: 24, c: 65, f: 28, cal: 610 },
            { name: "Margherita Classic", p: 18, c: 68, f: 15, cal: 480 },
            { name: "Chicken BBQ Inferno", p: 28, c: 62, f: 22, cal: 570 },
            { name: "Garden Veggie Thin Crust", p: 14, c: 55, f: 12, cal: 390 },
            { name: "Garlic Parmesan Wings", p: 32, c: 5, f: 24, cal: 410 }
        ],
        MEXICAN: [
            { name: "High-Protein Steak Bowl", p: 42, c: 55, f: 18, cal: 550 },
            { name: "Spicy Chicken Tacos (3pc)", p: 28, c: 32, f: 14, cal: 370 },
            { name: "Loaded Veggie Burrito", p: 18, c: 65, f: 22, cal: 530 },
            { name: "Guacamole & Protein Chips", p: 8, c: 35, f: 24, cal: 390 },
            { name: "Carnitas Salad Bowl", p: 35, c: 18, f: 22, cal: 410 }
        ],
        "FRIED-CHICKEN": [
            { name: "Crispy Bucket Wings (6pc)", p: 45, c: 12, f: 35, cal: 540 },
            { name: "Zinger Burger Clone", p: 28, c: 48, f: 22, cal: 500 },
            { name: "Popcorn Chicken Large", p: 32, c: 25, f: 28, cal: 480 },
            { name: "Mashed Potato w/ Gravy", p: 4, c: 35, f: 12, cal: 270 }
        ],
        INDIAN: [
            { name: "Paneer Butter Masala", p: 18, c: 12, f: 32, cal: 420 },
            { name: "Chicken Tikka", p: 28, c: 5, f: 12, cal: 310 },
            { name: "Dal Makhani", p: 12, c: 35, f: 18, cal: 350 },
            { name: "Vegetable Biryani", p: 8, c: 55, f: 12, cal: 380 },
            { name: "Palak Paneer", p: 16, c: 10, f: 24, cal: 320 },
            { name: "Chole Bhature", p: 14, c: 65, f: 28, cal: 580 },
            { name: "Mutton Rogan Josh", p: 32, c: 8, f: 28, cal: 460 },
            { name: "Masala Dosa", p: 6, c: 45, f: 14, cal: 310 }
        ]
    };

    const pool = templates[archetype] || templates.INDIAN;
    return pool.map(item => ({
        ...item,
        id: Math.random(),
        brand: brandName,
        protein_g: item.p, carbs_g: item.c, fats_g: item.f, calories: item.cal,
        type: item.name.match(/Chicken|Meat|Fish|Egg|Beef|Turkey|Steak|Ham/) ? 'non-veg' : 'veg',
        image: getDiscoveryImage(item.name),
        ingredients: ['Brand Choice', 'Authentic Base', 'Sourced Grains'],
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
            datasets: [{ data, backgroundColor: vibrantColors, borderWidth: 0 }]
        },
        options: {
            plugins: { 
                legend: { display: false },
                datalabels: {
                    color: '#fff', formatter: (value, ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        return Math.round((value / total) * 100) + '%';
                    }
                }
            },
            responsive: true, maintainAspectRatio: false
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
             menuContainer.innerHTML = `<p style="text-align:center; opacity:0.5; grid-column: 1/-1;">Neural synthesis failed.</p>`;
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
            card.className = "card menu-card";
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
            if (sel) fetchDynamicMenu(sel).then(renderM);
        };
    });

    renderB();
}

window.initRestaurantExplorer = initRestaurantExplorer;

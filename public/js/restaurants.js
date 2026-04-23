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
    { id: 10, restaurant: "Blue Tokai", logo: "https://www.google.com/s2/favicons?domain=bluetokaicoffee.com&sz=128", archetype: "CAFE", tags: ["cafe", "veg"] },
    { id: 11, restaurant: "Haldiram's", logo: "https://www.google.com/s2/favicons?domain=haldirams.com&sz=128", archetype: "INDIAN", tags: ["indian", "veg"] }
];

async function fetchDynamicMenu(brandName) {
    if (menuCache[brandName]) return menuCache[brandName];
    const brand = restaurantData.find(b => b.restaurant === brandName);
    if (brand && brand.archetype !== "INDIAN") {
        const items = await generateSyntheticMenu(brandName, brand.archetype);
        menuCache[brandName] = items;
        return items;
    }
    const items = await fetchIndianDiscovery(brandName);
    menuCache[brandName] = items;
    return items;
}

function getDiscoveryImage(foodName, brandName) {
    const cleanBrand = (brandName || '').toLowerCase().replace(/['\s]+/g, '');
    const cleanName = foodName.toLowerCase()
        .replace(/synthesis|archetype|pro|supreme|classic|ultra-pure|inferno|thin crust|stuffed crust|feat|artisan|flaky|sliced|protein|thick|crispy|golden|large|half/gi, '')
        .trim().split(' ').slice(0, 3).join(',');
    
    // Search with both brand and food name for maximum accuracy
    return `https://loremflickr.com/800/600/food,${cleanBrand},${cleanName}/all`;
}

async function fetchIndianDiscovery(brandName) {
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
    const brand = restaurantData.find(b => b.restaurant === brandName);
    const isGlobal = brand && ["BURGER", "CAFE", "PIZZA", "HEALTHY", "FRIED-CHICKEN", "MEXICAN"].includes(brand.archetype);

    return await Promise.all(meals.slice(0, 15).map(async (m) => {
        const name = m.strMeal || m.food_name || "Regional specialty";
        const res = await analyzeFoodLocal(name, { weight_kg: 70 });
        const finalImage = isGlobal ? getDiscoveryImage(name, brandName) : (m.strMealThumb || getDiscoveryImage(name, brandName));

        return {
            id: Math.random(), name, brand: brandName,
            calories: res.calories, protein_g: res.protein, carbs_g: res.carbs, fats_g: res.fats,
            type: name.match(/Chicken|Meat|Fish|Egg|Beef|Turkey|Steak|Ham/) ? 'non-veg' : 'veg',
            category: "REGIONAL",
            image: finalImage,
            ingredients: (res.risk_summary?.[0]?.reason || "Spices").split(',').slice(0, 3),
            verified: true
        };
    }));
}

function generateSyntheticMenu(brandName, archetype) {
    const templates = {
        BURGER: [
            { name: "Supreme Quarter Pounder Burger", p: 32, c: 45, f: 28, cal: 540, v: false, cat: "BURGER" },
            { name: "Big Mac Burger Archetype", p: 26, c: 48, f: 32, cal: 560, v: false, cat: "BURGER" },
            { name: "Double Cheese Tower Burger", p: 38, c: 50, f: 34, cal: 680, v: false, cat: "BURGER" },
            { name: "Crispy McChicken Burger", p: 24, c: 42, f: 18, cal: 440, v: false, cat: "BURGER" },
            { name: "McSpicy Chicken Burger", p: 28, c: 45, f: 22, cal: 510, v: false, cat: "BURGER" },
            { name: "Filet-O-Fish Burger Pro", p: 18, c: 40, f: 14, cal: 380, v: false, cat: "SANDWICH" },
            { name: "Golden Chicken Nuggets (9pc)", p: 22, c: 24, f: 24, cal: 410, v: false, cat: "SIDES" },
            { name: "Large Golden French Fries", p: 4, c: 55, f: 18, cal: 400, v: true, cat: "SIDES" },
            { name: "Oreo McFlurry Dessert Synthesis", p: 8, c: 65, f: 14, cal: 420, v: true, cat: "DESSERT" },
            { name: "Vanilla Thick Milk Shake", p: 12, c: 75, f: 16, cal: 480, v: true, cat: "DRINK" },
            { name: "Egg McMuffin Breakfast", p: 18, c: 32, f: 14, cal: 310, v: false, cat: "BREAKFAST" },
            { name: "Sausage McMuffin with Egg", p: 22, c: 35, f: 24, cal: 450, v: false, cat: "BREAKFAST" },
            { name: "Veggie Patty Supreme Burger", p: 15, c: 48, f: 12, cal: 360, v: true, cat: "BURGER" },
            { name: "Hash Brown Crispy", p: 2, c: 24, f: 12, cal: 210, v: true, cat: "BREAKFAST" },
            { name: "Apple Pie Dessert", p: 3, c: 44, f: 12, cal: 280, v: true, cat: "DESSERT" }
        ],
        CAFE: [
            { name: "Caramel Latte Macchiato", p: 8, c: 35, f: 12, cal: 280, v: true, cat: "DRINK" },
            { name: "Classic Cappuccino Large", p: 10, c: 12, f: 8, cal: 160, v: true, cat: "DRINK" },
            { name: "Vanilla Sweet Cream Cold Brew", p: 2, c: 22, f: 8, cal: 180, v: true, cat: "DRINK" },
            { name: "Iced Peach Green Tea", p: 0, c: 28, f: 0, cal: 110, v: true, cat: "DRINK" },
            { name: "Avocado Toast on Sourdough", p: 12, c: 45, f: 22, cal: 440, v: true, cat: "SNACK" },
            { name: "Butter Croissant Flaky", p: 6, c: 32, f: 18, cal: 320, v: true, cat: "SNACK" },
            { name: "Pain au Chocolat Artisan", p: 8, c: 38, f: 22, cal: 380, v: true, cat: "SNACK" },
            { name: "Blueberry Protein Muffin", p: 14, c: 52, f: 14, cal: 390, v: true, cat: "SNACK" },
            { name: "Ham & Gruyere Egg Bites", p: 19, c: 9, f: 22, cal: 310, v: false, cat: "SNACK" },
            { name: "Spinach & Feta Protein Wrap", p: 22, c: 35, f: 14, cal: 360, v: true, cat: "SNACK" },
            { name: "Lemon Loaf Sliced", p: 4, c: 65, f: 18, cal: 450, v: true, cat: "SNACK" },
            { name: "Artisan Turkey Panini", p: 32, c: 42, f: 12, cal: 410, v: false, cat: "SNACK" }
        ],
        PIZZA: [
            { name: "Pepperoni Feast Classic", p: 28, c: 68, f: 32, cal: 660, v: false, cat: "PIZZA" },
            { name: "Margherita Ultra-Pure", p: 18, c: 72, f: 18, cal: 520, v: true, cat: "PIZZA" },
            { name: "BBQ Chicken Inferno", p: 32, c: 65, f: 24, cal: 610, v: false, cat: "PIZZA" },
            { name: "Garden Veggie Thin Crust", p: 14, c: 58, f: 12, cal: 390, v: true, cat: "PIZZA" },
            { name: "Meat Lovers Stuffed Crust", p: 45, c: 75, f: 42, cal: 840, v: false, cat: "PIZZA" },
            { name: "Buffalo Chicken Wings (6pc)", p: 42, c: 8, f: 28, cal: 440, v: false, cat: "SIDES" },
            { name: "Garlic Bread with Cheese", p: 8, c: 45, f: 18, cal: 370, v: true, cat: "SIDES" },
            { name: "Chocolate Lava Cake", p: 6, c: 55, f: 24, cal: 460, v: true, cat: "DESSERT" }
        ],
        INDIAN: [
            { name: "Paneer Butter Masala", p: 18, c: 12, f: 32, cal: 420, v: true, cat: "CURRY" },
            { name: "Dal Makhani Classic", p: 12, c: 35, f: 18, cal: 350, v: true, cat: "CURRY" },
            { name: "Butter Chicken Supreme", p: 32, c: 8, f: 24, cal: 380, v: false, cat: "CURRY" },
            { name: "Mutton Rogan Josh", p: 35, c: 6, f: 28, cal: 410, v: false, cat: "CURRY" },
            { name: "Tandoori Chicken Half", p: 45, c: 4, f: 12, cal: 310, v: false, cat: "TANDOOR" },
            { name: "Vegetable Dum Biryani", p: 12, c: 65, f: 15, cal: 440, v: true, cat: "RICE" },
            { name: "Gulab Jamun (2pc)", p: 4, c: 55, f: 14, cal: 360, v: true, cat: "DESSERT" }
        ]
    };

    const pool = templates[archetype] || templates.INDIAN;
    return pool.map(item => ({
        ...item,
        id: Math.random(), brand: brandName,
        protein_g: item.p, carbs_g: item.c, fats_g: item.f, calories: item.cal,
        type: item.v ? 'veg' : 'non-veg',
        category: item.cat || "REGIONAL",
        image: getDiscoveryImage(item.name, brandName),
        ingredients: ['Brand Core', 'Regional Base'],
        verified: false
    }));
}

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

    badge.innerText = `${dish.category} | ${dish.type.toUpperCase()}`;
    badge.className = `type-badge ${dish.type}`;
    badge.style.background = dish.type === 'veg' ? '#34c759' : '#ff3b30';

    ingList.innerHTML = dish.ingredients.map(i => `<span class="ing-chip">${i}</span>`).join("");
    modal.style.display = "flex";

    const ctx = document.getElementById('detailChart').getContext('2d');
    if (window.detailChart) window.detailChart.destroy();
    
    window.detailChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Protein', 'Carb', 'Fat'],
            datasets: [{ data: [dish.protein_g * 4, dish.carbs_g * 4, dish.fats_g * 9], backgroundColor: ['#06b6d4', '#f59e0b', '#f43f5e'], borderWidth: 0 }]
        },
        options: {
            plugins: { legend: { display: false }, datalabels: { color: '#fff', formatter: (value, ctx) => Math.round((value / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100) + '%' } },
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
            if (currF === "veg") return i.type === 'veg';
            if (currF === "non-veg") return i.type === 'non-veg';
            return true;
        });

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = `card menu-card ${item.type}`;
            card.innerHTML = `
                <div class="diet-symbol ${item.type === 'veg' ? 'veg-symbol' : 'nonveg-symbol'}"></div>
                <img src="${item.image}" alt="${item.name}">
                <div class="menu-card-content">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h4 style="margin:0; font-size:1rem; font-weight:600;">${item.name}</h4>
                            <span style="font-size:0.65rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em;">${item.category}</span>
                        </div>
                    </div>
                    <div class="menu-macros" style="margin-top:1rem; display:flex; gap:12px; font-size:0.75rem; font-weight:500; color: rgba(255,255,255,0.6);">
                        <span>P ${item.protein_g}g</span>
                        <span>C ${item.carbs_g}g</span>
                        <span>F ${item.fats_g}g</span>
                        <span style="opacity:0.8; font-weight:700;">${item.calories} KCAL</span>
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

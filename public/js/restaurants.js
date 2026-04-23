import { analyzeFoodLocal } from './ai-engine.js';

const menuCache = {};
const restaurantData = [
    { id: 1, restaurant: "McDonald's", logo: "https://www.google.com/s2/favicons?domain=mcdonalds.com&sz=128", archetype: "MCDONALDS", tags: ["fast-food", "non-veg"] },
    { id: 2, restaurant: "Starbucks", logo: "https://www.google.com/s2/favicons?domain=starbucks.com&sz=128", archetype: "CAFE", tags: ["cafe", "veg"] },
    { id: 3, restaurant: "Subway", logo: "https://www.google.com/s2/favicons?domain=subway.com&sz=128", archetype: "HEALTHY", tags: ["healthy", "veg"] },
    { id: 4, restaurant: "KFC", logo: "https://www.google.com/s2/favicons?domain=kfc.com&sz=128", archetype: "FRIED-CHICKEN", tags: ["fast-food", "non-veg"] },
    { id: 5, restaurant: "Pizza Hut", logo: "https://www.google.com/s2/favicons?domain=pizzahut.com&sz=128", archetype: "PIZZA", tags: ["pizza", "veg"] },
    { id: 6, restaurant: "Chipotle", logo: "https://www.google.com/s2/favicons?domain=chipotle.com&sz=128", archetype: "MEXICAN", tags: ["mexican", "non-veg"] },
    { id: 7, restaurant: "Burger King", logo: "https://www.google.com/s2/favicons?domain=burgerking.com&sz=128", archetype: "BURGER_KING", tags: ["fast-food", "non-veg"] },
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

function getDiscoveryImage(foodName, brandName, archetype) {
    const cleanBrand = (brandName || '').toLowerCase().replace(/['\s]+/g, '');
    const cleanName = foodName.toLowerCase()
        .replace(/synthesis|archetype|pro|supreme|classic|ultra-pure|inferno|thin crust|stuffed crust|feat|artisan|flaky|sliced|protein|thick|crispy|golden|large|half/gi, '')
        .trim().split(' ').slice(0, 3).join(',');
    
    const tags = ['food'];
    if (archetype) tags.push(archetype.toLowerCase());
    tags.push(cleanBrand);
    tags.push(cleanName);
    
    return `https://loremflickr.com/800/600/${tags.join(',')}/all`;
}

async function fetchIndianDiscovery(brandName) {
    const brand = restaurantData.find(b => b.restaurant === brandName);
    const arch = brand ? brand.archetype : "INDIAN";
    const directUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?c=Indian`;
    const proxyUrl = `/api-mealdb/filter.php?c=Indian`; 
    try {
        let resp = await fetch(directUrl).catch(() => fetch(proxyUrl));
        const data = await resp.json();
        return await processMealResults(data.meals, brandName, arch);
    } catch (e) {
        return generateSyntheticMenu(brandName, arch);
    }
}

async function processMealResults(meals, brandName, archetype) {
    if (!meals) return null;
    const brand = restaurantData.find(b => b.restaurant === brandName);
    const isGlobal = brand && ["BURGER", "CAFE", "PIZZA", "HEALTHY", "FRIED-CHICKEN", "MEXICAN"].includes(brand.archetype);

    return await Promise.all(meals.slice(0, 15).map(async (m) => {
        const name = m.strMeal || m.food_name || "Regional specialty";
        const res = await analyzeFoodLocal(name, { weight_kg: 70 });
        const finalImage = isGlobal ? getDiscoveryImage(name, brandName, archetype) : (m.strMealThumb || getDiscoveryImage(name, brandName, archetype));

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
        MCDONALDS: [
            { name: "McAloo Tikki Burger", p: 10, c: 45, f: 13, cal: 339, v: true, cat: "BURGER" },
            { name: "McChicken Burger", p: 18, c: 42, f: 18, cal: 400, v: false, cat: "BURGER" },
            { name: "Chicken Maharaja Mac", p: 32, c: 55, f: 38, cal: 689, v: false, cat: "BURGER" },
            { name: "McSpicy Chicken Burger", p: 24, c: 45, f: 20, cal: 451, v: false, cat: "BURGER" },
            { name: "McSpicy Paneer Burger", p: 22, c: 52, f: 36, cal: 652, v: true, cat: "BURGER" },
            { name: "Spicy Paneer Wrap", p: 21, c: 62, f: 38, cal: 674, v: true, cat: "WRAP" },
            { name: "Spicy Chicken Wrap", p: 28, c: 55, f: 26, cal: 567, v: false, cat: "WRAP" },
            { name: "Pizza McPuff", p: 6, c: 28, f: 10, cal: 228, v: true, cat: "SNACK" },
            { name: "World Famous Fries (Medium)", p: 4, c: 42, f: 15, cal: 317, v: true, cat: "SIDES" },
            { name: "Chicken McNuggets (6pc)", p: 16, c: 18, f: 14, cal: 254, v: false, cat: "SIDES" },
            { name: "Cold Coffee", p: 6, c: 45, f: 11, cal: 301, v: true, cat: "DRINK" },
            { name: "Masala Chai", p: 2, c: 15, f: 3, cal: 94, v: true, cat: "DRINK" }
        ],
        BURGER_KING: [
            { name: "Veg Whopper", p: 22, c: 72, f: 34, cal: 682, v: true, cat: "BURGER" },
            { name: "Chicken Whopper", p: 32, c: 48, f: 38, cal: 667, v: false, cat: "BURGER" },
            { name: "Crispy Veg Burger", p: 10, c: 45, f: 14, cal: 362, v: true, cat: "BURGER" },
            { name: "Crispy Chicken Burger", p: 18, c: 42, f: 18, cal: 359, v: false, cat: "BURGER" },
            { name: "Paneer Royale Burger", p: 18, c: 42, f: 35, cal: 558, v: true, cat: "BURGER" },
            { name: "Fiery Chicken Burger", p: 26, c: 48, f: 32, cal: 588, v: false, cat: "BURGER" },
            { name: "Paneer Royale Wrap", p: 21, c: 68, f: 35, cal: 676, v: true, cat: "WRAP" },
            { name: "Chicken Wings Fried (4pcs)", p: 24, c: 4, f: 20, cal: 300, v: false, cat: "SIDES" },
            { name: "Peri Peri Fries Medium", p: 4, c: 45, f: 15, cal: 333, v: true, cat: "SIDES" },
            { name: "Classic Cold Coffee", p: 5, c: 30, f: 8, cal: 215, v: true, cat: "DRINK" },
            { name: "Vanilla Softie", p: 3, c: 20, f: 3, cal: 115, v: true, cat: "DESSERT" }
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
            { name: "Margherita Pizza", p: 24, c: 88, f: 26, cal: 688, v: true, cat: "PIZZA" },
            { name: "Cheese n Corn Pizza", p: 24, c: 92, f: 26, cal: 709, v: true, cat: "PIZZA" },
            { name: "Farm House Pizza", p: 31, c: 92, f: 28, cal: 727, v: true, cat: "PIZZA" },
            { name: "Veggie Paradise Pizza", p: 27, c: 91, f: 28, cal: 715, v: true, cat: "PIZZA" },
            { name: "Peppy Paneer Pizza", p: 32, c: 91, f: 39, cal: 857, v: true, cat: "PIZZA" },
            { name: "Veg Extravaganza Pizza", p: 29, c: 95, f: 32, cal: 789, v: true, cat: "PIZZA" },
            { name: "Chicken Golden Delight Pizza", p: 37, c: 91, f: 27, cal: 733, v: false, cat: "PIZZA" },
            { name: "Chicken Dominator Pizza", p: 41, c: 91, f: 32, cal: 801, v: false, cat: "PIZZA" },
            { name: "Non-Veg Supreme Pizza", p: 36, c: 91, f: 30, cal: 773, v: false, cat: "PIZZA" },
            { name: "Chicken Pepperoni Pizza", p: 36, c: 89, f: 32, cal: 753, v: false, cat: "PIZZA" },
            { name: "Garlic Breadsticks", p: 5, c: 34, f: 14, cal: 288, v: true, cat: "SIDES" },
            { name: "Paneer Tikka Stuffed GB", p: 10, c: 44, f: 23, cal: 429, v: true, cat: "SIDES" },
            { name: "Choco Lava Cake", p: 6, c: 47, f: 13, cal: 327, v: true, cat: "DESSERT" },
            { name: "Taco Mexicana - Veg", p: 9, c: 59, f: 25, cal: 496, v: true, cat: "SIDES" }
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
        image: getDiscoveryImage(item.name, brandName, archetype),
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

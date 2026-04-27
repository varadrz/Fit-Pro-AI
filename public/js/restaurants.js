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

const archetypeToUnsplash = {
    MCDONALDS: '1571091718767-18b5b1457add',
    BURGER_KING: '1561758033-d89a9ad46330',
    PIZZA: '1513104890138-7c749659a591',
    CAFE: '1541167760496-1628856ab752',
    INDIAN: '1631452180519-c014fe946bc7',
    HEALTHY: '1546069901-ba9599a7e63c',
    WRAP: '1626700051175-6818013e1d4f',
    SIDES: '1573080496219-bb080dd4f877',
    DRINK: '1544145945-f904253db0ad',
    DESSERT: '1563729784-498ae8d2a215'
};

function getDiscoveryImage(foodName, brandName, archetype) {
    // 100% Guaranteed Food Images from Curated Unsplash IDs
    const id = archetypeToUnsplash[brandName] || archetypeToUnsplash[archetype] || archetypeToUnsplash.INDIAN;
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
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
            { name: "McAloo Tikki Burger", p: 10, c: 45, f: 13, cal: 339, v: true, cat: "BURGER", ing: ["Potato Patty", "Green Peas", "Toasted Bun", "Tomato", "Onion", "Spicy Mayo"] },
            { name: "McChicken Burger", p: 18, c: 42, f: 18, cal: 400, v: false, cat: "BURGER", ing: ["Classic Chicken Patty", "Iceberg Lettuce", "Creamy Mayo", "Premium Bun"] },
            { name: "Chicken Maharaja Mac", p: 32, c: 55, f: 38, cal: 689, v: false, cat: "BURGER", ing: ["Dual Grilled Chicken Patties", "Habanero Sauce", "Jalapenos", "Cheddar Cheese", "Triple Bun"] },
            { name: "McSpicy Chicken Burger", p: 24, c: 45, f: 20, cal: 451, v: false, cat: "BURGER", ing: ["Spicy Fried Chicken", "Shredded Lettuce", "Veg Sauce", "Sesame Bun"] },
            { name: "McSpicy Paneer Burger", p: 22, c: 52, f: 36, cal: 652, v: true, cat: "BURGER", ing: ["Spicy Paneer Patty", "Veg Sauce", "Lettuce", "Premium Bun"] },
            { name: "Spicy Paneer Wrap", p: 21, c: 62, f: 38, cal: 674, v: true, cat: "WRAP", ing: ["Grilled Paneer", "Whole Wheat Wrap", "Salad Mix", "Chipotle Sauce"] },
            { name: "Spicy Chicken Wrap", p: 28, c: 55, f: 26, cal: 567, v: false, cat: "WRAP", ing: ["Roasted Chicken Strips", "Tortilla", "Onion Mix", "Green Chilli Sauce"] },
            { name: "Pizza McPuff", p: 6, c: 28, f: 10, cal: 228, v: true, cat: "SNACK", ing: ["Wheat Flour Shell", "Pizza Sauce", "Capsicum", "Corn", "Processed Cheese"] },
            { name: "World Famous Fries (M)", p: 4, c: 42, f: 15, cal: 317, v: true, cat: "SIDES", ing: ["Russet Potatoes", "Vegetable Oil", "Iodized Salt"] },
            { name: "Chicken McNuggets (6pc)", p: 16, c: 18, f: 14, cal: 254, v: false, cat: "SIDES", ing: ["Tender Chicken Meat", "Battering", "Light Seasoning"] },
            { name: "Cold Coffee", p: 6, c: 45, f: 11, cal: 301, v: true, cat: "DRINK", ing: ["Arabica Coffee", "Milk Solids", "Sugar Syrup", "Ice"] },
            { name: "Masala Chai", p: 2, c: 15, f: 3, cal: 94, v: true, cat: "DRINK", ing: ["Brewed Tea", "Cardamom", "Ginger", "Whole Milk", "Sugar"] }
        ],
        BURGER_KING: [
            { name: "Veg Whopper", p: 22, c: 72, f: 34, cal: 682, v: true, cat: "BURGER", ing: ["Veg Patty", "Onions", "Lettuce", "Mayo", "Sesame Bun"] },
            { name: "Chicken Whopper", p: 32, c: 48, f: 38, cal: 667, v: false, cat: "BURGER", ing: ["Flame-Grilled Chicken", "Pickles", "Lettuce", "Mayo", "Big Bun"] }
        ],
        CAFE: [
            { name: "Java Chip Frappuccino", p: 6, c: 72, f: 18, cal: 470, v: true, cat: "DRINK", ing: ["Coffee Base", "Chocolate Chips", "Whipped Cream", "Mocha Sauce"] },
            { name: "Paneer Tikka Sandwich", p: 18, c: 45, f: 14, cal: 380, v: true, cat: "SNACK", ing: ["Multi-grain Bread", "Spicy Paneer Tikka", "Mint Chutney", "Capsicum"] }
        ],
        PIZZA: [
            { name: "Margherita Pizza", p: 24, c: 88, f: 26, cal: 688, v: true, cat: "PIZZA", ing: ["Mozzarella Cheese", "Tomato Sauce", "Basil Leaves", "Hand-tossed Crust"] },
            { name: "Chicken Dominator Pizza", p: 41, c: 91, f: 32, cal: 801, v: false, cat: "PIZZA", ing: ["Grilled Chicken", "Chicken Tikka", "Chicken Keema", "Peri Peri Sauce"] }
        ],
        INDIAN: [
            { name: "Paneer Butter Masala", p: 18, c: 12, f: 32, cal: 420, v: true, cat: "CURRY", ing: ["Soft Paneer Cubes", "Rich Tomato Gravy", "Fresh Cream", "Indian Spices"] },
            { name: "Butter Chicken Supreme", p: 32, c: 8, f: 24, cal: 380, v: false, cat: "CURRY", ing: ["Marinated Chicken", "Butter Gravy", "Milk Cream", "Kasuri Methi"] }
        ]
    };

    const pool = templates[archetype] || templates.INDIAN;
    return pool.map(item => ({
        ...item,
        id: Math.random(), brand: brandName,
        protein_g: item.p, carbs_g: item.c, fats_g: item.f, calories: item.cal,
        type: item.v ? 'veg' : 'non-veg',
        category: item.cat || "REGIONAL",
        image: item.img || getDiscoveryImage(item.name, brandName, archetype),
        ingredients: item.ing || ['Brand Core', 'Regional Base'],
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

    ingList.innerHTML = `<ul style="list-style: disc; padding-left: 20px; color: rgba(255,255,255,0.7); font-size: 0.85rem; line-height: 1.6;">
        ${dish.ingredients.map(i => `<li>${i}</li>`).join("")}
    </ul>`;
    modal.style.display = "flex";
    
    // GSAP Reveal for premium feel
    if (window.gsap) {
        gsap.fromTo(".modal-content", 
            { opacity: 0, y: 50 }, 
            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
        );
    }

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
}

function initRestaurantExplorer() {
    const list = document.querySelector("#brand-list");
    const menuContainer = document.querySelector("#menu-container");
    const modal = document.querySelector("#dish-modal");
    const closeBtn = document.querySelector("#close-modal");

    // Modal Close Logic - Set once for reliability
    if (modal && closeBtn) {
        const closeModal = () => {
            modal.style.display = "none";
            window.history.pushState({}, '', '/restaurant-lab');
        };

        closeBtn.onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
        });
    }
    let sel = null, currGoal = "all";

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
                // Reset filters to show ALL menu by default when clicking a brand
                currGoal = "all";
                document.querySelectorAll(".goal-btn").forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.goal === 'all') btn.classList.add('active');
                });
                document.querySelector("#menu-sort").value = "none";
                
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

        const isVegOnly = document.querySelector("#diet-switch").checked;
        const sortBy = document.querySelector("#menu-sort").value;

        // Enrich data with estimated values if missing
        const enriched = items.map(item => {
            if (item._enriched) return item;
            item.fiber_g = item.fiber_g || Math.round(item.carbs_g * 0.15 + 2);
            item.sugar_g = item.sugar_g || Math.round(item.carbs_g * 0.2);
            item.sodium_mg = item.sodium_mg || Math.round(item.calories * 0.8 + 100);
            item._enriched = true;
            return item;
        });

        let filtered = enriched.filter(i => {
            // New Goal Filters (Macro based)
            let passGoal = true;
            if (currGoal === "high-protein") passGoal = i.protein_g > 20;
            else if (currGoal === "low-carbs") passGoal = i.carbs_g < 25;
            else if (currGoal === "low-calories") passGoal = i.calories < 450;
            else if (currGoal === "low-fat") passGoal = i.fats_g < 12;
            else if (currGoal === "high-fiber") passGoal = i.fiber_g > 5;

            // Sort-based Filters (Focus)
            let passFocus = true;
            if (sortBy === "fat-loss") passFocus = (i.calories < 500 && i.protein_g > 15);
            else if (sortBy === "muscle-gain") passFocus = (i.protein_g > 25 || (i.protein_g > 15 && i.calories > 600));
            else if (sortBy === "diabetic") passFocus = (i.carbs_g < 30 && i.sugar_g < 5);
            else if (sortBy === "heart") passFocus = (i.fats_g < 15 && i.sodium_mg < 600);

            let passDiet = isVegOnly ? i.type === 'veg' : true;

            return passGoal && passFocus && passDiet;
        });

        // Sorting Logic (Traditional)
        if (sortBy === "high-protein") filtered.sort((a,b) => b.protein_g - a.protein_g);
        else if (sortBy === "protein-per-cal") filtered.sort((a,b) => (b.protein_g/b.calories) - (a.protein_g/a.calories));
        else if (sortBy === "low-cal") filtered.sort((a,b) => a.calories - b.calories);
        else if (sortBy === "low-fat") filtered.sort((a,b) => a.fats_g - b.fats_g);
        else if (sortBy === "satiety") filtered.sort((a,b) => (b.protein_g + b.fiber_g * 2) - (a.protein_g + a.fiber_g * 2));

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = `card menu-card reveal-up ${item.type}`;
            
            // Dynamic Tags Heuristic
            let tags = [];
            if (item.protein_g > 25) tags.push({text: "Protein Power", color: "#06b6d4"});
            if (item.carbs_g < 10) tags.push({text: "Keto Pick", color: "#f59e0b"});
            if (item.fiber_g > 6) tags.push({text: "High Fiber", color: "#8b5cf6"});
            if (item.type === 'veg' && item.protein_g > 15) tags.push({text: "Veg Pro", color: "#22c55e"});

            card.innerHTML = `
                <div class="menu-image-wrap" style="position:relative; overflow:hidden; background: #000;">
                    <img src="${item.image}" alt="${item.name}" style="width:100%; height:180px; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80'">
                    <div class="diet-symbol ${item.type === 'veg' ? 'veg-symbol' : 'nonveg-symbol'}" style="position:absolute; top:12px; right:12px; z-index:2;"></div>
                    <div class="tags-container" style="position: absolute; bottom: 10px; left: 10px; display: flex; gap: 4px; flex-wrap: wrap; z-index:2; padding-right: 20px;">
                        ${tags.map(t => `<span style="background: ${t.color}; color: white; font-size: 0.5rem; padding: 2px 6px; border-radius: 4px; font-weight: 800; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.2);">${t.text}</span>`).join("")}
                    </div>
                </div>
                <div class="menu-card-content">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h4 style="margin:0; font-size:0.95rem; font-weight:700;">${item.name}</h4>
                    </div>
                    <p style="font-size:0.65rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; margin: 4px 0 12px;">${item.category} • ${item.brand}</p>
                    <div class="menu-macros" style="display:flex; justify-content: space-between; align-items:center; font-size:0.7rem; font-weight:600; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">
                        <div style="display:flex; gap:8px; color:rgba(255,255,255,0.6);">
                            <span>P ${item.protein_g}g</span>
                            <span>C ${item.carbs_g}g</span>
                            <span>F ${item.fats_g}g</span>
                        </div>
                        <span style="color: #fff; font-weight:700;">${item.calories} <small>KCAL</small></span>
                    </div>
                </div>
            `;
            card.onclick = () => showDishDetail(item);
            menuContainer.appendChild(card);
        });
        
        gsap.from(".menu-card", { y: 20, opacity: 0, stagger: 0.05, duration: 0.6, ease: "power4.out" });
    }

    document.querySelector("#res-search").oninput = (e) => renderB(e.target.value);
    document.querySelector("#diet-switch").onchange = () => { if (sel) fetchDynamicMenu(sel).then(renderM); };
    document.querySelector("#menu-sort").onchange = () => { if (sel) fetchDynamicMenu(sel).then(renderM); };
    
    const goalBtns = document.querySelectorAll(".goal-btn");
    goalBtns.forEach(b => {
        b.onclick = () => {
            goalBtns.forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            currGoal = b.dataset.goal;
            if (sel) fetchDynamicMenu(sel).then(renderM);
        };
    });

    renderB();
}

window.initRestaurantExplorer = initRestaurantExplorer;

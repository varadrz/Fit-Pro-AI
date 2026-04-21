const restaurantData = [
    {
        "restaurant": "Subway",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Subway_2016_logo.svg",
        "menu_items": [
            { "name": "Veggie Delight", "type": "veg", "calories": 230, "protein_g": 8, "carbs_g": 40, "fats_g": 3, "image": "https://images.unsplash.com/photo-1534352956272-46522f990f77?auto=format&fit=crop&w=600&q=80" },
            { "name": "Paneer Tikka Sub", "type": "veg", "calories": 320, "protein_g": 18, "carbs_g": 35, "fats_g": 10, "image": "https://images.unsplash.com/photo-1626733130541-b945d83bb37e?auto=format&fit=crop&w=600&q=80" },
            { "name": "Roasted Chicken", "type": "non-veg", "calories": 310, "protein_g": 24, "carbs_g": 38, "fats_g": 6, "image": "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    {
        "restaurant": "McDonald's",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg",
        "menu_items": [
            { "name": "McAloo Tikki", "type": "veg", "calories": 340, "protein_g": 10, "carbs_g": 45, "fats_g": 12, "image": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80" },
            { "name": "McVeggie", "type": "veg", "calories": 420, "protein_g": 12, "carbs_g": 52, "fats_g": 18, "image": "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=600&q=80" },
            { "name": "McChicken", "type": "non-veg", "calories": 400, "protein_g": 15, "carbs_g": 42, "fats_g": 20, "image": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    {
        "restaurant": "Domino's",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/7/74/Dominos_pizza_logo.svg",
        "menu_items": [
            { "name": "Margherita", "type": "veg", "calories": 250, "protein_g": 10, "carbs_g": 30, "fats_g": 12, "image": "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=600&q=80" },
            { "name": "Peppy Paneer", "type": "veg", "calories": 280, "protein_g": 14, "carbs_g": 32, "fats_g": 15, "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80" },
            { "name": "Chicken Dominator", "type": "non-veg", "calories": 320, "protein_g": 22, "carbs_g": 28, "fats_g": 18, "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    {
        "restaurant": "KFC",
        "logo": "https://upload.wikimedia.org/wikipedia/en/b/bf/KFC_logo.svg",
        "menu_items": [
            { "name": "Veg Zinger", "type": "veg", "calories": 410, "protein_g": 12, "carbs_g": 48, "fats_g": 18, "image": "https://images.unsplash.com/photo-1585238341267-1cfec2046a55?auto=format&fit=crop&w=600&q=80" },
            { "name": "Chicken Zinger", "type": "non-veg", "calories": 450, "protein_g": 22, "carbs_g": 40, "fats_g": 24, "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80" },
            { "name": "Popcorn Chicken", "type": "non-veg", "calories": 350, "protein_g": 18, "carbs_g": 25, "fats_g": 20, "image": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    {
        "restaurant": "Pizza Hut",
        "logo": "https://upload.wikimedia.org/wikipedia/en/d/d2/Pizza_Hut_logo.svg",
        "menu_items": [
            { "name": "Country Feast", "type": "veg", "calories": 260, "protein_g": 9, "carbs_g": 32, "fats_g": 11, "image": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80" },
            { "name": "Tandoori Paneer", "type": "veg", "calories": 290, "protein_g": 13, "carbs_g": 34, "fats_g": 14, "image": "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80" },
            { "name": "Chicken Supreme", "type": "non-veg", "calories": 310, "protein_g": 20, "carbs_g": 30, "fats_g": 16, "image": "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=600&q=80" }
        ]
    }
];

function initRestaurantExplorer() {
    const list = document.querySelector("#brand-list");
    const menuContainer = document.querySelector("#menu-container");
    const filters = document.querySelectorAll(".filter-btn");

    let currF = "all", sel = null;

    function renderB(q = "") {
        list.innerHTML = "";
        const f = restaurantData.filter(x => x.restaurant.toLowerCase().includes(q.toLowerCase()));
        f.forEach(b => {
            const d = document.createElement('div');
            d.className = `card brand-card ${sel === b.restaurant ? 'active' : ''}`;
            d.innerHTML = `
                <div style="height:40px; display:flex; align-items:center; justify-content:center; margin-bottom:0.5rem;">
                    <img src="${b.logo}" alt="${b.restaurant}" style="max-height: 100%; max-width: 80px;">
                </div>
                <h4 style="font-size:0.9rem;">${b.restaurant}</h4>
            `;
            d.onclick = () => { sel = b.restaurant; renderB(q); renderM(); };
            list.appendChild(d);
        });
    }

    function renderM() {
        if (!sel) return menuContainer.innerHTML = "<p style='grid-column: 1/-1; text-align: center; opacity: 0.5;'>Select a brand to view delicious options</p>";
        const b = restaurantData.find(x => x.restaurant === sel);
        let items = [...b.menu_items];
        
        if(currF === 'veg') items = items.filter(i=>i.type==='veg');
        if(currF === 'non-veg') items = items.filter(i=>i.type==='non-veg');
        if(currF === 'high-protein') items.sort((a,b)=>b.protein_g - a.protein_g);
        if(currF === 'low-carbs') items.sort((a,b)=>a.carbs_g - b.carbs_g);
        if(currF === 'low-calories') items.sort((a,b)=>a.calories - b.calories);

        menuContainer.innerHTML = items.map(i => `
            <div class="card menu-item-card">
                <img src="${i.image}" class="menu-img" alt="${i.name}">
                <div class="menu-info">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="margin:0;">${i.name}</h4>
                        <span style="font-size:1rem;">${i.type==='veg'?'🟩':'🟥'}</span>
                    </div>
                    <div style="display:flex; gap:12px; font-size:0.7rem; color:var(--text-muted); font-weight:600;">
                        <span>🔥 ${i.calories} kcal</span>
                        <span>🥩 ${i.protein_g}g Prot</span>
                        <span>🍞 ${i.carbs_g}g Carb</span>
                    </div>
                </div>
            </div>
        `).join("");
    }

    const searchInput = document.querySelector("#res-search");
    if(searchInput) {
        searchInput.oninput = (e) => renderB(e.target.value);
    }
    
    filters.forEach(btn => {
        btn.onclick = () => {
            filters.forEach(x => x.classList.remove('active'));
            btn.classList.add('active');
            currF = btn.dataset.filter;
            renderM();
        };
    });

    renderB();
    renderM();
}

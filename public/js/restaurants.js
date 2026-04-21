const restaurantData = [
    {
        "restaurant": "Subway",
        "logo": "https://logo.clearbit.com/subway.com",
        "menu_items": [
            { "name": "Veggie Delight", "type": "veg", "calories": 230, "protein_g": 8, "carbs_g": 40, "fats_g": 3, "image": "https://images.unsplash.com/photo-1592415499556-74fcb9f18667?auto=format&fit=crop&w=600&q=80" },
            { "name": "Paneer Tikka Sub", "type": "veg", "calories": 320, "protein_g": 18, "carbs_g": 35, "fats_g": 10, "image": "https://images.unsplash.com/photo-1601050690597-df0568f70932?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    {
        "restaurant": "McDonald's",
        "logo": "https://logo.clearbit.com/mcdonalds.com",
        "menu_items": [
            { "name": "McAloo Tikki", "type": "veg", "calories": 340, "protein_g": 10, "carbs_g": 45, "fats_g": 12, "image": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80" },
            { "name": "McChicken", "type": "non-veg", "calories": 400, "protein_g": 15, "carbs_g": 42, "fats_g": 20, "image": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80" }
        ]
    },
    {
        "restaurant": "Domino's",
        "logo": "https://logo.clearbit.com/dominos.com",
        "menu_items": [
            { "name": "Margherita", "type": "veg", "calories": 250, "protein_g": 10, "carbs_g": 30, "fats_g": 12, "image": "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=600&q=80" },
            { "name": "Chicken Dominator", "type": "non-veg", "calories": 320, "protein_g": 22, "carbs_g": 28, "fats_g": 18, "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=600&q=80" }
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
                <img src="${b.logo}" alt="${b.restaurant}" style="height: 40px; margin-bottom: 0.5rem; display: block; margin-left: auto; margin-right: auto;">
                <h4>${b.restaurant}</h4>
            `;
            d.onclick = () => { sel = b.restaurant; renderB(q); renderM(); };
            list.appendChild(d);
        });
    }

    function renderM() {
        if (!sel) return menuContainer.innerHTML = "<p>Select a brand</p>";
        const b = restaurantData.find(x => x.restaurant === sel);
        let items = [...b.menu_items];
        
        if(currF === 'veg') items = items.filter(i=>i.type==='veg');
        if(currF === 'non-veg') items = items.filter(i=>i.type==='non-veg');
        if(currF === 'high-protein') items.sort((a,b)=>b.protein_g - a.protein_g);
        if(currF === 'low-carbs') items.sort((a,b)=>a.carbs_g - b.carbs_g);
        if(currF === 'low-calories') items.sort((a,b)=>a.calories - b.calories);

        menuContainer.innerHTML = items.map(i => `
            <div class="card menu-item-card">
                <div style="height: 150px; background: url('${i.image}') center/cover; border-radius: 8px; margin-bottom: 10px;"></div>
                <h4>${i.name} ${i.type==='veg'?'🟩':'🟥'}</h4>
                <div style="font-size:0.8rem; color:#ccc;">
                    Cal: ${i.calories} | Prot: ${i.protein_g}g | Carb: ${i.carbs_g}g
                </div>
            </div>
        `).join("");
    }

    document.querySelector("#res-search").oninput = (e) => renderB(e.target.value);
    
    filters.forEach(btn => {
        btn.onclick = () => {
            filters.forEach(x => x.classList.remove('active'));
            btn.classList.add('active');
            currF = btn.dataset.filter;
            renderM();
        };
    });

    renderB();
}

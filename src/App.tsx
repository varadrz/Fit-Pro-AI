import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { analyzeFoodServerless } from './utils/ai';

gsap.registerPlugin(ScrollTrigger);

// --- Data ---
const restaurantData = [
  {
    restaurant: "McDonald's",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg",
    menu_items: [
      { name: "McAloo Tikki", type: "veg", calories: 340, protein_g: 10, carbs_g: 45, fats_g: 12, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { name: "McChicken", type: "non-veg", calories: 400, protein_g: 15, carbs_g: 42, fats_g: 20, image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400" }
    ]
  },
  {
    restaurant: "Subway",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Subway_2016_logo.svg",
    menu_items: [
      { name: "Veggie Delight", type: "veg", calories: 230, protein_g: 8, carbs_g: 40, fats_g: 3, image: "https://images.unsplash.com/photo-1534352956272-46522f990f77?w=400" },
      { name: "Roasted Chicken", type: "non-veg", calories: 310, protein_g: 24, carbs_g: 38, fats_g: 6, image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400" }
    ]
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('/');
  const [mealInput, setMealInput] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const data = await analyzeFoodServerless(mealInput, { weight: 70, age: 25, lifestyle: "moderate" });
      setAnalysis(data);
    } catch (e) {
      console.error(e);
      setAnalysis({ error: "Failed to connect to AI service." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="logo text-xl font-black cursor-pointer" onClick={() => setActiveTab('/')}>VITALITY.<span className="text-cyan-400">AI</span></div>
          <div className="flex gap-6">
            {['/', '/nutrition', '/restaurant-lab', '/fitness-lab'].map(tab => (
               <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium transition-colors ${activeTab === tab ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}
               >
                 {tab === '/' ? 'Home' : tab.replace('/','').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
               </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {activeTab === '/' && <Hero onStart={() => setActiveTab('/nutrition')} />}
        
        {activeTab === '/nutrition' && (
          <section className="container mx-auto px-6 py-12">
            <h2 className="text-4xl font-bold mb-12">Health <span className="text-cyan-400">Intelligence</span></h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">Log Your Food</h3>
                <textarea 
                  value={mealInput} 
                  onChange={(e) => setMealInput(e.target.value)}
                  placeholder="e.g. 2 idli, 1 bowl sambar"
                  className="w-full h-32 bg-black/30 border border-slate-800 rounded-xl p-4 text-white mb-6 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
                <button 
                  className={`w-full py-4 rounded-xl font-bold transition-all ${loading ? 'bg-slate-700' : 'bg-cyan-500 hover:bg-cyan-400 text-black'}`}
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Analyze Health Profile'}
                </button>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-6">AI Risk Insights</h3>
                {analysis?.error ? (
                  <div className="border border-red-500/50 bg-red-500/10 p-4 rounded-xl text-red-400 text-sm">{analysis.error}</div>
                ) : analysis ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest">Est. Protein</p>
                        <p className="text-3xl font-black text-cyan-400">{analysis.proteinContent}</p>
                      </div>
                    </div>
                    {analysis.risk_summary?.map((r: any, i: number) => (
                      <div key={i} className="flex gap-4">
                        <div className={`mt-2 h-2 w-2 rounded-full shrink-0 ${r.risk_level === 'high' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-green-500'}`} />
                        <div>
                          <h4 className="font-bold text-slate-200 capitalize">{r.condition} Health</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{r.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-slate-500 italic text-center py-10">Analysis results will appear here.</div>}
              </div>
            </div>
          </section>
        )}

        {activeTab === '/restaurant-lab' && (
          <section className="container mx-auto px-6 py-12">
            <h2 className="text-4xl font-bold mb-12">Restaurant <span className="text-cyan-400">Lab</span></h2>
            <div className="flex gap-4 overflow-x-auto pb-6 mb-10">
              {restaurantData.map(b => (
                <div 
                  key={b.restaurant}
                  onClick={() => setSelectedBrand(b.restaurant)}
                  className={`min-w-[140px] p-6 rounded-2xl border cursor-pointer transition-all ${selectedBrand === b.restaurant ? 'border-cyan-400 bg-cyan-400/5' : 'border-slate-800 bg-slate-900/50'}`}
                >
                  <img src={b.logo} className="h-10 mx-auto mb-3" alt={b.restaurant} />
                  <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-tighter">{b.restaurant}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {selectedBrand && restaurantData.find(b => b.restaurant === selectedBrand)?.menu_items.map(item => (
                <div key={item.name} className="group bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden hover:border-cyan-400/50 transition-all">
                  <div className="h-48 bg-slate-800 overflow-hidden">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-6">
                    <div className={`h-1.5 w-8 rounded-full mb-4 ${item.type === 'veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <h4 className="text-xl font-bold mb-2">{item.name}</h4>
                    <div className="flex gap-4">
                      <div className="bg-black/40 px-3 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Calories</span>
                        <span className="text-xs font-bold text-cyan-400">{item.calories} kCal</span>
                      </div>
                      <div className="bg-black/40 px-3 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Protein</span>
                        <span className="text-xs font-bold text-cyan-400">{item.protein_g}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === '/fitness-lab' && (
          <section className="container mx-auto px-6 py-12">
            <h2 className="text-4xl font-bold mb-12">Fitness <span className="text-cyan-400">Lab</span></h2>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 relative aspect-video bg-black rounded-3xl border border-slate-800 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-cyan-400 font-mono text-sm tracking-tighter uppercase animate-pulse">Waiting for Camera Access...</p>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
                <h3 className="text-xl font-bold mb-6">Live Squat Analysis</h3>
                <ul className="space-y-4 mb-10">
                  {['Keep back straight', 'Reach 90° depth', 'Maintain stable base'].map(target => (
                    <li key={target} className="flex items-center gap-3 text-slate-400 text-sm">
                      <div className="h-5 w-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">○</div>
                      {target}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all">Initialize Tracker</button>
              </div>
            </div>
          </section>
        )}
      </main>

      {activeTab !== '/' && (
        <footer className="container mx-auto px-6 py-10 mt-10 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-xs tracking-widest uppercase">&copy; 2026 Vitality AI. Serverless Edge Computing.</p>
        </footer>
      )}
    </div>
  );
};

const Hero: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const sections = gsap.utils.toArray('.story-section');
    
    const pin = gsap.to(containerRef.current, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${(sections.length - 1) * 100}%`,
        pin: true,
        scrub: 1,
        anticipatePin: 1
      }
    });

    sections.forEach((section: any, i: number) => {
      const content = section.querySelector('.story-content');
      const isLast = i === sections.length - 1;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
      });

      if (i === 0) {
        tl.to(content, { opacity: 1, y: 0, scale: 1, duration: 1 })
          .to(content, { opacity: 0, y: -100, scale: 0.9, duration: 2 }, "+=1");
      } else {
        tl.fromTo(content, { opacity: 0, y: 150, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 1.5 });
        if (!isLast) {
          tl.to(content, { opacity: 0, y: -150, scale: 1.2, duration: 1.5 }, "+=1");
        } else {
          tl.to(content, { opacity: 1, y: 0, duration: 2 });
        }
      }
    });

    return () => { pin.kill(); ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <div className="story-scroll-container" ref={containerRef}>
       <div className="story-section h-screen flex items-center justify-center p-6">
        <div className="story-content text-center max-w-4xl">
          <h2 className="text-7xl font-black mb-8 leading-tight">🍛 Hidden <span className="text-cyan-400">Gaps</span><br/>In Your Diet</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">Modern life obscures deficiencies. We use intelligence to reveal them.</p>
        </div>
      </div>
      <div className="story-section h-screen flex items-center justify-center p-6">
        <div className="story-content text-center max-w-4xl">
          <h2 className="text-7xl font-black mb-8 leading-tight">✅ Intelligent <span className="text-cyan-400">Correction</span></h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">Seamlessly pivot from empty calories to high-performance fuel.</p>
        </div>
      </div>
      <div className="story-section h-screen flex items-center justify-center p-6">
        <div className="story-content text-center max-w-4xl">
          <h2 className="text-7xl font-black mb-8 leading-tight">💪 Own Your <span className="text-cyan-400">Vitals</span></h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">Real-time posture tracking meets nutrition brilliance.</p>
          <button className="px-10 py-5 bg-cyan-500 text-black font-black uppercase rounded-2xl hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]" onClick={onStart}>Enter Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default App;

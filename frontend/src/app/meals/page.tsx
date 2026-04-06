'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { Meal, Food } from '@/types';
import {
  Plus, Search, X, Trash2, Sunrise, Sun, Moon, Apple, UtensilsCrossed, Loader2,
  Sparkles, Camera, ChevronDown, ChevronUp, Flame, Beef, Wheat, Droplet,
} from 'lucide-react';

interface MealItemForm {
  food_id: string | null;
  custom_name: string;
  quantity_g: number;
  calories: number | null;
  protein: number;
  carbs: number;
  fat: number;
  food_name: string;
  photo_preview: string | null;
  // Per-100g base values for recalculation
  cal_per_100: number;
  protein_per_100: number;
  carbs_per_100: number;
  fat_per_100: number;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Kahvaltı', Icon: Sunrise },
  { value: 'lunch', label: 'Öğle', Icon: Sun },
  { value: 'dinner', label: 'Akşam', Icon: Moon },
  { value: 'snack', label: 'Atıştırmalık', Icon: Apple },
];

const MEAL_LABEL_MAP: Record<string, string> = {
  breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam', snack: 'Atıştırmalık',
};

const MEAL_ICON_MAP: Record<string, typeof Sunrise> = {
  breakfast: Sunrise, lunch: Sun, dinner: Moon, snack: Apple,
};

// Popular Turkish foods for quick-pick (matches seed data names)
const POPULAR_FOODS = [
  { name: 'Tavuk göğsü (ızgara)', cal: 165, p: 31, c: 0, f: 3.6, portion: 150, category: 'protein' },
  { name: 'Pilav', cal: 130, p: 2.7, c: 28, f: 0.3, portion: 200, category: 'grain' },
  { name: 'Mercimek çorbası', cal: 56, p: 3.5, c: 9, f: 0.8, portion: 300, category: 'soup' },
  { name: 'Yumurta (haşlanmış)', cal: 155, p: 13, c: 1.1, f: 11, portion: 60, category: 'protein' },
  { name: 'Yoğurt (tam yağlı)', cal: 61, p: 3.5, c: 4.7, f: 3.3, portion: 200, category: 'dairy' },
  { name: 'Ekmek (beyaz)', cal: 265, p: 9, c: 49, f: 3.2, portion: 50, category: 'grain' },
  { name: 'Köfte', cal: 250, p: 17, c: 7, f: 17, portion: 80, category: 'protein' },
  { name: 'Salata (karışık)', cal: 20, p: 1, c: 4, f: 0.2, portion: 200, category: 'vegetable' },
];

export default function MealsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [items, setItems] = useState<MealItemForm[]>([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodResults, setFoodResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPopular, setShowPopular] = useState(true);
  const [mealPhoto, setMealPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) loadMeals();
  }, [user, authLoading]);

  const loadMeals = () => {
    const today = new Date().toISOString().split('T')[0];
    api.get<Meal[]>(`/api/meals?target_date=${today}`).then(setMeals);
  };

  const searchFoods = useCallback(async (q: string) => {
    if (q.length < 2) { setFoodResults([]); return; }
    const results = await api.get<Food[]>(`/api/meals/foods?q=${encodeURIComponent(q)}`);
    setFoodResults(results);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchFoods(foodSearch), 300);
    return () => clearTimeout(timer);
  }, [foodSearch, searchFoods]);

  const addFoodItem = (food: Food) => {
    const ratio = food.default_portion_g / 100;
    setItems(prev => [...prev, {
      food_id: food.id, custom_name: '', quantity_g: food.default_portion_g,
      calories: Math.round(food.calories_per_100g * ratio),
      protein: Math.round(food.protein_per_100g * ratio * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * ratio * 10) / 10,
      fat: Math.round(food.fat_per_100g * ratio * 10) / 10,
      food_name: food.name, photo_preview: null,
      cal_per_100: food.calories_per_100g,
      protein_per_100: food.protein_per_100g,
      carbs_per_100: food.carbs_per_100g,
      fat_per_100: food.fat_per_100g,
    }]);
    setFoodSearch('');
    setFoodResults([]);
  };

  const addPopularFood = (food: typeof POPULAR_FOODS[0]) => {
    const ratio = food.portion / 100;
    setItems(prev => [...prev, {
      food_id: null, custom_name: food.name, quantity_g: food.portion,
      calories: Math.round(food.cal * ratio),
      protein: Math.round(food.p * ratio * 10) / 10,
      carbs: Math.round(food.c * ratio * 10) / 10,
      fat: Math.round(food.f * ratio * 10) / 10,
      food_name: food.name, photo_preview: null,
      cal_per_100: food.cal,
      protein_per_100: food.p,
      carbs_per_100: food.c,
      fat_per_100: food.f,
    }]);
  };

  const addCustomItem = () => {
    setItems(prev => [...prev, {
      food_id: null, custom_name: '', quantity_g: 100, calories: 0,
      protein: 0, carbs: 0, fat: 0, food_name: '', photo_preview: null,
      cal_per_100: 0, protein_per_100: 0, carbs_per_100: 0, fat_per_100: 0,
    }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      // Recalculate calories and macros when quantity changes
      if (field === 'quantity_g' && updated.cal_per_100 > 0) {
        const ratio = value / 100;
        updated.calories = Math.round(updated.cal_per_100 * ratio);
        updated.protein = Math.round(updated.protein_per_100 * ratio * 10) / 10;
        updated.carbs = Math.round(updated.carbs_per_100 * ratio * 10) / 10;
        updated.fat = Math.round(updated.fat_per_100 * ratio * 10) / 10;
      }
      return updated;
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMealPhoto(url);
    }
  };

  const submitMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || items.length === 0) return;
    setLoading(true);
    try {
      await api.post('/api/meals', {
        title, meal_type: mealType, description: null,
        items: items.map(i => ({
          food_id: i.food_id, custom_name: i.food_id ? null : i.custom_name,
          quantity_g: i.quantity_g, calories: i.calories,
          protein: i.protein, carbs: i.carbs, fat: i.fat,
        })),
      });
      setShowForm(false); setTitle(''); setItems([]); setMealPhoto(null);
      loadMeals();
    } catch {}
    setLoading(false);
  };

  const deleteMeal = async (id: string) => {
    await api.delete(`/api/meals/${id}`);
    loadMeals();
  };

  const totalCalories = meals.reduce((s, m) => s + m.total_calories, 0);
  const goal = user?.daily_calorie_goal || 2000;
  const pct = goal > 0 ? Math.min(100, (totalCalories / goal) * 100) : 0;

  const totalMacros = meals.reduce(
    (acc, m) => {
      m.items.forEach(item => {
        acc.protein += item.protein || 0;
        acc.carbs += item.carbs || 0;
        acc.fat += item.fat || 0;
      });
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <AppShell>
      <div className="space-y-3 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-primary-500" />
            <h1 className="text-heading">Öğünler</h1>
          </div>
          <div className="text-right">
            <p className="text-body font-bold">{totalCalories} <span className="text-surface-400 font-normal">/ {goal} kcal</span></p>
            <div className="w-24 bg-surface-100 dark:bg-surface-700 rounded-full h-1.5 mt-1">
              <div className={`h-1.5 rounded-full transition-all ${pct > 100 ? 'bg-danger' : 'bg-primary-500'}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Daily macro summary */}
        {meals.length > 0 && (
          <div className="flex gap-3 text-center">
            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-btn p-2">
              <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                <Beef size={12} />
                <span className="text-micro font-semibold">Protein</span>
              </div>
              <p className="text-body font-bold text-blue-700 dark:text-blue-300">{Math.round(totalMacros.protein)}g</p>
            </div>
            <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-btn p-2">
              <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                <Wheat size={12} />
                <span className="text-micro font-semibold">Karb</span>
              </div>
              <p className="text-body font-bold text-amber-700 dark:text-amber-300">{Math.round(totalMacros.carbs)}g</p>
            </div>
            <div className="flex-1 bg-rose-50 dark:bg-rose-900/20 rounded-btn p-2">
              <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400">
                <Droplet size={12} />
                <span className="text-micro font-semibold">Yağ</span>
              </div>
              <p className="text-body font-bold text-rose-700 dark:text-rose-300">{Math.round(totalMacros.fat)}g</p>
            </div>
          </div>
        )}

        {/* Add meal */}
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus size={18} /> Öğün Ekle
          </button>
        ) : (
          <form onSubmit={submitMeal} className="card p-4 space-y-4">
            <div>
              <label className="block text-caption font-semibold mb-1">Öğün Adı</label>
              <input className="input-field" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="örn. Öğle yemeği" required />
            </div>

            <div>
              <label className="block text-caption font-semibold mb-2">Öğün Türü</label>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setMealType(t.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-btn text-caption font-medium transition-all
                      ${mealType === t.value
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-700'
                        : 'bg-surface-50 dark:bg-surface-700 text-surface-500'}`}>
                    <t.Icon size={18} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-caption font-semibold mb-1">Fotoğraf (opsiyonel)</label>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              {mealPhoto ? (
                <div className="relative">
                  <img src={mealPhoto} alt="Yemek" className="w-full h-36 object-cover rounded-btn" />
                  <button type="button" onClick={() => { setMealPhoto(null); if (photoInputRef.current) photoInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-surface-200 dark:border-surface-600 rounded-btn p-4 flex flex-col items-center gap-1.5 text-surface-400 hover:border-primary-300 hover:text-primary-500 transition-colors">
                  <Camera size={22} />
                  <span className="text-caption">Fotoğraf ekle</span>
                </button>
              )}
            </div>

            {/* Popular foods quick-pick */}
            <div>
              <button type="button" onClick={() => setShowPopular(!showPopular)}
                className="flex items-center gap-1.5 text-caption font-semibold text-surface-600 dark:text-surface-300 mb-2">
                <Sparkles size={14} className="text-primary-500" />
                Popüler Türk Yemekleri
                {showPopular ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showPopular && (
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_FOODS.map(food => (
                    <button key={food.name} type="button" onClick={() => addPopularFood(food)}
                      className="inline-flex items-center gap-1 bg-surface-50 dark:bg-surface-700 hover:bg-primary-50 dark:hover:bg-primary-900/20
                        text-caption px-2.5 py-1.5 rounded-full border border-surface-100 dark:border-surface-600
                        hover:border-primary-200 dark:hover:border-primary-700 transition-colors">
                      <Plus size={12} className="text-primary-500" />
                      <span>{food.name}</span>
                      <span className="text-micro text-surface-400">{Math.round(food.cal * food.portion / 100)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Food search */}
            <div>
              <label className="block text-caption font-semibold mb-1">Yemek Ara</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input className="input-field pl-9" value={foodSearch} onChange={e => setFoodSearch(e.target.value)}
                  placeholder="Ara... (örn. tavuk, pilav, çorba)" />
              </div>
              {foodResults.length > 0 && (
                <div className="mt-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-btn overflow-hidden max-h-48 overflow-y-auto">
                  {foodResults.map(f => (
                    <button key={f.id} type="button" onClick={() => addFoodItem(f)}
                      className="w-full text-left px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-700 flex justify-between items-center border-b border-surface-50 dark:border-surface-700 last:border-0">
                      <div>
                        <span className="text-body">{f.name}</span>
                        <div className="flex gap-2 text-micro text-surface-400 mt-0.5">
                          <span>P: {f.protein_per_100g}g</span>
                          <span>K: {f.carbs_per_100g}g</span>
                          <span>Y: {f.fat_per_100g}g</span>
                        </div>
                      </div>
                      <span className="text-caption text-surface-400 whitespace-nowrap ml-2">{f.calories_per_100g} kcal/100g</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={addCustomItem} className="text-caption text-primary-500 font-semibold flex items-center gap-1">
              <Plus size={14} /> Manuel yemek ekle
            </button>

            {items.length > 0 && (
              <div className="space-y-2">
                <p className="text-caption font-semibold">Eklenen yemekler:</p>
                {items.map((item, i) => (
                  <div key={i} className="bg-surface-50 dark:bg-surface-700 p-3 rounded-btn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-body font-medium">{item.food_name || item.custom_name || 'Özel yemek'}</span>
                      <button type="button" onClick={() => removeItem(i)} className="text-danger"><Trash2 size={14} /></button>
                    </div>
                    {!item.food_id && (
                      <input className="input-field text-body mb-2" placeholder="Yemek adı"
                        value={item.custom_name} onChange={e => updateItem(i, 'custom_name', e.target.value)} />
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-micro text-surface-400">Miktar (g)</label>
                        <input type="number" className="input-field text-body" value={item.quantity_g}
                          onChange={e => updateItem(i, 'quantity_g', parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <label className="text-micro text-surface-400">Kalori</label>
                        <input type="number" className="input-field text-body" value={item.calories || ''}
                          onChange={e => updateItem(i, 'calories', parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                    {/* Macro display */}
                    <div className="flex gap-3 mt-2 pt-2 border-t border-surface-100 dark:border-surface-600">
                      <div className="flex items-center gap-1 text-micro">
                        <Beef size={10} className="text-blue-500" />
                        <span className="text-surface-400">P:</span>
                        <input type="number" step="0.1" className="w-14 bg-transparent text-body font-medium border-b border-surface-200 dark:border-surface-600 text-center"
                          value={item.protein} onChange={e => updateItem(i, 'protein', parseFloat(e.target.value) || 0)} />
                        <span className="text-surface-400">g</span>
                      </div>
                      <div className="flex items-center gap-1 text-micro">
                        <Wheat size={10} className="text-amber-500" />
                        <span className="text-surface-400">K:</span>
                        <input type="number" step="0.1" className="w-14 bg-transparent text-body font-medium border-b border-surface-200 dark:border-surface-600 text-center"
                          value={item.carbs} onChange={e => updateItem(i, 'carbs', parseFloat(e.target.value) || 0)} />
                        <span className="text-surface-400">g</span>
                      </div>
                      <div className="flex items-center gap-1 text-micro">
                        <Droplet size={10} className="text-rose-500" />
                        <span className="text-surface-400">Y:</span>
                        <input type="number" step="0.1" className="w-14 bg-transparent text-body font-medium border-b border-surface-200 dark:border-surface-600 text-center"
                          value={item.fat} onChange={e => updateItem(i, 'fat', parseFloat(e.target.value) || 0)} />
                        <span className="text-surface-400">g</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-right space-y-0.5">
                  <p className="text-body font-bold">
                    Toplam: {items.reduce((s, i) => s + (i.calories || 0), 0)} kcal
                  </p>
                  <p className="text-micro text-surface-400">
                    P: {items.reduce((s, i) => s + i.protein, 0).toFixed(1)}g
                    {' · '}K: {items.reduce((s, i) => s + i.carbs, 0).toFixed(1)}g
                    {' · '}Y: {items.reduce((s, i) => s + i.fat, 0).toFixed(1)}g
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setItems([]); setMealPhoto(null); }} className="btn-secondary flex-1">İptal</button>
              <button type="submit" className="btn-primary flex-1" disabled={loading || items.length === 0}>
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Kaydet'}
              </button>
            </div>
          </form>
        )}

        {/* Meal list */}
        <div className="space-y-2">
          {meals.length === 0 && !showForm && (
            <div className="card text-center py-10 px-6">
              <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <UtensilsCrossed size={24} className="text-primary-400" />
              </div>
              <h3 className="text-body font-bold mb-1">Bugün henüz öğün eklenmedi</h3>
              <p className="text-caption text-surface-400 mb-4">
                İlk öğünü ekleyerek gününe başla! Sağlıklı bir kahvaltı ile
                güne enerji dolu başlayabilirsin.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {[
                  { label: 'Yulaf ezmesi', cal: '170 kcal' },
                  { label: 'Yumurta + ekmek', cal: '225 kcal' },
                  { label: 'Yoğurt + meyve', cal: '180 kcal' },
                ].map(s => (
                  <div key={s.label} className="bg-surface-50 dark:bg-surface-700 px-3 py-1.5 rounded-full text-caption">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-surface-400 ml-1">{s.cal}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowForm(true)} className="btn-accent inline-flex items-center gap-2 px-6">
                <Sparkles size={16} /> Bugünkü ilk öğünü ekle!
              </button>
            </div>
          )}
          {meals.map(meal => {
            const MealIcon = MEAL_ICON_MAP[meal.meal_type] || UtensilsCrossed;
            const mealLabel = MEAL_LABEL_MAP[meal.meal_type] || meal.meal_type;
            const mealMacros = meal.items.reduce(
              (acc, item) => ({
                protein: acc.protein + (item.protein || 0),
                carbs: acc.carbs + (item.carbs || 0),
                fat: acc.fat + (item.fat || 0),
              }),
              { protein: 0, carbs: 0, fat: 0 }
            );
            return (
              <div key={meal.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-btn bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                      <MealIcon size={16} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="text-body font-semibold">{meal.title}</p>
                      <p className="text-micro text-surface-400">
                        {mealLabel} · {new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-body font-bold">{meal.total_calories} kcal</p>
                      <p className="text-micro text-surface-400">
                        P:{Math.round(mealMacros.protein)} K:{Math.round(mealMacros.carbs)} Y:{Math.round(mealMacros.fat)}
                      </p>
                    </div>
                    <button onClick={() => deleteMeal(meal.id)} className="text-surface-300 hover:text-danger transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                {meal.items.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-surface-50 dark:border-surface-700 space-y-0.5">
                    {meal.items.map(item => (
                      <div key={item.id} className="flex justify-between text-caption text-surface-400">
                        <span>{item.custom_name || 'Yemek'} ({item.quantity_g}g)</span>
                        <span className="flex items-center gap-2">
                          <span className="text-micro">P:{item.protein || 0} K:{item.carbs || 0} Y:{item.fat || 0}</span>
                          <span>{item.calories} kcal</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

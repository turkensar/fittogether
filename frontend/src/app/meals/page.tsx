'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { Meal, Food } from '@/types';

interface MealItemForm {
  food_id: string | null;
  custom_name: string;
  quantity_g: number;
  calories: number | null;
  food_name: string;
}

export default function MealsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<MealItemForm[]>([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodResults, setFoodResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

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
    setItems(prev => [...prev, {
      food_id: food.id,
      custom_name: '',
      quantity_g: food.default_portion_g,
      calories: Math.round(food.calories_per_100g * food.default_portion_g / 100),
      food_name: food.name,
    }]);
    setFoodSearch('');
    setFoodResults([]);
  };

  const addCustomItem = () => {
    setItems(prev => [...prev, {
      food_id: null,
      custom_name: '',
      quantity_g: 100,
      calories: 0,
      food_name: '',
    }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const submitMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || items.length === 0) return;
    setLoading(true);
    try {
      await api.post('/api/meals', {
        title,
        meal_type: mealType,
        description: description || null,
        items: items.map(i => ({
          food_id: i.food_id,
          custom_name: i.food_id ? null : i.custom_name,
          quantity_g: i.quantity_g,
          calories: i.calories,
        })),
      });
      setShowForm(false);
      setTitle('');
      setDescription('');
      setItems([]);
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

  const MEAL_TYPES = [
    { value: 'breakfast', label: 'Kahvalti', icon: '🌅' },
    { value: 'lunch', label: 'Ogle', icon: '☀��' },
    { value: 'dinner', label: 'Aksam', icon: '🌙' },
    { value: 'snack', label: 'Atistirma', icon: '🍎' },
  ];

  return (
    <AppShell>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">🍽️ Meals</h1>
          <div className="text-right">
            <p className="text-sm font-bold">{totalCalories} / {goal} cal</p>
            <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalCalories / goal) * 100)}%` }} />
            </div>
          </div>
        </div>

        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="btn-primary w-full">+ Add Meal</button>
        ) : (
          <form onSubmit={submitMeal} className="card p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Meal Name</label>
              <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Lunch" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => setMealType(t.value)}
                    className={`text-center p-2 rounded-xl text-xs font-medium transition-all
                      ${mealType === t.value ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-gray-50 dark:bg-gray-700'}`}>
                    <div className="text-lg">{t.icon}</div>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Search Foods</label>
              <input className="input-field" value={foodSearch} onChange={e => setFoodSearch(e.target.value)}
                placeholder="Search food... (e.g., tavuk, pilav)" />
              {foodResults.length > 0 && (
                <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {foodResults.map(f => (
                    <button key={f.id} type="button" onClick={() => addFoodItem(f)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <span className="text-sm">{f.name}</span>
                      <span className="text-xs text-gray-400">{f.calories_per_100g} cal/100g</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={addCustomItem} className="text-sm text-primary-500 font-medium">
              + Add custom item
            </button>

            {items.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Items:</p>
                {items.map((item, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.food_name || item.custom_name || 'Custom item'}</span>
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 text-xs">Remove</button>
                    </div>
                    {!item.food_id && (
                      <input className="input-field text-sm mb-2" placeholder="Food name"
                        value={item.custom_name} onChange={e => updateItem(i, 'custom_name', e.target.value)} />
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Quantity (g)</label>
                        <input type="number" className="input-field text-sm" value={item.quantity_g}
                          onChange={e => {
                            const g = parseFloat(e.target.value);
                            updateItem(i, 'quantity_g', g);
                            if (item.food_id) {
                              const food = foodResults.find(f => f.id === item.food_id);
                              // Recalc not possible without food data; keep manual
                            }
                          }} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Calories</label>
                        <input type="number" className="input-field text-sm" value={item.calories || ''}
                          onChange={e => updateItem(i, 'calories', parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-right">
                  <p className="text-sm font-bold">
                    Total: {items.reduce((s, i) => s + (i.calories || 0), 0)} cal
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setItems([]); }} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={loading || items.length === 0}>
                {loading ? 'Saving...' : 'Save Meal'}
              </button>
            </div>
          </form>
        )}

        {/* Meal list */}
        <div className="space-y-3">
          {meals.length === 0 && !showForm && (
            <div className="card text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">🍽️</div>
              <p className="text-sm">No meals logged today</p>
            </div>
          )}
          {meals.map(meal => (
            <div key={meal.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {{ breakfast: '🌅', lunch: '☀️', dinner: '����', snack: '🍎' }[meal.meal_type] || '🍽️'}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{meal.title}</p>
                    <p className="text-xs text-gray-400">{new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{meal.total_calories} cal</p>
                  <button onClick={() => deleteMeal(meal.id)} className="text-xs text-red-400">Delete</button>
                </div>
              </div>
              {meal.items.length > 0 && (
                <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                  {meal.items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.custom_name || 'Food item'} ({item.quantity_g}g)</span>
                      <span>{item.calories} cal</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

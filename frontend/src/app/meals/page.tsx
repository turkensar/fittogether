'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AppShell from '@/components/ui/AppShell';
import { Meal, Food } from '@/types';
import {
  Plus, Search, X, Trash2, Sunrise, Sun, Moon, Apple, UtensilsCrossed, Loader2,
} from 'lucide-react';

interface MealItemForm {
  food_id: string | null;
  custom_name: string;
  quantity_g: number;
  calories: number | null;
  food_name: string;
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', Icon: Sunrise },
  { value: 'lunch', label: 'Lunch', Icon: Sun },
  { value: 'dinner', label: 'Dinner', Icon: Moon },
  { value: 'snack', label: 'Snack', Icon: Apple },
];

const MEAL_ICON_MAP: Record<string, typeof Sunrise> = {
  breakfast: Sunrise, lunch: Sun, dinner: Moon, snack: Apple,
};

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
      food_id: food.id, custom_name: '', quantity_g: food.default_portion_g,
      calories: Math.round(food.calories_per_100g * food.default_portion_g / 100),
      food_name: food.name,
    }]);
    setFoodSearch('');
    setFoodResults([]);
  };

  const addCustomItem = () => {
    setItems(prev => [...prev, { food_id: null, custom_name: '', quantity_g: 100, calories: 0, food_name: '' }]);
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
        title, meal_type: mealType, description: null,
        items: items.map(i => ({
          food_id: i.food_id, custom_name: i.food_id ? null : i.custom_name,
          quantity_g: i.quantity_g, calories: i.calories,
        })),
      });
      setShowForm(false); setTitle(''); setItems([]);
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

  return (
    <AppShell>
      <div className="space-y-3 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-primary-500" />
            <h1 className="text-heading">Meals</h1>
          </div>
          <div className="text-right">
            <p className="text-body font-bold">{totalCalories} <span className="text-surface-400 font-normal">/ {goal} cal</span></p>
            <div className="w-24 bg-surface-100 dark:bg-surface-700 rounded-full h-1.5 mt-1">
              <div className={`h-1.5 rounded-full transition-all ${pct > 100 ? 'bg-danger' : 'bg-primary-500'}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Add meal */}
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus size={18} /> Add Meal
          </button>
        ) : (
          <form onSubmit={submitMeal} className="card p-4 space-y-4">
            <div>
              <label className="block text-caption font-semibold mb-1">Meal Name</label>
              <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Lunch" required />
            </div>

            <div>
              <label className="block text-caption font-semibold mb-2">Type</label>
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

            <div>
              <label className="block text-caption font-semibold mb-1">Search Foods</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input className="input-field pl-9" value={foodSearch} onChange={e => setFoodSearch(e.target.value)}
                  placeholder="Search... (e.g., tavuk, pilav)" />
              </div>
              {foodResults.length > 0 && (
                <div className="mt-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-btn overflow-hidden max-h-48 overflow-y-auto">
                  {foodResults.map(f => (
                    <button key={f.id} type="button" onClick={() => addFoodItem(f)}
                      className="w-full text-left px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-700 flex justify-between items-center border-b border-surface-50 dark:border-surface-700 last:border-0">
                      <span className="text-body">{f.name}</span>
                      <span className="text-caption text-surface-400">{f.calories_per_100g} cal/100g</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={addCustomItem} className="text-caption text-primary-500 font-semibold flex items-center gap-1">
              <Plus size={14} /> Add custom item
            </button>

            {items.length > 0 && (
              <div className="space-y-2">
                <p className="text-caption font-semibold">Items:</p>
                {items.map((item, i) => (
                  <div key={i} className="bg-surface-50 dark:bg-surface-700 p-3 rounded-btn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-body font-medium">{item.food_name || item.custom_name || 'Custom item'}</span>
                      <button type="button" onClick={() => removeItem(i)} className="text-danger"><Trash2 size={14} /></button>
                    </div>
                    {!item.food_id && (
                      <input className="input-field text-body mb-2" placeholder="Food name"
                        value={item.custom_name} onChange={e => updateItem(i, 'custom_name', e.target.value)} />
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-micro text-surface-400">Quantity (g)</label>
                        <input type="number" className="input-field text-body" value={item.quantity_g}
                          onChange={e => updateItem(i, 'quantity_g', parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <label className="text-micro text-surface-400">Calories</label>
                        <input type="number" className="input-field text-body" value={item.calories || ''}
                          onChange={e => updateItem(i, 'calories', parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-body font-bold text-right">
                  Total: {items.reduce((s, i) => s + (i.calories || 0), 0)} cal
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setItems([]); }} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={loading || items.length === 0}>
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Meal'}
              </button>
            </div>
          </form>
        )}

        {/* Meal list */}
        <div className="space-y-2">
          {meals.length === 0 && !showForm && (
            <div className="card text-center py-10 text-surface-400">
              <UtensilsCrossed size={32} className="mx-auto mb-2 text-surface-300" />
              <p className="text-body">No meals logged today</p>
            </div>
          )}
          {meals.map(meal => {
            const MealIcon = MEAL_ICON_MAP[meal.meal_type] || UtensilsCrossed;
            return (
              <div key={meal.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-btn bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                      <MealIcon size={16} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="text-body font-semibold">{meal.title}</p>
                      <p className="text-micro text-surface-400">{new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="text-body font-bold">{meal.total_calories} cal</p>
                    <button onClick={() => deleteMeal(meal.id)} className="text-surface-300 hover:text-danger transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                {meal.items.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-surface-50 dark:border-surface-700 space-y-0.5">
                    {meal.items.map(item => (
                      <div key={item.id} className="flex justify-between text-caption text-surface-400">
                        <span>{item.custom_name || 'Food item'} ({item.quantity_g}g)</span>
                        <span>{item.calories} cal</span>
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

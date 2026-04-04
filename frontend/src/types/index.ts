export interface User {
  id: string;
  email: string;
  name: string;
  age: number | null;
  height: number | null;
  current_weight: number | null;
  target_weight: number | null;
  gender: string | null;
  daily_calorie_goal: number;
  avatar_emoji: string;
  avatar_color: string;
  invite_code: string;
  is_onboarded: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PartnerInfo {
  id: string;
  name: string;
  avatar_emoji: string;
  avatar_color: string;
  daily_calorie_goal: number;
  current_weight: number | null;
  target_weight: number | null;
}

export interface PairingStatus {
  paired: boolean;
  invite_code: string;
  couple_id?: string;
  partner?: PartnerInfo;
  max_cheat_days_per_week?: number;
}

export interface MealItem {
  id: string;
  food_id: string | null;
  custom_name: string | null;
  quantity_g: number;
  calories: number;
}

export interface Meal {
  id: string;
  user_id: string;
  title: string;
  meal_type: string;
  description: string | null;
  total_calories: number;
  items: MealItem[];
  created_at: string;
}

export interface Food {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  default_portion_g: number;
  category: string;
}

export interface Message {
  id: string;
  couple_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  emoji: string;
  completed: boolean;
}

export interface DashboardSummary {
  my_calories: number;
  my_goal: number;
  my_remaining: number;
  my_score: number;
  partner_calories: number;
  partner_goal: number;
  partner_remaining: number;
  partner_score: number;
  partner_name: string;
  partner_emoji: string;
  couple_score: number;
}

export interface WeightProgress {
  start_weight: number;
  current_weight: number;
  target_weight: number;
  lost: number;
  percentage: number;
  logs: { weight: number; date: string }[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned_at: string | null;
}

export interface DietBreakEvent {
  id: string;
  user_id: string;
  punishment: string;
  points_lost: number;
  note: string | null;
  created_at: string;
}

from sqlalchemy.orm import Session

from app.models.food import Food
from app.models.challenge import DailyChallenge
from app.models.gamification import Badge

FOODS = [
    # Turkish foods
    {"name": "Yumurta (haşlanmış)", "calories_per_100g": 155, "protein_per_100g": 13, "carbs_per_100g": 1.1, "fat_per_100g": 11, "default_portion_g": 60, "category": "protein"},
    {"name": "Tavuk göğsü (ızgara)", "calories_per_100g": 165, "protein_per_100g": 31, "carbs_per_100g": 0, "fat_per_100g": 3.6, "default_portion_g": 150, "category": "protein"},
    {"name": "Pilav", "calories_per_100g": 130, "protein_per_100g": 2.7, "carbs_per_100g": 28, "fat_per_100g": 0.3, "default_portion_g": 200, "category": "grain"},
    {"name": "Makarna", "calories_per_100g": 131, "protein_per_100g": 5, "carbs_per_100g": 25, "fat_per_100g": 1.1, "default_portion_g": 200, "category": "grain"},
    {"name": "Köfte", "calories_per_100g": 250, "protein_per_100g": 17, "carbs_per_100g": 7, "fat_per_100g": 17, "default_portion_g": 80, "category": "protein"},
    {"name": "Ekmek (beyaz)", "calories_per_100g": 265, "protein_per_100g": 9, "carbs_per_100g": 49, "fat_per_100g": 3.2, "default_portion_g": 50, "category": "grain"},
    {"name": "Muz", "calories_per_100g": 89, "protein_per_100g": 1.1, "carbs_per_100g": 23, "fat_per_100g": 0.3, "default_portion_g": 120, "category": "fruit"},
    {"name": "Elma", "calories_per_100g": 52, "protein_per_100g": 0.3, "carbs_per_100g": 14, "fat_per_100g": 0.2, "default_portion_g": 180, "category": "fruit"},
    {"name": "Yoğurt (tam yağlı)", "calories_per_100g": 61, "protein_per_100g": 3.5, "carbs_per_100g": 4.7, "fat_per_100g": 3.3, "default_portion_g": 200, "category": "dairy"},
    {"name": "Ayran", "calories_per_100g": 36, "protein_per_100g": 1.7, "carbs_per_100g": 2.5, "fat_per_100g": 1.8, "default_portion_g": 250, "category": "dairy"},
    {"name": "Çay (şekersiz)", "calories_per_100g": 1, "protein_per_100g": 0, "carbs_per_100g": 0.2, "fat_per_100g": 0, "default_portion_g": 200, "category": "beverage"},
    {"name": "Türk kahvesi", "calories_per_100g": 2, "protein_per_100g": 0.1, "carbs_per_100g": 0.3, "fat_per_100g": 0, "default_portion_g": 80, "category": "beverage"},
    {"name": "Patates kızartması", "calories_per_100g": 312, "protein_per_100g": 3.4, "carbs_per_100g": 41, "fat_per_100g": 15, "default_portion_g": 150, "category": "snack"},
    {"name": "Pizza (karışık)", "calories_per_100g": 266, "protein_per_100g": 11, "carbs_per_100g": 33, "fat_per_100g": 10, "default_portion_g": 200, "category": "fast_food"},
    {"name": "Hamburger", "calories_per_100g": 295, "protein_per_100g": 17, "carbs_per_100g": 24, "fat_per_100g": 14, "default_portion_g": 200, "category": "fast_food"},
    {"name": "Çikolata (sütlü)", "calories_per_100g": 535, "protein_per_100g": 7.6, "carbs_per_100g": 60, "fat_per_100g": 30, "default_portion_g": 30, "category": "snack"},
    {"name": "Baklava", "calories_per_100g": 428, "protein_per_100g": 6, "carbs_per_100g": 43, "fat_per_100g": 26, "default_portion_g": 80, "category": "dessert"},
    # Global common foods
    {"name": "Avokado", "calories_per_100g": 160, "protein_per_100g": 2, "carbs_per_100g": 9, "fat_per_100g": 15, "default_portion_g": 150, "category": "fruit"},
    {"name": "Ton balığı (konserve)", "calories_per_100g": 116, "protein_per_100g": 26, "carbs_per_100g": 0, "fat_per_100g": 0.8, "default_portion_g": 100, "category": "protein"},
    {"name": "Yulaf ezmesi", "calories_per_100g": 68, "protein_per_100g": 2.4, "carbs_per_100g": 12, "fat_per_100g": 1.4, "default_portion_g": 250, "category": "grain"},
    {"name": "Beyaz peynir", "calories_per_100g": 264, "protein_per_100g": 17, "carbs_per_100g": 1.3, "fat_per_100g": 21, "default_portion_g": 30, "category": "dairy"},
    {"name": "Domates", "calories_per_100g": 18, "protein_per_100g": 0.9, "carbs_per_100g": 3.9, "fat_per_100g": 0.2, "default_portion_g": 150, "category": "vegetable"},
    {"name": "Salatalık", "calories_per_100g": 15, "protein_per_100g": 0.7, "carbs_per_100g": 3.6, "fat_per_100g": 0.1, "default_portion_g": 150, "category": "vegetable"},
    {"name": "Mercimek çorbası", "calories_per_100g": 56, "protein_per_100g": 3.5, "carbs_per_100g": 9, "fat_per_100g": 0.8, "default_portion_g": 300, "category": "soup"},
    {"name": "Zeytinyağlı fasulye", "calories_per_100g": 70, "protein_per_100g": 3, "carbs_per_100g": 8, "fat_per_100g": 3, "default_portion_g": 200, "category": "vegetable"},
    {"name": "Kuru fasulye", "calories_per_100g": 127, "protein_per_100g": 8.7, "carbs_per_100g": 22, "fat_per_100g": 0.5, "default_portion_g": 250, "category": "legume"},
    {"name": "Bal", "calories_per_100g": 304, "protein_per_100g": 0.3, "carbs_per_100g": 82, "fat_per_100g": 0, "default_portion_g": 20, "category": "sweetener"},
    {"name": "Zeytin", "calories_per_100g": 115, "protein_per_100g": 0.8, "carbs_per_100g": 6, "fat_per_100g": 11, "default_portion_g": 30, "category": "snack"},
    {"name": "Somon (ızgara)", "calories_per_100g": 208, "protein_per_100g": 20, "carbs_per_100g": 0, "fat_per_100g": 13, "default_portion_g": 150, "category": "protein"},
    {"name": "Brokoli", "calories_per_100g": 34, "protein_per_100g": 2.8, "carbs_per_100g": 7, "fat_per_100g": 0.4, "default_portion_g": 150, "category": "vegetable"},
    {"name": "Portakal", "calories_per_100g": 47, "protein_per_100g": 0.9, "carbs_per_100g": 12, "fat_per_100g": 0.1, "default_portion_g": 200, "category": "fruit"},
    {"name": "Süt (tam yağlı)", "calories_per_100g": 61, "protein_per_100g": 3.2, "carbs_per_100g": 4.8, "fat_per_100g": 3.3, "default_portion_g": 250, "category": "dairy"},
    {"name": "Tam buğday ekmeği", "calories_per_100g": 247, "protein_per_100g": 13, "carbs_per_100g": 41, "fat_per_100g": 3.4, "default_portion_g": 40, "category": "grain"},
    {"name": "Bulgur pilavı", "calories_per_100g": 83, "protein_per_100g": 3.1, "carbs_per_100g": 19, "fat_per_100g": 0.2, "default_portion_g": 200, "category": "grain"},
    {"name": "Lahmacun", "calories_per_100g": 210, "protein_per_100g": 9, "carbs_per_100g": 28, "fat_per_100g": 7, "default_portion_g": 180, "category": "fast_food"},
    {"name": "Döner (tavuk)", "calories_per_100g": 190, "protein_per_100g": 22, "carbs_per_100g": 5, "fat_per_100g": 9, "default_portion_g": 200, "category": "fast_food"},
    {"name": "Çorba (genel)", "calories_per_100g": 40, "protein_per_100g": 2, "carbs_per_100g": 6, "fat_per_100g": 1, "default_portion_g": 300, "category": "soup"},
    {"name": "Ceviz", "calories_per_100g": 654, "protein_per_100g": 15, "carbs_per_100g": 14, "fat_per_100g": 65, "default_portion_g": 30, "category": "nut"},
    {"name": "Badem", "calories_per_100g": 579, "protein_per_100g": 21, "carbs_per_100g": 22, "fat_per_100g": 50, "default_portion_g": 30, "category": "nut"},
]

CHALLENGES = [
    {"title": "Şekersiz gün", "description": "Bugün şekerli içecek içme!", "points": 15, "emoji": "🚫"},
    {"title": "8000 adım", "description": "Bugün en az 8000 adım at!", "points": 15, "emoji": "🚶"},
    {"title": "2L su iç", "description": "Bugün en az 2 litre su iç!", "points": 10, "emoji": "💧"},
    {"title": "Gece atıştırmasız", "description": "Saat 21'den sonra atıştırma yapma!", "points": 10, "emoji": "🌙"},
    {"title": "Meyve ye", "description": "Tatlı yerine meyve ye!", "points": 10, "emoji": "🍎"},
    {"title": "Tüm öğünleri kaydet", "description": "Bugün tüm öğünlerini uygulamaya kaydet!", "points": 10, "emoji": "📝"},
    {"title": "Protein odaklı öğün", "description": "En az bir öğünde protein ağırlıklı ye!", "points": 10, "emoji": "🥩"},
    {"title": "Sebze festivali", "description": "Bugün her öğünde sebze ye!", "points": 15, "emoji": "🥦"},
    {"title": "Fast food yok", "description": "Bugün hiç fast food yeme!", "points": 15, "emoji": "🍔"},
    {"title": "Partnerine mesaj at", "description": "Partnerine motivasyon mesajı gönder!", "points": 5, "emoji": "💌"},
    {"title": "Sağlıklı kahvaltı", "description": "Sağlıklı bir kahvaltı yap ve kaydet!", "points": 10, "emoji": "🥣"},
    {"title": "Yürüyüş zamanı", "description": "15 dakikalık bir yürüyüş yap!", "points": 10, "emoji": "🏃"},
]

BADGES = [
    {"name": "İlk Adım", "description": "İlk öğününü kaydet!", "emoji": "🌟", "requirement": "Log first meal", "points_required": 5},
    {"name": "Haftalık Savaşçı", "description": "7 gün üst üste öğün kaydet!", "emoji": "⚔️", "requirement": "7-day streak", "points_required": 50},
    {"name": "Kalori Ustası", "description": "100 puan topla!", "emoji": "🏅", "requirement": "Reach 100 points", "points_required": 100},
    {"name": "Su Canavarı", "description": "5 gün üst üste 2L su iç!", "emoji": "🐳", "requirement": "Water goal 5 days", "points_required": 75},
    {"name": "Çift Gücü", "description": "Partnerinle birlikte 200 puan toplayın!", "emoji": "💪", "requirement": "Couple 200 points", "points_required": 200},
    {"name": "Şampiyon", "description": "500 puan topla!", "emoji": "🏆", "requirement": "Reach 500 points", "points_required": 500},
    {"name": "Meydan Okuyucu", "description": "10 günlük meydan okuma tamamla!", "emoji": "🎯", "requirement": "Complete 10 challenges", "points_required": 150},
    {"name": "Kararlı Diyet", "description": "30 gün üst üste aktif ol!", "emoji": "🔥", "requirement": "30-day streak", "points_required": 300},
    {"name": "Destekçi Partner", "description": "Partnerine 50 mesaj gönder!", "emoji": "💝", "requirement": "Send 50 messages", "points_required": 250},
    {"name": "Efsane", "description": "1000 puan topla!", "emoji": "👑", "requirement": "Reach 1000 points", "points_required": 1000},
]


def seed_database(db: Session):
    if db.query(Food).count() > 0:
        print("Database already seeded, skipping...")
        return

    print("Seeding foods...")
    for f in FOODS:
        db.add(Food(**f))

    print("Seeding challenges...")
    for c in CHALLENGES:
        db.add(DailyChallenge(**c))

    print("Seeding badges...")
    for b in BADGES:
        db.add(Badge(**b))

    db.commit()
    print(f"Seeded {len(FOODS)} foods, {len(CHALLENGES)} challenges, {len(BADGES)} badges")

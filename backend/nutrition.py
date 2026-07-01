"""Nutrition calculator — Mifflin-St Jeor + macro targets."""
from typing import Optional

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

GOAL_ADJUSTMENTS = {
    "lose": -500,       # 0.5 kg/week deficit
    "maintain": 0,
    "gain": 300,        # lean muscle gain
}

def compute_targets(profile: Optional[dict]) -> Optional[dict]:
    """Returns daily kcal + macro targets from a client profile, or None if incomplete."""
    if not profile:
        return None
    required = ("sex", "age", "height_cm", "weight_kg", "activity_level", "goal")
    if not all(profile.get(k) is not None for k in required):
        return None
    try:
        sex = profile["sex"].lower()
        age = int(profile["age"])
        h = float(profile["height_cm"])
        w = float(profile["weight_kg"])
        activity = profile["activity_level"]
        goal = profile["goal"]
    except (ValueError, TypeError, AttributeError):
        return None

    # Mifflin-St Jeor BMR
    if sex == "male":
        bmr = 10 * w + 6.25 * h - 5 * age + 5
    else:
        bmr = 10 * w + 6.25 * h - 5 * age - 161

    tdee = bmr * ACTIVITY_MULTIPLIERS.get(activity, 1.55)
    kcal = round(tdee + GOAL_ADJUSTMENTS.get(goal, 0))

    # Macros: 2 g/kg protein, 0.9 g/kg fat, rest carbs
    protein_g = round(2.0 * w)
    fat_g = round(0.9 * w)
    kcal_from_pf = protein_g * 4 + fat_g * 9
    carbs_g = max(0, round((kcal - kcal_from_pf) / 4))

    return {
        "kcal": kcal,
        "protein_g": protein_g,
        "carbs_g": carbs_g,
        "fat_g": fat_g,
        "bmr": round(bmr),
        "tdee": round(tdee),
    }


def day_scale_factor(targets: Optional[dict], day_recipes: list) -> float:
    """Returns a multiplier to scale all meals in a day so their total kcal ~= target.
       Rounded to nearest 0.05 for readability."""
    if not targets or not day_recipes:
        return 1.0
    total = sum((r or {}).get("macros", {}).get("kcal", 0) for r in day_recipes)
    if total <= 0:
        return 1.0
    raw = targets["kcal"] / total
    # Clamp so we never scale below 0.5x or above 3x — protects against odd data
    raw = max(0.5, min(3.0, raw))
    return round(raw * 20) / 20  # 0.05 increments

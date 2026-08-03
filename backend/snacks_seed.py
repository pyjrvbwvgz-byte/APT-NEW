"""40 healthy snack options — used to fill the daily snack slot on each client's plan.
Same tag conventions as the extra recipes seed: lean / bulk / balanced.
"""
import uuid

def _r(slug, name, image_url, prep, servings, ingredients, instructions, macros, tags):
    return {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, slug)),
        "slug": slug,
        "name": name,
        "category": "snack",
        "image_url": image_url,
        "prep_time": prep,
        "servings": servings,
        "ingredients": ingredients,
        "instructions": instructions,
        "macros": macros,
        "tags": tags,
    }

def ing(n, q, u): return {"name": n, "quantity": q, "unit": u}
def m(k, p, c, f): return {"kcal": k, "protein": p, "carbs": c, "fat": f}


SNACKS = [
    _r("apple-peanut-butter", "Apple with Peanut Butter",
       "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
       3, 1, [ing("Apple", 1, "pc"), ing("Peanut butter", 20, "g")],
       ["Slice apple, dip into peanut butter."],
       m(240, 6, 30, 12), ["balanced", "quick"]),

    _r("greek-yogurt-honey", "Greek Yogurt & Honey",
       "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
       2, 1, [ing("Greek yogurt", 170, "g"), ing("Honey", 10, "g")],
       ["Spoon yogurt into a bowl, drizzle honey."],
       m(190, 17, 22, 3), ["lean", "high-protein"]),

    _r("hummus-carrots", "Hummus & Carrot Sticks",
       "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&q=80",
       5, 1, [ing("Hummus", 50, "g"), ing("Carrot sticks", 150, "g")],
       ["Slice carrots, dip in hummus."],
       m(210, 8, 24, 10), ["lean", "veggie"]),

    _r("cottage-cheese-pineapple", "Cottage Cheese & Pineapple",
       "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&q=80",
       3, 1, [ing("Cottage cheese", 150, "g"), ing("Pineapple", 100, "g")],
       ["Combine in a bowl and eat."],
       m(190, 22, 18, 4), ["lean", "high-protein"]),

    _r("banana-almond-butter", "Banana with Almond Butter",
       "https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?w=800&q=80",
       2, 1, [ing("Banana", 1, "pc"), ing("Almond butter", 20, "g")],
       ["Slice banana, spread almond butter."],
       m(240, 6, 32, 12), ["balanced", "quick"]),

    _r("boiled-eggs-2", "Two Boiled Eggs with Salt & Pepper",
       "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=800&q=80",
       10, 1, [ing("Eggs", 2, "pcs"), ing("Salt", 1, "g"), ing("Black pepper", 1, "g")],
       ["Boil eggs 8 min, peel and season."],
       m(160, 13, 1, 11), ["lean", "high-protein"]),

    _r("tuna-crackers", "Tuna on Rice Crackers",
       "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
       5, 1, [ing("Tuna in water", 80, "g"), ing("Rice crackers", 6, "pcs"), ing("Light mayo", 10, "g")],
       ["Mix tuna with mayo, spoon onto crackers."],
       m(220, 20, 22, 6), ["lean", "high-protein"]),

    _r("edamame-salt", "Salted Edamame",
       "https://images.unsplash.com/photo-1554244933-d876deb6b2ff?w=800&q=80",
       6, 1, [ing("Edamame in pods", 150, "g"), ing("Sea salt", 2, "g")],
       ["Steam edamame 4 min, sprinkle with salt."],
       m(180, 16, 12, 8), ["lean", "veggie"]),

    _r("protein-shake-water", "Whey Protein Shake",
       "https://images.unsplash.com/photo-1622485831181-ef8e6d3a8b12?w=800&q=80",
       2, 1, [ing("Whey protein", 30, "g"), ing("Water", 300, "ml")],
       ["Shake protein powder with water."],
       m(130, 25, 3, 2), ["lean", "high-protein"]),

    _r("protein-shake-milk", "Protein Shake with Milk",
       "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&q=80",
       2, 1, [ing("Whey protein", 30, "g"), ing("Milk", 300, "ml")],
       ["Shake protein powder with milk."],
       m(280, 34, 20, 8), ["bulk", "high-protein"]),

    _r("trail-mix", "Trail Mix (30g)",
       "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80",
       0, 1, [ing("Trail mix", 30, "g")],
       ["Portion 30g into a small bag."],
       m(160, 5, 12, 10), ["balanced"]),

    _r("mixed-nuts", "Mixed Nuts (30g)",
       "https://images.unsplash.com/photo-1599909533555-cadd4d0e6b90?w=800&q=80",
       0, 1, [ing("Mixed nuts", 30, "g")],
       ["Portion 30g into a small bag."],
       m(180, 6, 6, 16), ["balanced", "quick"]),

    _r("dark-choc-almonds", "Dark Chocolate & Almonds",
       "https://images.unsplash.com/photo-1548907040-4d24f4e02a4d?w=800&q=80",
       1, 1, [ing("Dark chocolate 85%", 20, "g"), ing("Almonds", 15, "g")],
       ["Enjoy together."],
       m(200, 5, 12, 15), ["balanced"]),

    _r("rice-cake-cottage-cheese", "Rice Cakes with Cottage Cheese",
       "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80",
       3, 1, [ing("Rice cakes", 3, "pcs"), ing("Cottage cheese", 100, "g"), ing("Cherry tomatoes", 60, "g")],
       ["Top rice cakes with cottage cheese and tomato halves."],
       m(230, 20, 30, 4), ["lean", "high-protein"]),

    _r("banana-oats-cookies", "Banana Oat Cookies (3)",
       "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80",
       20, 6, [ing("Banana", 2, "pcs"), ing("Oats", 120, "g"), ing("Raisins", 30, "g"), ing("Cinnamon", 2, "g")],
       ["Mash banana, mix with oats and raisins.",
        "Spoon 18 rounds on tray, bake 15 min at 180°C."],
       m(140, 3, 26, 2), ["balanced", "meal-prep"]),

    _r("smoked-salmon-cucumber", "Smoked Salmon Cucumber Bites",
       "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
       6, 1, [ing("Cucumber", 0.5, "pc"), ing("Smoked salmon", 60, "g"), ing("Cream cheese", 20, "g")],
       ["Slice cucumber, top with cream cheese and salmon."],
       m(180, 18, 6, 10), ["lean", "high-protein", "omega-3"]),

    _r("chocolate-milk-postworkout", "Chocolate Milk (post-workout)",
       "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=800&q=80",
       1, 1, [ing("Chocolate milk", 400, "ml")],
       ["Pour and drink."],
       m(320, 14, 50, 8), ["bulk", "quick"]),

    _r("chicken-slices-cucumber", "Chicken Slices & Cucumber",
       "https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800&q=80",
       3, 1, [ing("Cooked chicken breast", 120, "g"), ing("Cucumber", 1, "pc"), ing("Salt", 1, "g")],
       ["Slice cucumber, wrap chicken pieces around."],
       m(180, 32, 4, 4), ["lean", "high-protein", "low-carb"]),

    _r("skyr-berries", "Skyr with Berries",
       "https://images.unsplash.com/photo-1583577612013-4fecf105ee0c?w=800&q=80",
       3, 1, [ing("Skyr", 170, "g"), ing("Mixed berries", 80, "g")],
       ["Spoon skyr into a bowl, top with berries."],
       m(180, 22, 18, 1), ["lean", "high-protein"]),

    _r("popcorn-air", "Air-Popped Popcorn (30g)",
       "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&q=80",
       5, 1, [ing("Popcorn kernels", 30, "g"), ing("Sea salt", 1, "g")],
       ["Air-pop kernels 3 minutes, sprinkle salt."],
       m(120, 4, 24, 1), ["lean", "quick"]),

    _r("peanut-butter-toast-snack", "Peanut Butter Toast",
       "https://images.unsplash.com/photo-1484278114887-4d68a5c15a45?w=800&q=80",
       4, 1, [ing("Wholemeal bread", 1, "slice"), ing("Peanut butter", 20, "g"), ing("Banana", 0.5, "pc")],
       ["Toast bread, spread peanut butter, top with banana."],
       m(280, 10, 32, 12), ["bulk", "quick"]),

    _r("chickpeas-roasted", "Roasted Chickpeas",
       "https://images.unsplash.com/photo-1611574474427-38df66d78bd7?w=800&q=80",
       35, 4, [ing("Chickpeas", 400, "g"), ing("Olive oil", 10, "ml"), ing("Paprika", 3, "g")],
       ["Drain chickpeas, toss with oil and paprika.",
        "Roast at 200°C for 30 min until crisp."],
       m(200, 10, 26, 6), ["lean", "veggie", "meal-prep"]),

    _r("cheese-crackers", "Cheese & Wholegrain Crackers",
       "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&q=80",
       2, 1, [ing("Cheddar", 40, "g"), ing("Wholegrain crackers", 5, "pcs")],
       ["Slice cheese, serve with crackers."],
       m(280, 12, 20, 16), ["balanced", "quick"]),

    _r("berry-smoothie", "Berry Smoothie",
       "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&q=80",
       5, 1, [ing("Frozen berries", 150, "g"), ing("Greek yogurt", 100, "g"), ing("Milk", 150, "ml"), ing("Honey", 10, "g")],
       ["Blend all ingredients until smooth."],
       m(260, 15, 40, 4), ["balanced"]),

    _r("veggie-sticks-tzatziki", "Veggie Sticks & Tzatziki",
       "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&q=80",
       6, 1, [ing("Carrot sticks", 100, "g"), ing("Cucumber sticks", 100, "g"), ing("Tzatziki", 60, "g")],
       ["Slice veg, dip in tzatziki."],
       m(160, 6, 18, 6), ["lean", "veggie"]),

    _r("almonds-30g", "Handful of Almonds (30g)",
       "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&q=80",
       0, 1, [ing("Almonds", 30, "g")],
       ["Portion into a bag."],
       m(180, 6, 6, 16), ["balanced", "quick"]),

    _r("orange-cottage-cheese", "Orange & Cottage Cheese",
       "https://images.unsplash.com/photo-1547514701-42782101795e?w=800&q=80",
       3, 1, [ing("Orange", 1, "pc"), ing("Cottage cheese", 120, "g")],
       ["Peel orange, serve with cottage cheese."],
       m(180, 18, 22, 3), ["lean", "high-protein"]),

    _r("energy-balls", "Peanut Butter Energy Balls (3)",
       "https://images.unsplash.com/photo-1587582140428-9d95f3a11737?w=800&q=80",
       15, 6, [ing("Oats", 100, "g"), ing("Peanut butter", 60, "g"), ing("Honey", 30, "g"), ing("Whey protein", 30, "g"), ing("Dark chocolate chips", 20, "g")],
       ["Mix all ingredients, roll into 12 balls.",
        "Chill 30 min. Serving = 3 balls."],
       m(240, 14, 22, 12), ["balanced", "meal-prep"]),

    _r("yogurt-granola", "Yogurt & Granola",
       "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=800&q=80",
       3, 1, [ing("Greek yogurt", 150, "g"), ing("Granola", 30, "g")],
       ["Layer in a glass."],
       m(280, 18, 40, 6), ["balanced"]),

    _r("beef-jerky-30g", "Beef Jerky (30g)",
       "https://images.unsplash.com/photo-1519693178048-4a1cca75fbd6?w=800&q=80",
       0, 1, [ing("Beef jerky", 30, "g")],
       ["Rip and eat."],
       m(120, 20, 4, 3), ["lean", "high-protein", "quick"]),

    _r("dates-almonds", "Dates Stuffed with Almonds (4)",
       "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=800&q=80",
       5, 1, [ing("Medjool dates", 4, "pcs"), ing("Almonds", 12, "pcs")],
       ["Split each date, remove stone, insert 3 almonds."],
       m(220, 4, 40, 8), ["balanced", "quick"]),

    _r("cottage-cheese-cinnamon", "Cottage Cheese & Cinnamon",
       "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&q=80",
       2, 1, [ing("Cottage cheese", 200, "g"), ing("Cinnamon", 1, "g"), ing("Honey", 8, "g")],
       ["Combine in a bowl."],
       m(220, 25, 14, 5), ["lean", "high-protein"]),

    _r("avocado-toast-snack", "Avocado Toast (Small)",
       "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&q=80",
       5, 1, [ing("Wholemeal bread", 1, "slice"), ing("Avocado", 0.5, "pc"), ing("Lemon", 0.25, "pc")],
       ["Toast bread, mash avocado with lemon on top."],
       m(230, 6, 22, 14), ["balanced"]),

    _r("cheese-string-apple", "Cheese String & Apple",
       "https://images.unsplash.com/photo-1596591868231-05e908752cc9?w=800&q=80",
       1, 1, [ing("Cheese string", 1, "pc"), ing("Apple", 1, "pc")],
       ["Snack together."],
       m(180, 8, 22, 6), ["balanced", "quick"]),

    _r("turkey-cheese-rollups", "Turkey & Cheese Roll-Ups",
       "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&q=80",
       4, 1, [ing("Turkey slices", 80, "g"), ing("Cheddar slices", 40, "g")],
       ["Layer cheese on turkey, roll up."],
       m(230, 26, 2, 13), ["lean", "high-protein", "low-carb"]),

    _r("pb-banana-shake", "Peanut Butter Banana Shake",
       "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&q=80",
       3, 1, [ing("Banana", 1, "pc"), ing("Peanut butter", 20, "g"), ing("Milk", 300, "ml"), ing("Honey", 5, "g")],
       ["Blend and drink."],
       m(380, 14, 46, 16), ["bulk"]),

    _r("kiwi-yogurt", "Kiwi with Yogurt",
       "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
       3, 1, [ing("Kiwi", 2, "pcs"), ing("Greek yogurt", 150, "g")],
       ["Peel and slice kiwi over yogurt."],
       m(180, 15, 22, 3), ["lean"]),

    _r("chia-pudding", "Chia Pudding",
       "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80",
       5, 1, [ing("Chia seeds", 30, "g"), ing("Almond milk", 200, "ml"), ing("Honey", 10, "g")],
       ["Whisk chia into milk, chill 2 hours.",
        "Drizzle honey to serve."],
       m(230, 8, 22, 12), ["balanced", "meal-prep"]),

    _r("mozzarella-tomato", "Mozzarella & Tomato",
       "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=800&q=80",
       3, 1, [ing("Mozzarella ball", 100, "g"), ing("Tomato", 1, "pc"), ing("Basil", 5, "g")],
       ["Slice mozzarella and tomato, garnish with basil."],
       m(260, 20, 6, 18), ["balanced", "high-protein"]),

    _r("greek-yogurt-granola-honey", "Greek Yogurt, Granola & Honey Snack",
       "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=800&q=80",
       3, 1, [ing("Greek yogurt", 170, "g"), ing("Granola", 25, "g"), ing("Honey", 10, "g")],
       ["Layer yogurt with granola, drizzle honey."],
       m(280, 18, 40, 6), ["balanced"]),
]

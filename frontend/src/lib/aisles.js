// Groups shopping-list items into supermarket aisles so the list is usable in a shop.
const AISLES = [
  {
    key: "produce",
    label: "Fruit & veg",
    match: [
      "apple", "avocado", "banana", "basil", "bean sprout", "beetroot", "berry", "blueberr",
      "broccoli", "cabbage", "carrot", "cauliflower", "celery", "chilli", "coriander", "courgette",
      "cucumber", "date", "garlic", "ginger", "grape", "kale", "leek", "lemon", "lettuce", "lime",
      "mango", "mushroom", "onion", "orange", "parsley", "pea", "pepper", "pineapple", "potato",
      "raspberr", "rocket", "salad", "spinach", "spring onion", "strawberr", "sweet potato",
      "tomato", "veg", "lemon juice", "mint", "cherry",
    ],
  },
  {
    key: "protein",
    label: "Meat, fish & eggs",
    match: [
      "bacon", "beef", "chicken", "cod", "egg", "fish", "ham", "lamb", "mince", "pork", "prawn",
      "salmon", "sausage", "steak", "tuna", "turkey", "tofu", "halloumi", "mackerel",
    ],
  },
  {
    key: "dairy",
    label: "Dairy & chilled",
    match: [
      "butter", "cheese", "cream", "feta", "milk", "mozzarella", "parmesan", "yoghurt", "yogurt",
      "skyr", "cottage",
    ],
  },
  {
    key: "bakery",
    label: "Bakery & grains",
    match: [
      "bagel", "bread", "bun", "couscous", "flour", "oats", "pasta", "pitta", "quinoa", "rice",
      "noodle", "tortilla", "wrap", "cereal", "granola",
    ],
  },
  {
    key: "pantry",
    label: "Pantry & store cupboard",
    match: [
      "almond", "cashew", "chia", "chocolate", "cinnamon", "cocoa", "coconut", "cumin", "curry",
      "honey", "hummus", "jam", "ketchup", "lentil", "mayo", "mustard", "nut", "oil", "olive",
      "paprika", "peanut", "pesto", "protein powder", "salt", "sauce", "seed", "sesame", "soy",
      "spice", "stock", "sugar", "syrup", "tahini", "tinned", "turmeric", "vinegar", "water",
      "chickpea", "pepper corn", "black pepper", "vanilla", "raisin",
    ],
  },
];

export function aisleFor(name) {
  const n = (name || "").toLowerCase();
  for (const a of AISLES) {
    if (a.match.some((m) => n.includes(m))) return a;
  }
  return { key: "other", label: "Everything else" };
}

export function groupByAisle(items) {
  const order = [...AISLES.map((a) => a.key), "other"];
  const buckets = new Map();
  items.forEach((item, index) => {
    const a = aisleFor(item.name);
    if (!buckets.has(a.key)) buckets.set(a.key, { key: a.key, label: a.label, items: [] });
    buckets.get(a.key).items.push({ ...item, index });
  });
  return order.filter((k) => buckets.has(k)).map((k) => buckets.get(k));
}

// Common foods with their nutrition per 100 g, from USDA FoodData Central (public domain): Foundation Foods
// where they have the food, SR Legacy otherwise.
import type { CatalogFood } from './types'

interface CommonFood extends CatalogFood {
  /** Other words people search with, like "ground beef" for mince. */
  aliases?: string
}

function food(
  fdcId: number,
  name: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  aliases?: string
): CommonFood {
  return { id: `usda-${fdcId}`, name, per100g: { calories, protein, carbs, fat }, aliases }
}

export const COMMON_FOODS: CommonFood[] = [
  // Grains, bread and potatoes
  food(2346396, 'Oats, rolled (dry)', 379, 13.5, 68.7, 5.9, 'oatmeal porridge oat flakes'),
  food(2346397, 'Oats, steel-cut (dry)', 379, 12.5, 69.8, 5.8, 'oatmeal porridge'),
  food(173905, 'Porridge, made with water', 71, 2.5, 12, 1.5, 'oatmeal oats cooked'),
  food(168878, 'White rice (cooked)', 130, 2.7, 28.2, 0.3, 'rice boiled'),
  food(2512381, 'White rice (dry)', 370, 7, 80.3, 1, 'rice uncooked'),
  food(169704, 'Brown rice (cooked)', 123, 2.7, 25.6, 1, 'rice boiled'),
  food(2512380, 'Brown rice (dry)', 368, 7.3, 76.7, 3.3, 'rice uncooked'),
  food(169737, 'Pasta (cooked)', 158, 5.8, 30.9, 0.9, 'spaghetti penne macaroni fusilli noodles'),
  food(169736, 'Pasta (dry)', 371, 13, 74.7, 1.5, 'spaghetti penne macaroni fusilli noodles uncooked'),
  food(168910, 'Whole-wheat pasta (cooked)', 149, 6, 30.1, 1.7, 'wholemeal wholewheat spaghetti penne'),
  food(168917, 'Quinoa (cooked)', 120, 4.4, 21.3, 1.9),
  food(169700, 'Couscous (cooked)', 112, 3.8, 23.2, 0.2),
  food(2512378, 'Buckwheat (dry)', 332, 11.1, 71.1, 3, 'kasha groats'),
  food(2710820, 'Bulgur (dry)', 349, 11.8, 75.9, 2.4, 'bulgar'),
  food(174924, 'White bread', 266, 8.9, 49.4, 3.3, 'toast'),
  food(172688, 'Whole-wheat bread', 252, 12.4, 42.7, 3.5, 'wholemeal brown toast'),
  food(168013, 'Multigrain bread', 265, 13.4, 43.3, 4.2, 'seeded toast'),
  food(174915, 'Pita bread', 275, 9.1, 55.7, 1.2, 'pitta'),
  food(167535, 'Flour tortilla', 297, 8, 49.3, 7.6, 'wrap'),
  food(170250, 'Rice cakes', 387, 8.2, 81.5, 2.8, 'rice cake'),
  food(789951, 'Wheat flour', 358, 13.1, 73.2, 1.5, 'plain all-purpose'),
  food(170440, 'Potatoes (boiled)', 86, 1.7, 20, 0.1, 'potato'),
  food(170093, 'Baked potato, with skin', 93, 2.5, 21.2, 0.1, 'potato jacket'),
  food(2346401, 'Potatoes (raw)', 81, 2.3, 17.8, 0.4, 'potato'),
  food(168483, 'Sweet potato (baked)', 90, 2, 20.7, 0.2, 'yam'),
  food(2346404, 'Sweet potato (raw)', 77, 1.6, 17.3, 0.4, 'yam'),
  // Meat and fish
  food(2646170, 'Chicken breast (raw)', 112, 22.5, 0, 1.9, 'chicken fillet'),
  food(171477, 'Chicken breast (cooked)', 165, 31, 0, 3.6, 'chicken fillet roasted grilled'),
  food(2646171, 'Chicken thigh, skinless (raw)', 149, 18.6, 0, 7.9),
  food(2727566, 'Chicken drumsticks (raw)', 130, 18.4, 0, 5.9, 'chicken legs'),
  food(2727568, 'Chicken wings (raw)', 173, 18.4, 0, 10.6),
  food(2514747, 'Turkey mince, 7% fat (raw)', 158, 17.3, 0, 9.6, 'ground turkey'),
  food(2514743, 'Beef mince, 10% fat (raw)', 190, 18.2, 0, 12.8, 'ground beef hamburger'),
  food(2514744, 'Beef mince, 20% fat (raw)', 248, 17.5, 0, 19.4, 'ground beef hamburger'),
  food(171794, 'Beef mince, 10% fat (cooked)', 230, 28.4, 0, 12, 'ground beef'),
  food(174034, 'Beef mince, 15% fat (cooked)', 256, 27.7, 0, 15.3, 'ground beef'),
  food(2727574, 'Sirloin steak (raw)', 146, 22, 0.2, 5.7, 'beef'),
  food(2646172, 'Ribeye steak (raw)', 260, 18.7, 0, 20, 'beef rib eye'),
  food(2646169, 'Pork tenderloin (raw)', 125, 21.6, 0, 3.9, 'pork fillet'),
  food(2727575, 'Pork chop (raw)', 145, 22.8, 0, 5.5),
  food(2514745, 'Pork mince (raw)', 233, 17.8, 0, 17.5, 'ground pork'),
  food(749420, 'Bacon (cooked)', 500, 40.9, 2.1, 36.5),
  food(332397, 'Ham, sliced', 106, 16.7, 0.3, 3.7, 'deli'),
  food(2684441, 'Salmon (raw)', 203, 20.3, 0, 13.1, 'fish'),
  food(175168, 'Salmon (cooked)', 206, 22.1, 0, 12.4, 'fish'),
  food(334194, 'Tuna, canned in water', 90, 19, 0.1, 0.9, 'fish tin'),
  food(173708, 'Tuna, canned in oil (drained)', 198, 29.1, 0, 8.2, 'fish tin'),
  food(2684444, 'Cod (raw)', 71, 16.1, 0, 0.7, 'fish'),
  food(2684442, 'Tilapia (raw)', 100, 19, 0, 2.5, 'fish'),
  food(2684443, 'Shrimp (raw)', 76, 15.6, 0.5, 0.8, 'prawns'),
  // Eggs and dairy
  food(748967, 'Egg', 148, 12.4, 1, 10, 'eggs whole raw'),
  food(747997, 'Egg white', 55, 10.7, 2.4, 0, 'eggs'),
  food(748236, 'Egg yolk', 334, 16.2, 1, 28.8, 'eggs'),
  food(173424, 'Egg (hard-boiled)', 155, 12.6, 1.1, 10.6, 'eggs boiled'),
  food(173423, 'Egg (fried)', 196, 13.6, 0.8, 14.8, 'eggs'),
  food(746782, 'Milk, whole (3.25%)', 60, 3.3, 4.6, 3.2, 'full fat'),
  food(746778, 'Milk, semi-skimmed (2%)', 50, 3.4, 4.9, 1.9, 'reduced fat'),
  food(746772, 'Milk, low-fat (1%)', 43, 3.4, 5.2, 1),
  food(746776, 'Milk, skimmed', 34, 3.4, 4.9, 0.1, 'skim fat-free nonfat'),
  food(330137, 'Greek yogurt, fat-free', 61, 10.3, 3.6, 0.4, 'yoghurt skyr nonfat'),
  food(2259794, 'Greek yogurt, whole milk', 95, 8.8, 4.8, 4.4, 'yoghurt full fat'),
  food(2259793, 'Plain yogurt, whole milk', 77, 3.8, 5.6, 4.5, 'yoghurt natural'),
  food(2647437, 'Plain yogurt, fat-free', 50, 4.2, 8.1, 0.1, 'yoghurt natural nonfat'),
  food(328841, 'Cottage cheese, low-fat (2%)', 84, 11, 4.3, 2.3),
  food(2346384, 'Cottage cheese, full fat', 105, 11.6, 4.6, 4.2),
  food(328637, 'Cheddar cheese', 408, 23.3, 2.4, 34),
  food(329370, 'Mozzarella, part-skim', 298, 23.7, 4.4, 20.4, 'cheese'),
  food(2259796, 'Feta cheese', 273, 19.7, 5.6, 19.1),
  food(325036, 'Parmesan, grated', 421, 29.6, 12.4, 28, 'cheese'),
  food(746766, 'Ricotta', 157, 7.8, 6.9, 11, 'cheese'),
  food(746767, 'Swiss cheese', 393, 27, 1.4, 31, 'emmental'),
  food(2346385, 'Cream cheese', 337, 5.8, 4.6, 33.5),
  food(173410, 'Butter', 717, 0.9, 0.1, 81.1),
  food(2346386, 'Double cream', 336, 2, 3.8, 35.6, 'heavy whipping cream'),
  food(2346387, 'Sour cream', 193, 3.1, 5.6, 18),
  food(173180, 'Whey protein powder', 352, 78.1, 6.3, 1.6, 'protein shake'),
  food(173177, 'Whey protein isolate', 359, 58.1, 29.1, 1.2, 'protein shake powder'),
  food(2257045, 'Almond milk, unsweetened', 19, 0.7, 0.7, 1.6),
  food(2257046, 'Oat milk, unsweetened', 48, 0.8, 5.1, 2.8),
  food(1999630, 'Soy milk, unsweetened', 39, 3.6, 1.3, 2.1, 'soya'),
  // Fruit
  food(1105314, 'Banana', 97, 0.7, 23, 0.3),
  food(1750341, 'Apple', 55, 0.1, 14.8, 0.2),
  food(746771, 'Orange', 47, 0.9, 11.8, 0.2),
  food(2710832, 'Mandarin', 56, 1, 13.4, 0.5, 'clementine tangerine'),
  food(746773, 'Pear', 57, 0.4, 15.1, 0.2),
  food(325430, 'Peach', 42, 0.9, 10.1, 0.3),
  food(2710815, 'Apricot', 44, 1, 10.2, 0.4),
  food(2346399, 'Cherries', 63, 1, 16.2, 0.2),
  food(2346409, 'Strawberries', 33, 0.6, 8, 0.2, 'berries'),
  food(2346411, 'Blueberries', 57, 0.7, 14.6, 0.3, 'berries'),
  food(2346410, 'Raspberries', 51, 1, 12.9, 0.2, 'berries'),
  food(2346412, 'Grapes', 77, 0.9, 20.2, 0.2),
  food(2346398, 'Pineapple', 54, 0.5, 14.1, 0.2),
  food(2710833, 'Mango', 62, 0.6, 15.3, 0.6),
  food(327046, 'Kiwi', 58, 1.1, 14, 0.4, 'kiwifruit'),
  food(2710824, 'Avocado', 206, 1.8, 8.3, 20.3),
  food(746770, 'Cantaloupe melon', 34, 0.8, 8.2, 0.2, 'melon'),
  food(168165, 'Raisins', 299, 3.3, 79.3, 0.3, 'sultanas'),
  food(168191, 'Medjool dates', 277, 1.8, 75, 0.2, 'date'),
  // Vegetables
  food(747447, 'Broccoli', 31, 2.6, 6.3, 0.3),
  food(1999633, 'Spinach', 22, 2.9, 2.6, 0.6),
  food(2258586, 'Carrots', 45, 0.9, 10.3, 0.4, 'carrot'),
  food(1999634, 'Tomato', 19, 0.7, 3.8, 0.4, 'tomatoes'),
  food(321360, 'Cherry tomatoes', 27, 0.8, 5.5, 0.6, 'grape tomatoes'),
  food(2346406, 'Cucumber', 14, 0.6, 3, 0.2),
  food(2258590, 'Red pepper', 27, 0.9, 6.7, 0.1, 'bell pepper capsicum paprika'),
  food(2258588, 'Green pepper', 20, 0.7, 4.8, 0.1, 'bell pepper capsicum'),
  food(790646, 'Onion', 38, 0.8, 8.6, 0.1),
  food(1999629, 'Mushrooms', 25, 2.9, 4.1, 0.4, 'champignon'),
  food(746769, 'Lettuce (romaine)', 17, 1.2, 3.2, 0.3, 'salad'),
  food(2346400, 'Green beans', 34, 2, 7.4, 0.3),
  food(2685573, 'Cauliflower', 23, 1.6, 4.7, 0.2),
  food(2685568, 'Courgette', 16, 1, 3.3, 0.2, 'zucchini'),
  food(2685577, 'Aubergine', 22, 0.9, 5.4, 0.1, 'eggplant'),
  food(2685570, 'Butternut squash', 42, 1.2, 10.5, 0.2, 'pumpkin'),
  food(2710826, 'Sweetcorn', 73, 2.8, 14.7, 1.6, 'corn maize'),
  food(2644291, 'Green peas, canned', 78, 4.7, 12.7, 1.2),
  food(323505, 'Kale', 35, 2.9, 4.4, 1.5),
  food(2685575, 'Brussels sprouts', 49, 4, 9.6, 0.6),
  food(2710823, 'Asparagus', 24, 1.4, 5.1, 0.2),
  food(2346407, 'Cabbage', 28, 1, 6.4, 0.2),
  food(1104647, 'Garlic', 143, 6.6, 28.2, 0.4),
  // Beans and lentils
  food(172421, 'Lentils (cooked)', 116, 9, 20.1, 0.4),
  food(2644283, 'Lentils (dry)', 351, 23.6, 62.2, 1.9),
  food(2644288, 'Chickpeas, canned', 133, 7, 20.3, 3.1, 'garbanzo'),
  food(2644285, 'Black beans, canned', 115, 6.9, 19.8, 1.3),
  food(2644289, 'Kidney beans, canned', 123, 7.8, 21, 1.3, 'red beans'),
  food(175182, 'Baked beans', 94, 4.8, 21.1, 0.4),
  food(172475, 'Tofu, firm', 144, 17.3, 2.8, 8.7, 'bean curd'),
  food(321358, 'Hummus', 229, 7.4, 14.9, 17.1, 'houmous'),
  food(168411, 'Edamame', 121, 11.9, 8.9, 5.2, 'soybeans'),
  // Nuts, seeds and oils
  food(2346393, 'Almonds', 584, 21.5, 20, 51.1, 'nuts'),
  food(2346394, 'Walnuts', 679, 14.6, 10.9, 69.7, 'nuts'),
  food(2515374, 'Cashews', 533, 17.4, 36.3, 38.9, 'nuts'),
  food(2515375, 'Hazelnuts', 602, 13.5, 26.5, 53.5, 'nuts'),
  food(2515379, 'Pistachios', 561, 20.5, 27.7, 45, 'nuts'),
  food(2515376, 'Peanuts', 551, 23.2, 26.5, 43.3, 'nuts'),
  food(2262072, 'Peanut butter', 589, 24, 22.7, 49.4),
  food(2262074, 'Almond butter', 603, 20.8, 21.2, 53),
  food(2710819, 'Chia seeds', 490, 17, 38.3, 32.9),
  food(2262075, 'Flaxseed, ground', 514, 18, 34.4, 37.3, 'linseed'),
  food(2515380, 'Pumpkin seeds', 515, 29.9, 18.7, 40, 'pepitas'),
  food(2515381, 'Sunflower seeds', 571, 18.9, 24.5, 48.4),
  food(171413, 'Olive oil', 884, 0, 0, 100, 'oil'),
  food(171025, 'Sunflower oil', 884, 0, 0, 100, 'vegetable cooking oil'),
  food(330458, 'Coconut oil', 833, 0, 0.8, 99.1, 'oil'),
  food(171009, 'Mayonnaise', 680, 1, 0.6, 74.8, 'mayo'),
  // Sweets, sauces and drinks
  food(169640, 'Honey', 304, 0.3, 82.4, 0),
  food(746784, 'Sugar', 385, 0, 99.6, 0.3),
  food(169661, 'Maple syrup', 260, 0, 67, 0.1),
  food(169641, 'Jam', 278, 0.4, 68.9, 0.1, 'preserves jelly'),
  food(170273, 'Dark chocolate (70–85%)', 598, 7.8, 45.9, 42.6, 'chocolate cacao cocoa'),
  food(747693, 'Ketchup', 117, 1.1, 26.8, 0.6),
  food(326698, 'Mustard', 61, 4.3, 5.3, 3.4),
  food(332282, 'Pasta sauce (marinara)', 45, 1.4, 8.1, 1.5, 'tomato sauce'),
  food(2685580, 'Tomato paste', 89, 4.2, 20.2, 0.7, 'puree concentrate'),
  food(746777, 'Salsa', 29, 1.4, 6.7, 0.2),
  food(2003597, 'Orange juice', 45, 0.8, 10, 0.4),
  food(2003590, 'Apple juice', 47, 0.1, 11.4, 0.3),
  food(168746, 'Beer', 43, 0.5, 3.6, 0, 'lager'),
  food(173190, 'Red wine', 85, 0.1, 2.6, 0, 'wine'),
]

/** Lowercase words without accents or punctuation, for matching searches. */
function words(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** A search word matches the start of a word, or a plural of it ("eggs" finds "egg", "tomatoes" finds "tomato"). */
function matches(term: string, word: string): boolean {
  return word.startsWith(term) || (word.length >= 3 && term.startsWith(word) && term.length - word.length <= 2)
}

const SEARCH_INDEX = COMMON_FOODS.map((food) => ({
  food,
  name: words(food.name),
  all: words(`${food.name} ${food.aliases ?? ''}`),
}))

/** Common foods whose name or aliases match every search word, best matches first. */
export function searchCommonFoods(query: string, limit = 8): CatalogFood[] {
  const terms = words(query)
  if (terms.length === 0) return []

  return SEARCH_INDEX.filter(({ all }) => terms.every((term) => all.some((word) => matches(term, word))))
    .map(({ food, name }) => ({
      food,
      // Names that start with the first word rank highest, then names that hold more of the words; aliases only count for the filter.
      // Ties keep the list order, which has the everyday version of a food first.
      score: (matches(terms[0], name[0]) ? terms.length + 1 : 0) + terms.filter((term) => name.some((word) => matches(term, word))).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ food }) => food)
}

/** The common food with exactly this name, if there is one. */
export function findCommonFood(name: string): CatalogFood | undefined {
  return COMMON_FOODS.find((food) => food.name === name)
}

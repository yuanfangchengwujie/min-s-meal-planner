// 食材数据库 — 中文常见婴幼儿食材,带常见过敏原标签
// allergens 使用 ID:egg / milk / wheat / soy / peanut / treenut / fish / shellfish / sesame

export type AllergenId =
  | "egg"
  | "milk"
  | "wheat"
  | "soy"
  | "peanut"
  | "treenut"
  | "fish"
  | "shellfish"
  | "sesame";

export const ALLERGEN_LABEL: Record<AllergenId, string> = {
  egg: "鸡蛋",
  milk: "牛奶",
  wheat: "小麦/麸质",
  soy: "大豆",
  peanut: "花生",
  treenut: "坚果",
  fish: "鱼",
  shellfish: "甲壳类",
  sesame: "芝麻",
};

export type FoodCategory = "主食" | "蛋白质" | "蔬菜" | "水果" | "油脂" | "调味";

export type NutrientTag =
  | "蛋白质"
  | "铁"
  | "锌"
  | "钙"
  | "DHA"
  | "维D"
  | "维A"
  | "维C"
  | "膳食纤维"
  | "碳水"
  | "健康脂肪"
  | "B族";

export interface Food {
  id: string;
  name: string;
  emoji: string;
  category: FoodCategory;
  allergens: AllergenId[]; // 该食材本身含有/属于的常见过敏原
  nutrients: NutrientTag[];
  notes?: string;
}

export const FOODS: Food[] = [
  // 主食(谷物/根茎)
  { id: "rice", name: "大米", emoji: "🍚", category: "主食", allergens: [], nutrients: ["碳水", "B族"] },
  { id: "millet", name: "小米", emoji: "🌾", category: "主食", allergens: [], nutrients: ["碳水", "铁", "B族"] },
  { id: "quinoa", name: "藜麦", emoji: "🌱", category: "主食", allergens: [], nutrients: ["蛋白质", "铁", "膳食纤维"] },
  { id: "oats_gf", name: "无麸燕麦", emoji: "🥣", category: "主食", allergens: [], nutrients: ["碳水", "膳食纤维", "B族"], notes: "需选 gluten-free 认证" },
  { id: "corn", name: "玉米", emoji: "🌽", category: "主食", allergens: [], nutrients: ["碳水", "维A", "膳食纤维"] },
  { id: "sweet_potato", name: "红薯", emoji: "🍠", category: "主食", allergens: [], nutrients: ["维A", "膳食纤维", "维C"] },
  { id: "potato", name: "土豆", emoji: "🥔", category: "主食", allergens: [], nutrients: ["碳水", "维C", "钾"] as NutrientTag[] },
  { id: "yam", name: "山药", emoji: "🥖", category: "主食", allergens: [], nutrients: ["碳水", "膳食纤维"] },
  { id: "pumpkin", name: "南瓜", emoji: "🎃", category: "主食", allergens: [], nutrients: ["维A", "膳食纤维"] },
  { id: "rice_noodle", name: "米粉/米线", emoji: "🍜", category: "主食", allergens: [], nutrients: ["碳水"] },
  { id: "buckwheat", name: "荞麦", emoji: "🌾", category: "主食", allergens: [], nutrients: ["蛋白质", "膳食纤维"] },
  { id: "taro", name: "芋头", emoji: "🍠", category: "主食", allergens: [], nutrients: ["碳水", "膳食纤维"] },

  // 蛋白质
  { id: "pork", name: "猪肉(瘦)", emoji: "🥩", category: "蛋白质", allergens: [], nutrients: ["蛋白质", "铁", "锌", "B族"] },
  { id: "beef", name: "牛肉", emoji: "🥩", category: "蛋白质", allergens: [], nutrients: ["蛋白质", "铁", "锌"] },
  { id: "chicken", name: "鸡肉", emoji: "🍗", category: "蛋白质", allergens: [], nutrients: ["蛋白质", "B族"] },
  { id: "lamb", name: "羊肉", emoji: "🍖", category: "蛋白质", allergens: [], nutrients: ["蛋白质", "铁"] },
  { id: "salmon", name: "三文鱼", emoji: "🐟", category: "蛋白质", allergens: ["fish"], nutrients: ["蛋白质", "DHA", "维D"] },
  { id: "cod", name: "鳕鱼", emoji: "🐟", category: "蛋白质", allergens: ["fish"], nutrients: ["蛋白质", "DHA"] },
  { id: "bass", name: "鲈鱼", emoji: "🐟", category: "蛋白质", allergens: ["fish"], nutrients: ["蛋白质", "DHA"] },
  { id: "shrimp", name: "虾", emoji: "🦐", category: "蛋白质", allergens: ["shellfish"], nutrients: ["蛋白质", "钙"] },
  { id: "tofu", name: "豆腐", emoji: "🧈", category: "蛋白质", allergens: ["soy"], nutrients: ["蛋白质", "钙"] },
  { id: "black_bean", name: "黑豆", emoji: "🫘", category: "蛋白质", allergens: ["soy"], nutrients: ["蛋白质", "膳食纤维", "铁"] },
  { id: "chickpea", name: "鹰嘴豆", emoji: "🫘", category: "蛋白质", allergens: [], nutrients: ["蛋白质", "膳食纤维"] },
  { id: "lentil", name: "扁豆/红扁豆", emoji: "🫘", category: "蛋白质", allergens: [], nutrients: ["蛋白质", "铁"] },
  { id: "duck", name: "鸭肉", emoji: "🦆", category: "蛋白质", allergens: [], nutrients: ["蛋白质", "铁"] },

  // 蔬菜
  { id: "broccoli", name: "西兰花", emoji: "🥦", category: "蔬菜", allergens: [], nutrients: ["维C", "钙", "膳食纤维"] },
  { id: "spinach", name: "菠菜", emoji: "🥬", category: "蔬菜", allergens: [], nutrients: ["铁", "维A", "钙"] },
  { id: "carrot", name: "胡萝卜", emoji: "🥕", category: "蔬菜", allergens: [], nutrients: ["维A", "膳食纤维"] },
  { id: "tomato", name: "番茄", emoji: "🍅", category: "蔬菜", allergens: [], nutrients: ["维C", "维A"] },
  { id: "cucumber", name: "黄瓜", emoji: "🥒", category: "蔬菜", allergens: [], nutrients: ["维C"] },
  { id: "lettuce", name: "生菜", emoji: "🥬", category: "蔬菜", allergens: [], nutrients: ["膳食纤维"] },
  { id: "cabbage", name: "白菜", emoji: "🥬", category: "蔬菜", allergens: [], nutrients: ["维C", "膳食纤维"] },
  { id: "zucchini", name: "西葫芦", emoji: "🥒", category: "蔬菜", allergens: [], nutrients: ["维C"] },
  { id: "mushroom", name: "香菇/口蘑", emoji: "🍄", category: "蔬菜", allergens: [], nutrients: ["维D", "B族"] },
  { id: "green_bean", name: "豆角", emoji: "🫛", category: "蔬菜", allergens: [], nutrients: ["膳食纤维"] },
  { id: "bok_choy", name: "小青菜", emoji: "🥬", category: "蔬菜", allergens: [], nutrients: ["钙", "维C"] },
  { id: "bell_pepper", name: "彩椒", emoji: "🫑", category: "蔬菜", allergens: [], nutrients: ["维C", "维A"] },
  { id: "onion", name: "洋葱", emoji: "🧅", category: "蔬菜", allergens: [], nutrients: ["维C"] },

  // 水果
  { id: "apple", name: "苹果", emoji: "🍎", category: "水果", allergens: [], nutrients: ["膳食纤维", "维C"] },
  { id: "pear", name: "梨", emoji: "🍐", category: "水果", allergens: [], nutrients: ["膳食纤维", "维C"] },
  { id: "banana", name: "香蕉", emoji: "🍌", category: "水果", allergens: [], nutrients: ["碳水", "B族"] },
  { id: "blueberry", name: "蓝莓", emoji: "🫐", category: "水果", allergens: [], nutrients: ["维C", "膳食纤维"] },
  { id: "avocado", name: "牛油果", emoji: "🥑", category: "水果", allergens: [], nutrients: ["健康脂肪", "膳食纤维"] },
  { id: "peach", name: "桃", emoji: "🍑", category: "水果", allergens: [], nutrients: ["维C"] },
  { id: "dragonfruit", name: "火龙果", emoji: "🐉", category: "水果", allergens: [], nutrients: ["维C", "膳食纤维"] },
  { id: "kiwi", name: "猕猴桃", emoji: "🥝", category: "水果", allergens: [], nutrients: ["维C"] },
  { id: "orange", name: "橙子", emoji: "🍊", category: "水果", allergens: [], nutrients: ["维C"] },
  { id: "strawberry", name: "草莓", emoji: "🍓", category: "水果", allergens: [], nutrients: ["维C"] },

  // 油脂
  { id: "olive_oil", name: "橄榄油", emoji: "🫒", category: "油脂", allergens: [], nutrients: ["健康脂肪"] },
  { id: "perilla_oil", name: "紫苏籽油", emoji: "🌿", category: "油脂", allergens: [], nutrients: ["健康脂肪", "DHA"], notes: "富含α-亚麻酸" },
  { id: "avocado_oil", name: "牛油果油", emoji: "🥑", category: "油脂", allergens: [], nutrients: ["健康脂肪"] },

  // 调味(基础)
  { id: "ginger", name: "姜", emoji: "🫚", category: "调味", allergens: [], nutrients: [] },
  { id: "scallion", name: "葱", emoji: "🌿", category: "调味", allergens: [], nutrients: [] },
];

export const FOODS_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

// 默认敏宝过敏: 鸡蛋/小麦/牛奶。这些 ID 标记为"已知过敏",食谱推荐时自动排除。
export const DEFAULT_KNOWN_ALLERGENS: AllergenId[] = ["egg", "wheat", "milk"];

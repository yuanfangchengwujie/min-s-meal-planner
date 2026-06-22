// 食谱库 — 全部为蛋/小麦/奶 free,可根据已排敏食材进一步筛选
import type { NutrientTag } from "./foods";

export type MealType = "早餐" | "午餐" | "晚餐" | "加餐";

export interface Recipe {
  id: string;
  name: string;
  meal: MealType[];
  emoji: string;
  prepMin: number;
  ingredients: { foodId: string; amount: string }[];
  steps: string[];
  nutrients: NutrientTag[];
  tip?: string;
}

export const RECIPES: Recipe[] = [
  {
    id: "pumpkin-millet-porridge",
    name: "南瓜小米粥",
    meal: ["早餐", "加餐"],
    emoji: "🥣",
    prepMin: 25,
    ingredients: [
      { foodId: "millet", amount: "30g" },
      { foodId: "pumpkin", amount: "50g 切丁" },
      { foodId: "rice", amount: "10g(可选)" },
    ],
    steps: [
      "小米和大米淘洗干净,冷水浸泡 15 分钟。",
      "南瓜去皮切小丁,与米一起入锅,加 5 倍水。",
      "大火煮开后转小火 20 分钟,搅拌至粘稠即可。",
    ],
    nutrients: ["碳水", "维A", "B族", "膳食纤维"],
    tip: "南瓜自带甜味,无需加糖。",
  },
  {
    id: "banana-oat-mash",
    name: "香蕉燕麦糊",
    meal: ["早餐", "加餐"],
    emoji: "🍌",
    prepMin: 10,
    ingredients: [
      { foodId: "oats_gf", amount: "20g(无麸认证)" },
      { foodId: "banana", amount: "半根" },
    ],
    steps: [
      "无麸燕麦加 100ml 水,小火煮 5 分钟至软烂。",
      "香蕉压成泥,拌入燕麦糊。",
      "稍凉后即可食用,可点几滴紫苏油增加好脂肪。",
    ],
    nutrients: ["碳水", "膳食纤维", "B族"],
    tip: "务必选 gluten-free 认证燕麦,避免小麦交叉污染。",
  },
  {
    id: "salmon-quinoa-bowl",
    name: "三文鱼藜麦蔬菜碗",
    meal: ["午餐", "晚餐"],
    emoji: "🐟",
    prepMin: 25,
    ingredients: [
      { foodId: "salmon", amount: "40g" },
      { foodId: "quinoa", amount: "30g" },
      { foodId: "broccoli", amount: "40g" },
      { foodId: "carrot", amount: "20g" },
      { foodId: "olive_oil", amount: "几滴" },
    ],
    steps: [
      "藜麦冲洗后加 2 倍水,煮 15 分钟焖 5 分钟。",
      "三文鱼用姜片去腥,蒸 8 分钟,去皮去刺后压碎。",
      "西兰花和胡萝卜焯水后切小粒。",
      "全部拌入藜麦,滴入橄榄油即可。",
    ],
    nutrients: ["蛋白质", "DHA", "铁", "膳食纤维", "维A"],
    tip: "三文鱼每周 2-3 次,是 DHA 最佳来源之一。",
  },
  {
    id: "beef-potato-stew",
    name: "番茄牛肉土豆煲",
    meal: ["午餐", "晚餐"],
    emoji: "🍲",
    prepMin: 40,
    ingredients: [
      { foodId: "beef", amount: "40g 切小丁" },
      { foodId: "potato", amount: "60g" },
      { foodId: "carrot", amount: "30g" },
      { foodId: "tomato", amount: "1 个" },
      { foodId: "onion", amount: "少许" },
    ],
    steps: [
      "牛肉冷水下锅焯水,撇沫捞出。",
      "洋葱炒香,加番茄丁炒出红油。",
      "倒入牛肉、土豆、胡萝卜,加水没过食材。",
      "小火炖 30 分钟,至软烂入味。可配米饭。",
    ],
    nutrients: ["蛋白质", "铁", "锌", "维A", "维C"],
    tip: "番茄+牛肉的维C促进非血红素铁吸收。",
  },
  {
    id: "chicken-mushroom-rice",
    name: "鸡肉香菇焖饭",
    meal: ["午餐", "晚餐"],
    emoji: "🍛",
    prepMin: 35,
    ingredients: [
      { foodId: "chicken", amount: "40g" },
      { foodId: "mushroom", amount: "30g" },
      { foodId: "rice", amount: "40g" },
      { foodId: "carrot", amount: "20g" },
      { foodId: "olive_oil", amount: "几滴" },
    ],
    steps: [
      "鸡肉切丁,用姜末抓匀去腥。",
      "香菇、胡萝卜切碎,与鸡肉一起翻炒至变色。",
      "倒入淘好的米和水(米水 1:1.2),焖 20 分钟。",
      "出锅前拌匀,可滴橄榄油。",
    ],
    nutrients: ["蛋白质", "维D", "碳水", "B族"],
  },
  {
    id: "cod-yam-puree",
    name: "鳕鱼山药泥",
    meal: ["午餐", "晚餐"],
    emoji: "🥄",
    prepMin: 20,
    ingredients: [
      { foodId: "cod", amount: "40g" },
      { foodId: "yam", amount: "60g" },
      { foodId: "broccoli", amount: "20g" },
    ],
    steps: [
      "山药去皮切块,与西兰花一起蒸 12 分钟。",
      "鳕鱼用姜片蒸 8 分钟,去刺压碎。",
      "山药压成泥,与鳕鱼、西兰花碎拌匀。",
    ],
    nutrients: ["蛋白质", "DHA", "膳食纤维"],
    tip: "山药细腻好消化,适合刚开始尝试新蛋白质时搭配。",
  },
  {
    id: "tomato-beef-rice-noodle",
    name: "番茄牛肉米线",
    meal: ["午餐", "晚餐"],
    emoji: "🍜",
    prepMin: 25,
    ingredients: [
      { foodId: "rice_noodle", amount: "40g" },
      { foodId: "beef", amount: "30g 末" },
      { foodId: "tomato", amount: "1 个" },
      { foodId: "bok_choy", amount: "30g" },
    ],
    steps: [
      "番茄去皮切碎,炒出汁后加水煮成汤底。",
      "下牛肉末和小青菜,煮 3 分钟。",
      "另起锅煮米线至软,捞入汤中即可。",
    ],
    nutrients: ["碳水", "蛋白质", "铁", "维C"],
  },
  {
    id: "shrimp-zucchini-noodle",
    name: "西葫芦虾仁米粉",
    meal: ["午餐", "晚餐"],
    emoji: "🦐",
    prepMin: 20,
    ingredients: [
      { foodId: "shrimp", amount: "30g 去虾线" },
      { foodId: "zucchini", amount: "40g" },
      { foodId: "rice_noodle", amount: "40g" },
      { foodId: "olive_oil", amount: "几滴" },
    ],
    steps: [
      "虾仁剁碎,西葫芦切小丁。",
      "锅中放橄榄油,虾仁炒至变色,加西葫芦炒软。",
      "米粉煮熟后拌入,加少许水成汤即可。",
    ],
    nutrients: ["蛋白质", "钙", "维C"],
    tip: "虾属甲壳类,首次添加请单独排敏 3 天。",
  },
  {
    id: "sweet-potato-quinoa-mash",
    name: "红薯藜麦泥",
    meal: ["早餐", "加餐"],
    emoji: "🍠",
    prepMin: 20,
    ingredients: [
      { foodId: "sweet_potato", amount: "60g" },
      { foodId: "quinoa", amount: "20g" },
    ],
    steps: [
      "藜麦煮 15 分钟焖 5 分钟。",
      "红薯蒸熟压成泥,与藜麦拌匀即可。",
    ],
    nutrients: ["维A", "膳食纤维", "蛋白质"],
  },
  {
    id: "apple-pear-water",
    name: "苹果梨煮水",
    meal: ["加餐"],
    emoji: "🍎",
    prepMin: 15,
    ingredients: [
      { foodId: "apple", amount: "半个" },
      { foodId: "pear", amount: "半个" },
    ],
    steps: [
      "苹果梨去皮切块,加 300ml 水煮 10 分钟。",
      "果肉可压泥喂食,汤水温热饮用。",
    ],
    nutrients: ["膳食纤维", "维C"],
    tip: "干燥季节润肺,也适合缓解便秘。",
  },
  {
    id: "avocado-banana-mash",
    name: "牛油果香蕉泥",
    meal: ["加餐"],
    emoji: "🥑",
    prepMin: 5,
    ingredients: [
      { foodId: "avocado", amount: "1/4 个" },
      { foodId: "banana", amount: "半根" },
    ],
    steps: [
      "牛油果取肉,香蕉切段。",
      "一起压成泥,挤几滴橙汁防氧化。",
    ],
    nutrients: ["健康脂肪", "膳食纤维", "B族"],
    tip: "牛油果含单不饱和脂肪酸,对大脑发育友好。",
  },
  {
    id: "pork-cabbage-rice",
    name: "猪肉白菜软饭",
    meal: ["午餐", "晚餐"],
    emoji: "🍚",
    prepMin: 30,
    ingredients: [
      { foodId: "pork", amount: "30g 末" },
      { foodId: "cabbage", amount: "50g 切碎" },
      { foodId: "rice", amount: "40g" },
      { foodId: "carrot", amount: "20g" },
    ],
    steps: [
      "猪肉末用姜末抓匀,焯水去腥。",
      "白菜、胡萝卜切碎,与猪肉同炒。",
      "加入淘好的米和 1.5 倍水,焖 20 分钟。",
    ],
    nutrients: ["蛋白质", "铁", "锌", "膳食纤维"],
  },
  {
    id: "blueberry-banana-snack",
    name: "蓝莓香蕉小食",
    meal: ["加餐"],
    emoji: "🫐",
    prepMin: 5,
    ingredients: [
      { foodId: "blueberry", amount: "10 颗" },
      { foodId: "banana", amount: "半根切片" },
    ],
    steps: [
      "蓝莓对半切开防呛。",
      "与香蕉片拼盘即可。",
    ],
    nutrients: ["维C", "膳食纤维"],
  },
  {
    id: "lamb-carrot-porridge",
    name: "羊肉胡萝卜粥",
    meal: ["午餐", "晚餐"],
    emoji: "🍲",
    prepMin: 45,
    ingredients: [
      { foodId: "lamb", amount: "30g 末" },
      { foodId: "carrot", amount: "30g" },
      { foodId: "rice", amount: "40g" },
      { foodId: "ginger", amount: "2 片" },
    ],
    steps: [
      "羊肉末加姜片焯水去膻。",
      "与大米、胡萝卜碎一起加 6 倍水。",
      "小火煮 30 分钟,煮成稠粥。",
    ],
    nutrients: ["蛋白质", "铁", "维A"],
    tip: "冬季暖胃,羊肉性温补铁好。",
  },
];

export const RECIPES_BY_ID: Record<string, Recipe> = Object.fromEntries(
  RECIPES.map((r) => [r.id, r]),
);

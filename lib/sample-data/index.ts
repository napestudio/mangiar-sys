import { RestaurantType } from "@/app/generated/prisma";

export type SampleProduct = {
  name: string;
  description: string;
  category: string;
  price: number;
};

export type SampleData = {
  categories: string[];
  products: SampleProduct[];
};

export type RestaurantTypeLabel = {
  value: RestaurantType;
  label: string;
};

export const RESTAURANT_TYPE_LABELS: RestaurantTypeLabel[] = [
  { value: "RESTAURANT", label: "Restaurante" },
  { value: "CAFETERIA", label: "Cafetería" },
  { value: "BAR", label: "Bar" },
  { value: "FAST_FOOD", label: "Comida rápida" },
  { value: "PIZZERIA", label: "Pizzería" },
  { value: "PARRILLA", label: "Parrilla / Asador" },
  { value: "SUSHI", label: "Sushi / Japonesa" },
  { value: "FOOD_TRUCK", label: "Food Truck" },
  { value: "HELADERIA", label: "Heladería" },
  { value: "PARADOR", label: "Parador / Balneario" },
  { value: "EVENTO", label: "Salón de eventos" },
  { value: "CANTINA", label: "Cantina / Bodegón" },
  { value: "CERVECERIA", label: "Cervecería / Brewpub" },
  { value: "PASTELERIA", label: "Pastelería / Confitería" },
  { value: "CENTRO_EDUCATIVO", label: "Comedor educativo" },
];

const SAMPLE_DATA: Record<RestaurantType, SampleData> = {
  CAFETERIA: {
    categories: ["Desayunos", "Cafés y Bebidas", "Sandwiches y Tostadas", "Pastelería"],
    products: [
      { name: "Desayuno completo", description: "Café con leche, medias lunas y tostadas con manteca y mermelada", category: "Desayunos", price: 3200 },
      { name: "Tostadas con palta", description: "Pan de masa madre tostado con palta, sal y limón", category: "Desayunos", price: 2800 },
      { name: "Granola con yogur", description: "Granola artesanal con yogur griego y frutas de estación", category: "Desayunos", price: 2400 },
      { name: "Café espresso", description: "Espresso doble de origen seleccionado", category: "Cafés y Bebidas", price: 1200 },
      { name: "Cappuccino", description: "Espresso con leche vaporizada y espuma cremosa", category: "Cafés y Bebidas", price: 1600 },
      { name: "Latte", description: "Espresso con leche fría o caliente al gusto", category: "Cafés y Bebidas", price: 1800 },
      { name: "Matcha latte", description: "Matcha japonés con leche de avena", category: "Cafés y Bebidas", price: 2200 },
      { name: "Chocolate caliente", description: "Chocolate belga con leche entera y crema", category: "Cafés y Bebidas", price: 1800 },
      { name: "Tostado de jamón y queso", description: "Pan brioche tostado con jamón y queso fundido", category: "Sandwiches y Tostadas", price: 2600 },
      { name: "Sandwich de pollo", description: "Pechuga grillada, lechuga, tomate y mayonesa en pan ciabatta", category: "Sandwiches y Tostadas", price: 3400 },
      { name: "Croissant de manteca", description: "Croissant de manteca francés recién horneado", category: "Pastelería", price: 1400 },
      { name: "Medias lunas", description: "Medias lunas de manteca x3, glaseadas", category: "Pastelería", price: 1800 },
      { name: "Muffin de arándanos", description: "Muffin húmedo de arándanos y limón", category: "Pastelería", price: 1600 },
      { name: "Carrot cake", description: "Torta de zanahoria con frosting de queso crema", category: "Pastelería", price: 2200 },
      { name: "Brownie de chocolate", description: "Brownie de chocolate negro con nueces", category: "Pastelería", price: 1800 },
    ],
  },

  RESTAURANT: {
    categories: ["Entradas", "Principales", "Pastas", "Postres"],
    products: [
      { name: "Tabla de fiambres", description: "Surtido de quesos, jamón crudo y salame artesanal", category: "Entradas", price: 4800 },
      { name: "Ensalada César", description: "Lechuga romana, crutones, parmesano y aderezo clásico", category: "Entradas", price: 3200 },
      { name: "Empanadas x4", description: "Empanadas caseras variadas con chimichurri", category: "Entradas", price: 3600 },
      { name: "Sopa del día", description: "Consultar al mozo para conocer la preparación del día", category: "Entradas", price: 2400 },
      { name: "Milanesa napolitana", description: "Milanesa de ternera con salsa de tomate, jamón y queso", category: "Principales", price: 7200 },
      { name: "Lomo a la pimienta", description: "Lomo de ternera con salsa de pimienta verde y papas fritas", category: "Principales", price: 9500 },
      { name: "Pollo al limón", description: "Pechuga de pollo grillada con salsa de limón y alcaparras", category: "Principales", price: 6800 },
      { name: "Salmón a la plancha", description: "Salmón rosado con vegetales salteados y arroz blanco", category: "Principales", price: 10200 },
      { name: "Spaghetti bolognesa", description: "Spaghetti con ragú de carne de res y cerdo", category: "Pastas", price: 5800 },
      { name: "Fettuccine al pesto", description: "Fettuccine con pesto de albahaca fresca y parmesano", category: "Pastas", price: 5400 },
      { name: "Ravioles de ricota", description: "Ravioles caseros de ricota y espinaca con manteca y salvia", category: "Pastas", price: 6200 },
      { name: "Tiramisú", description: "Tiramisú clásico con mascarpone y café espresso", category: "Postres", price: 2400 },
      { name: "Panna cotta", description: "Panna cotta de vainilla con coulis de frutos rojos", category: "Postres", price: 2200 },
      { name: "Flan casero", description: "Flan casero con dulce de leche y crema chantilly", category: "Postres", price: 2000 },
      { name: "Brownie con helado", description: "Brownie de chocolate tibio con helado de vainilla", category: "Postres", price: 2600 },
    ],
  },

  PIZZERIA: {
    categories: ["Entradas", "Pizzas", "Empanadas", "Postres"],
    products: [
      { name: "Provoleta", description: "Provoleta fundida con orégano y aceite de oliva", category: "Entradas", price: 3000 },
      { name: "Garlic bread", description: "Pan de ajo con manteca, ajo y perejil", category: "Entradas", price: 1800 },
      { name: "Pizza Mozzarella (grande)", description: "Salsa de tomate casera y mozzarella fior di latte", category: "Pizzas", price: 5200 },
      { name: "Pizza Napolitana (grande)", description: "Salsa de tomate, mozzarella, tomate fresco y ajo", category: "Pizzas", price: 5800 },
      { name: "Pizza Fugazzeta (grande)", description: "Mozzarella y cebolla caramelizada, sin salsa", category: "Pizzas", price: 5600 },
      { name: "Pizza de Rúcula (grande)", description: "Mozzarella, rúcula fresca, tomates cherry y parmesano", category: "Pizzas", price: 6400 },
      { name: "Pizza 4 Quesos (grande)", description: "Mozzarella, roquefort, parmesano y provolone", category: "Pizzas", price: 6800 },
      { name: "Pizza de Jamón (grande)", description: "Salsa de tomate, mozzarella, jamón cocido y champiñones", category: "Pizzas", price: 6200 },
      { name: "Pizza Calabresa (grande)", description: "Salsa de tomate, mozzarella y salamín picante", category: "Pizzas", price: 6000 },
      { name: "Pizza Veggie (grande)", description: "Pimientos, zucchini, berenjena y aceitunas", category: "Pizzas", price: 5800 },
      { name: "Empanada de carne", description: "Empanada de carne cortada a cuchillo", category: "Empanadas", price: 800 },
      { name: "Empanada de jamón y queso", description: "Empanada de jamón y queso derretido", category: "Empanadas", price: 750 },
      { name: "Empanada de pollo", description: "Empanada de pollo con verduras salteadas", category: "Empanadas", price: 750 },
      { name: "Fainá", description: "Fainá de garbanzos recién horneada", category: "Postres", price: 1400 },
      { name: "Tiramisú", description: "Tiramisú clásico con mascarpone y café", category: "Postres", price: 2400 },
    ],
  },

  PARRILLA: {
    categories: ["Entradas", "Carnes", "Acompañamientos", "Postres"],
    products: [
      { name: "Tabla de quesos y fiambres", description: "Surtido de quesos curados, jamón crudo y salame artesanal", category: "Entradas", price: 4800 },
      { name: "Empanadas de carne (x6)", description: "Empanadas caseras de carne cortada a cuchillo", category: "Entradas", price: 3600 },
      { name: "Chorizo criollo", description: "Chorizo artesanal a la parrilla con chimichurri", category: "Entradas", price: 2800 },
      { name: "Morcilla", description: "Morcilla a la parrilla con pan de campo", category: "Entradas", price: 2400 },
      { name: "Asado de tira (400g)", description: "Asado de tira de novillo a la parrilla a punto", category: "Carnes", price: 8500 },
      { name: "Bife de chorizo (350g)", description: "Bife de chorizo Aberdeen Angus con papas fritas", category: "Carnes", price: 9200 },
      { name: "Entraña (300g)", description: "Entraña fina a la parrilla con ensalada mixta", category: "Carnes", price: 8800 },
      { name: "Vacío completo (500g)", description: "Vacío de novillo con chimichurri y salsa criolla", category: "Carnes", price: 10500 },
      { name: "Pollo a la parrilla", description: "Medio pollo a la parrilla con especias criollas", category: "Carnes", price: 6400 },
      { name: "Costillar de cerdo", description: "Costillar de cerdo glaseado con miel y mostaza", category: "Carnes", price: 9800 },
      { name: "Papas fritas", description: "Papas fritas caseras crocantes", category: "Acompañamientos", price: 2200 },
      { name: "Ensalada mixta", description: "Lechuga, tomate, zanahoria y aceitunas", category: "Acompañamientos", price: 1800 },
      { name: "Provoleta", description: "Provoleta gratinada con orégano y aceite de oliva", category: "Acompañamientos", price: 3200 },
      { name: "Flan casero", description: "Flan casero con dulce de leche y crema", category: "Postres", price: 2000 },
      { name: "Ensalada de frutas", description: "Mezcla de frutas de estación con crema chantilly", category: "Postres", price: 1800 },
    ],
  },

  BAR: {
    categories: ["Picadas", "Snacks", "Bebidas", "Cócteles"],
    products: [
      { name: "Picada completa", description: "Quesos, fiambres, aceitunas, maní y bastones de pan", category: "Picadas", price: 5500 },
      { name: "Tabla de quesos", description: "Surtido de quesos con mermelada y pan tostado", category: "Picadas", price: 4200 },
      { name: "Nachos con guacamole", description: "Nachos crocantes con guacamole casero y salsa picante", category: "Snacks", price: 3200 },
      { name: "Alitas de pollo", description: "Alitas de pollo fritas con salsa buffalo y celery", category: "Snacks", price: 4500 },
      { name: "Papas rústicas", description: "Papas con piel al horno con dip de queso azul", category: "Snacks", price: 2800 },
      { name: "Cerveza artesanal pinta", description: "Pinta de cerveza artesanal. Consultar variedades disponibles.", category: "Bebidas", price: 2400 },
      { name: "Cerveza artesanal media pinta", description: "Media pinta de cerveza artesanal. Consultar variedades.", category: "Bebidas", price: 1600 },
      { name: "Vino copa", description: "Copa de vino tinto, blanco o rosado", category: "Bebidas", price: 1800 },
      { name: "Agua mineral", description: "Agua mineral con o sin gas 500ml", category: "Bebidas", price: 800 },
      { name: "Gin & Tonic", description: "Gin premium con agua tónica, pepino y hielo", category: "Cócteles", price: 3800 },
      { name: "Mojito", description: "Ron, lima, menta fresca, azúcar y soda", category: "Cócteles", price: 3600 },
      { name: "Aperol Spritz", description: "Aperol, prosecco, soda y rodaja de naranja", category: "Cócteles", price: 3800 },
      { name: "Negroni", description: "Gin, Campari y vermut rosso con cáscara de naranja", category: "Cócteles", price: 4200 },
      { name: "Margarita", description: "Tequila, triple sec y jugo de lima con sal en el borde", category: "Cócteles", price: 3800 },
      { name: "Cosmopolitan", description: "Vodka citrus, triple sec, jugo de arándano y lima", category: "Cócteles", price: 3600 },
    ],
  },

  FAST_FOOD: {
    categories: ["Hamburguesas", "Wraps", "Papas y Salsas", "Bebidas"],
    products: [
      { name: "Hamburguesa Clásica", description: "Medallón de 200g, lechuga, tomate, cebolla y salsa especial", category: "Hamburguesas", price: 4800 },
      { name: "Hamburguesa Doble", description: "Doble medallón de 200g, cheddar, bacon y BBQ", category: "Hamburguesas", price: 6200 },
      { name: "Hamburguesa con Queso", description: "Medallón de 200g con doble cheddar y mostaza americana", category: "Hamburguesas", price: 5200 },
      { name: "Hamburguesa Veggie", description: "Medallón de lentejas y remolacha, aguacate y tomate", category: "Hamburguesas", price: 5000 },
      { name: "Hamburguesa Picante", description: "Medallón de 200g, jalapeños, salsa sriracha y cebolla crispy", category: "Hamburguesas", price: 5600 },
      { name: "Wrap de Pollo", description: "Pechuga grillada, lechuga, tomate y mayonesa en tortilla", category: "Wraps", price: 4200 },
      { name: "Wrap BBQ", description: "Tiras de pollo crujiente con salsa BBQ, cebolla y cheddar", category: "Wraps", price: 4600 },
      { name: "Wrap Veggie", description: "Falafel, hummus, pepino y mix de hojas en tortilla integral", category: "Wraps", price: 4000 },
      { name: "Papas fritas pequeñas", description: "Papas fritas crocantes tamaño pequeño", category: "Papas y Salsas", price: 1600 },
      { name: "Papas fritas grandes", description: "Papas fritas crocantes tamaño grande", category: "Papas y Salsas", price: 2200 },
      { name: "Papas con cheddar", description: "Papas fritas con salsa de cheddar derretido", category: "Papas y Salsas", price: 2800 },
      { name: "Aros de cebolla", description: "Aros de cebolla rebozados y fritos, crocantes", category: "Papas y Salsas", price: 2400 },
      { name: "Gaseosa personal", description: "Coca-Cola, Sprite o Fanta 350ml", category: "Bebidas", price: 1200 },
      { name: "Limonada", description: "Limonada casera con hielo y menta", category: "Bebidas", price: 1400 },
      { name: "Milkshake", description: "Milkshake de chocolate, fresa o vainilla", category: "Bebidas", price: 2200 },
    ],
  },

  SUSHI: {
    categories: ["Entradas", "Rolls", "Nigiris y Sashimi", "Postres"],
    products: [
      { name: "Edamame", description: "Vainas de soja saladas al vapor", category: "Entradas", price: 1800 },
      { name: "Gyozas (x6)", description: "Dumplings de cerdo y repollo a la plancha con ponzu", category: "Entradas", price: 3600 },
      { name: "Miso soup", description: "Sopa de miso con tofu, wakame y cebolla de verdeo", category: "Entradas", price: 1600 },
      { name: "Karaage", description: "Pollo frito japonés con mayonesa de kewpie y limón", category: "Entradas", price: 4200 },
      { name: "California Roll (8 piezas)", description: "Kani, palta y pepino con mayonesa y semillas de sésamo", category: "Rolls", price: 4800 },
      { name: "Philadelphia Roll (8 piezas)", description: "Salmón, queso crema y pepino", category: "Rolls", price: 5200 },
      { name: "Spicy Tuna Roll (8 piezas)", description: "Atún picante con sriracha, pepino y tobiko", category: "Rolls", price: 5600 },
      { name: "Dragon Roll (8 piezas)", description: "Langostino tempura por dentro, palta por fuera", category: "Rolls", price: 6400 },
      { name: "Tempura Roll (8 piezas)", description: "Langostino tempura, pepino y queso crema", category: "Rolls", price: 5800 },
      { name: "Rainbow Roll (8 piezas)", description: "Roll californiano cubierto de sashimi variado", category: "Rolls", price: 7200 },
      { name: "Salmón nigiri (2 piezas)", description: "Nigiri de salmón fresco sobre arroz de sushi", category: "Nigiris y Sashimi", price: 2800 },
      { name: "Atún nigiri (2 piezas)", description: "Nigiri de atún rojo sobre arroz de sushi", category: "Nigiris y Sashimi", price: 3200 },
      { name: "Sashimi de salmón (5 piezas)", description: "Láminas de salmón fresco con jengibre y wasabi", category: "Nigiris y Sashimi", price: 4800 },
      { name: "Mochi de helado", description: "Mochi de helado de té verde y frambuesa", category: "Postres", price: 2200 },
      { name: "Cheesecake japonés", description: "Cheesecake esponjoso de estilo japonés con frutos rojos", category: "Postres", price: 2600 },
    ],
  },

  FOOD_TRUCK: {
    categories: ["Platos Principales", "Extras", "Bebidas", "Postres"],
    products: [
      { name: "Burger Street", description: "Hamburguesa de 180g, cheddar, caramelizada y sriracha", category: "Platos Principales", price: 4200 },
      { name: "Hot Dog Clásico", description: "Salchicha en pan brioche con mostaza y ketchup", category: "Platos Principales", price: 2800 },
      { name: "Wrap de Pollo BBQ", description: "Pollo asado, salsa BBQ, repollo y pimientos en tortilla", category: "Platos Principales", price: 3800 },
      { name: "Arepa Rellena", description: "Arepa de maíz rellena con pollo mechado y aguacate", category: "Platos Principales", price: 3600 },
      { name: "Taco Street (x3)", description: "Tacos de carne asada con cilantro, cebolla y salsa verde", category: "Platos Principales", price: 3400 },
      { name: "Nachos bowl", description: "Nachos con pollo, guacamole, jalapeños y crema agria", category: "Platos Principales", price: 4000 },
      { name: "Papas fritas", description: "Papas fritas crocantes con sal", category: "Extras", price: 1600 },
      { name: "Papas con cheddar y bacon", description: "Papas fritas con cheddar derretido y bacon crujiente", category: "Extras", price: 2600 },
      { name: "Aros de cebolla", description: "Aros de cebolla rebozados crocantes", category: "Extras", price: 2000 },
      { name: "Agua mineral", description: "Agua mineral con o sin gas 500ml", category: "Bebidas", price: 800 },
      { name: "Gaseosa", description: "Lata de gaseosa 350ml", category: "Bebidas", price: 1000 },
      { name: "Limonada natural", description: "Limonada exprimida con hielo", category: "Bebidas", price: 1400 },
      { name: "Cerveza de lata", description: "Lata de cerveza fría 473ml", category: "Bebidas", price: 1800 },
      { name: "Brownie de chocolate", description: "Brownie húmedo de chocolate con nueces", category: "Postres", price: 1600 },
      { name: "Churros con dulce de leche", description: "Churros crocantes con dulce de leche para dipear", category: "Postres", price: 2000 },
    ],
  },

  HELADERIA: {
    categories: ["Helados", "Granizados y Frappes", "Tortas y Postres", "Bebidas"],
    products: [
      { name: "Cucurucho simple", description: "1 gusto a elección en cucurucho o vasito", category: "Helados", price: 1400 },
      { name: "Cucurucho doble", description: "2 gustos a elección en cucurucho o vasito", category: "Helados", price: 2000 },
      { name: "Cuarto kilo", description: "250g de helado artesanal. Hasta 2 gustos.", category: "Helados", price: 2800 },
      { name: "Medio kilo", description: "500g de helado artesanal. Hasta 3 gustos.", category: "Helados", price: 5200 },
      { name: "Kilo de helado", description: "1kg de helado artesanal. Hasta 4 gustos.", category: "Helados", price: 9800 },
      { name: "Banana split", description: "Banana, 3 bochas de helado, crema, almendras y frutillas", category: "Helados", price: 3800 },
      { name: "Granizado de limón", description: "Granizado artesanal de limón natural con peta zeta", category: "Granizados y Frappes", price: 1800 },
      { name: "Granizado de sandía", description: "Granizado refrescante de sandía natural", category: "Granizados y Frappes", price: 1800 },
      { name: "Frappe de chocolate", description: "Frappe cremoso de chocolate con leche y helado", category: "Granizados y Frappes", price: 2600 },
      { name: "Frappe de vainilla", description: "Frappe de vainilla con leche, helado y crema chantilly", category: "Granizados y Frappes", price: 2400 },
      { name: "Torta helada de chocolate", description: "Porción de torta helada de chocolate y dulce de leche", category: "Tortas y Postres", price: 3200 },
      { name: "Profiteroles", description: "Profiteroles rellenos de helado bañados en chocolate", category: "Tortas y Postres", price: 3600 },
      { name: "Waffles con helado", description: "Waffles crocantes con 2 bochas de helado y dulce de leche", category: "Tortas y Postres", price: 4200 },
      { name: "Agua mineral", description: "Agua mineral con o sin gas 500ml", category: "Bebidas", price: 800 },
      { name: "Café con leche", description: "Café con leche caliente en vaso grande", category: "Bebidas", price: 1400 },
    ],
  },

  PARADOR: {
    categories: ["Desayunos y Meriendas", "Platos del Día", "Bebidas Frías", "Postres"],
    products: [
      { name: "Medialunas (x3)", description: "Medialunas de manteca recién horneadas", category: "Desayunos y Meriendas", price: 1600 },
      { name: "Tostadas con dulce y manteca", description: "Tostadas con manteca y mermelada surtida", category: "Desayunos y Meriendas", price: 1800 },
      { name: "Café con leche", description: "Café con leche caliente en vaso o taza", category: "Desayunos y Meriendas", price: 1400 },
      { name: "Té o manzanilla", description: "Té negro o manzanilla con azúcar y limón", category: "Desayunos y Meriendas", price: 1200 },
      { name: "Milanesa con papas", description: "Milanesa de ternera con papas fritas o ensalada", category: "Platos del Día", price: 6800 },
      { name: "Sandwich de lomito", description: "Lomito, queso, lechuga, tomate y mayonesa en pan", category: "Platos del Día", price: 5200 },
      { name: "Wrap de pollo grillado", description: "Pollo, palta, tomate y lechuga en tortilla", category: "Platos del Día", price: 4600 },
      { name: "Ensalada completa", description: "Mix de hojas, pollo grillado, tomate y vinagreta", category: "Platos del Día", price: 4000 },
      { name: "Plato de frutas", description: "Frutas de estación picadas con yogur y granola", category: "Platos del Día", price: 2800 },
      { name: "Agua mineral", description: "Agua mineral con o sin gas 500ml", category: "Bebidas Frías", price: 800 },
      { name: "Gaseosa", description: "Gaseosa en lata 350ml. Consultar variedades.", category: "Bebidas Frías", price: 1000 },
      { name: "Limonada", description: "Limonada natural con hielo y menta", category: "Bebidas Frías", price: 1600 },
      { name: "Cerveza de lata", description: "Lata de cerveza fría 473ml", category: "Bebidas Frías", price: 1800 },
      { name: "Licuado de banana", description: "Licuado de banana con leche y miel", category: "Bebidas Frías", price: 2000 },
      { name: "Helado de palito", description: "Helado de palito. Consultar variedades disponibles.", category: "Postres", price: 1200 },
    ],
  },

  EVENTO: {
    categories: ["Aperitivos", "Buffet Frío", "Buffet Caliente", "Postres"],
    products: [
      { name: "Canapés surtidos (x12)", description: "Surtido de canapés con quesos, fiambres y vegetales", category: "Aperitivos", price: 4800 },
      { name: "Brochetas de mozzarella y tomate (x6)", description: "Brochetas caprese con albahaca fresca y aceite de oliva", category: "Aperitivos", price: 3200 },
      { name: "Mini empanadas (x12)", description: "Mini empanadas surtidas (carne, jamón y queso, verdura)", category: "Aperitivos", price: 4200 },
      { name: "Tabla de quesos premium", description: "Surtido de quesos curados, frutos secos y mermeladas", category: "Buffet Frío", price: 8500 },
      { name: "Tabla de salmón y mariscos", description: "Salmón ahumado, langostinos y ceviche con tostadas", category: "Buffet Frío", price: 12000 },
      { name: "Ensalada mediterránea (por persona)", description: "Rúcula, cherry, aceitunas, queso feta y pesto", category: "Buffet Frío", price: 2400 },
      { name: "Pollo relleno (por persona)", description: "Pechuga rellena de verduras y queso con salsa", category: "Buffet Caliente", price: 5600 },
      { name: "Pasta al pesto (por persona)", description: "Pasta corta con pesto de albahaca y parmesano", category: "Buffet Caliente", price: 3800 },
      { name: "Risotto de champiñones (por persona)", description: "Risotto cremoso con champiñones y trufa", category: "Buffet Caliente", price: 4500 },
      { name: "Minihamburguesas (x4)", description: "Minihamburguesas gourmet con queso y salsa especial", category: "Buffet Caliente", price: 4200 },
      { name: "Croquetas de jamón y queso (x6)", description: "Croquetas artesanales crocantes con dip", category: "Buffet Caliente", price: 3600 },
      { name: "Torta de celebración (porción)", description: "Porción de torta de celebración personalizada", category: "Postres", price: 2800 },
      { name: "Mesa de dulces (por persona)", description: "Surtido de macarons, petit fours y trufas", category: "Postres", price: 3200 },
      { name: "Copa de frutas (por persona)", description: "Ensalada de frutas frescas con coulis y menta", category: "Postres", price: 2000 },
      { name: "Mousse de chocolate (por persona)", description: "Mousse de chocolate belga con frambuesas frescas", category: "Postres", price: 2400 },
    ],
  },

  CANTINA: {
    categories: ["Entradas", "Pastas", "Guisos y Platos", "Postres"],
    products: [
      { name: "Empanadas de carne (x4)", description: "Empanadas caseras de carne cortada a cuchillo", category: "Entradas", price: 3200 },
      { name: "Caldo de pollo", description: "Caldo casero de pollo con fideos y vegetales", category: "Entradas", price: 2200 },
      { name: "Ensalada mixta", description: "Lechuga, tomate, zanahoria, cebolla y aceitunas", category: "Entradas", price: 1800 },
      { name: "Pan casero", description: "Pan casero recién horneado con manteca", category: "Entradas", price: 1200 },
      { name: "Spaghetti con tuco", description: "Spaghetti con salsa de tomate y albahaca casera", category: "Pastas", price: 4800 },
      { name: "Fideos con estofado", description: "Pasta corta con estofado de carne y vegetales", category: "Pastas", price: 5400 },
      { name: "Ravioles de ricota y espinaca", description: "Ravioles caseros con manteca y salvia o tuco", category: "Pastas", price: 5800 },
      { name: "Sorrentinos de jamón y queso", description: "Sorrentinos caseros con crema o tuco", category: "Pastas", price: 6200 },
      { name: "Locro de invierno", description: "Locro con carne, chorizo, maíz y porotos", category: "Guisos y Platos", price: 5600 },
      { name: "Guiso de lentejas", description: "Guiso de lentejas con chorizo y verduras", category: "Guisos y Platos", price: 4800 },
      { name: "Puchero de gallina", description: "Puchero tradicional con gallina, vegetales y caldo", category: "Guisos y Platos", price: 5200 },
      { name: "Milanesa con papas", description: "Milanesa de ternera con papas fritas o ensalada", category: "Guisos y Platos", price: 6400 },
      { name: "Flan con dulce de leche", description: "Flan casero con dulce de leche y crema", category: "Postres", price: 1800 },
      { name: "Budín de pan", description: "Budín de pan con pasas y crema inglesa", category: "Postres", price: 1600 },
      { name: "Arroz con leche", description: "Arroz con leche con canela y vainilla", category: "Postres", price: 1600 },
    ],
  },

  CERVECERIA: {
    categories: ["Cervezas Artesanales", "Hamburguesas y Sándwiches", "Picadas", "Sin Alcohol"],
    products: [
      { name: "Pinta Blonde Ale", description: "Blonde Ale suave, color dorado, 5% ABV", category: "Cervezas Artesanales", price: 2400 },
      { name: "Pinta IPA", description: "India Pale Ale con notas cítricas y amargas, 6.5% ABV", category: "Cervezas Artesanales", price: 2800 },
      { name: "Pinta Stout", description: "Stout oscura con notas a café y chocolate, 5.5% ABV", category: "Cervezas Artesanales", price: 2800 },
      { name: "Pinta Red Ale", description: "Red Ale caramelizada con cuerpo medio, 5.2% ABV", category: "Cervezas Artesanales", price: 2600 },
      { name: "Pinta Weizen", description: "Wheat beer alemana con notas a banana y clavo, 4.8% ABV", category: "Cervezas Artesanales", price: 2400 },
      { name: "Hamburguesa artesanal", description: "Medallón de 200g, cheddar añejo, caramelizada y cerveza BBQ", category: "Hamburguesas y Sándwiches", price: 5800 },
      { name: "Hamburguesa doble", description: "Doble medallón de 200g, bacon ahumado y queso azul", category: "Hamburguesas y Sándwiches", price: 7200 },
      { name: "Sándwich de pulled pork", description: "Cerdo desmenuzado con BBQ, coleslaw y encurtidos", category: "Hamburguesas y Sándwiches", price: 5400 },
      { name: "Hot dog artesanal", description: "Salchicha artesanal con cebolla caramelizada y mostaza rústica", category: "Hamburguesas y Sándwiches", price: 4200 },
      { name: "Picada clásica", description: "Quesos, fiambres, aceitunas, maní tostado y bastones", category: "Picadas", price: 5600 },
      { name: "Alitas de pollo (x8)", description: "Alitas con salsa buffalo o miel y mostaza", category: "Picadas", price: 5200 },
      { name: "Nachos con queso", description: "Nachos con salsa de cheddar, jalapeños y crema agria", category: "Picadas", price: 3800 },
      { name: "Cerveza sin alcohol", description: "Cerveza artesanal sin alcohol, refrescante y con sabor", category: "Sin Alcohol", price: 2000 },
      { name: "Limonada de jengibre", description: "Limonada natural con jengibre y hielo", category: "Sin Alcohol", price: 1600 },
      { name: "Kombucha", description: "Kombucha artesanal en botella 330ml. Consultar sabores.", category: "Sin Alcohol", price: 2200 },
    ],
  },

  PASTELERIA: {
    categories: ["Tortas y Tartas", "Facturas y Masas", "Cupcakes y Mini Postres", "Bebidas"],
    products: [
      { name: "Torta de chocolate (porción)", description: "Torta húmeda de chocolate con ganache y frambuesas", category: "Tortas y Tartas", price: 2800 },
      { name: "Cheesecake de maracuyá (porción)", description: "Cheesecake cremoso de maracuyá con coulis", category: "Tortas y Tartas", price: 3000 },
      { name: "Torta de zanahoria (porción)", description: "Torta de zanahoria con frosting de queso crema", category: "Tortas y Tartas", price: 2600 },
      { name: "Lemon pie (porción)", description: "Tarta de limón con merengue suizo tostado", category: "Tortas y Tartas", price: 2600 },
      { name: "Tarta de frutas (porción)", description: "Masa sablé, crema pastelera y frutas de estación", category: "Tortas y Tartas", price: 2400 },
      { name: "Medialunas de manteca (x3)", description: "Medialunas de manteca recién horneadas y glaseadas", category: "Facturas y Masas", price: 1800 },
      { name: "Facturas surtidas (x4)", description: "Surtido de facturas: vigilante, cuernito, berlinesa y cañita", category: "Facturas y Masas", price: 2400 },
      { name: "Croissant de manteca", description: "Croissant francés de hojaldre con manteca", category: "Facturas y Masas", price: 1600 },
      { name: "Scone de arándanos", description: "Scone inglés de arándanos con manteca y mermelada", category: "Facturas y Masas", price: 1800 },
      { name: "Cupcake de vainilla", description: "Cupcake de vainilla con buttercream de colores", category: "Cupcakes y Mini Postres", price: 1600 },
      { name: "Cupcake de chocolate", description: "Cupcake de chocolate con relleno de dulce de leche", category: "Cupcakes y Mini Postres", price: 1800 },
      { name: "Macarons (x3)", description: "Macarons parisinos surtidos. Consultar sabores.", category: "Cupcakes y Mini Postres", price: 2400 },
      { name: "Trufas de chocolate (x4)", description: "Trufas artesanales de chocolate belga surtidas", category: "Cupcakes y Mini Postres", price: 2200 },
      { name: "Café con leche", description: "Café con leche en vaso grande con espuma", category: "Bebidas", price: 1600 },
      { name: "Té de hierbas", description: "Surtido de tés de hierbas con miel y limón", category: "Bebidas", price: 1200 },
    ],
  },

  CENTRO_EDUCATIVO: {
    categories: ["Desayuno y Merienda", "Almuerzo", "Snacks", "Bebidas"],
    products: [
      { name: "Té con leche", description: "Té con leche caliente en vaso", category: "Desayuno y Merienda", price: 800 },
      { name: "Café con leche", description: "Café con leche en vaso", category: "Desayuno y Merienda", price: 900 },
      { name: "Medialunas (x2)", description: "Medialunas de manteca frescas", category: "Desayuno y Merienda", price: 1200 },
      { name: "Tostadas con manteca y mermelada", description: "Tostadas con manteca y mermelada de durazno o frutilla", category: "Desayuno y Merienda", price: 1000 },
      { name: "Menú del día (almuerzo)", description: "Entrada + plato principal del día. Consultar en mostrador.", category: "Almuerzo", price: 4500 },
      { name: "Milanesa con ensalada", description: "Milanesa de pollo o carne con guarnición a elección", category: "Almuerzo", price: 5200 },
      { name: "Fideos con tuco o manteca", description: "Fideos con salsa de tomate casera o manteca y queso", category: "Almuerzo", price: 3800 },
      { name: "Pollo a la plancha con arroz", description: "Pechuga de pollo grillada con arroz y ensalada", category: "Almuerzo", price: 4800 },
      { name: "Guiso del día", description: "Guiso casero. Consultar preparación en mostrador.", category: "Almuerzo", price: 4200 },
      { name: "Sandwich de jamón y queso", description: "Sandwich en pan lactal con jamón y queso", category: "Snacks", price: 1600 },
      { name: "Empanada de carne", description: "Empanada de carne casera", category: "Snacks", price: 900 },
      { name: "Alfajor de maicena", description: "Alfajor casero de maicena con dulce de leche y coco", category: "Snacks", price: 1000 },
      { name: "Fruta del día", description: "Fruta de estación entera o en trozos", category: "Snacks", price: 600 },
      { name: "Agua mineral", description: "Agua mineral 500ml con o sin gas", category: "Bebidas", price: 700 },
      { name: "Jugo de fruta natural", description: "Jugo exprimido de naranja o pomelo", category: "Bebidas", price: 1200 },
    ],
  },
};

export function getSampleData(type: RestaurantType): SampleData {
  return SAMPLE_DATA[type];
}

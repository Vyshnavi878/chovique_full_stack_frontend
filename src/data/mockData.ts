import { Product, Banner, Order, OfflineSale } from '../types';

export const initialBanners: Banner[] = [
  {
    id: '0',
    title: 'The Art of Fine Chocolate',
    subtitle: 'Handcrafted from the world\'s finest single-origin cocoa beans, every Chovique creation is a masterpiece of flavor and elegance.',
    tag: 'Est. 2020 · Premium Handmade Chocolates',
    image: '/assets/hero-1.jpg',
    buttonText: 'Explore Collection',
    link: '#popular'
  },
  {
    id: '1',
    title: 'Festive Season Sale — 40% Off',
    subtitle: 'Indulge in our curated gift boxes, truffles, and pralines. Perfect for gifting or savoring the finest moments.',
    tag: 'Limited Time Offer',
    image: '/assets/hero-2.jpg',
    buttonText: 'Shop Deals',
    link: '#store'
  },
  {
    id: '2',
    title: 'Crafted with Passion & Precision',
    subtitle: 'From sourcing the rarest cocoa beans to tempering by hand, we pour love into every single piece.',
    tag: 'Bean to Bar · Handcrafted',
    image: '/assets/hero-3.jpg',
    buttonText: 'Discover Our Process',
    link: '/our-story'
  },
  {
    id: '3',
    title: 'Gift the Joy of Luxury Chocolate',
    subtitle: 'Our premium gift hampers and bespoke packaging make every occasion unforgettable.',
    tag: 'Luxury Gifting · Worldwide Delivery',
    image: '/assets/hero-4.jpg',
    buttonText: 'View Gift Sets',
    link: '#store'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'p1',
    name: 'Belgian Dark Truffle Bar',
    category: 'dark',
    price: 849,
    originalPrice: 1199,
    weight: '100g',
    badge: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=600&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    ratingsCount: 148,
    description: '72% single-origin cocoa from Ghana, cold-pressed with Tahitian vanilla and dusted with gold leaf. Expect a rich, complex cocoa profile with notes of dried fruit and warm spice.',
    ingredients: 'Ghanaian Cocoa Mass, Cocoa Butter, Organic Cane Sugar, Tahitian Vanilla Bean Extract, Edible 24k Gold Leaf, Soy Lecithin (emulsifier).',
    nutrition: {
      calories: '560 kcal',
      totalFat: '38g',
      saturatedFat: '23g',
      cholesterol: '0mg',
      sodium: '15mg',
      totalCarb: '48g',
      protein: '7.5g'
    },
    reviews: [
      { id: 'r1', author: 'Priya Sharma', rating: 5, text: 'Absolutely divine! The dark truffle melted like silk. The depth of flavor is outstanding.', date: '2026-06-15', avatar: 'PS' },
      { id: 'r2', author: 'Vikram Kapoor', rating: 5, text: 'I\'ve tried chocolates from Belgium, Switzerland, and France — but Chovique genuinely stands apart.', date: '2026-06-10', avatar: 'VK' }
    ]
  },
  {
    id: 'p2',
    name: 'Royal Truffle Collection',
    category: 'gift',
    price: 2499,
    originalPrice: 3299,
    weight: '300g',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    ratingsCount: 92,
    description: 'An exquisite 24-piece assortment of hand-rolled truffles in dark, milk, and white chocolate. Flavors include Salted Caramel, Dark Espresso, Rose Raspberry, and Pistachio Saffron.',
    ingredients: 'Cocoa Mass, Cocoa Butter, Whole Milk Powder, Dairy Cream, Butter, Sugar, Natural Flavourings (Raspberry, Coffee, Pistachio, Saffron), Soy Lecithin.',
    nutrition: {
      calories: '525 kcal',
      totalFat: '34g',
      saturatedFat: '20g',
      cholesterol: '18mg',
      sodium: '45mg',
      totalCarb: '52g',
      protein: '6.2g'
    },
    reviews: [
      { id: 'r3', author: 'Arjun Mehta', rating: 5, text: 'Gifted the Royal Box to my wife. Best reaction ever! Presentation is 10/10.', date: '2026-06-20', avatar: 'AM' }
    ]
  },
  {
    id: 'p3',
    name: 'Gold Leaf Pralines',
    category: 'dark',
    price: 1649,
    originalPrice: 2199,
    weight: '180g',
    badge: 'Premium',
    image: 'https://images.unsplash.com/photo-1526081347589-7fa3cb36b312?auto=format&fit=crop&w=600&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
    rating: 5.0,
    ratingsCount: 74,
    description: 'Premium pistachio cream and caramelized hazelnut wrapped in 64% dark chocolate, finished with edible 24k gold. A harmonious blend of nutty creaminess and rich dark chocolate.',
    ingredients: 'Cocoa Mass, Cocoa Butter, Sugar, Roasted Hazelnuts, Iranian Pistachios, Milk Solid Cream, Edible Gold flakes, Lecithin, Natural Vanilla.',
    nutrition: {
      calories: '575 kcal',
      totalFat: '41g',
      saturatedFat: '18g',
      cholesterol: '4mg',
      sodium: '35mg',
      totalCarb: '45g',
      protein: '8.8g'
    },
    reviews: [
      { id: 'r4', author: 'Chef Ravi Joshi', rating: 5, text: 'The pistachio paste is tempered perfectly. Gold leaf adds an ultra-premium touch.', date: '2026-06-22', avatar: 'RJ' }
    ]
  },
  {
    id: 'p4',
    name: 'Hazelnut Crunch',
    category: 'milk',
    price: 699,
    originalPrice: 899,
    weight: '150g',
    image: 'https://images.unsplash.com/photo-1542841791-1925b02a2bcd?auto=format&fit=crop&w=600&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    ratingsCount: 110,
    description: 'Creamy milk chocolate crafted from premium Madagascan cocoa, combined with double-roasted, caramelized Turkish hazelnuts for the ultimate crunch.',
    ingredients: 'Milk Chocolate (Madagascan Cocoa 38%, Whole Milk Powder, Sugar, Cocoa Butter), Turkish Hazelnuts, Caramelized Sugar, Natural Vanilla Flavor.',
    nutrition: {
      calories: '585 kcal',
      totalFat: '39g',
      saturatedFat: '16g',
      cholesterol: '15mg',
      sodium: '60mg',
      totalCarb: '50g',
      protein: '8.0g'
    },
    reviews: [
      { id: 'r5', author: 'Ananya Rao', rating: 5, text: 'Hazelnut crunch is my weakness. Best chocolate in India! Perfectly sweetened.', date: '2026-06-18', avatar: 'AR' }
    ]
  },
  {
    id: 'p5',
    name: 'Salted Caramel Bonbons',
    category: 'dark',
    price: 999,
    originalPrice: 1299,
    weight: '120g',
    image: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=600&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1534706936160-d5be8023c345?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    ratingsCount: 88,
    description: 'Exquisite 8-piece bonbon shell containing rich, hand-cooked fleur de sel liquid caramel that oozes out in every bite. Encased in a beautiful glassmorphic sliding case.',
    ingredients: 'Dark Chocolate Shell (Ecuadorian Cocoa 60%), Caramel Fill (Glucose Syrup, Butter, Heavy Cream, Sea Salt (Fleur de Sel)), Emulsifier.',
    nutrition: {
      calories: '495 kcal',
      totalFat: '28g',
      saturatedFat: '17g',
      cholesterol: '25mg',
      sodium: '190mg',
      totalCarb: '58g',
      protein: '4.2g'
    },
    reviews: [
      { id: 'r6', author: 'Sara Khan', rating: 5, text: 'The salted caramel is unreal. Liquid caramel explosion, salt balance is perfect.', date: '2026-06-14', avatar: 'SK' }
    ]
  },
  {
    id: 'p6',
    name: 'White Macadamia Bar',
    category: 'white',
    price: 749,
    originalPrice: 949,
    weight: '100g',
    image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    ratingsCount: 56,
    description: 'Velvety, slow-churned white chocolate packed with buttery Queensland macadamia nuts. Mildly sweet, highlighting the premium cocoa butter quality.',
    ingredients: 'Deodorized Cocoa Butter, Whole Milk Solids, Icing Sugar, Roasted Macadamia Nuts, Pure Vanilla Extract, Soy Lecithin.',
    nutrition: {
      calories: '610 kcal',
      totalFat: '44g',
      saturatedFat: '24g',
      cholesterol: '20mg',
      sodium: '70mg',
      totalCarb: '47g',
      protein: '7.0g'
    },
    reviews: [
      { id: 'r7', author: 'Rahul Desai', rating: 4, text: 'Not usually a fan of white chocolate, but the macadamia is buttery and delicious. Great snap.', date: '2026-06-08', avatar: 'RD' }
    ]
  },
  {
    id: 'p7',
    name: 'Dipped Strawberries',
    category: 'gift',
    price: 1299,
    originalPrice: 1699,
    weight: '12 Pieces',
    badge: 'Limited',
    image: 'https://images.unsplash.com/photo-1518635017498-87f514b751ba?auto=format&fit=crop&w=600&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    ratingsCount: 63,
    description: 'Handpicked fresh Mahabaleshwar strawberries dipped in premium Ecuadorian dark and milk chocolate, drizzled with white chocolate stripes.',
    ingredients: 'Fresh Strawberries, Dark Chocolate (Ecuadorian Cocoa 55%), Milk Chocolate (Cocoa 36%), White Chocolate Drizzle.',
    nutrition: {
      calories: '280 kcal',
      totalFat: '14g',
      saturatedFat: '9g',
      cholesterol: '5mg',
      sodium: '20mg',
      totalCarb: '36g',
      protein: '3.0g'
    },
    reviews: [
      { id: 'r8', author: 'Neha Patel', rating: 5, text: 'Ordered these for a party. Super fresh, chocolate coat was thick and rich.', date: '2026-06-03', avatar: 'NP' }
    ]
  },
  {
    id: 'p8',
    name: 'Velvet Hot Chocolate',
    category: 'beverage',
    price: 599,
    originalPrice: 799,
    weight: '250g',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    ratingsCount: 120,
    description: 'A luxurious shaving blend of 68% chocolate flakes, ready to melt in hot milk. Formulated to create a thick, frothy hot beverage like the Parisian cafes.',
    ingredients: 'Shaved Chocolate Flakes (Ghanaian Cocoa mass 68%, Sugar, Cocoa Butter, Vanilla), Cocoa Powder, Cornstarch (thickener).',
    nutrition: {
      calories: '450 kcal',
      totalFat: '26g',
      saturatedFat: '16g',
      cholesterol: '0mg',
      sodium: '10mg',
      totalCarb: '53g',
      protein: '6.8g'
    },
    reviews: [
      { id: 'r9', author: 'Ananya Rao', rating: 5, text: 'This is the real deal! None of that sugary powder. Thick, dark, and rich.', date: '2026-06-25', avatar: 'AR' }
    ]
  }
];

export const initialOrders: Order[] = [
  {
    id: 'ORD-9872',
    items: [
      { product: initialProducts[0], quantity: 2 },
      { product: initialProducts[2], quantity: 1 }
    ],
    total: 3347,
    subtotal: 3347,
    discount: 0,
    shipping: 0,
    date: '2026-06-12',
    status: 'Delivered',
    shippingAddress: {
      name: 'Priya Sharma',
      street: 'Flat 402, Royal Gardens, Sector 15',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400053',
      phone: '+91 98765 43210'
    },
    deliveryOption: 'Express Delivery',
    paymentMethod: 'UPI'
  },
  {
    id: 'ORD-5431',
    items: [
      { product: initialProducts[1], quantity: 1 }
    ],
    total: 2499,
    subtotal: 2499,
    discount: 0,
    shipping: 0,
    date: '2026-06-24',
    status: 'Processing',
    shippingAddress: {
      name: 'Priya Sharma',
      street: 'Flat 402, Royal Gardens, Sector 15',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400053',
      phone: '+91 98765 43210'
    },
    deliveryOption: 'Same Day Delivery',
    paymentMethod: 'Credit Card'
  }
];

export const initialOfflineSales: OfflineSale[] = [
  { id: 'OFL-001', productName: 'Belgian Dark Truffle Bar', quantity: 12, totalPrice: 10188, date: '2026-06-25', paymentMethod: 'Cash' },
  { id: 'OFL-002', productName: 'Royal Truffle Collection', quantity: 5, totalPrice: 12495, date: '2026-06-25', paymentMethod: 'Card' },
  { id: 'OFL-003', productName: 'Gold Leaf Pralines', quantity: 8, totalPrice: 13192, date: '2026-06-26', paymentMethod: 'UPI' },
  { id: 'OFL-004', productName: 'Hazelnut Crunch', quantity: 15, totalPrice: 10485, date: '2026-06-26', paymentMethod: 'Cash' },
  { id: 'OFL-005', productName: 'Salted Caramel Bonbons', quantity: 10, totalPrice: 9990, date: '2026-06-27', paymentMethod: 'Card' }
];

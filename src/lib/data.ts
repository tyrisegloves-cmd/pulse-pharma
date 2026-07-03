export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isPrescriptionRequired: boolean;
  inStock: boolean;
  imageUrl: string;
  brand: string;
  dosage: string;
}

export const CATEGORIES = [
  "Pain Relief",
  "Antibiotics",
  "Chronic Care",
  "Baby & Mother",
  "Wellness",
  "First Aid",
];

// Lazy-load mock products to reduce initial bundle size
let cachedProducts: Product[] | null = null;

export function getMockProducts(): Product[] {
  if (cachedProducts) return cachedProducts;

  cachedProducts = [
    {
      id: "p1",
      name: "Paracetamol 500mg (Panadol)",
      description: "Effective relief for mild to moderate pain and fever.",
      price: 15.5,
      category: "Pain Relief",
      isPrescriptionRequired: false,
      inStock: true,
      imageUrl:
        "https://images.unsplash.com/photo-1584308666744-24d5e12810a0?q=80&w=600&auto=format&fit=crop",
      brand: "GSK",
      dosage: "Adults: 2 tablets up to 4 times daily",
    },
    {
      id: "p2",
      name: "Amoxicillin 500mg Capsules",
      description: "Penicillin antibiotic used to treat bacterial infections.",
      price: 45.0,
      category: "Antibiotics",
      isPrescriptionRequired: true,
      inStock: true,
      imageUrl:
        "https://images.unsplash.com/photo-1550572017-ed34c6776856?q=80&w=600&auto=format&fit=crop",
      brand: "Generic",
      dosage: "As directed by physician",
    },
    {
      id: "p3",
      name: "Metformin 500mg",
      description: "First-line medication for the treatment of type 2 diabetes.",
      price: 65.0,
      category: "Chronic Care",
      isPrescriptionRequired: true,
      inStock: true,
      imageUrl:
        "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=600&auto=format&fit=crop",
      brand: "Bristol-Myers",
      dosage: "As directed by physician",
    },
    {
      id: "p4",
      name: "Ibuprofen 400mg (Brufen)",
      description:
        "Nonsteroidal anti-inflammatory drug (NSAID) for pain and inflammation.",
      price: 25.0,
      category: "Pain Relief",
      isPrescriptionRequired: false,
      inStock: true,
      imageUrl:
        "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=600&auto=format&fit=crop",
      brand: "Abbott",
      dosage: "Adults: 1 tablet every 6-8 hours",
    },
    {
      id: "p5",
      name: "Vitamin C 1000mg Effervescent",
      description: "Immune system support and antioxidant protection.",
      price: 85.0,
      category: "Wellness",
      isPrescriptionRequired: false,
      inStock: true,
      imageUrl:
        "https://images.unsplash.com/photo-1620612668581-7f99991206f4?q=80&w=600&auto=format&fit=crop",
      brand: "Redoxon",
      dosage: "1 tablet daily dissolved in water",
    },
    {
      id: "p6",
      name: "Baby Vitamin D Drops",
      description:
        "Essential vitamin D support for infant development and bone health.",
      price: 35.0,
      category: "Baby & Mother",
      isPrescriptionRequired: false,
      inStock: true,
      imageUrl:
        "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=600&auto=format&fit=crop",
      brand: "Enfamil",
      dosage: "As directed by pediatrician",
    },
  ];

  return cachedProducts;
}

// Keep MOCK_PRODUCTS for backwards compatibility, but it's now lazy
export const MOCK_PRODUCTS = getMockProducts();

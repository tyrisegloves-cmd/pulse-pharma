import {
  Pill,
  Syringe,
  Heart,
  Baby,
  Leaf,
  Bandage,
  LucideIcon,
} from "lucide-react";

export interface CategoryIcon {
  icon: LucideIcon;
  bgColor: string;
  color: string;
}

const DEFAULT_CATEGORY_ICON: CategoryIcon = {
  icon: Pill,
  bgColor: "bg-gray-50",
  color: "text-gray-600",
};

const CATEGORY_ICONS: Record<string, CategoryIcon> = {
  "Pain Relief": {
    icon: Pill,
    bgColor: "bg-orange-50",
    color: "text-orange-600",
  },
  "Antibiotics": {
    icon: Syringe,
    bgColor: "bg-blue-50",
    color: "text-blue-600",
  },
  "Chronic Care": {
    icon: Heart,
    bgColor: "bg-red-50",
    color: "text-red-600",
  },
  "Mother & Baby Care": {
    icon: Baby,
    bgColor: "bg-pink-50",
    color: "text-pink-600",
  },
  "Wellness & Supplements": {
    icon: Leaf,
    bgColor: "bg-green-50",
    color: "text-green-600",
  },
  "First Aid": {
    icon: Bandage,
    bgColor: "bg-yellow-50",
    color: "text-yellow-600",
  },
};

export function getCategoryIcon(category: string): CategoryIcon {
  return CATEGORY_ICONS[category] ?? DEFAULT_CATEGORY_ICON;
}

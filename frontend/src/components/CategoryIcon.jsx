import React from 'react';
import {
  Utensils,
  Plane,
  Hotel,
  Camera,
  ShoppingBag,
  Beer,
  Package,
  ShoppingCart,
  Home,
  Zap,
  Wrench,
  Coffee,
  Tv,
  Luggage,
  Sun,
  Heart,
  Folder,
} from 'lucide-react';

const CATEGORY_ICON_COMPONENTS = {
  food: Utensils,
  travel: Plane,
  stay: Hotel,
  sightseeing: Camera,
  shopping: ShoppingBag,
  alcohol: Beer,
  misc: Package,
  groceries: ShoppingCart,
  rent: Home,
  utilities: Zap,
  maintenance: Wrench,
  chai_snacks: Coffee,
  subscriptions: Tv,
};

const GROUP_TYPE_ICON_COMPONENTS = {
  trip: Luggage,
  flatmates: Home,
  daily: Sun,
  couple: Heart,
  other: Folder,
};

export default function CategoryIcon({ category, size = 16, className = '', color }) {
  const IconComponent = CATEGORY_ICON_COMPONENTS[category] || Package;
  return <IconComponent size={size} className={className} color={color} />;
}

export function GroupTypeIcon({ type, size = 16, className = '', color }) {
  const IconComponent = GROUP_TYPE_ICON_COMPONENTS[type] || Folder;
  return <IconComponent size={size} className={className} color={color} />;
}

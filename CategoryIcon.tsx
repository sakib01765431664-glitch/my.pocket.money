import {
  BookOpen,
  Briefcase,
  Bus,
  Coffee,
  Film,
  Gift,
  Heart,
  Home,
  MoreHorizontal,
  ShoppingBag,
  Smartphone,
  Users,
  Utensils,
  Zap,
} from 'lucide-react';
import type { CategoryIconKey } from '../types/expense';

interface CategoryIconProps {
  icon: CategoryIconKey;
  className?: string;
}

export function CategoryIcon({ icon, className = 'w-4 h-4' }: CategoryIconProps) {
  switch (icon) {
    case 'utensils':
      return <Utensils className={className} aria-hidden="true" />;
    case 'bus':
      return <Bus className={className} aria-hidden="true" />;
    case 'coffee':
      return <Coffee className={className} aria-hidden="true" />;
    case 'smartphone':
      return <Smartphone className={className} aria-hidden="true" />;
    case 'film':
      return <Film className={className} aria-hidden="true" />;
    case 'shopping-bag':
      return <ShoppingBag className={className} aria-hidden="true" />;
    case 'users':
      return <Users className={className} aria-hidden="true" />;
    case 'heart':
      return <Heart className={className} aria-hidden="true" />;
    case 'book':
      return <BookOpen className={className} aria-hidden="true" />;
    case 'home':
      return <Home className={className} aria-hidden="true" />;
    case 'gift':
      return <Gift className={className} aria-hidden="true" />;
    case 'zap':
      return <Zap className={className} aria-hidden="true" />;
    case 'briefcase':
      return <Briefcase className={className} aria-hidden="true" />;
    case 'more-horizontal':
    default:
      return <MoreHorizontal className={className} aria-hidden="true" />;
  }
}

import { Layers, Waves, Ship, Info, LayoutDashboard, type LucideIcon } from 'lucide-react';

export type ViewId = 'dashboard' | 'explorer' | 'disaster' | 'about';

export interface NavItem {
  id: ViewId;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'explorer', label: '3D Explorer', icon: Waves },
  { id: 'disaster', label: 'Disaster Management', icon: Ship },
  { id: 'about', label: 'About', icon: Info },
];

export const PROJECT = {
  title: 'OceanVerse',
  subtitle: 'Interactive Ocean Model & Observation Visualization Platform',
  description:
    'An interactive browser-based platform for exploring ocean model fields and in-situ observations such as Argo floats and underwater Gliders.',
  organization: 'Ministry of Earth Sciences (MoES)',
  department: 'Indian National Centre for Ocean Information Services (INCOIS)',
  category: 'Software',
  theme: 'Smart Automation',
};

export const CAPABILITIES = [
  {
    icon: Layers,
    title: '3D Ocean Visualization',
    description: 'Interactive volumetric-style rendering of model fields across depth and time.',
  },
  {
    icon: Waves,
    title: 'Argo & Glider Observations',
    description: 'In-situ observation markers with clickable profiles and metadata.',
  },
  {
    icon: Layers,
    title: 'Model–Observation Comparison',
    description: 'Overlay model and observation profiles with RMSE and mean error metrics.',
  },
  {
    icon: Ship,
    title: 'Disaster Management Support',
    description: 'Current-driven drift context for marine search-and-rescue scenarios.',
  },
];



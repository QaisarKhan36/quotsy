import type { SavedItem } from './types';

type Preset = Omit<SavedItem, 'id'>;

export interface Trade {
  key: string;
  label: string;
  icon: string; // Ionicons name
  items: Preset[];
}

export const TRADES: Trade[] = [
  {
    key: 'cleaning',
    label: 'Cleaning',
    icon: 'sparkles-outline',
    items: [
      { name: 'Standard clean', description: 'Kitchen, bathrooms, dusting, vacuum & mop', rate: 120, unit: 'visit' },
      { name: 'Deep clean', description: 'Top-to-bottom clean incl. inside appliances', rate: 250, unit: 'visit' },
      { name: 'Move-out clean', description: 'End of tenancy clean', rate: 300, unit: 'job' },
      { name: 'Hourly cleaning', description: '', rate: 35, unit: 'hr' },
      { name: 'Oven clean', description: '', rate: 60, unit: 'each' },
      { name: 'Window cleaning', description: 'Interior & exterior', rate: 5, unit: 'window' },
    ],
  },
  {
    key: 'handyman',
    label: 'Handyman',
    icon: 'hammer-outline',
    items: [
      { name: 'Labour', description: '', rate: 55, unit: 'hr' },
      { name: 'Call-out fee', description: '', rate: 45, unit: 'each' },
      { name: 'Furniture assembly', description: '', rate: 70, unit: 'item' },
      { name: 'TV wall mounting', description: 'Bracket install & cable tidy', rate: 120, unit: 'each' },
      { name: 'Materials', description: 'Supplied at cost', rate: 0, unit: 'lot' },
    ],
  },
  {
    key: 'plumbing',
    label: 'Plumbing',
    icon: 'water-outline',
    items: [
      { name: 'Labour', description: '', rate: 85, unit: 'hr' },
      { name: 'Emergency call-out', description: '', rate: 120, unit: 'each' },
      { name: 'Leak repair', description: '', rate: 150, unit: 'job' },
      { name: 'Tap / faucet replacement', description: '', rate: 110, unit: 'each' },
      { name: 'Drain unblocking', description: '', rate: 130, unit: 'job' },
      { name: 'Parts & materials', description: '', rate: 0, unit: 'lot' },
    ],
  },
  {
    key: 'electrical',
    label: 'Electrical',
    icon: 'flash-outline',
    items: [
      { name: 'Labour', description: '', rate: 90, unit: 'hr' },
      { name: 'Socket / outlet install', description: '', rate: 85, unit: 'each' },
      { name: 'Light fitting install', description: '', rate: 75, unit: 'each' },
      { name: 'Safety inspection', description: 'Inspection & certificate', rate: 180, unit: 'job' },
      { name: 'Parts & materials', description: '', rate: 0, unit: 'lot' },
    ],
  },
  {
    key: 'landscaping',
    label: 'Landscaping',
    icon: 'leaf-outline',
    items: [
      { name: 'Lawn mowing', description: 'Mow, edge & clear clippings', rate: 50, unit: 'visit' },
      { name: 'Hedge trimming', description: '', rate: 45, unit: 'hr' },
      { name: 'Garden clearance', description: 'Incl. green waste removal', rate: 220, unit: 'job' },
      { name: 'Planting', description: '', rate: 40, unit: 'hr' },
      { name: 'Mulch / soil', description: '', rate: 60, unit: 'cu yd' },
    ],
  },
  {
    key: 'painting',
    label: 'Painting',
    icon: 'color-palette-outline',
    items: [
      { name: 'Interior painting', description: 'Walls, 2 coats', rate: 3.5, unit: 'sq ft' },
      { name: 'Room repaint', description: 'Walls & ceiling, standard room', rate: 400, unit: 'room' },
      { name: 'Prep & repairs', description: 'Filling, sanding, masking', rate: 45, unit: 'hr' },
      { name: 'Paint & materials', description: '', rate: 0, unit: 'lot' },
    ],
  },
  {
    key: 'photography',
    label: 'Photography',
    icon: 'camera-outline',
    items: [
      { name: 'Photo session', description: '1 hour shoot, 20 edited images', rate: 250, unit: 'session' },
      { name: 'Event coverage', description: '', rate: 150, unit: 'hr' },
      { name: 'Extra edited image', description: '', rate: 15, unit: 'image' },
      { name: 'Travel', description: '', rate: 0.6, unit: 'mile' },
    ],
  },
  {
    key: 'other',
    label: 'Other',
    icon: 'briefcase-outline',
    items: [
      { name: 'Labour', description: '', rate: 50, unit: 'hr' },
      { name: 'Materials', description: '', rate: 0, unit: 'lot' },
      { name: 'Service fee', description: '', rate: 100, unit: 'each' },
    ],
  },
];

export const UNITS = ['each', 'hr', 'day', 'job', 'visit', 'item', 'sq ft', 'm²', 'lot'];

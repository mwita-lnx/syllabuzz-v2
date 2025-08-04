// Export UI components
// Place this file in src/components/ui/index.ts

// Layout components
export * from './card';
export * from './separator';

// Input components
export * from './input';
export * from './button';
export * from './textarea';
export * from './select';

// Display components
export * from './badge';
export * from './avatar';
export * from './tabs';
export * from './progress';
export * from './tooltip';
export * from './alert';

// Navigation
export * from './dropdown-menu';
// export * from './navigation-menu';

// // Feedback
// export * from './toast';
export * from './dialog';

// Examples of how these would be defined in their own files:
// card.tsx would export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
// button.tsx would export { Button, buttonVariants }
// input.tsx would export { Input }
// and so on...

// This index file allows importing all UI components from one location:
// import { Button, Card, Input, ... } from '@/components/ui';
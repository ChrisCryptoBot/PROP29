// PROPER 2.9 Shared Types
// This file contains actual TypeScript types and interfaces for the application

export * from './common.types';
export * from './auth.types';
export * from './module.types';
export * from './events.types';
export * from './api.types';
export * from './performance.types';
export * from './ui.types';
export * from './notifications.types';

// Utility types for better TypeScript experience
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : any;

export type ComponentPropsWithoutRef<T extends React.ElementType> = 
  React.ComponentPropsWithoutRef<T>;

export type PolymorphicRef<C extends React.ElementType> = 
  React.ComponentPropsWithRef<C>['ref'];

export type PolymorphicComponentProp<
  C extends React.ElementType,
  Props = {}
> = React.PropsWithChildren<Props & { as?: C }> &
  Omit<React.ComponentPropsWithoutRef<C>, keyof Props>;

export type PolymorphicComponentPropWithRef<
  C extends React.ElementType,
  Props = {}
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> }; 
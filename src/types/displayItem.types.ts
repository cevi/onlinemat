import { Material } from './material.types';
import { Sammlung } from './sammlung.types';

export type DisplayItem =
  | { type: 'material'; data: Material }
  | { type: 'sammlung'; data: Sammlung };

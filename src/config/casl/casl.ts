import { createContext } from 'react';
import { createContextualCan } from '@casl/react';



export const AbilityContext = createContext({} as any);
export const Can = createContextualCan(AbilityContext.Consumer);
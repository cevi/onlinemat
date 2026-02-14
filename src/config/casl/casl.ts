import { createContext } from 'react';
import { createContextualCan } from '@casl/react';
import { AppAbility } from 'config/casl/ability';

export const AbilityContext = createContext<AppAbility>({} as AppAbility);
export const Can = createContextualCan(AbilityContext.Consumer);
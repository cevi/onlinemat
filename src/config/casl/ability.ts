import { Ability, AbilityClass } from "@casl/ability";

import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { Material } from 'types/material.types';
import { UserData } from 'types/user.type';

export type Actions = 'create' | 'read' | 'update' | 'delete';
export type Subjects = Abteilung | Material | UserData | AbteilungMember | 'homepage';

export const ability = new Ability();

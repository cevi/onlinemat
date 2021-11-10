import { Ability, AbilityClass, InferSubjects } from "@casl/ability";

import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { Material } from 'types/material.types';
import { UserData } from 'types/user.type';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'order';

export type Subjects =  InferSubjects<Abteilung | Material | UserData | AbteilungMember> | 'users';

export type Abilities = [Actions, Subjects];
export type AppAbility = Ability<Abilities>
export const AppAbility = Ability as AbilityClass<AppAbility>;

export const ability = new Ability<Abilities>();

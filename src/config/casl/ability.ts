import { Ability, AbilityClass, InferSubjects } from "@casl/ability";

import { Abteilung, AbteilungMember } from 'types/abteilung.type';
import { Categorie } from "types/categorie.types";
import { Group } from "types/group.types";
import { Material } from 'types/material.types';
import { Order } from "types/order.types";
import { UserData } from 'types/user.type';

export type Actions = 'create' | 'read' | 'update' | 'delete';


export type Subjects =  InferSubjects<Abteilung 
| Material & { abteilungId: string }  
| Categorie & { abteilungId: string } 
| Order & { abteilungId: string } 
| Group & { abteilungId: string } 
| UserData 
| AbteilungMember> 
| 'users';

//needed to allow a checkif user can create material/category... in abteilung
export interface AbteilungEntityCasl {
    __caslSubjectType__: Subjects,
    abteilungId: string
}

export type Abilities = [Actions, Subjects];
export type AppAbility = Ability<Abilities>
export const AppAbility = Ability as AbilityClass<AppAbility>;

export const ability = new Ability<Abilities>();

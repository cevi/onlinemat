import { createContext } from 'react';
import { AbteilungMember } from 'types/abteilung.type';
import { UserData } from 'types/user.type';
import { Categorie } from 'types/categorie.types';
import { Standort } from 'types/standort.types';
import { Material } from 'types/material.types';

export const MembersContext = createContext<{ members: AbteilungMember[], loading: boolean }>({ loading: false, members: [] });
export const MembersUserDataContext = createContext<{ userData: { [uid: string]: UserData }, loading: boolean }>({ loading: false, userData: {} });
export const CategorysContext = createContext<{ categories: Categorie[], loading: boolean }>({ loading: false, categories: [] });
export const StandorteContext = createContext<{ standorte: Standort[], loading: boolean }>({ loading: false, standorte: [] });
export const MaterialsContext = createContext<{ materials: Material[], loading: boolean }>({ loading: false, materials: [] });

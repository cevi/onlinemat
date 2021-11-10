import { AbilityBuilder, Ability } from '@casl/ability';
import { Abilities, AppAbility } from 'config/casl/ability';
import { AbteilungMember } from 'types/abteilung.type';
import { UserData } from 'types/user.type';


export const updateAbility = (ability: Ability<Abilities>, user: UserData) => {
    const { can, rules } = new AbilityBuilder(AppAbility);

    if (!!user.staff) {
      //Read
      can('read', 'Abteilung');
      can('read', 'Material');
      can('read', 'AbteilungMember');
      can('read', 'UserData');
      can('read', 'users');

      //Create
      can('create', 'Abteilung');
      can('create', 'Material');
      can('create', 'AbteilungMember');

      //Update
      can('update', 'Abteilung');
      can('update', 'Material');
      can('update', 'AbteilungMember');
      can('update', 'UserData');

      //Delete
      can('delete', 'Abteilung');
      can('delete', 'Material');
      can('delete', 'AbteilungMember');
      can('delete', 'UserData');

      //Order
      can('order', 'Abteilung');

    } else {
      //add roles based on abteilung

      if(!user.roles) user.roles = {};

      for(const abteilungId of Object.keys(user.roles)) {

        const role: AbteilungMember['role'] = user.roles[abteilungId] as AbteilungMember['role'];

        switch(role) {
          case 'admin':
            can('read', 'Abteilung', { id: abteilungId });
            can('update', 'Abteilung', { id: abteilungId });
            can('delete', 'Abteilung', { id: abteilungId });
            can('order', 'Abteilung', { id: abteilungId });
            break;

          case 'matchef':
            can('read', 'Abteilung', { id: abteilungId });
            can('order', 'Abteilung', { id: abteilungId });
            break;

          case 'member':
            can('read', 'Abteilung', { id: abteilungId });
            can('order', 'Abteilung', { id: abteilungId });
            break;

          case 'guest':
            can('read', 'Abteilung', { id: abteilungId });
            can('order', 'Abteilung', { id: abteilungId });

        }
      }

      //basic user
      
    }

    ability.update(rules);
}
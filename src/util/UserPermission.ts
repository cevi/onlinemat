import { AbilityBuilder, Ability } from '@casl/ability';
import { Abilities, AppAbility } from 'config/casl/ability';
import { AbteilungMember } from 'types/abteilung.type';
import { UserData } from 'types/user.type';


export const updateAbility = (ability: Ability<Abilities>, user: UserData) => {
  const { can, cannot, rules } = new AbilityBuilder(AppAbility);

  if (!!user.staff) {
    //Abteilung
    can('create', 'Abteilung');
    can('read', 'Abteilung');
    can('update', 'Abteilung');
    can('delete', 'Abteilung');

    //Material
    can('create', 'Material');
    can('read', 'Material');
    can('update', 'Material');
    can('delete', 'Material');

    //Categorie
    can('create', 'Categorie');
    can('read', 'Categorie');
    can('update', 'Categorie');
    can('delete', 'Categorie');

    //AbteilungMember
    can('create', 'AbteilungMember');
    can('read', 'AbteilungMember');
    can('update', 'AbteilungMember');
    can('delete', 'AbteilungMember');

    //UserData
    can('read', 'UserData');
    can('update', 'UserData');

    //Users
    can('read', 'users');

    //Order
    can('create', 'Order');
    can('read', 'Order');
    can('update', 'Order');
    can('delete', 'Order');
    can('deliver', 'Order');

  } else {
    //add roles based on abteilung

    if (!user.roles) user.roles = {};

    for (const abteilungId of Object.keys(user.roles)) {

      const role = user.roles[abteilungId] as (AbteilungMember['role'] | 'pending');

      switch (role) {
        case 'admin':
          //Abteilung
          can('update', 'Abteilung', { id: abteilungId });
          can('delete', 'Abteilung', { id: abteilungId });

          //Material
          can('create', 'Material', { abteilungId: abteilungId });
          can('update', 'Material', { abteilungId: abteilungId });
          can('delete', 'Material', { abteilungId: abteilungId });

          //Categorie
          can('create', 'Categorie', { abteilungId: abteilungId });
          can('update', 'Categorie', { abteilungId: abteilungId });
          can('delete', 'Categorie', { abteilungId: abteilungId });

          //Order
          can('create', 'Order', { abteilungId: abteilungId });
          can('read', 'Order', { abteilungId: abteilungId });
          can('update', 'Order', { abteilungId: abteilungId });
          can('delete', 'Order', { abteilungId: abteilungId });
          can('deliver', 'Order', { abteilungId: abteilungId });

          break;

        case 'matchef':
          //Material
          can('create', 'Material', { abteilungId: abteilungId });
          can('update', 'Material', { abteilungId: abteilungId });
          can('delete', 'Material', { abteilungId: abteilungId });


          //Categorie
          can('create', 'Categorie', { abteilungId: abteilungId });
          can('update', 'Categorie', { abteilungId: abteilungId });
          can('delete', 'Categorie', { abteilungId: abteilungId });

          //Order
          can('create', 'Order', { abteilungId: abteilungId });
          can('read', 'Order', { abteilungId: abteilungId });
          can('update', 'Order', { abteilungId: abteilungId });
          can('delete', 'Order', { abteilungId: abteilungId });
          can('deliver', 'Order', { abteilungId: abteilungId });
          
          break;

        case 'member':

          break;

        case 'guest':

      }

      //default member rights

      //Abteilung
      if (role !== 'pending') {
        can('read', 'Abteilung', { id: abteilungId });
      }


      //order
      can('create', 'Order', { abteilungId: abteilungId });


    }

  }

  ability.update(rules);
}
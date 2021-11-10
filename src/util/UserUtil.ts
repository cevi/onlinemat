import { AbilityBuilder, Ability } from '@casl/ability';
import { Actions, Subjects } from 'config/casl/ability';
import { UserData } from 'types/user.type';


export const updateAbility = (ability: Ability, user: UserData) => {
    const { can, rules } = new AbilityBuilder(Ability);
  
    if (!!user.staff) {
      can('', 'homepage');
    } else {
      can('read', 'all');
    }
  
    ability.update(rules as any);
  }
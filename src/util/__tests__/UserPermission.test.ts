import { describe, it, expect, beforeEach } from 'vitest';
import { createMongoAbility } from '@casl/ability';
import { updateAbility } from '../UserPermission';
import { Abilities } from 'config/casl/ability';
import { UserData } from 'types/user.type';

const makeUser = (overrides: Partial<UserData> = {}): UserData => ({
  __caslSubjectType__: 'UserData',
  id: 'user1',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: '',
  given_name: 'Test',
  family_name: 'User',
  nickname: 'test',
  name: 'Test User',
  roles: {},
  ...overrides,
});

const createAbility = () => createMongoAbility<Abilities>();

describe('UserPermission - updateAbility', () => {
  describe('Staff user', () => {
    let ability: ReturnType<typeof createAbility>;

    beforeEach(() => {
      ability = createAbility();
      updateAbility(ability, makeUser({ staff: true }));
    });

    it('can CRUD Abteilung globally', () => {
      expect(ability.can('create', 'Abteilung')).toBe(true);
      expect(ability.can('read', 'Abteilung')).toBe(true);
      expect(ability.can('update', 'Abteilung')).toBe(true);
      expect(ability.can('delete', 'Abteilung')).toBe(true);
    });

    it('can CRUD Material globally', () => {
      expect(ability.can('create', 'Material')).toBe(true);
      expect(ability.can('read', 'Material')).toBe(true);
      expect(ability.can('update', 'Material')).toBe(true);
      expect(ability.can('delete', 'Material')).toBe(true);
    });

    it('can CRUD Order globally (including deliver)', () => {
      expect(ability.can('create', 'Order')).toBe(true);
      expect(ability.can('read', 'Order')).toBe(true);
      expect(ability.can('update', 'Order')).toBe(true);
      expect(ability.can('delete', 'Order')).toBe(true);
      expect(ability.can('deliver', 'Order')).toBe(true);
    });

    it('can CRUD Categorie globally', () => {
      expect(ability.can('create', 'Categorie')).toBe(true);
      expect(ability.can('delete', 'Categorie')).toBe(true);
    });

    it('can CRUD Standort globally', () => {
      expect(ability.can('create', 'Standort')).toBe(true);
      expect(ability.can('delete', 'Standort')).toBe(true);
    });

    it('can CRUD AbteilungMember globally', () => {
      expect(ability.can('create', 'AbteilungMember')).toBe(true);
      expect(ability.can('read', 'AbteilungMember')).toBe(true);
      expect(ability.can('update', 'AbteilungMember')).toBe(true);
      expect(ability.can('delete', 'AbteilungMember')).toBe(true);
    });

    it('can manage UserData', () => {
      expect(ability.can('read', 'UserData')).toBe(true);
      expect(ability.can('update', 'UserData')).toBe(true);
    });

    it('can read users list', () => {
      expect(ability.can('read', 'users')).toBe(true);
    });

    it('can manage Invitations', () => {
      expect(ability.can('create', 'Invitation')).toBe(true);
      expect(ability.can('read', 'Invitation')).toBe(true);
      expect(ability.can('delete', 'Invitation')).toBe(true);
    });
  });

  describe('Admin role (per abteilung)', () => {
    const abteilungId = 'abt1';
    let ability: ReturnType<typeof createAbility>;

    beforeEach(() => {
      ability = createAbility();
      updateAbility(ability, makeUser({ roles: { [abteilungId]: 'admin' } }));
    });

    it('can update and delete own Abteilung', () => {
      expect(ability.can('update', { __caslSubjectType__: 'Abteilung', id: abteilungId } as any)).toBe(true);
      expect(ability.can('delete', { __caslSubjectType__: 'Abteilung', id: abteilungId } as any)).toBe(true);
    });

    it('cannot update other Abteilung', () => {
      expect(ability.can('update', { __caslSubjectType__: 'Abteilung', id: 'other' } as any)).toBe(false);
    });

    it('can CRUD Material in own abteilung', () => {
      const subject = { __caslSubjectType__: 'Material', abteilungId } as any;
      expect(ability.can('create', subject)).toBe(true);
      expect(ability.can('update', subject)).toBe(true);
      expect(ability.can('delete', subject)).toBe(true);
    });

    it('cannot CRUD Material in other abteilung', () => {
      const subject = { __caslSubjectType__: 'Material', abteilungId: 'other' } as any;
      expect(ability.can('create', subject)).toBe(false);
    });

    it('can manage Orders in own abteilung (including deliver)', () => {
      const subject = { __caslSubjectType__: 'Order', abteilungId } as any;
      expect(ability.can('create', subject)).toBe(true);
      expect(ability.can('read', subject)).toBe(true);
      expect(ability.can('update', subject)).toBe(true);
      expect(ability.can('delete', subject)).toBe(true);
      expect(ability.can('deliver', subject)).toBe(true);
    });

    it('can manage Invitations in own abteilung', () => {
      const subject = { __caslSubjectType__: 'Invitation', abteilungId } as any;
      expect(ability.can('create', subject)).toBe(true);
      expect(ability.can('read', subject)).toBe(true);
      expect(ability.can('delete', subject)).toBe(true);
    });

    it('can read own Abteilung', () => {
      expect(ability.can('read', { __caslSubjectType__: 'Abteilung', id: abteilungId } as any)).toBe(true);
    });

    it('can always create Abteilung (all non-staff users can)', () => {
      expect(ability.can('create', 'Abteilung')).toBe(true);
    });
  });

  describe('Matchef role', () => {
    const abteilungId = 'abt1';
    let ability: ReturnType<typeof createAbility>;

    beforeEach(() => {
      ability = createAbility();
      updateAbility(ability, makeUser({ roles: { [abteilungId]: 'matchef' } }));
    });

    it('can CRUD Material in own abteilung', () => {
      const subject = { __caslSubjectType__: 'Material', abteilungId } as any;
      expect(ability.can('create', subject)).toBe(true);
      expect(ability.can('update', subject)).toBe(true);
      expect(ability.can('delete', subject)).toBe(true);
    });

    it('can CRUD Categorie in own abteilung', () => {
      const subject = { __caslSubjectType__: 'Categorie', abteilungId } as any;
      expect(ability.can('create', subject)).toBe(true);
      expect(ability.can('update', subject)).toBe(true);
      expect(ability.can('delete', subject)).toBe(true);
    });

    it('can CRUD Standort in own abteilung', () => {
      const subject = { __caslSubjectType__: 'Standort', abteilungId } as any;
      expect(ability.can('create', subject)).toBe(true);
      expect(ability.can('update', subject)).toBe(true);
      expect(ability.can('delete', subject)).toBe(true);
    });

    it('can manage Orders (including deliver)', () => {
      const subject = { __caslSubjectType__: 'Order', abteilungId } as any;
      expect(ability.can('create', subject)).toBe(true);
      expect(ability.can('read', subject)).toBe(true);
      expect(ability.can('update', subject)).toBe(true);
      expect(ability.can('delete', subject)).toBe(true);
      expect(ability.can('deliver', subject)).toBe(true);
    });

    it('cannot update or delete Abteilung', () => {
      expect(ability.can('update', { __caslSubjectType__: 'Abteilung', id: abteilungId } as any)).toBe(false);
      expect(ability.can('delete', { __caslSubjectType__: 'Abteilung', id: abteilungId } as any)).toBe(false);
    });

    it('cannot manage Invitations', () => {
      const subject = { __caslSubjectType__: 'Invitation', abteilungId } as any;
      expect(ability.can('create', subject)).toBe(false);
    });

    it('can read own Abteilung', () => {
      expect(ability.can('read', { __caslSubjectType__: 'Abteilung', id: abteilungId } as any)).toBe(true);
    });
  });

  describe('Member role', () => {
    const abteilungId = 'abt1';
    let ability: ReturnType<typeof createAbility>;

    beforeEach(() => {
      ability = createAbility();
      updateAbility(ability, makeUser({ roles: { [abteilungId]: 'member' } }));
    });

    it('can create Order', () => {
      expect(ability.can('create', { __caslSubjectType__: 'Order', abteilungId } as any)).toBe(true);
    });

    it('can delete Order', () => {
      expect(ability.can('delete', { __caslSubjectType__: 'Order', abteilungId } as any)).toBe(true);
    });

    it('cannot update or deliver Order', () => {
      const subject = { __caslSubjectType__: 'Order', abteilungId } as any;
      expect(ability.can('update', subject)).toBe(false);
      expect(ability.can('deliver', subject)).toBe(false);
    });

    it('cannot manage Material', () => {
      const subject = { __caslSubjectType__: 'Material', abteilungId } as any;
      expect(ability.can('create', subject)).toBe(false);
      expect(ability.can('update', subject)).toBe(false);
      expect(ability.can('delete', subject)).toBe(false);
    });

    it('can read own Abteilung', () => {
      expect(ability.can('read', { __caslSubjectType__: 'Abteilung', id: abteilungId } as any)).toBe(true);
    });
  });

  describe('Guest role', () => {
    const abteilungId = 'abt1';
    let ability: ReturnType<typeof createAbility>;

    beforeEach(() => {
      ability = createAbility();
      updateAbility(ability, makeUser({ roles: { [abteilungId]: 'guest' } }));
    });

    it('can create Order (default member right)', () => {
      expect(ability.can('create', { __caslSubjectType__: 'Order', abteilungId } as any)).toBe(true);
    });

    it('can read Abteilung', () => {
      expect(ability.can('read', { __caslSubjectType__: 'Abteilung', id: abteilungId } as any)).toBe(true);
    });

    it('cannot manage Material', () => {
      expect(ability.can('create', { __caslSubjectType__: 'Material', abteilungId } as any)).toBe(false);
    });

    it('cannot delete Order', () => {
      expect(ability.can('delete', { __caslSubjectType__: 'Order', abteilungId } as any)).toBe(false);
    });
  });

  describe('Pending role', () => {
    const abteilungId = 'abt1';
    let ability: ReturnType<typeof createAbility>;

    beforeEach(() => {
      ability = createAbility();
      updateAbility(ability, makeUser({ roles: { [abteilungId]: 'pending' } }));
    });

    it('cannot read Abteilung', () => {
      expect(ability.can('read', { __caslSubjectType__: 'Abteilung', id: abteilungId } as any)).toBe(false);
    });

    it('can still create Order (default member right)', () => {
      expect(ability.can('create', { __caslSubjectType__: 'Order', abteilungId } as any)).toBe(true);
    });
  });

  describe('Multi-abteilung user', () => {
    it('scopes permissions to correct abteilung', () => {
      const ability = createAbility();
      updateAbility(ability, makeUser({
        roles: { abt1: 'admin', abt2: 'guest' },
      }));

      // Admin in abt1
      expect(ability.can('update', { __caslSubjectType__: 'Material', abteilungId: 'abt1' } as any)).toBe(true);
      expect(ability.can('delete', { __caslSubjectType__: 'Abteilung', id: 'abt1' } as any)).toBe(true);

      // Guest in abt2 — cannot manage materials
      expect(ability.can('update', { __caslSubjectType__: 'Material', abteilungId: 'abt2' } as any)).toBe(false);
      expect(ability.can('delete', { __caslSubjectType__: 'Abteilung', id: 'abt2' } as any)).toBe(false);
    });
  });

  describe('User with no roles', () => {
    it('can create Abteilung but nothing else', () => {
      const ability = createAbility();
      updateAbility(ability, makeUser({ roles: {} }));

      expect(ability.can('create', 'Abteilung')).toBe(true);
      expect(ability.can('read', 'Material')).toBe(false);
      expect(ability.can('create', 'Order')).toBe(false);
    });
  });

  describe('User with undefined roles', () => {
    it('initializes roles to empty object and can create Abteilung', () => {
      const ability = createAbility();
      const user = makeUser();
      // @ts-expect-error - testing undefined roles
      user.roles = undefined;
      updateAbility(ability, user);

      expect(ability.can('create', 'Abteilung')).toBe(true);
    });
  });
});

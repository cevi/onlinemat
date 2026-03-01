import { describe, it, expect, beforeEach } from 'vitest';
import { createMongoAbility } from '@casl/ability';
import { updateAbility } from 'util/UserPermission';
import { Abilities } from 'config/casl/ability';
import { UserData } from 'types/user.type';

/**
 * Integration test: CASL ability + UserPermission work together
 * to enforce the full permission matrix across roles and abteilungen.
 */

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

// Helper to build a subject with __caslSubjectType__ and abteilungId
const subject = (type: string, abteilungId: string) =>
  ({ __caslSubjectType__: type, abteilungId } as any);

const abteilungSubject = (id: string) =>
  ({ __caslSubjectType__: 'Abteilung', id } as any);

describe('CASL Ability Integration', () => {
  describe('Role hierarchy enforcement across multiple abteilungen', () => {
    it('admin in abt1, guest in abt2, matchef in abt3 — all scoped correctly', () => {
      const ability = createAbility();
      updateAbility(ability, makeUser({
        roles: { abt1: 'admin', abt2: 'guest', abt3: 'matchef' },
      }));

      // Admin in abt1: full control
      expect(ability.can('update', abteilungSubject('abt1'))).toBe(true);
      expect(ability.can('delete', abteilungSubject('abt1'))).toBe(true);
      expect(ability.can('create', subject('Material', 'abt1'))).toBe(true);
      expect(ability.can('deliver', subject('Order', 'abt1'))).toBe(true);
      expect(ability.can('create', subject('Invitation', 'abt1'))).toBe(true);

      // Guest in abt2: read abteilung + create order only
      expect(ability.can('read', abteilungSubject('abt2'))).toBe(true);
      expect(ability.can('create', subject('Order', 'abt2'))).toBe(true);
      expect(ability.can('update', abteilungSubject('abt2'))).toBe(false);
      expect(ability.can('create', subject('Material', 'abt2'))).toBe(false);
      expect(ability.can('deliver', subject('Order', 'abt2'))).toBe(false);
      expect(ability.can('delete', subject('Order', 'abt2'))).toBe(false);

      // Matchef in abt3: material/order management, no abteilung admin
      expect(ability.can('create', subject('Material', 'abt3'))).toBe(true);
      expect(ability.can('deliver', subject('Order', 'abt3'))).toBe(true);
      expect(ability.can('update', abteilungSubject('abt3'))).toBe(false);
      expect(ability.can('create', subject('Invitation', 'abt3'))).toBe(false);

      // No access to abt4 at all
      expect(ability.can('read', abteilungSubject('abt4'))).toBe(false);
      expect(ability.can('create', subject('Material', 'abt4'))).toBe(false);
    });
  });

  describe('Ability updates replace previous rules', () => {
    it('changing from admin to guest removes admin permissions', () => {
      const ability = createAbility();

      // First: admin
      updateAbility(ability, makeUser({ roles: { abt1: 'admin' } }));
      expect(ability.can('delete', abteilungSubject('abt1'))).toBe(true);
      expect(ability.can('create', subject('Material', 'abt1'))).toBe(true);

      // Update: now guest
      updateAbility(ability, makeUser({ roles: { abt1: 'guest' } }));
      expect(ability.can('delete', abteilungSubject('abt1'))).toBe(false);
      expect(ability.can('create', subject('Material', 'abt1'))).toBe(false);
      expect(ability.can('read', abteilungSubject('abt1'))).toBe(true);
    });

    it('removing all roles removes all permissions except create Abteilung', () => {
      const ability = createAbility();

      updateAbility(ability, makeUser({ roles: { abt1: 'admin' } }));
      expect(ability.can('delete', abteilungSubject('abt1'))).toBe(true);

      updateAbility(ability, makeUser({ roles: {} }));
      expect(ability.can('delete', abteilungSubject('abt1'))).toBe(false);
      expect(ability.can('create', 'Abteilung')).toBe(true);
    });
  });

  describe('Staff vs non-staff boundary', () => {
    it('staff can access any abteilung without explicit role', () => {
      const ability = createAbility();
      updateAbility(ability, makeUser({ staff: true, roles: {} }));

      expect(ability.can('create', 'Material')).toBe(true);
      expect(ability.can('delete', 'Order')).toBe(true);
      expect(ability.can('read', 'users')).toBe(true);
      expect(ability.can('deliver', 'Order')).toBe(true);
    });

    it('non-staff cannot access users list', () => {
      const ability = createAbility();
      updateAbility(ability, makeUser({ roles: { abt1: 'admin' } }));

      expect(ability.can('read', 'users')).toBe(false);
    });
  });

  describe('Order permission edge cases', () => {
    it('member can create and delete orders but not update or read them', () => {
      const ability = createAbility();
      updateAbility(ability, makeUser({ roles: { abt1: 'member' } }));

      expect(ability.can('create', subject('Order', 'abt1'))).toBe(true);
      expect(ability.can('delete', subject('Order', 'abt1'))).toBe(true);
      expect(ability.can('update', subject('Order', 'abt1'))).toBe(false);
      expect(ability.can('read', subject('Order', 'abt1'))).toBe(false);
    });

    it('pending user can create orders but cannot read abteilung', () => {
      const ability = createAbility();
      updateAbility(ability, makeUser({ roles: { abt1: 'pending' } }));

      expect(ability.can('create', subject('Order', 'abt1'))).toBe(true);
      expect(ability.can('read', abteilungSubject('abt1'))).toBe(false);
    });
  });

  describe('Invitation permissions', () => {
    it('only admin (not matchef) can manage invitations', () => {
      const ability = createAbility();
      updateAbility(ability, makeUser({ roles: { abt1: 'matchef' } }));
      expect(ability.can('create', subject('Invitation', 'abt1'))).toBe(false);

      updateAbility(ability, makeUser({ roles: { abt1: 'admin' } }));
      expect(ability.can('create', subject('Invitation', 'abt1'))).toBe(true);
      expect(ability.can('read', subject('Invitation', 'abt1'))).toBe(true);
      expect(ability.can('delete', subject('Invitation', 'abt1'))).toBe(true);
    });
  });
});

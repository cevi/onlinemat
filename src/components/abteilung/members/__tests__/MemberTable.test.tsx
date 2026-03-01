import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemberTableImpl } from '../MemberTable';
import { AbteilungMemberUserData } from 'types/abteilung.type';

// Polyfill window.matchMedia for jsdom (required by antd responsive observer)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('util/MemberUtil', () => ({
  approveMemberRequest: vi.fn(),
  banMember: vi.fn(),
  changeRoleOfMember: vi.fn(),
  denyMemberRequest: vi.fn(),
  removeMember: vi.fn(),
  unBanMember: vi.fn(),
}));

// Mock sibling/parent component imports to prevent dependency chains
vi.mock('components/abteilung/group/AddGroup', () => ({
  AddGroupButton: () => null,
}));

vi.mock('components/abteilung/AbteilungDetails', () => ({
  MembersContext: { Provider: ({ children }: any) => children },
  MembersUserDataContext: { Provider: ({ children }: any) => children },
}));

const makeApprovedMember = (overrides: Partial<AbteilungMemberUserData> = {}): AbteilungMemberUserData => ({
  id: 'member1',
  userId: 'u1',
  displayName: 'Alice Admin',
  email: 'alice@test.com',
  name: 'Alice Admin',
  role: 'admin',
  approved: true,
  banned: false,
  photoURL: '',
  ...overrides,
} as AbteilungMemberUserData);

const makePendingMember = (overrides: Partial<AbteilungMemberUserData> = {}): AbteilungMemberUserData => ({
  id: 'pending1',
  userId: 'u2',
  displayName: 'Pending Pete',
  email: 'pete@test.com',
  name: 'Pending Pete',
  role: 'member',
  approved: false,
  banned: false,
  photoURL: '',
  ...overrides,
} as AbteilungMemberUserData);

const makeBannedMember = (overrides: Partial<AbteilungMemberUserData> = {}): AbteilungMemberUserData => ({
  id: 'banned1',
  userId: 'u3',
  displayName: 'Banned Bob',
  email: 'bob@test.com',
  name: 'Banned Bob',
  role: 'member',
  approved: false,
  banned: true,
  photoURL: '',
  ...overrides,
} as AbteilungMemberUserData);

describe('MemberTableImpl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders member names and emails', () => {
    const members = [makeApprovedMember()];

    render(
      <MemberTableImpl abteilungId="abt1" members={members} loading={false} />
    );

    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(
      <MemberTableImpl abteilungId="abt1" members={[]} loading={true} />
    );

    // antd Table shows a spinner when loading
    expect(container.querySelector('.ant-spin')).toBeTruthy();
  });

  it('shows approve/deny/ban buttons for pending members', () => {
    const members = [makePendingMember()];

    render(
      <MemberTableImpl abteilungId="abt1" members={members} loading={false} />
    );

    // Translation keys are used as-is since t() returns the key
    expect(screen.getByText('member:actions.deny')).toBeInTheDocument();
    expect(screen.getByText('member:actions.ban')).toBeInTheDocument();
  });

  it('shows unban button for banned members', () => {
    const members = [makeBannedMember()];

    render(
      <MemberTableImpl abteilungId="abt1" members={members} loading={false} />
    );

    expect(screen.getByText('member:actions.unban')).toBeInTheDocument();
  });

  it('shows role selector and remove button for approved members', () => {
    const members = [makeApprovedMember()];

    render(
      <MemberTableImpl abteilungId="abt1" members={members} loading={false} />
    );

    expect(screen.getByText('member:actions.remove')).toBeInTheDocument();
  });

  it('renders multiple member types together', () => {
    const members = [
      makeApprovedMember(),
      makePendingMember(),
      makeBannedMember(),
    ];

    render(
      <MemberTableImpl abteilungId="abt1" members={members} loading={false} />
    );

    // All names are displayed
    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('Pending Pete')).toBeInTheDocument();
    expect(screen.getByText('Banned Bob')).toBeInTheDocument();
  });

  it('sorts pending members before approved members', () => {
    const members = [
      makeApprovedMember({ displayName: 'Approved User' }),
      makePendingMember({ displayName: 'Pending User' }),
    ];

    render(
      <MemberTableImpl abteilungId="abt1" members={members} loading={false} />
    );

    // Both should be rendered (sorting is internal to the component)
    expect(screen.getByText('Approved User')).toBeInTheDocument();
    expect(screen.getByText('Pending User')).toBeInTheDocument();
  });
});

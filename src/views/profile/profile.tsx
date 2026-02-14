import { useContext, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Collapse,
  Descriptions,
  Alert,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { EditOutlined, CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { useAuth0 } from "@auth0/auth0-react";
import { Auth0User } from "types/auth0.types";
import dayjs from "dayjs";
import { useUser } from "hooks/use-user";
import { EditProfile } from "../../components/profile/EditProfile";
import { AbteilungenContext } from "../../components/navigation/NavigationMenu";
import generatedGitInfo from "generatedGitInfo.json";
import { useNavigate } from "react-router-dom";
import { role } from "types/user.type";

const roleLabels: Record<string, string> = {
  staff: "Staff",
  admin: "Admin",
  matchef: "Matchef",
  member: "Mitglied",
  guest: "Gast",
  pending: "Angefragt",
};

const roleColors: Record<string, string> = {
  staff: "purple",
  admin: "red",
  matchef: "orange",
  member: "green",
  guest: "blue",
  pending: "geekblue",
};

const rolePriority: Record<string, number> = {
  admin: 0,
  matchef: 1,
  member: 2,
  guest: 3,
  pending: 4,
};

export const ProfileView = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const auth0User = {
    ...(user as any),
    __caslSubjectType__: "Auth0User",
  } as Auth0User;

  const userState = useUser();
  const navigate = useNavigate();
  const { abteilungen, loading: abteilungenLoading } =
    useContext(AbteilungenContext);

  const [editing, setEditing] = useState(false);
  const editRef = useRef<{ saveEditProfile: () => void }>(null);

  const userData = userState.appUser?.userData;

  const isStaff = !!userData?.staff;

  const abteilungenRoles = useMemo(() => {
    if (!userData?.roles) return [];

    return Object.entries(userData.roles)
      .map(([abteilungId, userRole]) => {
        const abteilung = abteilungen.find(
          (a) => a.id === abteilungId || a.slug === abteilungId
        );
        return {
          key: abteilungId,
          abteilungId,
          abteilungName: abteilung?.name ?? abteilungId,
          abteilungSlug: abteilung?.slug ?? abteilungId,
          role: userRole as role,
        };
      })
      .sort(
        (a, b) =>
          (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99) ||
          a.abteilungName.localeCompare(b.abteilungName)
      );
  }, [userData?.roles, abteilungen, isStaff]);

  const columns = [
    {
      title: "Abteilung",
      dataIndex: "abteilungName",
      key: "abteilungName",
      render: (name: string, record: (typeof abteilungenRoles)[0]) => (
        <a onClick={() => navigate(`/abteilungen/${record.abteilungSlug}`)}>
          {name}
        </a>
      ),
    },
    {
      title: "Rolle",
      dataIndex: "role",
      key: "role",
      render: (r: string) => (
        <Tag color={roleColors[r] ?? "default"}>{roleLabels[r] ?? r}</Tag>
      ),
    },
  ];

  if (userState.loading || isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user || !isAuthenticated) return null;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Avatar size={72} src={user.picture} style={{ flexShrink: 0 }}>
            {userData?.given_name?.[0]}
            {userData?.family_name?.[0]}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {userData?.displayName ?? userData?.name}
            </Typography.Title>
            {userData?.nickname && (
              <Typography.Text type="secondary">
                &laquo;{userData.nickname}&raquo;
              </Typography.Text>
            )}
          </div>
          {!editing && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
            >
              Bearbeiten
            </Button>
          )}
        </div>

        {editing ? (
          <>
            <EditProfile
              ref={editRef}
              userId={userData?.id}
              userData={userData}
              onSuccess={() => setEditing(false)}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 16,
              }}
            >
              <Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>
                Abbrechen
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => editRef.current?.saveEditProfile()}
              >
                Speichern
              </Button>
            </div>
          </>
        ) : (
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="Vorname">
              {userData?.given_name}
            </Descriptions.Item>
            <Descriptions.Item label="Nachname">
              {userData?.family_name}
            </Descriptions.Item>
            <Descriptions.Item label="Ceviname">
              {userData?.nickname}
            </Descriptions.Item>
            <Descriptions.Item label="E-Mail">
              {userData?.email}
            </Descriptions.Item>
            {userData?.defaultAbteilung && (
              <Descriptions.Item label="Standard Abteilung" span={2}>
                {abteilungen.find(
                  (a) =>
                    a.slug === userData.defaultAbteilung ||
                    a.id === userData.defaultAbteilung
                )?.name ?? userData.defaultAbteilung}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Card>

      <Card
        title="Meine Abteilungen"
        style={{ marginTop: 16 }}
        loading={abteilungenLoading}
      >
        {isStaff ? (
          <Alert
            type="info"
            showIcon
            message="Du hast als Staff-Mitglied Vollzugriff auf alle Abteilungen."
          />
        ) : abteilungenRoles.length > 0 ? (
          <Table
            dataSource={abteilungenRoles}
            columns={columns}
            pagination={false}
            size="small"
          />
        ) : (
          <Typography.Text type="secondary">
            Du bist noch keiner Abteilung beigetreten.
          </Typography.Text>
        )}
      </Card>

      {userData?.staff && (
        <Collapse
          style={{ marginTop: 16 }}
          items={[
            {
              key: "staff",
              label: "Staff Debug Info",
              children: (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="E-Mail verifiziert">
                    {userData.email_verified ? "Ja" : "Nein"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Firebase Token">
                    {auth0User["https://mat.cevi.tools/firebase_token"]
                      ? "Ja"
                      : "Nein"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Locale">
                    {auth0User.locale}
                  </Descriptions.Item>
                  <Descriptions.Item label="Profilbild">
                    {auth0User.picture ? "Ja" : "Nein"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sub">
                    {auth0User.sub}
                  </Descriptions.Item>
                  <Descriptions.Item label="Aktualisiert am">
                    {dayjs(auth0User.updated_at).format("L LT")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Firebase User ID">
                    {userState.appUser?.firebaseUser?.uid ?? "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Standard Abteilung">
                    {userData.defaultAbteilung ?? "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Staff">
                    {userData.staff ? "Ja" : "Nein"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Branch">
                    <Tag>{generatedGitInfo.gitBranch}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Git Hash">
                    <Tag>{generatedGitInfo.gitCommitHash}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
          ]}
        />
      )}
    </div>
  );
};

import { UserData, UserDataUpdate } from "../../types/user.type";
import {
  forwardRef,
  useContext,
  useImperativeHandle,
} from "react";
import { Col, Form, Input, Row, Select, message } from "antd";
import { editUserData } from "../../util/UserUtil";
import { useUser } from "../../hooks/use-user";
import { validateMessages } from "../../util/FormValdationMessages";
import { AbteilungenContext } from "../navigation/NavigationMenu";

export interface EditProfileProps {
  userId: string | undefined;
  userData: UserData | undefined;
  onSuccess?: () => void;
}

export const EditProfile = forwardRef((props: EditProfileProps, ref) => {
  const { userId, userData, onSuccess } = props;

  const [form] = Form.useForm<UserDataUpdate>();
  const userState = useUser();

  const abteilungenContext = useContext(AbteilungenContext);
  const abteilungen = abteilungenContext.abteilungen;

  useImperativeHandle(ref, () => ({
    saveEditProfile() {
      prepareEditProfile();
    },
  }));

  const prepareEditProfile = async () => {
    try {
      await form.validateFields();
    } catch (validation) {
      return;
    }
    try {
      const formData = form.getFieldsValue();
      await editUserData(userState.appUser?.firebaseUser?.uid, formData);
      if (onSuccess) {
        onSuccess();
      } else {
        message.error("Es ist leider ein Fehler aufgetreten");
      }
    } catch (ex) {
      message.error(`Es ist ein Fehler aufgetreten: ${ex}`);
    }
  };

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  return (
    <Form
      form={form}
      initialValues={userData}
      layout="vertical"
      validateMessages={validateMessages}
    >
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Vorname"
            name="given_name"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder="Vorname" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Nachname"
            name="family_name"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder="Nachname" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Vollständiger Name"
            name="name"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder="Name" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Ceviname"
            name="nickname"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder="Ceviname" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="E-Mail"
            name="email"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder="E-Mail" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Standard Abteilung"
            name="defaultAbteilung"
            rules={[{ type: "string" }]}
          >
            <Select
              showSearch
              allowClear
              placeholder="Standard Abteilung"
              optionFilterProp="children"
              filterOption={filterOption}
              options={abteilungen
                .filter((a) => {
                  if (userState.appUser?.userData.staff) return true;
                  const userRoles = userState.appUser?.userData.roles || {};
                  for (const abteilungId of Object.keys(userRoles)) {
                    if (
                      abteilungId === a.id &&
                      userRoles[abteilungId] !== "pending"
                    )
                      return true;
                  }
                  return false;
                })
                .map((a) => ({
                  value: a.slug || a.id,
                  label: a.name,
                }))
                .sort((a, b) => a.label.localeCompare(b.label))}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
});

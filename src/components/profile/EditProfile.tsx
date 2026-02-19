import { UserData, UserDataUpdate } from "../../types/user.type";
import {
  forwardRef,
  useContext,
  useImperativeHandle,
} from "react";
import { Col, Form, Input, Row, Select, message } from "antd";
import { editUserData } from "../../util/UserUtil";
import { useUser } from "../../hooks/use-user";
import { getValidateMessages } from "../../util/FormValdationMessages";
import { AbteilungenContext } from "../navigation/NavigationMenu";
import { useTranslation } from 'react-i18next';

export interface EditProfileProps {
  userId: string | undefined;
  userData: UserData | undefined;
  onSuccess?: () => void;
}

export const EditProfile = forwardRef((props: EditProfileProps, ref) => {
  const { userId, userData, onSuccess } = props;

  const [form] = Form.useForm<UserDataUpdate>();
  const userState = useUser();
  const { t } = useTranslation();

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
        message.error(t('common:errors.genericShort'));
      }
    } catch (ex) {
      message.error(t('common:errors.generic', { error: ex }));
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
      validateMessages={getValidateMessages()}
    >
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={t('profile:form.firstName')}
            name="given_name"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder={t('profile:form.firstNamePlaceholder')} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label={t('profile:form.lastName')}
            name="family_name"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder={t('profile:form.lastNamePlaceholder')} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={t('profile:form.fullName')}
            name="name"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder={t('profile:form.fullNamePlaceholder')} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label={t('profile:form.ceviName')}
            name="nickname"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder={t('profile:form.ceviNamePlaceholder')} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            label={t('profile:form.email')}
            name="email"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder={t('profile:form.emailPlaceholder')} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label={t('profile:form.defaultAbteilung')}
            name="defaultAbteilung"
            rules={[{ type: "string" }]}
          >
            <Select
              showSearch
              allowClear
              placeholder={t('profile:form.defaultAbteilungPlaceholder')}
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

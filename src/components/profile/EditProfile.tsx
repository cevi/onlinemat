import { UserData, UserDataUpdate } from "../../types/user.type";
import React, {
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { AutoComplete, Button, Form, Input, Modal, Select, message } from "antd";
import { editUserData } from "../../util/UserUtil";
import { useUser } from "../../hooks/use-user";
import { validateMessages } from "../../util/FormValdationMessages";
import { EditOutlined } from "@ant-design/icons";
import { AbteilungenContext } from "../navigation/NavigationMenu";

export interface EditProfileProps {
  userId: string | undefined;
  userData: UserData | undefined;
  onSuccess?: () => void;
}

export const EditProfile = forwardRef((props: EditProfileProps, ref) => {
  useImperativeHandle(ref, () => ({
    saveEditProfile() {
      prepareEditProfile();
    },
  }));

  const { userId, userData, onSuccess } = props;

  const [form] = Form.useForm<UserDataUpdate>();

  const userState = useUser();

  const abteilungenContext = useContext(AbteilungenContext);
  const abteilungen = abteilungenContext.abteilungen;

  const prepareEditProfile = async () => {
    try {
      await form.validateFields();
    } catch (validation) {
      //form is not valid
      return;
    }
    try {
      const userData = form.getFieldsValue()
      await editUserData(userState.appUser?.firebaseUser?.uid, userData);
      if (onSuccess) {
        onSuccess();
      } else {
        message.error("Es ist leider ein Fehler aufgetreten");
      }
    } catch (ex) {
      message.error(`Es ist ein Fehler aufgetreten: ${ex}`);
    }
  };


  const filterOption = (input: string, option?: { label: string; value: string }) =>
  (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  return (
    <>
      {
        <Form
          form={form}
          initialValues={userData}
          onValuesChange={() => {
            const tempUserData = form.getFieldsValue() as UserDataUpdate;
            form.validateFields();
          }}
          validateMessages={validateMessages}
        >
          <Form.Item
            label="Vollständiger Name"
            name="name"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder="Name" />
          </Form.Item>
          <Form.Item
            label="Vorname"
            name="given_name"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder="Vorname" />
          </Form.Item>
          <Form.Item
            label="Nachname"
            name="family_name"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder="Nachname" />
          </Form.Item>
          <Form.Item
            label="Nickname"
            name="nickname"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder="Nickname" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true }, { type: "string", min: 1 }]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item
            label="Standard Abteilung"
            name="defaultAbteilung"
            rules={[{ type: "string", min: 1 }]}
          >
            <Select
              showSearch
              placeholder="Standard Abteilung"
              optionFilterProp="children"
              filterOption={filterOption}
              options={[{label: 'Keine Abteilung', value: null} as any, ...abteilungen.filter(a => {
                if(userState.appUser?.userData.staff) return true

                const userRoles = userState.appUser?.userData.roles || {}
                for(const abteilungId of Object.keys(userRoles)) {
                    if(abteilungId === a.id && userRoles[abteilungId] !== 'pending') return true
                }
                return false
              }).map((a) => {
                return {
                    value: a.slug || a.id,
                    label: a.name,
                }
              }).sort((a,b) => a.label.localeCompare(b.label))]}
            />
          </Form.Item>
        </Form>
      }
    </>
  );
});

export const EditProfileButton = (props: EditProfileProps) => {
  const { userId, userData } = props;
  const editProfileRef = useRef();
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <Button
        type="primary"
        onClick={() => {
          setIsModalVisible(!isModalVisible);
        }}
        icon={<EditOutlined />}
      />
      <Modal
        title="Profil bearbeiten"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
        }}
        footer={[
          <Button
            key="back"
            onClick={() => {
              setIsModalVisible(false);
            }}
          >
            Abbrechen
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={() => {
              if (!editProfileRef || !editProfileRef.current) return;
              //TODO: typescript
              (editProfileRef.current as any).saveEditProfile();
            }}
          >
            Änderungen speichern
          </Button>,
        ]}
      >
        <EditProfile
          ref={editProfileRef}
          userId={userId}
          userData={userData}
          onSuccess={() => {
            setIsModalVisible(false);
          }}
        />
      </Modal>
    </>
  );
};

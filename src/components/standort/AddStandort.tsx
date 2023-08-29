import React, { useState } from "react";
import { Button, Input, message, Form } from "antd";
import Modal from "antd/lib/modal/Modal";
import { firestore } from "config/firebase/firebase";
import {
  abteilungenCollection,
  abteilungenStandortCollection,
} from "config/firebase/collections";
import { validateMessages } from "util/FormValdationMessages";
import { Standort } from "types/standort.types";

export interface AddStandortProps {
  abteilungId: string;
  onSuccess?: () => void;
}

export const AddStandort = (props: AddStandortProps) => {
  const { abteilungId, onSuccess } = props;

  const [form] = Form.useForm<Standort>();

  const addStandort = async () => {
    try {
      const response = await firestore()
        .collection(abteilungenCollection)
        .doc(abteilungId)
        .collection(abteilungenStandortCollection)
        .add(form.getFieldsValue() as Standort);
      if (response.id) {
        message.success(
          `Standort ${form.getFieldValue("name")} erfolgreich erstellt`
        );
        form.resetFields();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        message.error("Es ist leider ein Fehler aufgetreten");
      }
    } catch (ex) {
      message.error(`Es ist ein Fehler aufgetreten: ${ex}`);
      console.error(ex);
    }
  };

  return (
    <>
      <Form
        form={form}
        validateMessages={validateMessages}
        initialValues={{
          city: null,
          coordinates: null,
          street: null,
        }}
        onFinish={addStandort}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true }, { type: "string", min: 1 }]}
        >
          <Input placeholder="Standortname" />
        </Form.Item>
        <Form.Item label="Strasse" name="street" rules={[{ required: false }]}>
          <Input placeholder="Strasse und Nummer" />
        </Form.Item>
        <Form.Item label="Ort" name="city" rules={[{ required: false }]}>
          <Input placeholder="PLZ und Ort" />
        </Form.Item>
        <Form.Item
          label="Koordinaten"
          name="coordinates"
          rules={[{ required: false }]}
        >
          <Input placeholder="Koordinaten" />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            Standort hinzufügen
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export const AddStandortButton = (props: AddStandortProps) => {
  const { abteilungId } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <Button
        type="primary"
        onClick={() => {
          setIsModalVisible(!isModalVisible);
        }}
      >
        Standort hinzufügen
      </Button>
      <Modal
        title="Standort hinzufügen"
        visible={isModalVisible}
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
        ]}
      >
        <AddStandort
          abteilungId={abteilungId}
          onSuccess={() => {
            setIsModalVisible(false);
          }}
        />
      </Modal>
    </>
  );
};

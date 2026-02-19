import React, { useState } from "react";
import { Button, Input, message, Modal, Form } from "antd";
import { db } from "config/firebase/firebase";
import { collection, addDoc } from "firebase/firestore";
import {
  abteilungenCollection,
  abteilungenStandortCollection,
} from "config/firebase/collections";
import { getValidateMessages } from "util/FormValdationMessages";
import { Standort } from "types/standort.types";
import { useTranslation } from 'react-i18next';

export interface AddStandortProps {
  abteilungId: string;
  onSuccess?: () => void;
}

export const AddStandort = (props: AddStandortProps) => {
  const { abteilungId, onSuccess } = props;

  const [form] = Form.useForm<Standort>();
  const { t } = useTranslation();

  const addStandort = async () => {
    try {
      const response = await addDoc(collection(db, abteilungenCollection, abteilungId, abteilungenStandortCollection), form.getFieldsValue() as Standort);
      if (response.id) {
        message.success(
          t('standort:add.success', { name: form.getFieldValue("name") })
        );
        form.resetFields();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        message.error(t('common:errors.genericShort'));
      }
    } catch (ex) {
      message.error(t('common:errors.generic', { error: ex }));
      console.error(ex);
    }
  };

  return (
    <>
      <Form
        form={form}
        validateMessages={getValidateMessages()}
        initialValues={{
          city: null,
          coordinates: null,
          street: null,
        }}
        onFinish={addStandort}
      >
        <Form.Item
          label={t('standort:form.name')}
          name="name"
          rules={[{ required: true }, { type: "string", min: 1 }]}
        >
          <Input placeholder={t('standort:form.namePlaceholder')} />
        </Form.Item>
        <Form.Item label={t('standort:form.street')} name="street" rules={[{ required: false }]}>
          <Input placeholder={t('standort:form.streetPlaceholder')} />
        </Form.Item>
        <Form.Item label={t('standort:form.city')} name="city" rules={[{ required: false }]}>
          <Input placeholder={t('standort:form.cityPlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('standort:form.coordinates')}
          name="coordinates"
          rules={[{ required: false }]}
        >
          <Input placeholder={t('standort:form.coordinatesPlaceholder')} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            {t('standort:add.submit')}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export const AddStandortButton = (props: AddStandortProps) => {
  const { abteilungId } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Button
        type="primary"
        onClick={() => {
          setIsModalVisible(!isModalVisible);
        }}
      >
        {t('standort:add.button')}
      </Button>
      <Modal
        title={t('standort:add.title')}
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
            {t('common:buttons.cancel')}
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

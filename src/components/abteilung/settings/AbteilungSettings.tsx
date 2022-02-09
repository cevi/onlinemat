import classNames from 'classnames';
import { Button, Col, Form, Image, Input, message, Popconfirm, Row, Upload } from 'antd';
import ceviLogoImage from 'assets/onlinemat_logo.png';
import { useNavigate } from 'react-router';
import { Abteilung } from 'types/abteilung.type';
import { useContext, useState } from 'react';
import { firestore, functions } from 'config/firebase/firebase';
import { abteilungenCollection } from 'config/firebase/collections';
import moduleStyles from '../Abteilung.module.scss'
import { ability } from 'config/casl/ability';
import { slugify } from 'util/FormUtil';
import { Can } from 'config/casl/casl';
import { DeleteOutlined, FileExcelOutlined } from '@ant-design/icons';
import { validateMessages } from 'util/FormValdationMessages';
import { excelToJson, exportMaterialsToXlsx } from 'util/ExcelUtil';
import { ExcelImport } from './ExcelImport';
import { ExcelJson } from 'types/excel.type';
import { CategorysContext, MaterialsContext } from '../AbteilungDetails';

export interface AbteilungSettingsProps {
    abteilung: Abteilung
}

export const AbteilungSettings = (props: AbteilungSettingsProps) => {

    const { abteilung } = props;

    const navigate = useNavigate();

    //fetch materials
    const materialsContext = useContext(MaterialsContext);

    const materials = materialsContext.materials;
    const matLoading = materialsContext.loading;

    //fetch categories
    const categoriesContext = useContext(CategorysContext);

    const categories = categoriesContext.categories;
    const catLoading = categoriesContext.loading;

    const [form] = Form.useForm<Abteilung>();
    const [updateLoading, setUpdateLoading] = useState(false);
    const [excelData, setExcelData] = useState<ExcelJson | undefined>();
    const [showImportModal, setShowImportModal] = useState<boolean>(false);

    const disabled = ability.cannot('update', 'Abteilung');
    

    const updateAbteilung = async () => {
        if (!abteilung) return;
        try {
            setUpdateLoading(true);
            if (abteilung?.slug !== form.getFieldsValue().slug) {
                await updateSlug();
            }

            await firestore().collection(abteilungenCollection).doc(abteilung.id).update({
                name: form.getFieldsValue().name,
                ceviDBId: form.getFieldsValue().ceviDBId || null,
                logoUrl: form.getFieldsValue().logoUrl || null,
                email: form.getFieldsValue().email || null
            } as Abteilung);
            message.success(`Änderungen erfolgreich gespeichert`);
        } catch (ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
        setUpdateLoading(false);
    }

    const updateSlug = async () => {
        if (!abteilung) return;
        try {
            const slug = form.getFieldsValue().slug;
            await functions().httpsCallable('updateSlug')({ abteilungId: abteilung.id, slug });
        } catch (ex) {
            console.error(`Es ist ein Fehler aufgetreten: ${ex}`)
            throw ex;
        }
    }

    const delteAbteilung = async (ab: Abteilung | undefined) => {
        if (!ab) return;
        try {
            await firestore().collection(abteilungenCollection).doc(ab.id).delete();
            message.info(`${ab.name} erfolgreich gelöscht`)
            navigate('/')
        } catch (ex) {
            message.error(`Es ist ein Fehler aufgetreten: ${ex}`)
        }
    }

    return <Row>
        <div className={classNames(moduleStyles['ceviLogoWrapper'])}>
            <Image
                width={200}
                src={abteilung?.logoUrl && abteilung.logoUrl !== '' ? abteilung.logoUrl : `${ceviLogoImage}`}
                preview={false}
            />
        </div>
        <div style={{ flex: 1 }}>
            <Form
                form={form}
                layout='vertical'
                onFinish={updateAbteilung}
                onFinishFailed={() => { }}
                autoComplete='off'
                validateMessages={validateMessages}
                initialValues={abteilung}
            >
                <Row gutter={[16, 24]}>
                    <Col span={8}>
                        <Form.Item
                            label='Abteilungsname'
                            name='name'
                            rules={[
                                { required: true },
                                { type: 'string', min: 6 },
                            ]}
                        >
                            <Input
                                placeholder='Abteilungsname'
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label='Slug'
                            name='slug'
                            tooltip={'Url lesbarer Name'}
                            rules={[
                                { required: true },
                                { type: 'string', min: 4 },
                                {
                                    validator: (rule: any, value: string, cb: (msg?: string) => void) => {
                                        //check for whitespaces
                                        if (value.includes(' ')) {
                                            return cb('Der Slug darf keine Leerzeichen haben')
                                        }
                                        //Check if contains upper case
                                        if (value.toLowerCase() !== value) {
                                            return cb('Der Slug muss klein geschrieben werden')
                                        }

                                        //OK
                                        return cb();
                                    }
                                }
                            ]}

                        >
                            <Input
                                placeholder='Slug'
                                onChange={(val) => form.setFieldsValue({ slug: slugify(val.currentTarget.value) })}
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label='Cevi DB Abteilungs ID'
                            name='ceviDBId'
                            rules={[
                                { required: false }
                            ]}
                        >
                            <Input
                                placeholder='Cevi DB Id'
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label='Cevi Logo Url'
                            name='logoUrl'
                            rules={[
                                { required: false },
                                { type: 'url', warningOnly: true },
                                { type: 'string', min: 6 },
                            ]}
                        >
                            <Input
                                placeholder='Cevi Logo Url'
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label='Email'
                            name='email'
                            rules={[
                                { type: 'email' },
                            ]}
                        >
                            <Input
                                placeholder='Email'
                                disabled={disabled || updateLoading}
                            />
                        </Form.Item>
                    </Col>
                    <Can I='update' this={abteilung}>
                        <Col span={8}>
                            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                                <Button type='primary' htmlType='submit' disabled={updateLoading}>
                                    Speichern
                                </Button>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Popconfirm
                                title='Möchtest du diese Abteilung wirklich löschen?'
                                onConfirm={() => delteAbteilung(abteilung)}
                                onCancel={() => { }}
                                okText='Ja'
                                cancelText='Nein'
                            >
                                <Button type='ghost' danger icon={<DeleteOutlined />} disabled={updateLoading}>
                                    Löschen
                                </Button>
                            </Popconfirm>
                        </Col>
                        <Col>
                            <Form.Item
                                label='Material hochladen'
                                name='upload'
                            >
                                <Input
                                    type='file'
                                    name='excelFile'
                                    id='uploadExcel'
                                    onChange={async (e) => {
                                        const res = await excelToJson(e);
                                        if(res) {
                                            setExcelData(res)
                                            setShowImportModal(true)
                                        } else {
                                            message.error('Leider ist ein Fehler beim lesen der Datei aufgetreten 2');
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Button icon={<FileExcelOutlined />} onClick={()=> exportMaterialsToXlsx(abteilung, categories, materials)}>Excel export</Button>
                        </Col>
                    </Can>
                </Row>
            </Form>
            <ExcelImport abteilung={abteilung} excelData={excelData} showModal={showImportModal} setShow={setShowImportModal}/>
        </div>
    </Row>
}

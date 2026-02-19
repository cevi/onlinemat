import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Input, message, Popconfirm, Row, Space, Spin, Switch, Typography } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from 'config/firebase/firebase';
import { releaseNotesCollection } from 'config/firebase/collections';
import { useUser } from 'hooks/use-user';
import ReactMarkdown from 'react-markdown';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';

export const ReleaseNoteEditorView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const userState = useUser();
    const userData = userState.appUser?.userData;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [published, setPublished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notifying, setNotifying] = useState(false);

    const isEditing = !!id;

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getDoc(doc(db, releaseNotesCollection, id)).then((snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setTitle(data.title || '');
                setContent(data.content || '');
                setPublished(data.published || false);
            }
            setLoading(false);
        });
    }, [id]);

    const handleSave = async () => {
        if (!userData) return;
        setSaving(true);
        try {
            if (isEditing) {
                await setDoc(doc(db, releaseNotesCollection, id), {
                    title,
                    content,
                    published,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            } else {
                const docRef = await addDoc(collection(db, releaseNotesCollection), {
                    title,
                    content,
                    published,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    createdBy: userData.id,
                });
                navigate(`/release-notes/${docRef.id}/edit`, { replace: true });
            }
            message.success(t('releaseNote:saveButton'));
        } catch (err) {
            console.error(err);
            message.error(String(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            await deleteDoc(doc(db, releaseNotesCollection, id));
            message.success(t('releaseNote:deleteButton'));
            navigate('/release-notes');
        } catch (err) {
            console.error(err);
            message.error(String(err));
        }
    };

    const handleNotify = async () => {
        if (!id) return;
        setNotifying(true);
        try {
            const result = await httpsCallable<{ releaseNoteId: string }, { notifiedCount: number }>(
                functions, 'notifyReleaseNote'
            )({ releaseNoteId: id });
            message.success(t('releaseNote:notifySuccess', { count: result.data.notifiedCount }));
        } catch (err: any) {
            console.error(err);
            message.error(err?.message || String(err));
        } finally {
            setNotifying(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className={classNames(appStyles['flex-grower'])} style={{marginTop: '20px'}}>
            <Space style={{ marginBottom: 16 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/release-notes')}>
                    {t('releaseNote:backButton')}
                </Button>
            </Space>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Input
                    size="large"
                    placeholder={t('releaseNote:titlePlaceholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <Space>
                    <Switch
                        checked={published}
                        onChange={setPublished}
                    />
                    <Typography.Text>
                        {published ? t('releaseNote:publishedLabel') : t('releaseNote:draftLabel')}
                    </Typography.Text>
                </Space>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Card title={t('releaseNote:editorLabel')} size="small">
                            <Input.TextArea
                                rows={16}
                                placeholder={t('releaseNote:contentPlaceholder')}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                style={{ fontFamily: 'monospace' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card title={t('releaseNote:previewLabel')} size="small">
                            <div style={{ minHeight: 350, overflow: 'auto' }}>
                                <ReactMarkdown>{content}</ReactMarkdown>
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Space>
                    <Button type="primary" onClick={handleSave} loading={saving}>
                        {t('releaseNote:saveButton')}
                    </Button>
                    {isEditing && published && (
                        <Button
                            icon={<SendOutlined />}
                            onClick={handleNotify}
                            loading={notifying}
                        >
                            {t('releaseNote:notifyButton')}
                        </Button>
                    )}
                    {isEditing && (
                        <Popconfirm
                            title={t('releaseNote:deleteConfirm')}
                            onConfirm={handleDelete}
                            okText={t('releaseNote:deleteButton')}
                        >
                            <Button danger icon={<DeleteOutlined />}>
                                {t('releaseNote:deleteButton')}
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            </Space>
        </div>
    );
};

import React, { useMemo } from 'react';
import { Button, Card, Empty, Space, Spin, Tag, Typography } from 'antd';
import { PlusOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from 'config/firebase/firebase';
import { releaseNotesCollection, usersCollection } from 'config/firebase/collections';
import { useFirestoreCollection } from 'hooks/useFirestoreCollection';
import { ReleaseNote } from 'types/releaseNote.types';
import { useUser } from 'hooks/use-user';
import dayjs from 'dayjs';
import ReactMarkdown from 'react-markdown';
import classNames from 'classnames';
import appStyles from 'styles.module.scss';

export const ReleaseNotesView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const userState = useUser();
    const userData = userState.appUser?.userData;
    const isStaff = userData?.staff || false;
    const readIds = userData?.readReleaseNoteIds || [];

    const collectionRef = useMemo(() => {
        if (isStaff) {
            return query(collection(db, releaseNotesCollection), orderBy('createdAt', 'desc'));
        }
        return query(
            collection(db, releaseNotesCollection),
            where('published', '==', true),
            orderBy('createdAt', 'desc')
        );
    }, [isStaff]);

    const { data: releaseNotes, loading } = useFirestoreCollection<ReleaseNote>({
        ref: collectionRef,
        enabled: !!userData,
        transform: (data, id) => ({
            ...data,
            id,
            createdAt: data.createdAt?.toDate ? dayjs(data.createdAt.toDate()) : dayjs(),
            updatedAt: data.updatedAt?.toDate ? dayjs(data.updatedAt.toDate()) : dayjs(),
        } as ReleaseNote),
        deps: [userData, isStaff],
    });

    const toggleRead = async (noteId: string, isRead: boolean) => {
        if (!userData) return;
        const userRef = doc(db, usersCollection, userData.id);
        if (isRead) {
            await updateDoc(userRef, { readReleaseNoteIds: arrayRemove(noteId) });
        } else {
            await updateDoc(userRef, { readReleaseNoteIds: arrayUnion(noteId) });
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Typography.Title level={2} style={{ margin: 0 }}>{t('releaseNote:title')}</Typography.Title>
                {isStaff && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/release-notes/new')}>
                        {t('releaseNote:newButton')}
                    </Button>
                )}
            </div>

            {releaseNotes.length === 0 ? (
                <Empty description={t('releaseNote:emptyState')} />
            ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {releaseNotes.map((note) => {
                        const isRead = readIds.includes(note.id);
                        return (
                            <Card
                                key={note.id}
                                title={
                                    <Space>
                                        {!isRead && <Tag color="blue">New</Tag>}
                                        {!note.published && <Tag color="orange">{t('releaseNote:draftLabel')}</Tag>}
                                        <span>{note.title}</span>
                                    </Space>
                                }
                                extra={
                                    <Space>
                                        <Button
                                            size="small"
                                            type="text"
                                            icon={isRead ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                            onClick={() => toggleRead(note.id, isRead)}
                                        >
                                            {isRead ? t('releaseNote:markUnread') : t('releaseNote:markRead')}
                                        </Button>
                                        {isStaff && (
                                            <Button size="small" onClick={() => navigate(`/release-notes/${note.id}/edit`)}>
                                                {t('releaseNote:editButton')}
                                            </Button>
                                        )}
                                    </Space>
                                }
                            >
                                <ReactMarkdown>{note.content}</ReactMarkdown>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    {note.updatedAt.format('DD.MM.YYYY HH:mm')}
                                </Typography.Text>
                            </Card>
                        );
                    })}
                </Space>
            )}
        </div>
    );
};

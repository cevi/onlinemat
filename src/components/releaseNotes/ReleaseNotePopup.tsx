import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Space } from 'antd';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from 'config/firebase/firebase';
import { usersCollection } from 'config/firebase/collections';
import { ReleaseNote } from 'types/releaseNote.types';
import ReactMarkdown from 'react-markdown';

interface ReleaseNotePopupProps {
    releaseNotes: ReleaseNote[];
    readReleaseNoteIds: string[];
    userId: string;
}

export const ReleaseNotePopup: React.FC<ReleaseNotePopupProps> = ({ releaseNotes, readReleaseNoteIds, userId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const unreadNotes = useMemo(() => {
        return releaseNotes.filter(n => n.published && !readReleaseNoteIds.includes(n.id));
    }, [releaseNotes, readReleaseNoteIds]);

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!dismissed && unreadNotes.length > 0) {
            setOpen(true);
        }
    }, [unreadNotes.length, dismissed]);

    const currentNote = unreadNotes[currentIndex];

    const handleMarkRead = async () => {
        if (!currentNote) return;
        const userRef = doc(db, usersCollection, userId);
        await updateDoc(userRef, { readReleaseNoteIds: arrayUnion(currentNote.id) });

        if (currentIndex < unreadNotes.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setOpen(false);
            setDismissed(true);
        }
    };

    const handleViewAll = () => {
        setOpen(false);
        setDismissed(true);
        navigate('/release-notes');
    };

    const handleClose = () => {
        setOpen(false);
        setDismissed(true);
    };

    if (!currentNote) return null;

    return (
        <Modal
            title={t('releaseNote:popupTitle')}
            open={open}
            onCancel={handleClose}
            footer={
                <Space>
                    <Button onClick={handleViewAll}>{t('releaseNote:viewAll')}</Button>
                    <Button type="primary" onClick={handleMarkRead}>{t('releaseNote:markRead')}</Button>
                </Space>
            }
        >
            <h3>{currentNote.title}</h3>
            <ReactMarkdown>{currentNote.content}</ReactMarkdown>
        </Modal>
    );
};

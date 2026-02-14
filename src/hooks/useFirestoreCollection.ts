import { useState, useEffect } from 'react';
import { CollectionReference, DocumentData, Query, onSnapshot } from 'firebase/firestore';
import { message } from 'antd';

interface UseFirestoreCollectionOptions<T> {
    ref: CollectionReference | Query | null;
    enabled?: boolean;
    transform?: (data: DocumentData, id: string) => T;
    deps?: unknown[];
}

interface UseFirestoreCollectionResult<T> {
    data: T[];
    loading: boolean;
}

export function useFirestoreCollection<T>(
    options: UseFirestoreCollectionOptions<T>
): UseFirestoreCollectionResult<T> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!options.enabled || !options.ref) return;
        setLoading(true);

        return onSnapshot(
            options.ref as Query,
            (snap) => {
                setLoading(false);
                const loaded = snap.docs.map((d) => {
                    if (options.transform) {
                        return options.transform(d.data(), d.id);
                    }
                    return { ...d.data(), id: d.id } as T;
                });
                setData(loaded);
            },
            (err) => {
                setLoading(false);
                message.error(`Es ist ein Fehler aufgetreten ${err}`);
                console.error('Es ist ein Fehler aufgetreten', err);
            }
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, options.deps ?? []);

    return { data, loading };
}

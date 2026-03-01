import React, { useEffect, useState } from 'react';
import { Badge, Button, Collapse, Select, Space } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Categorie } from 'types/categorie.types';
import { Standort } from 'types/standort.types';
import { MaterialFilterState, SortOption, initialFilterState } from 'util/materialFilterSort';

export interface MaterialFilterBarProps {
    categories: Categorie[];
    standorte: Standort[];
    onFilterChange: (state: MaterialFilterState) => void;
}

export const MaterialFilterBar: React.FC<MaterialFilterBarProps> = ({
    categories,
    standorte,
    onFilterChange,
}) => {
    const { t } = useTranslation();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStandorte, setSelectedStandorte] = useState<string[]>([]);
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);
    const [sortOption, setSortOption] = useState<SortOption | undefined>(undefined);

    useEffect(() => {
        onFilterChange({ selectedCategories, selectedStandorte, showAvailableOnly, sortOption });
    }, [selectedCategories, selectedStandorte, showAvailableOnly, sortOption]);

    const categoryOptions = [
        ...categories.map(c => ({ label: c.name, value: c.id })),
        ...(categories.length > 0 ? [{ label: t('material:table.uncategorized'), value: '__uncategorized__' }] : []),
    ];

    const sortOptions = [
        { label: t('material:sort.nameAsc'), value: 'name_asc' as SortOption },
        { label: t('material:sort.nameDesc'), value: 'name_desc' as SortOption },
        { label: t('material:sort.commentAsc'), value: 'comment_asc' as SortOption },
        { label: t('material:sort.commentDesc'), value: 'comment_desc' as SortOption },
        { label: t('material:sort.weightAsc'), value: 'weight_asc' as SortOption },
        { label: t('material:sort.weightDesc'), value: 'weight_desc' as SortOption },
        { label: t('material:sort.availableAsc'), value: 'available_asc' as SortOption },
        { label: t('material:sort.availableDesc'), value: 'available_desc' as SortOption },
    ];

    const activeFilterCount = selectedCategories.length + selectedStandorte.length + (showAvailableOnly ? 1 : 0);

    return (
        <Collapse
            ghost
            size="small"
            style={{ marginBottom: 8 }}
            items={[{
                key: 'filters',
                label: <span style={{ fontSize: 13 }}>
                    <FilterOutlined style={{ marginRight: 4 }} />
                    {t('material:filter.title')}
                    {activeFilterCount > 0 && <Badge count={activeFilterCount} size="small" style={{ marginLeft: 6 }} />}
                </span>,
                children: <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categories.length > 0 && (
                        <Select
                            mode="multiple"
                            allowClear
                            placeholder={t('material:filter.category')}
                            value={selectedCategories}
                            onChange={setSelectedCategories}
                            style={{ width: '100%' }}
                            size="small"
                            options={categoryOptions}
                        />
                    )}
                    {standorte.length > 0 && (
                        <Select
                            mode="multiple"
                            allowClear
                            placeholder={t('material:filter.standort')}
                            value={selectedStandorte}
                            onChange={setSelectedStandorte}
                            style={{ width: '100%' }}
                            size="small"
                            options={standorte.map(s => ({ label: s.name, value: s.id }))}
                        />
                    )}
                    <Space>
                        <Button
                            size="small"
                            type={showAvailableOnly ? 'primary' : 'default'}
                            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                        >
                            {t('material:filter.availableOnly')}
                        </Button>
                    </Space>
                    <Select
                        allowClear
                        placeholder={t('material:sort.placeholder')}
                        value={sortOption}
                        onChange={setSortOption}
                        style={{ width: '100%' }}
                        size="small"
                        options={sortOptions}
                    />
                </div>,
            }]}
        />
    );
};

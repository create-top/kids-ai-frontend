import {
  App,
  Button,
  Dropdown,
  Popconfirm,
  Space,
  Table,
  Tag,
  theme,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React from 'react';
import { useT } from '@/utils/i18n';
import type { AudioItem } from './service';

interface AudioTableProps {
  audios: AudioItem[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  isDesktop: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onPlay: (item: AudioItem) => void;
  onEdit: (item: AudioItem) => void;
  onMove: (item: AudioItem) => void;
  onDelete: (item: AudioItem) => Promise<void>;
}

const AudioTable: React.FC<AudioTableProps> = ({
  audios,
  loading,
  total,
  page,
  pageSize,
  isDesktop,
  onPageChange,
  onPlay,
  onEdit,
  onMove,
  onDelete,
}) => {
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const t = useT();
  const subTextStyle: React.CSSProperties = {
    color: token.colorTextDescription,
    fontSize: 12,
  };
  const desktopColumns: ColumnsType<AudioItem> = [
    { title: t('pages.audio.title'), dataIndex: 'title', ellipsis: true },
    { title: t('pages.audio.fileName'), dataIndex: 'fileName', ellipsis: true },
    { title: t('pages.audio.category'), dataIndex: 'category', width: 120 },
    {
      title: t('pages.audio.tags'),
      dataIndex: 'tags',
      width: 180,
      render: (tags?: string[]) =>
        (tags || []).map((tag) => <Tag key={tag}>{tag}</Tag>),
    },
    {
      title: t('pages.audio.actions'),
      key: 'action',
      width: 240,
      align: 'center',
      render: (_, record) => (
        <Space size={0} style={{ whiteSpace: 'nowrap' }}>
          <Button type="link" size="small" onClick={() => onPlay(record)}>
            {t('pages.audio.play')}
          </Button>
          <Button type="link" size="small" onClick={() => onEdit(record)}>
            {t('pages.audio.edit')}
          </Button>
          <Button type="link" size="small" onClick={() => onMove(record)}>
            {t('pages.audio.move')}
          </Button>
          <Popconfirm
            title={t('pages.audio.deleteConfirm', { title: record.title })}
            onConfirm={() => onDelete(record)}
          >
            <Button type="link" size="small" danger>
              {t('pages.audio.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 窄屏：标题下面补一行文件名和顺序，操作收进下拉菜单
  const mobileColumns: ColumnsType<AudioItem> = [
    {
      title: t('pages.audio.title'),
      dataIndex: 'title',
      ellipsis: true,
      render: (_, record) => (
        <>
          <div>{record.title}</div>
          <div style={subTextStyle}>
            {record.fileName}
            {record.sortNo != null &&
              t('pages.audio.sortInline', { sortNo: record.sortNo })}
          </div>
        </>
      ),
    },
    {
      title: t('pages.audio.actions'),
      key: 'action',
      width: 72,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'play', label: t('pages.audio.play') },
              { key: 'edit', label: t('pages.audio.edit') },
              { key: 'move', label: t('pages.audio.move') },
              { key: 'delete', label: t('pages.audio.delete'), danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'play') onPlay(record);
              else if (key === 'edit') onEdit(record);
              else if (key === 'move') onMove(record);
              else {
                modal.confirm({
                  title: t('pages.audio.deleteConfirm', {
                    title: record.title,
                  }),
                  onOk: () => onDelete(record),
                });
              }
            },
          }}
        >
          <Button type="link" size="small">
            {t('pages.audio.actions')}
          </Button>
        </Dropdown>
      ),
    },
  ];

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    simple: !isDesktop,
    showSizeChanger: isDesktop,
    showTotal: (count) => t('pages.audio.total', { count }),
    onChange: onPageChange,
  };

  return (
    <Table<AudioItem>
      rowKey="id"
      size="middle"
      columns={isDesktop ? desktopColumns : mobileColumns}
      dataSource={audios}
      loading={loading}
      pagination={pagination}
    />
  );
};

export default AudioTable;

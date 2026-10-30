import { App, Button, Dropdown, Popconfirm, Space, Table, Tag } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React from 'react';
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

const subTextStyle: React.CSSProperties = {
  color: 'rgba(0, 0, 0, 0.45)',
  fontSize: 12,
};

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
  const desktopColumns: ColumnsType<AudioItem> = [
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '文件名', dataIndex: 'fileName', ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 120 },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 180,
      render: (tags?: string[]) =>
        (tags || []).map((tag) => <Tag key={tag}>{tag}</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      align: 'center',
      render: (_, record) => (
        <Space size={0} style={{ whiteSpace: 'nowrap' }}>
          <Button type="link" size="small" onClick={() => onPlay(record)}>
            播放
          </Button>
          <Button type="link" size="small" onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => onMove(record)}>
            移动
          </Button>
          <Popconfirm
            title={`删除「${record.title}」？`}
            onConfirm={() => onDelete(record)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 窄屏：标题下面补一行文件名和顺序，操作收进下拉菜单
  const mobileColumns: ColumnsType<AudioItem> = [
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (_, record) => (
        <>
          <div>{record.title}</div>
          <div style={subTextStyle}>
            {record.fileName}
            {record.sortNo != null && ` · 顺序 ${record.sortNo}`}
          </div>
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 72,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'play', label: '播放' },
              { key: 'edit', label: '编辑' },
              { key: 'move', label: '移动' },
              { key: 'delete', label: '删除', danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'play') onPlay(record);
              else if (key === 'edit') onEdit(record);
              else if (key === 'move') onMove(record);
              else {
                modal.confirm({
                  title: `删除「${record.title}」？`,
                  onOk: () => onDelete(record),
                });
              }
            },
          }}
        >
          <Button type="link" size="small">
            操作
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
    showTotal: (count) => `共 ${count} 条数据`,
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

import { PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tree,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
import MoveModal from './MoveModal';
import {
  createFolder,
  deleteFolder,
  type Folder,
  moveFolder,
  renameFolder,
} from './service';
import { filterFolderTree, flattenFolders } from './utils';

interface FolderPanelProps {
  tree: Folder[];
  loading: boolean;
  currentFolder: Folder | null;
  isDesktop: boolean;
  /** 选中目录；点同一个已选中的节点时 antd 会给空，由调用方忽略 */
  onSelect: (folderId: number) => void;
  /** 目录结构变了（新建、改名、移动），需要重新取树 */
  onTreeChanged: () => Promise<void>;
  /** 当前目录被删除 */
  onDeleted: () => Promise<void>;
}

function toTreeData(nodes: Folder[]): DataNode[] {
  return nodes.map((node) => ({
    title: node.name,
    key: String(node.id),
    children: toTreeData(node.children || []),
  }));
}

type NameModalState =
  | { open: false }
  | { open: true; mode: 'create'; atRoot: boolean }
  | { open: true; mode: 'rename'; folder: Folder };

const FolderPanel: React.FC<FolderPanelProps> = ({
  tree,
  loading,
  currentFolder,
  isDesktop,
  onSelect,
  onTreeChanged,
  onDeleted,
}) => {
  const { message } = App.useApp();
  const t = useT();
  const [keyword, setKeyword] = useState('');
  const [nameModal, setNameModal] = useState<NameModalState>({ open: false });
  const [moveOpen, setMoveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<{ name: string }>();

  const treeData = useMemo(
    () => toTreeData(filterFolderTree(tree, keyword)),
    [tree, keyword],
  );
  const options = useMemo(() => flattenFolders(tree), [tree]);

  const openNameModal = (state: NameModalState) => {
    form.setFieldsValue({
      name: state.open && state.mode === 'rename' ? state.folder.name : '',
    });
    setNameModal(state);
  };

  const saveName = async () => {
    const { name } = await form.validateFields();
    const trimmed = name.trim();
    if (!trimmed) {
      message.warning(t('pages.audio.folderNameRequired'));
      return;
    }
    if (!nameModal.open) {
      return;
    }
    setSaving(true);
    try {
      if (nameModal.mode === 'rename') {
        await renameFolder(nameModal.folder.id, trimmed);
      } else {
        // 「新增」建在根目录；「添加下级」建在当前选中的目录下
        const parentId = nameModal.atRoot ? null : (currentFolder?.id ?? null);
        await createFolder(parentId, trimmed);
      }
      setNameModal({ open: false });
      await onTreeChanged();
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveMove = async (parentId: number | null) => {
    if (!currentFolder) {
      return;
    }
    try {
      await moveFolder(currentFolder.id, parentId);
      setMoveOpen(false);
      await onTreeChanged();
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const remove = async () => {
    if (!currentFolder) {
      return;
    }
    try {
      await deleteFolder(currentFolder.id);
      await onDeleted();
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const noSelection = !currentFolder;

  return (
    <Card variant="borderless" style={{ height: '100%' }}>
      <Space wrap style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            openNameModal({ open: true, mode: 'create', atRoot: true })
          }
        >
          {t('pages.audio.add')}
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={noSelection}
          onClick={() =>
            openNameModal({ open: true, mode: 'create', atRoot: false })
          }
        >
          {t('pages.audio.addChild')}
        </Button>
        <Button
          disabled={noSelection}
          onClick={() =>
            currentFolder &&
            openNameModal({ open: true, mode: 'rename', folder: currentFolder })
          }
        >
          {t('pages.audio.edit')}
        </Button>
        <Button disabled={noSelection} onClick={() => setMoveOpen(true)}>
          {t('pages.audio.move')}
        </Button>
        <Popconfirm
          title={t('pages.audio.deleteFolderHint')}
          disabled={noSelection}
          onConfirm={remove}
        >
          <Button danger disabled={noSelection}>
            {t('pages.audio.delete')}
          </Button>
        </Popconfirm>
      </Space>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 8 }}
        title={
          currentFolder
            ? t('pages.audio.currentFolder', { name: currentFolder.name })
            : t('pages.audio.noFolder')
        }
      />

      <Spin spinning={loading}>
        <Input.Search
          allowClear
          placeholder={t('pages.audio.searchFolder')}
          style={{ marginBottom: 10 }}
          onChange={(event) => setKeyword(event.target.value)}
        />
        {treeData.length ? (
          <Tree
            treeData={treeData}
            selectedKeys={currentFolder ? [String(currentFolder.id)] : []}
            defaultExpandAll
            style={
              isDesktop
                ? { overflow: 'auto', height: 'calc(100vh - 330px)' }
                : { overflow: 'auto', maxHeight: '60vh' }
            }
            onSelect={(keys) => {
              if (keys.length) {
                onSelect(Number(keys[0]));
              }
            }}
          />
        ) : (
          <Empty description={t('pages.audio.empty')} />
        )}
      </Spin>

      <Modal
        open={nameModal.open}
        title={
          nameModal.open && nameModal.mode === 'rename'
            ? t('pages.audio.renameFolder')
            : t('pages.audio.newFolder')
        }
        confirmLoading={saving}
        onOk={saveName}
        onCancel={() => setNameModal({ open: false })}
        forceRender
      >
        <Form form={form} layout="vertical" style={{ paddingTop: 16 }}>
          <Form.Item
            label={t('pages.audio.folderName')}
            name="name"
            rules={[
              { required: true, message: t('pages.audio.folderNameRequired') },
            ]}
          >
            <Input placeholder={t('pages.audio.folderName')} />
          </Form.Item>
        </Form>
      </Modal>

      <MoveModal
        open={moveOpen}
        title={t('pages.audio.moveFolder')}
        options={options}
        initialValue={currentFolder?.parentId}
        onOk={saveMove}
        onCancel={() => setMoveOpen(false)}
      />
    </Card>
  );
};

export default FolderPanel;

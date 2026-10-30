import { UploadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Grid,
  Input,
  Row,
  Space,
  Tabs,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AudioTable from './AudioTable';
import EditModal from './EditModal';
import FolderPanel from './FolderPanel';
import MoveModal from './MoveModal';
import PlayDrawer from './PlayDrawer';
import {
  type AudioItem,
  deleteAudio,
  type Folder,
  fetchAudios,
  fetchFolderTree,
  moveAudio,
} from './service';
import UploadModal from './UploadModal';
import { findFolder, flattenFolders } from './utils';

const DEFAULT_PAGE_SIZE = 10;

/** 窄屏（手机）用页签在「目录」和「音频」之间切换。 */
type MobileTab = 'folders' | 'audios';

const AudioPage: React.FC = () => {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  // useBreakpoint 挂载后才有值；先用窗口宽度，避免电脑上先闪出手机布局
  const isDesktop =
    Object.keys(screens).length === 0
      ? window.innerWidth >= 1200
      : !!screens.xl;
  const [mobileTab, setMobileTab] = useState<MobileTab>('audios');

  const [tree, setTree] = useState<Folder[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [uncategorized, setUncategorized] = useState(false);

  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  // 增加这个数字就会重新取一次列表（增删改之后用）
  const [reloadToken, setReloadToken] = useState(0);

  const [currentAudio, setCurrentAudio] = useState<AudioItem | null>(null);
  const [playOpen, setPlayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // 当前目录从树里按 id 找，树刷新后改名、移动都会自动反映；目录被删后找不到就回到「全部」
  const currentFolder = useMemo(
    () =>
      selectedFolderId == null ? null : findFolder(tree, selectedFolderId),
    [tree, selectedFolderId],
  );
  const folderOptions = useMemo(() => flattenFolders(tree), [tree]);

  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      setTree(await fetchFolderTree());
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setTreeLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // reloadToken 只用来触发重新取列表，所以放在依赖里但函数体不用它
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAudios({
      page,
      pageSize,
      keyword,
      folderId: selectedFolderId,
      uncategorized,
    })
      .then((result) => {
        if (cancelled) return;
        setAudios(result?.records || []);
        setTotal(result?.total || 0);
      })
      .catch((error) => {
        if (!cancelled) message.error((error as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // 快速切换目录时，丢弃上一次还没回来的结果
    return () => {
      cancelled = true;
    };
  }, [
    page,
    pageSize,
    keyword,
    selectedFolderId,
    uncategorized,
    reloadToken,
    message,
  ]);

  const reloadAudios = useCallback(async () => {
    setReloadToken((value) => value + 1);
  }, []);

  const selectFolder = (id: number) => {
    setUncategorized(false);
    setSelectedFolderId(id);
    setMobileTab('audios');
    setPage(1);
  };

  const showAll = () => {
    setUncategorized(false);
    setSelectedFolderId(null);
    setMobileTab('audios');
    setPage(1);
  };

  const showUncategorized = () => {
    setUncategorized(true);
    setSelectedFolderId(null);
    setMobileTab('audios');
    setPage(1);
  };

  const search = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const onFolderDeleted = async () => {
    showAll();
    await loadTree();
  };

  const removeAudio = async (item: AudioItem) => {
    try {
      await deleteAudio(item.id);
      if (currentAudio?.id === item.id) {
        setCurrentAudio(null);
        setPlayOpen(false);
      }
      await reloadAudios();
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const saveAudioMove = async (folderId: number | null) => {
    if (!currentAudio) {
      return;
    }
    try {
      setCurrentAudio(await moveAudio(currentAudio.id, folderId));
      setMoveOpen(false);
      await reloadAudios();
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const currentTitle = uncategorized
    ? '未归类'
    : currentFolder
      ? currentFolder.name
      : '全部音频';

  const folderColumn = (
    <Col xl={8} lg={24} md={24} style={{ marginBottom: 10 }}>
      <FolderPanel
        tree={tree}
        loading={treeLoading}
        currentFolder={currentFolder}
        isDesktop={isDesktop}
        onSelect={selectFolder}
        onTreeChanged={loadTree}
        onDeleted={onFolderDeleted}
      />
    </Col>
  );

  const audioColumn = (
    <Col xl={16} lg={24} md={24} style={{ marginBottom: 10 }}>
      <Card variant="borderless" style={{ height: '100%' }}>
        <Space wrap style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadOpen(true)}
          >
            上传
          </Button>
          <Button onClick={showAll}>全部</Button>
          <Button onClick={showUncategorized}>未归类</Button>
        </Space>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 8 }}
          title={currentTitle}
        />
        <Input.Search
          allowClear
          placeholder="按标题搜索…"
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          onSearch={search}
          style={{ width: isDesktop ? 240 : '100%', marginBottom: 10 }}
        />
        <AudioTable
          audios={audios}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          isDesktop={isDesktop}
          onPageChange={(nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          }}
          onPlay={(item) => {
            setCurrentAudio(item);
            setPlayOpen(true);
          }}
          onEdit={(item) => {
            setCurrentAudio(item);
            setEditOpen(true);
          }}
          onMove={(item) => {
            setCurrentAudio(item);
            setMoveOpen(true);
          }}
          onDelete={removeAudio}
        />
      </Card>
    </Col>
  );

  return (
    <PageContainer title={false}>
      {!isDesktop && (
        <Tabs
          activeKey={mobileTab}
          onChange={(key) => setMobileTab(key as MobileTab)}
          items={[
            { key: 'folders', label: '目录' },
            { key: 'audios', label: '音频' },
          ]}
        />
      )}
      <Row gutter={10}>
        {(isDesktop || mobileTab === 'folders') && folderColumn}
        {(isDesktop || mobileTab === 'audios') && audioColumn}
      </Row>

      <PlayDrawer
        open={playOpen}
        audio={currentAudio}
        isDesktop={isDesktop}
        onClose={() => setPlayOpen(false)}
      />
      <UploadModal
        open={uploadOpen}
        options={folderOptions}
        defaultFolderId={currentFolder?.id}
        onClose={() => setUploadOpen(false)}
        onUploaded={reloadAudios}
      />
      <EditModal
        open={editOpen}
        audio={currentAudio}
        onClose={() => setEditOpen(false)}
        onSaved={async (updated) => {
          setCurrentAudio(updated);
          await reloadAudios();
        }}
      />
      <MoveModal
        open={moveOpen}
        title="移动音频"
        options={folderOptions}
        initialValue={currentAudio?.folderId}
        onOk={saveAudioMove}
        onCancel={() => setMoveOpen(false)}
      />
    </PageContainer>
  );
};

export default AudioPage;

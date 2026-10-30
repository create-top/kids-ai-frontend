import { Descriptions, Drawer } from 'antd';
import React from 'react';
import { type AudioItem, audioContentUrl } from './service';

interface PlayDrawerProps {
  open: boolean;
  audio: AudioItem | null;
  isDesktop: boolean;
  onClose: () => void;
}

const PlayDrawer: React.FC<PlayDrawerProps> = ({
  open,
  audio,
  isDesktop,
  onClose,
}) => {
  return (
    <Drawer
      open={open}
      title={audio?.title || '播放'}
      placement="right"
      size={isDesktop ? 420 : '100%'}
      onClose={onClose}
      // 关闭时卸载，避免抽屉收起后声音还在播
      destroyOnHidden
    >
      {audio && (
        <>
          <Descriptions
            column={1}
            size="small"
            bordered
            items={[
              { key: 'file', label: '文件', children: audio.fileName },
              {
                key: 'category',
                label: '分类',
                children: audio.category || '-',
              },
              {
                key: 'description',
                label: '描述',
                children: audio.description || '没有描述',
              },
            ]}
          />
          {/* biome-ignore lint/a11y/useMediaCaption: 音频试听，没有字幕 */}
          <audio
            src={audioContentUrl(audio.id)}
            controls
            style={{ width: '100%', marginTop: 16 }}
          />
        </>
      )}
    </Drawer>
  );
};

export default PlayDrawer;

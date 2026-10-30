import { Descriptions, Drawer } from 'antd';
import React from 'react';
import { useT } from '@/utils/i18n';
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
  const t = useT();
  return (
    <Drawer
      open={open}
      title={audio?.title || t('pages.audio.play')}
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
              {
                key: 'file',
                label: t('pages.audio.file'),
                children: audio.fileName,
              },
              {
                key: 'category',
                label: t('pages.audio.category'),
                children: audio.category || '-',
              },
              {
                key: 'description',
                label: t('pages.audio.description'),
                children: audio.description || t('pages.audio.noDescription'),
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

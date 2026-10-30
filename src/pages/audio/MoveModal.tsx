import { Modal, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { useT } from '@/utils/i18n';
import type { FolderOption } from './utils';

interface MoveModalProps {
  open: boolean;
  title: string;
  options: FolderOption[];
  /** 打开时默认选中的目录，空表示根目录 / 未归类 */
  initialValue?: number | null;
  onOk: (parentId: number | null) => Promise<void>;
  onCancel: () => void;
}

/** 移动目录和移动音频共用：选一个目标目录，不选就是根目录（音频则是未归类）。 */
const MoveModal: React.FC<MoveModalProps> = ({
  open,
  title,
  options,
  initialValue,
  onOk,
  onCancel,
}) => {
  const t = useT();
  const [value, setValue] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(initialValue ?? undefined);
    }
  }, [open, initialValue]);

  const handleOk = async () => {
    setSaving(true);
    try {
      await onOk(value ?? null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      confirmLoading={saving}
      onOk={handleOk}
      onCancel={onCancel}
    >
      <div style={{ padding: '16px 0' }}>
        <Select
          allowClear
          showSearch={{ optionFilterProp: 'label' }}
          value={value}
          onChange={(next) => setValue(next ?? undefined)}
          placeholder={t('pages.audio.rootOrUncategorized')}
          style={{ width: '100%' }}
          options={options}
        />
      </div>
    </Modal>
  );
};

export default MoveModal;

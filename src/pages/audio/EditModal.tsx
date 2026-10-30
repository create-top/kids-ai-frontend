import { App, Form, Input, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { type AudioItem, updateAudio } from './service';
import { parseSortNo, parseTags } from './utils';

interface EditModalProps {
  open: boolean;
  audio: AudioItem | null;
  onClose: () => void;
  onSaved: (updated: AudioItem) => Promise<void>;
}

interface EditFormValues {
  title: string;
  description?: string;
  category?: string;
  tags?: string;
  sortNo?: string;
}

const EditModal: React.FC<EditModalProps> = ({
  open,
  audio,
  onClose,
  onSaved,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<EditFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && audio) {
      form.setFieldsValue({
        title: audio.title,
        description: audio.description || '',
        category: audio.category || '',
        tags: (audio.tags || []).join(','),
        sortNo: audio.sortNo == null ? '' : String(audio.sortNo),
      });
    }
  }, [open, audio, form]);

  const save = async () => {
    if (!audio) {
      return;
    }
    const values = form.getFieldsValue();
    const sortNo = parseSortNo(values.sortNo);
    if (sortNo === undefined) {
      message.warning('顺序要填数字');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateAudio(audio.id, {
        title: values.title ?? '',
        description: values.description ?? '',
        category: values.category ?? '',
        tags: parseTags(values.tags),
        sortNo,
      });
      onClose();
      await onSaved(updated);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="编辑音频"
      confirmLoading={saving}
      onOk={save}
      onCancel={onClose}
      forceRender
    >
      <Form form={form} layout="vertical" style={{ paddingTop: 16 }}>
        <Form.Item label="标题" name="title">
          <Input />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label="分类" name="category">
          <Input />
        </Form.Item>
        <Form.Item label="标签" name="tags">
          <Input placeholder="用逗号分隔" />
        </Form.Item>
        <Form.Item label="顺序" name="sortNo">
          <Input placeholder="同一目录里的先后，空着就按集数" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditModal;

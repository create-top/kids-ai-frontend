import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  App,
  Button,
  Collapse,
  Form,
  Input,
  Modal,
  Select,
  Upload,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useT } from '@/utils/i18n';
import { uploadAudio } from './service';
import type { FolderOption } from './utils';

interface UploadModalProps {
  open: boolean;
  options: FolderOption[];
  /** 打开时默认选中的目录（当前正在浏览的目录） */
  defaultFolderId?: number;
  onClose: () => void;
  onUploaded: () => Promise<void>;
}

interface UploadFormValues {
  title: string;
  folderId?: number;
  description?: string;
  category?: string;
  tags?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({
  open,
  options,
  defaultFolderId,
  onClose,
  onUploaded,
}) => {
  const { message } = App.useApp();
  const t = useT();
  const [form] = Form.useForm<UploadFormValues>();
  const [file, setFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFile(null);
      setFileList([]);
      form.resetFields();
      form.setFieldsValue({ folderId: defaultFolderId });
    }
  }, [open, defaultFolderId, form]);

  const submit = async () => {
    const values = form.getFieldsValue();
    const title = values.title?.trim();
    if (!file || !title) {
      message.warning(t('pages.audio.selectFileAndTitle'));
      return;
    }
    const body = new FormData();
    body.append('file', file);
    body.append('title', title);
    if (values.folderId) {
      body.append('folderId', String(values.folderId));
    }
    if (values.description) {
      body.append('description', values.description);
    }
    if (values.category) {
      body.append('category', values.category);
    }
    if (values.tags) {
      body.append('tags', values.tags);
    }
    setSaving(true);
    try {
      await uploadAudio(body);
      onClose();
      message.success(t('pages.audio.uploadOk'));
      await onUploaded();
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t('pages.audio.uploadAudio')}
      confirmLoading={saving}
      onOk={submit}
      onCancel={onClose}
      forceRender
    >
      <Form form={form} layout="vertical" style={{ paddingTop: 16 }}>
        <Form.Item label={t('pages.audio.audioFile')} required>
          <Upload
            fileList={fileList}
            accept=".mp3,.wav,.m4a,.aac,audio/*"
            maxCount={1}
            // 返回 false：不让组件自己上传，等点「确定」时统一用 FormData 提交
            beforeUpload={(selected) => {
              setFile(selected);
              setFileList([selected as unknown as UploadFile]);
              // 标题没填时，用文件名（去掉扩展名）作默认标题
              if (!form.getFieldValue('title')) {
                form.setFieldsValue({
                  title: selected.name.replace(/\.[^.]+$/, ''),
                });
              }
              return false;
            }}
            onRemove={() => {
              setFile(null);
              setFileList([]);
            }}
          >
            <Button icon={<UploadOutlined />}>
              {t('pages.audio.chooseFile')}
            </Button>
          </Upload>
        </Form.Item>
        <Form.Item label={t('pages.audio.title')} name="title" required>
          <Input />
        </Form.Item>
        <Form.Item label={t('pages.audio.folder')} name="folderId">
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder={t('pages.audio.uncategorized')}
            options={options}
          />
        </Form.Item>
        <Collapse
          items={[
            {
              key: 'more',
              label: t('pages.audio.more'),
              forceRender: true,
              children: (
                <>
                  <Form.Item
                    label={t('pages.audio.description')}
                    name="description"
                  >
                    <Input.TextArea />
                  </Form.Item>
                  <Form.Item label={t('pages.audio.category')} name="category">
                    <Input />
                  </Form.Item>
                  <Form.Item label={t('pages.audio.tags')} name="tags">
                    <Input placeholder={t('pages.audio.tagsComma')} />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
};

export default UploadModal;

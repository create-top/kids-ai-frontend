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
      message.warning('请选择音频并填写标题');
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
      message.success('上传成功');
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
      title="上传音频"
      confirmLoading={saving}
      onOk={submit}
      onCancel={onClose}
      forceRender
    >
      <Form form={form} layout="vertical" style={{ paddingTop: 16 }}>
        <Form.Item label="音频文件" required>
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
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
        </Form.Item>
        <Form.Item label="标题" name="title" required>
          <Input />
        </Form.Item>
        <Form.Item label="目录" name="folderId">
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="未归类"
            options={options}
          />
        </Form.Item>
        <Collapse
          items={[
            {
              key: 'more',
              label: '更多',
              forceRender: true,
              children: (
                <>
                  <Form.Item label="描述" name="description">
                    <Input.TextArea />
                  </Form.Item>
                  <Form.Item label="分类" name="category">
                    <Input />
                  </Form.Item>
                  <Form.Item label="标签" name="tags">
                    <Input placeholder="用逗号分隔" />
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

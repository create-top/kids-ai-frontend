import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet } from '@umijs/max';
import { Alert, App } from 'antd';
import { createStyles } from 'antd-style';
import React, { useCallback, useEffect, useState } from 'react';
import { Footer } from '@/components';
import {
  getCaptchaImage,
  type LoginParams,
  login,
  newCaptchaKey,
} from '@/services/auth';
import { getSafeRedirectUrl } from '@/utils/redirect';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'auto',
    background: '#f5f7fa',
  },
  captchaRow: {
    display: 'flex',
    gap: 8,
  },
  captchaImage: {
    height: 40,
    cursor: 'pointer',
    borderRadius: 6,
    border: '1px solid #d9d9d9',
  },
}));

const Login: React.FC = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [captchaKey, setCaptchaKey] = useState<string>(newCaptchaKey);
  const [captchaImage, setCaptchaImage] = useState<string>();

  // WHY：验证码答案存在服务端 Redis 里，只能用一次、60 秒过期；
  // 登录失败后必须换一张，所以每次换一个新的 key。
  const refreshCaptcha = useCallback(async () => {
    const key = newCaptchaKey();
    setCaptchaKey(key);
    try {
      setCaptchaImage(await getCaptchaImage(key));
    } catch (error) {
      setCaptchaImage(undefined);
      message.error((error as Error).message);
    }
  }, [message]);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  const handleSubmit = async (values: Omit<LoginParams, 'checkKey'>) => {
    try {
      await login({ ...values, checkKey: captchaKey });
      message.success('登录成功');
      const redirect = new URL(window.location.href).searchParams.get(
        'redirect',
      );
      // 整页跳转，让 getInitialState 带着新令牌重新取用户
      window.location.href = getSafeRedirectUrl(redirect);
    } catch (error) {
      setErrorMessage((error as Error).message);
      refreshCaptcha();
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          登录
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <div style={{ flex: 1, padding: '32px 0' }}>
        <LoginForm
          contentStyle={{ minWidth: 280, maxWidth: '75vw' }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="Kids-AI"
          subTitle="家庭儿童 AI 管理端"
          onFinish={async (values) => {
            await handleSubmit(values as Omit<LoginParams, 'checkKey'>);
          }}
        >
          {errorMessage && (
            <Alert
              style={{ marginBottom: 24 }}
              title={errorMessage}
              type="error"
              showIcon
            />
          )}
          <ProFormText
            name="username"
            fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
            placeholder="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
            placeholder="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          />
          <div className={styles.captchaRow}>
            <ProFormText
              name="captcha"
              fieldProps={{ size: 'large', prefix: <SafetyOutlined /> }}
              placeholder="验证码"
              rules={[{ required: true, message: '请输入验证码' }]}
              formItemProps={{ style: { flex: 1, marginBottom: 24 } }}
            />
            {captchaImage ? (
              <img
                className={styles.captchaImage}
                src={captchaImage}
                alt="验证码，点击刷新"
                title="点击刷新"
                onClick={refreshCaptcha}
              />
            ) : (
              <a onClick={refreshCaptcha}>获取验证码</a>
            )}
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;

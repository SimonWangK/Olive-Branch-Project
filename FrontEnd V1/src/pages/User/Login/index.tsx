import Footer from '@/components/Footer';
import { login } from '@/services/system/auth';
import {
  LockOutlined,
  MobileOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { history, useModel, Helmet } from '@umijs/max';
import { Alert, Tabs, message } from 'antd';
import Settings from '../../../../config/defaultSettings';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { clearSessionToken, setSessionToken } from '@/access';

// Variables for text replacements
const loginText = {
  title: 'olive branch',
  subTitle: 'Streamlined Case Management for Insolvency & Compliance Workflows',
  accountLoginTab: 'Account Login',
  mobileLoginTab: 'Phone Login',
  incorrectUsernamePassword: 'Incorrect email/password',
  usernamePlaceholder: 'Input your email',
  passwordPlaceholder: 'Input your password',
  mobilePlaceholder: 'Mobile number',
  captchaPlaceholder: 'Please input your captcha!',
  captchaText: 'Get Captcha ',
  rememberMe: 'Remember Me',
  forgotPassword: 'Forgot Password?',
  loginSuccessMessage: 'Login successful!',
  loginFailureMessage: 'Login failed, please try again!',
};

const LoginMessage: React.FC<{ content: string }> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({ code: 200 });
  const [type, setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');

  const containerClassName = useEmotionCss(() => {
    return {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
    };
  });

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      // Login
      const response = await login({ ...values });
      if (response.code === 2000) {
        message.success(loginText.loginSuccessMessage);
        setSessionToken(response.data?.access, response.data?.refresh, response.data?.access_expire_in);
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
        return;
      } else {
        console.log(response.msg);
        clearSessionToken();
        setUserLoginState({ ...response, type });
      }
    } catch (error) {
      message.error(loginText.loginFailureMessage);
    }
  };

  const { code } = userLoginState;
  const loginType = type;

  return (
    <div className={containerClassName}>
      <Helmet>
        <title>
          {loginText.title} - {Settings.title}
        </title>
      </Helmet>
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 380,
            maxWidth: '80vw',
          }}
          title={loginText.title}
          subTitle={loginText.subTitle}
          initialValues={{
            autoLogin: true,
          }}
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginParams);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[
              {
                key: 'account',
                label: loginText.accountLoginTab,
              },
              {
                key: 'mobile',
                label: loginText.mobileLoginTab,
              },
            ]}
          />

          {code !== 200 && loginType === 'account' && (
            <LoginMessage content={loginText.incorrectUsernamePassword} />
          )}

          {type === 'account' && (
            <>
              <ProFormText
                name="email"
                initialValue=""
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
                }}
                placeholder={loginText.usernamePlaceholder}
                rules={[
                  {
                    required: true,
                    message: loginText.usernamePlaceholder,
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                initialValue=""
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                placeholder={loginText.passwordPlaceholder}
                rules={[
                  {
                    required: true,
                    message: loginText.passwordPlaceholder,
                  },
                ]}
              />
            </>
          )}

          {code !== 200 && loginType === 'mobile' && (
            <LoginMessage content="Captcha error" />
          )}

          {type === 'mobile' && (
            <>
              <ProFormText
                fieldProps={{
                  size: 'large',
                  prefix: <MobileOutlined />,
                }}
                name="mobile"
                placeholder={loginText.mobilePlaceholder}
                rules={[
                  {
                    required: true,
                    message: loginText.mobilePlaceholder,
                  },
                ]}
              />
              <ProFormCaptcha
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                captchaProps={{
                  size: 'large',
                }}
                placeholder={loginText.captchaPlaceholder}
                captchaTextRender={(timing, count) => {
                  if (timing) {
                    return `${count} ${loginText.captchaText}`;
                  }
                  return loginText.captchaText;
                }}
                name="captcha"
                rules={[
                  {
                    required: true,
                    message: loginText.captchaPlaceholder,
                  },
                ]}
              />
            </>
          )}

          <div
            style={{
              marginBottom: 24,
            }}
          >
            <ProFormCheckbox noStyle name="autoLogin">
              {loginText.rememberMe}
            </ProFormCheckbox>
            <a
              style={{
                float: 'right',
              }}
            >
              {loginText.forgotPassword}
            </a>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;

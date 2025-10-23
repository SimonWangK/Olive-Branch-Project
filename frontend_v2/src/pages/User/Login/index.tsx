import Footer from '@/components/Footer';
import { login, register } from '@/services/system/auth';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText, ProFormRadio } from '@ant-design/pro-components';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { history, useModel, Helmet } from '@umijs/max';
import { Alert, message } from 'antd';
import Settings from '../../../../config/defaultSettings';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { clearSessionToken, setSessionToken } from '@/access';

// Variables for text replacements (unchanged)
const loginText = {
  title: 'Olive Branch',
  subTitle: 'Streamlined Case Management for Insolvency & Compliance Workflows',
  accountLoginTab: 'Account Login',
  incorrectUsernamePassword: 'Incorrect email/password',
  usernamePlaceholder: 'Input your email',
  passwordPlaceholder: 'Input your password',
  confirmPasswordPlaceholder: 'Confirm your password',
  rememberMe: 'Remember Me',
  forgotPassword: 'Forgot Password?',
  loginSuccessMessage: 'Login successful!',
  loginFailureMessage: 'Login failed, please try again!',
  registerTab: 'Register',
  registrationSuccessMessage: 'Registration successful!',
  registrationFailureMessage: 'Registration failed, please try again!',
  usernamePlaceholderReg: 'Input your username',
  namePlaceholderReg: 'Input your name',
  mobilePlaceholderReg: 'Input your mobile number',
  emailPlaceholderReg: 'Input your email',
  genderPlaceholderReg: 'Select your gender',
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
  const [isRegistering, setIsRegistering] = useState(false);
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

  const handleLoginSubmit = async (values: API.LoginParams) => {
    try {
      const response = await login({ ...values });
      if (response.code === 2000) {
        message.success(loginText.loginSuccessMessage);
        setSessionToken(response.data?.access, response.data?.refresh, response.data?.access_expire_in);
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
        return;
      } else {
        clearSessionToken();
        setUserLoginState({ ...response, type: 'account' });
      }
    } catch (error) {
      message.error(loginText.loginFailureMessage);
    }
  };

  const handleRegisterSubmit = async (values: API.RegisterParams) => {
    try {
      const { confirmPassword, ...registerData } = values;
      const response = await register(registerData);
      if (response.code === 2000) {
        message.success(loginText.registrationSuccessMessage);
        setIsRegistering(false);
      } else {
        message.error(loginText.registrationFailureMessage);
      }
    } catch (error) {
      message.error(loginText.registrationFailureMessage);
    }
  };

  const { code } = userLoginState;

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
            maxWidth: '80vw-dd',
          }}
          title={loginText.title}
          subTitle={loginText.subTitle}
          initialValues={{
            autoLogin: true,
            gender: 0,
          }}
          // Add submitter to dynamically set button text
          submitter={{
            searchConfig: {
              submitText: isRegistering ? 'Register' : 'Login',
            },
          }}
          onFinish={async (values) => {
            if (isRegistering) {
              await handleRegisterSubmit(values as API.RegisterParams);
            } else {
              await handleLoginSubmit(values as API.LoginParams);
            }
          }}
        >
          {code !== 200 && !isRegistering && (
            <LoginMessage content={loginText.incorrectUsernamePassword} />
          )}

          {!isRegistering ? (
            <>
              <ProFormText
                name="email"
                label="Email" // Added label
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
                  {
                    type: 'email',
                    message: 'Invalid email address',
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                label="Password" // Added label
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
                  {
                    min: 6,
                    message: 'Password must be at least 6 characters',
                  },
                ]}
              />
            </>
          ) : (
            <>
              <ProFormText
                name="email"
                // label="Email" // Added label
                initialValue=""
                // fieldProps={{
                //   size: 'large',
                //   prefix: <UserOutlined />,
                // }}
                placeholder={loginText.emailPlaceholderReg}
                rules={[
                  {
                    required: true,
                    message: loginText.emailPlaceholderReg,
                  },
                  {
                    type: 'email',
                    message: 'Invalid email address',
                  },
                ]}
              />
              <ProFormText
                name="username"
                // label="Username" // Added label
                initialValue=""
                // fieldProps={{
                //   size: 'large',
                //   prefix: <UserOutlined />,
                // }}
                placeholder={loginText.usernamePlaceholderReg}
                rules={[
                  {
                    required: true,
                    message: loginText.usernamePlaceholderReg,
                  },
                ]}
              />
              <ProFormText
                name="name"
                // label="Name" // Added label
                initialValue=""
                // fieldProps={{
                //   size: 'large',
                // }}
                placeholder={loginText.namePlaceholderReg}
                rules={[
                  {
                    required: true,
                    message: loginText.namePlaceholderReg,
                  },
                ]}
              />
              <ProFormText
                name="mobile"
                // label="Mobile Number" // Added label
                initialValue=""
                // fieldProps={{
                //   size: 'large',
                // }}
                placeholder={loginText.mobilePlaceholderReg}
                rules={[
                  {
                    required: true,
                    message: 'Mobile number is required',
                  },
                  {
                    pattern: /^[0-9]{5,15}$/,
                    message: 'Mobile number must be 5 to 15 digits',
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                // label="Password" // Added label
                initialValue=""
                // fieldProps={{
                //   size: 'large',
                //   prefix: <LockOutlined />,
                // }}
                placeholder={loginText.passwordPlaceholder}
                rules={[
                  {
                    required: true,
                    message: loginText.passwordPlaceholder,
                  },
                  {
                    min: 6,
                    message: 'Password must be at least 6 characters',
                  },
                ]}
              />
              <ProFormText.Password
                name="confirmPassword"
                // label="Confirm Password" // Added label
                initialValue=""
                // fieldProps={{
                //   size: 'large',
                //   prefix: <LockOutlined />,
                // }}
                placeholder={loginText.confirmPasswordPlaceholder}
                rules={[
                  {
                    required: true,
                    message: loginText.confirmPasswordPlaceholder,
                  },
                  {
                    min: 6,
                    message: 'Confirm password must be at least 6 characters',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              />
              <ProFormRadio.Group
                name="gender"
                // label="Gender" // Added label
                // fieldProps={{
                //   size: 'large',
                // }}
                options={[
                  { label: 'Male', value: 0 },
                  { label: 'Female', value: 1 },
                ]}
                placeholder={loginText.genderPlaceholderReg}
                rules={[
                  {
                    required: true,
                    message: loginText.genderPlaceholderReg,
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
                cursor: 'pointer',
              }}
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? loginText.accountLoginTab : loginText.registerTab}
            </a>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
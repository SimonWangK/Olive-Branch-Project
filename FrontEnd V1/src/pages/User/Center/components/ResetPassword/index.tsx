import React from 'react';
import { Form, message } from 'antd';
import { updateUserPwd } from '@/services/system/user';
import { ProForm, ProFormText } from '@ant-design/pro-components';

const ResetPassword: React.FC = () => {
  const [form] = Form.useForm();

  const handleFinish = async (values: Record<string, any>) => {
    const resp = await updateUserPwd(values.oldPassword, values.newPassword);
    if (resp.code === 2000) {
      message.success('Password reset successful.');
    } else {
      message.warning(resp.msg);
    }
  };

  const checkPassword = (rule: any, value: string) => {
    const login_password = form.getFieldValue('newPassword');
    if (value === login_password) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('The two passwords do not match.'));
  };

  return (
    <>
      <ProForm form={form} onFinish={handleFinish}>
        <ProFormText.Password
          name="oldPassword"
          label="Old Password"
          width="xl"
          placeholder="Please enter your old password"
          rules={[
            {
              required: true,
              message: 'Please enter your old password!',
            },
          ]}
        />
        <ProFormText.Password
          name="newPassword"
          label="New Password"
          width="xl"
          placeholder="Please enter your new password"
          rules={[
            {
              required: true,
              message: 'Please enter your new password!',
            },
          ]}
        />
        <ProFormText.Password
          name="confirmPassword"
          label="Confirm Password"
          width="xl"
          placeholder="Please confirm your password"
          rules={[
            {
              required: true,
              message: 'Please confirm your password!',
            },
            { validator: checkPassword },
          ]}
        />
      </ProForm>
    </>
  );
};

export default ResetPassword;

import React from 'react';
import { Form, message } from 'antd';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { updateUserPassword } from '@/services/system/user';

const ResetPassword: React.FC = () => {
  const [form] = Form.useForm();

  const handleFinish = async (values: Record<string, any>) => {
    const { oldPassword, newPassword, confirmPassword } = values;

    // 
    if (newPassword !== confirmPassword) {
      message.error('New password and confirm password do not match');
      return;
    }

    // 
    const resp = await updateUserPassword({
      oldPassword,
      newPassword,
    });

    if (resp.code === 2000) {
      message.success('Password updated successfully');
      form.resetFields(); // 
    } else {
      message.error(resp.message || 'Failed to update password');
    }
  };

  return (
    <ProForm
      form={form}
      submitter={{
        searchConfig: {
          submitText: 'Submit',
          resetText: 'Reset',
        },
      }}
      onFinish={handleFinish}
    >
      <ProFormText.Password
        name="oldPassword"
        label="Old Password"
        width="xl"
        placeholder="Please enter old password"
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
        placeholder="Please enter new password"
        rules={[
          {
            required: true,
            message: 'Please enter your new password!',
          },
          {
            min: 6,
            message: 'Password must be at least 6 characters long!',
          },
        ]}
      />
      <ProFormText.Password
        name="confirmPassword"
        label="Confirm Password"
        width="xl"
        placeholder="Please confirm new password"
        rules={[
          {
            required: true,
            message: 'Please confirm your new password!',
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords do not match!'));
            },
          }),
        ]}
      />
    </ProForm>
  );
};

export default ResetPassword;
import React from 'react';
import { Form, message, Row } from 'antd';

import { ProForm, ProFormRadio, ProFormText } from '@ant-design/pro-components';
import { updateUserProfile } from '@/services/system/user';

import { getUserInfo } from '@/services/session'; // 引入 getUserInfo

// export type BaseInfoProps = {
//   values: Partial<API.CurrentUser> | undefined;
// };

// Internationalization variables
const InfoMessages = {
  userNickname: 'User Nickname',
  phoneNumber: 'Phone Number',
  email: 'Email',
  gender: 'Gender',
  invalidEmail: 'Invalid email address!',
  selectGender: 'Please select gender!',
  enterUserNickname: 'Please enter the user nickname!',
  enterPhoneNumber: 'Please enter the phone number!',
  enterEmail: 'Please enter the email!',
  updateSuccess: 'Update successful',
  updateWarning: 'Update failed, try again.',
};

export type BaseInfoProps = {
  values: Partial<API.CurrentUser> | undefined;
  setInitialState?: (state: any) => void; 
};

const BaseInfo: React.FC<BaseInfoProps> = ({ values, setInitialState }) => {
  const [form] = Form.useForm();

  const handleFinish = async (values: Record<string, any>) => {
    const resp = await updateUserProfile(values);
    if (resp.code === 2000) {
      message.success(InfoMessages.updateSuccess);

      // 
      const response = await getUserInfo({ skipErrorHandler: true });
      if (response.code === 2000 && response.detail) {
        const user = response.detail;
        const updatedUser = {
          userId: user.id,
          name: user.name,
          username: user.username,
          mobile: user.mobile,
          gender: user.gender,
          email: user.email,
          avatar: user.avatar || 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
          description: user.description,
        } as API.CurrentUser;

        // 
        if (setInitialState) {
          setInitialState((preInitialState: any) => ({
            ...preInitialState,
            currentUser: updatedUser,
          }));
        }

        // 
        form.setFieldsValue(updatedUser);
      } else {
        message.warning('Failed to fetch updated user info.');
      }
    } else {
      message.warning(InfoMessages.updateWarning);
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
      initialValues={values}
    >
      <Row>
        <ProFormText
          name="name"
          label={InfoMessages.userNickname}
          width="xl"
          placeholder={InfoMessages.enterUserNickname}
          rules={[
            {
              required: true,
              message: InfoMessages.enterUserNickname,
            },
          ]}
        />
      </Row>
      <Row>
        <ProFormText
          name="mobile"
          label={InfoMessages.phoneNumber}
          width="xl"
          placeholder={InfoMessages.enterPhoneNumber}
          rules={[
            {
              required: false,
              message: InfoMessages.enterPhoneNumber,
            },
          ]}
        />
      </Row>
      <Row>
        <ProFormText
          name="email"
          label={InfoMessages.email}
          width="xl"
          placeholder={InfoMessages.enterEmail}
          rules={[
            {
              type: 'email',
              message: InfoMessages.invalidEmail,
            },
            {
              required: false,
              message: InfoMessages.enterEmail,
            },
          ]}
        />
      </Row>
      <Row>
        <ProFormRadio.Group
          options={[
            { label: 'Male', value: 0 },
            { label: 'Female', value: 1 },
          ]}
          name="gender"
          label={InfoMessages.gender}
          width="xl"
          rules={[
            {
              required: false,
              message: InfoMessages.selectGender,
            },
          ]}
        />
      </Row>
    </ProForm>
  );
};

export default BaseInfo;

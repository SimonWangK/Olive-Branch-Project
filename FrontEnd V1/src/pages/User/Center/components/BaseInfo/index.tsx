import React from 'react';
import { Form, message, Row } from 'antd';

import { ProForm, ProFormRadio, ProFormText } from '@ant-design/pro-components';
import { updateUserProfile } from '@/services/system/user';

export type BaseInfoProps = {
  values: Partial<API.CurrentUser> | undefined;
};

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

const BaseInfo: React.FC<BaseInfoProps> = (props) => {
  const [form] = Form.useForm();


  const handleFinish = async (values: Record<string, any>) => {
    const resp = await updateUserProfile(values);  // Only submit modified fields
    if (resp.code === 2000) {
      message.success(InfoMessages.updateSuccess);
    } else {
      message.warning(InfoMessages.updateWarning);
    }
  };

  return (
    <>
      <ProForm form={form} onFinish={handleFinish} initialValues={props.values}>
        <Row>
          <ProFormText
            name="name"
            label={ InfoMessages.userNickname
            }
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
            label={ InfoMessages.phoneNumber
            }
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
              {
                label: 'Male',
                value: 0,
              },
              {
                label: 'Female',
                value: 1,
              },
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
    </>
  );
};

export default BaseInfo;

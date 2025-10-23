// src/pages/Center.tsx
import {
  ClusterOutlined,
  MailOutlined,
  TeamOutlined,
  UserOutlined,
  MobileOutlined,
  ManOutlined,
} from '@ant-design/icons';
import { Card, Col, Divider, List, Row, message } from 'antd';
import React, { useState } from 'react';
import styles from './Center.less';
import BaseInfo from './components/BaseInfo';
import ResetPassword from './components/ResetPassword';
import AvatarCropperForm from './components/AvatarCropper'; // 导入 AvatarCropperForm
import { useRequest } from '@umijs/max';
import { getUserInfo } from '@/services/session';
import { PageLoading } from '@ant-design/pro-components';
import { auth } from '@/utils/firebaseConfig'; // 导入 Firebase auth

const operationTabList = [
  {
    key: 'base',
    tab: <span>Basic Info</span>,
  },
  {
    key: 'password',
    tab: <span>Reset Password</span>,
  },
];

export type tabKeyType = 'base' | 'password';

const Center: React.FC = () => {
  const [tabKey, setTabKey] = useState<tabKeyType>('base');
  const [cropperModalOpen, setCropperModalOpen] = useState<boolean>(false);

  // Fetch user info
  const { data: userInfo, loading } = useRequest(async () => {
    const response = await getUserInfo();
    return { data: response.detail }; // Extract the nested user data
  });

  if (loading) {
    return <div>loading...</div>;
  }

  const currentUser = userInfo; // userInfo is now the user object

  // Internationalization variables
  const initMessages = {
    userName: 'Username',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    unknown: 'Unknown',
    phone: 'Phone',
    email: 'Email',
    defaultAvatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
    updateSuccess: 'Update successful',
    updateWarning: 'Update failed, try again.',
    baseInfoTab: 'Basic Info',
    resetPasswordTab: 'Reset Password',
    usernameLabel: 'Username',
    genderLabel: 'Gender',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
  };

  // Render user information
  const renderUserInfo = ({
    username,
    mobile,
    email,
    avatar,
    gender,
  }: Partial<API.CurrentUser>) => {
    return (
      <List>
        <List.Item>
          <div>
            <UserOutlined style={{ marginRight: 8 }} />
            {initMessages.usernameLabel}
          </div>
          <div>{username || 'N/A'}</div>
        </List.Item>
        <List.Item>
          <div>
            <ManOutlined style={{ marginRight: 8 }} />
            {initMessages.genderLabel}
          </div>
          <div>{gender === 1 ? initMessages.female : gender === 0 ? initMessages.male : initMessages.unknown}</div>
        </List.Item>
        <List.Item>
          <div>
            <MobileOutlined style={{ marginRight: 8 }} />
            {initMessages.phoneLabel}
          </div>
          <div>{mobile || 'N/A'}</div>
        </List.Item>
        <List.Item>
          <div>
            <MailOutlined style={{ marginRight: 8 }} />
            {initMessages.emailLabel}
          </div>
          <div>{email || 'N/A'}</div>
        </List.Item>
      </List>
    );
  };

  // Render tab content
  const renderChildrenByTabKey = (tabValue: tabKeyType) => {
    if (tabValue === 'base') {
      return <BaseInfo values={currentUser} />;
    }
    if (tabValue === 'password') {
      return <ResetPassword />;
    }
    return null;
  };

  // Check if user is logged in before allowing avatar click
  const handleAvatarClick = () => {

    setCropperModalOpen(true);
  };

  if (!currentUser) {
    return <PageLoading />;
  }

  return (
    <div>
      <Row gutter={[16, 24]}>
        <Col lg={8} md={24}>
          <Card title={initMessages.baseInfoTab} bordered={false} loading={loading}>
            {!loading && (
              <div style={{ textAlign: 'center' }}>
                <div
                  className={styles.avatarHolder}
                  onClick={handleAvatarClick} // 使用新的点击处理函数
                >
                  <img alt="" src={currentUser.avatar || initMessages.defaultAvatar} />
                </div>
                {renderUserInfo(currentUser)}
                <Divider dashed />
              </div>
            )}
          </Card>
        </Col>
        <Col lg={16} md={24}>
          <Card
            bordered={false}
            tabList={operationTabList}
            activeTabKey={tabKey}
            onTabChange={(_tabKey: string) => {
              setTabKey(_tabKey as tabKeyType);
            }}
          >
            {renderChildrenByTabKey(tabKey)}
          </Card>
        </Col>
      </Row>

      {/* 添加 AvatarCropperForm 组件 */}
      <AvatarCropperForm
        open={cropperModalOpen}
        onFinished={(isSuccess) => {
          setCropperModalOpen(false);
          if (isSuccess) {
            // 可选：刷新用户信息
            // 例如调用 useRequest 的 refresh 方法
          }
        }}
        data={{ userId: auth.currentUser?.uid, avatar: currentUser.avatar }}
      />
    </div>
  );
};

export default Center;
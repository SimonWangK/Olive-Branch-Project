import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { history, useModel } from '@umijs/max';
import { Avatar, Spin } from 'antd';
import { setAlpha } from '@ant-design/pro-components';
import { stringify } from 'querystring';
import type { MenuInfo } from 'rc-menu/lib/interface';
import React, { useCallback } from 'react';
import { flushSync } from 'react-dom';
import HeaderDropdown from '../HeaderDropdown';
import { setRemoteMenu } from '@/services/session';
import { PageEnum } from '@/enums/pagesEnums';
import { clearSessionToken } from '@/access';
// import { logout } from '@/services/system/auth';

export type GlobalHeaderRightProps = {
  menu?: boolean;
};

const Name = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};

  const nameClassName = useEmotionCss(({ token }) => {
    return {
      width: '70px',
      height: '48px',
      overflow: 'hidden',
      lineHeight: '48px',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      [`@media only screen and (max-width: ${token.screenMD}px)`]: {
        display: 'none',
      },
    };
  });

 // console.log('Name component - currentUser:', currentUser);
  return <span className={`${nameClassName} anticon`}>{currentUser?.name}</span>;
};

const AvatarLogo = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};

  const avatarClassName = useEmotionCss(({ token }) => {
    return {
      marginRight: '8px',
      color: token.colorPrimary,
      verticalAlign: 'top',
      background: setAlpha(token.colorBgContainer, 0.85),
      [`@media only screen and (max-width: ${token.screenMD}px)`]: {
        margin: 0,
      },
    };
  });
  
 // console.log('AvatarLogo component - currentUser avatar:', currentUser?.avatar);
  return <Avatar size="small" className={avatarClassName} src={currentUser?.avatar} alt="avatar" />;
};

const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({ menu }) => {
 // console.log('AvatarDropdown rendered - menu prop:', menu);

  const loginOut = async () => {
   // console.log('Logout function called');
    try {
      // await logout();
      clearSessionToken();
      setRemoteMenu(null);
      const { search, pathname } = window.location;
      const urlParams = new URL(window.location.href).searchParams;
      /** 此方法会跳转到 redirect 参数所在的位置 */
      const redirect = urlParams.get('redirect');
     // console.log('Logout - current pathname:', pathname, 'redirect:', redirect);
      // Note: There may be security issues, please note
      if (window.location.pathname !== PageEnum.LOGIN && !redirect) {
        history.replace({
          pathname: PageEnum.LOGIN,
          search: stringify({
            redirect: pathname + search,
          }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const actionClassName = useEmotionCss(({ token }) => {
    return {
      display: 'flex',
      height: '48px',
      marginLeft: 'auto',
      overflow: 'hidden',
      alignItems: 'center',
      padding: '0 8px',
      cursor: 'pointer',
      borderRadius: token.borderRadius,
      '&:hover': {
        backgroundColor: token.colorBgTextHover,
      },
    };
  });

  const { initialState, setInitialState } = useModel('@@initialState');
  //console.log('AvatarDropdown - initialState:', initialState);

  const onMenuClick = useCallback(
    (event: MenuInfo) => {
     // console.log('Menu clicked - event:', event);
      const { key } = event;
     // console.log('Menu clicked - key:', key);
      
      if (key === 'logout') {
        console.log('Logout menu item clicked');
        flushSync(() => {
          setInitialState((s) => ({ ...s, currentUser: undefined }));
        });
        loginOut();
        return;
      }
      
      console.log('Navigating to:', `/account/${key}`);
      history.push(`/account/${key}`);
    },
    [setInitialState],
  );

  const loading = (
    <span className={actionClassName}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  if (!initialState) {
   // console.log('No initialState, showing loading');
    return loading;
  }

  const { currentUser } = initialState;
  // console.log('Current user data:', currentUser);
  
  if (!currentUser || !currentUser.name) {
    // console.log('No currentUser or name, showing loading');
    return loading;
  }

  const menuItems = [
  
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Log Out',
    },
  ];

  // console.log('Menu items:', menuItems);
  // console.log('HeaderDropdown props:', {
  //   menu: {
  //     selectedKeys: [],
  //     onClick: onMenuClick,
  //     items: menuItems,
  //   }
  // });

  // 
  // const handleSpanClick = (e: React.MouseEvent) => {
  //   console.log('Span clicked:', e);
  //   console.log('Event target:', e.target);
  //   console.log('Event currentTarget:', e.currentTarget);
  // };

  return (
    <HeaderDropdown
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
      placement="bottomCenter"
    >
      <span className={actionClassName} >
        <AvatarLogo />
        <Name />
      </span>
    </HeaderDropdown>
  );
};

export default AvatarDropdown;
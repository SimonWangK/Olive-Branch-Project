import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
// import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import { clearSessionToken, getAccessToken, getRefreshToken, getTokenExpireTime } from './access';
import { getRemoteMenu, getRoutersInfo, getUserInfo, patchRouteWithRemoteMenus, setRemoteMenu } from './services/session';
import { PageEnum } from './enums/pagesEnums';


// const isDev = process.env.NODE_ENV === 'development';

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
const fetchUserInfo = async () => {
  try {
    const response = await getUserInfo({
      skipErrorHandler: true,
    });


    if (response.code !== 2000) {
      throw new Error(response.msg || 'failed');
    }


    const user = response?.detail  ;

    if (!user) {
      throw new Error('user data not found');
    }


    if (!user.avatar) {
      user.avatar = 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png';
    }


    return {
      userId: user.id,         
      name: user.name,
      username: user.username,
      mobile: user.mobile,
      gender: user.gender,
      email: user.email,
      avatar: user.avatar,
      description: user.description,
    } as API.CurrentUser;

  } catch (error) {
    console.error(error);
    history.push(PageEnum.LOGIN);
  }
  return undefined;
};


  const { location } = history;
  if (location.pathname !== PageEnum.LOGIN) {
    const currentUser = await fetchUserInfo();
    return {  
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout  https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    rightContentRender: () => <RightContent />,
    waterMarkProps: {
      // content: initialState?.currentUser?.nickName,
    },

    menu: {
      locale: false,

      params: {
        userId: initialState?.currentUser?.userId,
      },
      request: async () => {
        if (!initialState?.currentUser?.userId) {
          return [];
        }
        // console.log('get menus')
        // initialState.currentUser 
        // console.log('get routers')
        // setInitialState((preInitialState) => ({
        //   ...preInitialState,
        //   menus,
        // }));
        return getRemoteMenu();
      },
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      // const { location } = history;

      // if (!initialState?.currentUser && location.pathname !== PageEnum.LOGIN) {
      //   history.push(PageEnum.LOGIN);
      // }
    },
    layoutBgImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],

    childrenRender: (children) => {
      return (
        <>
          {children}
          <SettingDrawer
            disableUrlParams
            enableDarkTheme
            settings={initialState?.settings}
            onSettingChange={(settings) => {
              setInitialState((preInitialState) => ({
                ...preInitialState,
                settings,
              }));
            }}
          />
        </>
      );
    },
    ...initialState?.settings,
  };
};

export async function onRouteChange({ clientRoutes, location }) {
  const menus = getRemoteMenu();
 // console.log('onRouteChange', clientRoutes, location, menus);
  if(menus === null && location.pathname !== PageEnum.LOGIN) {
    console.log('refresh')
    history.go(0);
  }
}


export async function patchClientRoutes({ routes }) {
  // console.log('patchClientRoutes', routes);
  patchRouteWithRemoteMenus(routes);
}

export function render(oldRender: () => void) {
  // console.log('render get routers', oldRender)
  const token = getAccessToken();
  if(!token || token?.length === 0) {
    oldRender();
    return;
  }
  getRoutersInfo().then(res => {
    setRemoteMenu(res);
    oldRender()
  });
}


const checkRegion = 5 * 60 * 1000;

export const request = {
  baseURL: 'http://127.0.0.1:3000/',
  ...errorConfig,
  requestInterceptors: [
    (url: any, options: { headers: any }) => {
      const headers = options.headers ? options.headers : [];
      // console.log('request ====>:', url);
      const authHeader = headers['Authorization'];
      const isToken = headers['isToken'];
      if (!authHeader && isToken !== false) {
        const expireTime = getTokenExpireTime();
        if (expireTime) {
          const left = Number(expireTime) - new Date().getTime();
          const refreshToken = getRefreshToken();
          if (left < checkRegion && refreshToken) {
            if (left < 0) {
              clearSessionToken();
            }
          } else {
            const accessToken = getAccessToken();
            if (accessToken) {
              headers['Authorization'] = `JWT ${accessToken}`;
            }
          }
        } else {
          clearSessionToken();
        }
      }
      return { url, options };
    },
  ],
  responseInterceptors: [
    // (response) =>
    // {
    //  
    //   // const { data = {} as any, config } = response;
    //   // // do something
    //   // console.log('data: ', data)
    //   // console.log('config: ', config)
    //   return response
    // },
  ],
};

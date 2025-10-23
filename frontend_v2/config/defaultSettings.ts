import { ProLayoutProps } from '@ant-design/pro-components';
// import logo from "../logo.png";
/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#1890ff',
  layout: 'mix',
   splitMenus: true,  // side close
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: false,
  // splitMenus: false,
  colorWeak: false,
  title: 'Olive Branch',
  pwa: true,
  logo: "https://i.postimg.cc/RCbb5bmt/logo.png",
  iconfontUrl: '',  
  locale: 'en-US', 

  token: {

  },
};

export default Settings;

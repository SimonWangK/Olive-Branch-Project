// https://umijs.org/config/
import { defineConfig } from '@umijs/max';
import { join } from 'path';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const { REACT_APP_ENV = 'dev' } = process.env;

export default defineConfig({
  /**
   * @name Enable hash mode
   * @description Include hash suffixes in the build output files, usually used for incremental releases and to avoid browser cache loading.
   * @doc https://umijs.org/docs/api/config#hash
   */
  hash: true,

  /**
   * @name Compatibility settings
   * @description Setting for IE11 compatibility, though it may not work perfectly, so you need to check all your dependencies.
   * @doc https://umijs.org/docs/api/config#targets
   */
  // targets: {
  //   ie: 11,
  // },

  /**
   * @name Routes configuration
   * @description Only files that are included in the routes will be compiled.
   * @doc https://umijs.org/docs/guides/routes
   */
  // umi routes: https://umijs.org/docs/routing
  routes,

  /**
   * @name Theme configuration
   * @description While it's called theme, it’s actually just a setting of less variables.
   * @doc antd theme settings https://ant.design/docs/react/customize-theme-cn
   * @doc umi theme configuration https://umijs.org/docs/api/config#theme
   */
  theme: {
    // If you don't want dynamic theme setting with configProvide, set this to 'default'.
    // Only by setting to 'variable', can you dynamically set the primary color using configProvide.
    'root-entry-name': 'variable',
  },

  /**
   * @name Moment internationalization configuration
   * @description If internationalization is not required, enabling this can reduce the JavaScript bundle size.
   * @doc https://umijs.org/docs/api/config#ignoremomentlocale
   */
  ignoreMomentLocale: true,

  /**
   * @name Proxy configuration
   * @description Allows your local server to proxy requests to your server, so you can access server data.
   * @see Note that this proxy configuration can only be used in local development; it won’t work after build.
   * @doc Proxy introduction https://umijs.org/docs/guides/proxy
   * @doc Proxy configuration https://umijs.org/docs/api/config#proxy
   */
  proxy: proxy[REACT_APP_ENV as keyof typeof proxy],

  /**
   * @name Fast refresh configuration
   * @description A great hot-reload feature that keeps state while updating.
   */
  fastRefresh: true,

  //============== The following are max plugin configurations ===============
  /**
   * @name Data flow plugin
   * @doc https://umijs.org/docs/max/data-flow
   */
  model: {},

  /**
   * A global initial data flow, which can be used to share data between plugins.
   * @description It can be used to store some global data, such as user information or other global states, which are initialized at the beginning of the Umi project.
   * @doc https://umijs.org/docs/max/data-flow#%E5%85%A8%E5%B1%80%E5%88%9D%E5%A7%8B%E7%8A%B6%E6%80%81
   */
  initialState: {},

  /**
   * @name Layout plugin
   * @doc https://umijs.org/docs/max/layout-menu
   */
  title: 'Olive Branch',
  layout: {
    // locale: false,
      locale: 'en-US', 
    ...defaultSettings,
  },
  // keepalive: [/./],
  // tabsLayout: {},

  /**
   * @name Moment2Dayjs plugin
   * @description Replaces moment with dayjs in the project.
   * @doc https://umijs.org/docs/max/moment2dayjs
   */
  moment2dayjs: {
    preset: 'antd',
    plugins: ['duration'],
  },

  /**
   * @name Internationalization plugin
   * @doc https://umijs.org/docs/max/i18n
   */
  locale: {
    // default zh-CN
    default: 'en-US',
    antd: true,
    // default true, when it is true, will use navigator.language to overwrite the default
    baseNavigator: false,
  },

  /**
   * @name Ant Design plugin
   * @description Built-in babel import plugin
   * @doc https://umijs.org/docs/max/antd#antd
   */
  antd: {},

  /**
   * @name Network request configuration
   * @description It provides a unified network request and error handling scheme based on axios and the useRequest from ahooks.
   * @doc https://umijs.org/docs/max/request
   */
  request: {
    // baseURL: API_MAP[REACT_APP_ENV as keyof typeof API_MAP], // 👈 Direct connection to production environment
    // dataField: 'data', // Only take the 'data' field from the backend response
  },

  /**
   * @name Access plugin
   * @description Permission plugin based on initialState, must be enabled first.
   * @doc https://umijs.org/docs/max/access
   */
  access: {},

  /**
   * @name Additional scripts in <head>
   * @description Configure additional scripts to be added in <head>
   */
  headScripts: [
    // Resolves the issue of a white screen during the initial load
    { src: '/scripts/loading.js', async: true },
  ],

  //================ Pro plugin configuration =================
  presets: ['umi-presets-pro'],

  /**
   * @name OpenAPI plugin configuration
   * @description Based on the OpenAPI specification to generate serve and mock, reducing boilerplate code.
   * @doc https://pro.ant.design/zh-cn/docs/openapi/
   */
  openAPI: [
    {
      requestLibPath: "import { request } from '@umijs/max'",
      // Or use the online version
      // schemaPath: "https://gw.alipayobjects.com/os/antfincdn/M%24jrzTTYJN/oneapi.json"
      schemaPath: join(__dirname, 'oneapi.json'),
      mock: false,
    },
    {
      requestLibPath: "import { request } from '@umijs/max'",
      schemaPath: 'https://gw.alipayobjects.com/os/antfincdn/CA1dOm%2631B/openapi.json',
      projectName: 'swagger',
    },
  ],

  mfsu: {
    strategy: 'normal',
  },

  requestRecord: {},

  publicPath: '/',
});

/**
 * @name Umi Router Configuration
 * @description Supports only path, component, routes, redirect, wrappers, name, and icon configurations
 * @param path  Path supports two types of placeholder configurations: the first is the dynamic parameter in the form of :id, and the second is the wildcard *, which can only appear at the end of the route string.
 * @param component  Configures the React component path to render after matching location and path. It can be an absolute path or a relative path. If it's a relative path, it will start from `src/pages`.
 * @param routes  Configures child routes, typically used when adding a layout component to multiple paths.
 * @param redirect  Configures route redirection.
 * @param wrappers  Configures wrapper components for route components. By using wrapper components, more functionalities can be added to the current route component. For example, it can be used for route-level permission checks.
 * @param name  Configures the route title. By default, it reads the value from the internationalization file `menu.ts` (e.g., `menu.xxx`), such as setting the name to "login", which will read `menu.login` for the title.
 * @param icon  Configures the route icon. Values refer to https://ant.design/components/icon-cn. Note to remove style suffixes and case sensitivity. For example, to use the `<StepBackwardOutlined />` icon, set the value as `stepBackward` or `StepBackward`, and for the `<UserOutlined />` icon, set it as `user` or `User`.
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/',
    redirect: '/system/dashboard',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './User/Login',
      },
      {
        name: 'settings',
        path: '/user/settings',
        component: './User/Settings',
      },
    ],
  },
  {
    path: '/account',
    routes: [
      {
        name: 'acenter',
        path: '/account/center',
        component: './User/Center',
      },
    ],
  },
  {
    name: 'system',
    path: '/system',
    routes: [
      {
        name: 'Dashboard',
        path: '/system/dashboard',
        component: './System/Dashboard',
      },
      {
        name: 'Case Management',
        path: '/system/case',
        component: './System/Case',
      },
      {
        name: 'Case Detail',
        path: '/system/case/detail/:case_num',
        component: './System/CaseDetail', // The detail page path
      },

    ]
  },
];

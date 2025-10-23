// src/services/session.ts
import { createIcon } from '@/utils/IconUtil';
import { MenuDataItem } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import React, { lazy } from 'react';
import { staticMenuData, ApiResponse, NewMenuDataItem } from '@/data/staticMenuData';

interface UserInfo {
  id: string;
  username: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  status: number;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  roles?: string[];
  permissions?: string[];
  dept_id?: string;
  dept_name?: string;
}

interface UserInfoResponse {
  code: number;
  data: UserInfo;
  message?: string;
}

let remoteMenu: any = null;

export function getRemoteMenu() {
  return remoteMenu;
}

export function setRemoteMenu(data: any) {
  remoteMenu = data;
}

function patchRouteItems(route: any, menu: any, parentPath: string) {
  for (const menuItem of menu) {
    if (menuItem.component === 'Layout' || menuItem.component === 'ParentView') {
      if (menuItem.routes || menuItem.children) {
        let hasItem = false;
        let newItem = null;
        for (const routeChild of route.routes) {
          if (routeChild.path === menuItem.path) {
            hasItem = true;
            newItem = routeChild;
          }
        }
        if (!hasItem) {
          newItem = {
            path: menuItem.path,
            routes: [],
            children: [],
          };
          route.routes.push(newItem);
        }
        const childRoutes = menuItem.routes || menuItem.children;
        if (childRoutes) {
          patchRouteItems(newItem, childRoutes, parentPath + menuItem.path + '/');
        }
      }
    } else {
      let componentPath = '';
      if (menuItem.component && menuItem.component.trim() !== '') {
        const names: string[] = menuItem.component.split('/');
        names.forEach(name => {
          if (componentPath.length > 0) {
            componentPath += '/';
          }
          if (name !== 'index') {
            componentPath += name.charAt(0).toUpperCase() + name.slice(1);
          } else {
            componentPath += name;
          }
        });
      } else {
        const pathToUse = menuItem.path || menuItem.web_path || '';
        if (pathToUse) {
          const segments = pathToUse.split(/(?=[A-Z])/).map(segment =>
            segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
          );
          componentPath = segments.join('/');
        }
      }

      if (componentPath && !componentPath.endsWith('.tsx')) {
        componentPath += '.tsx';
      }

      if (!componentPath) {
        console.warn(`Menu item ${menuItem.name || menuItem.title} has no valid component path`);
        continue;
      }

      if (route.routes === undefined) {
        route.routes = [];
      }
      if (route.children === undefined) {
        route.children = [];
      }

      const newRoute = {
        element: React.createElement(lazy(() => import(`@/pages/${componentPath}`))),
        path: parentPath + (menuItem.path || menuItem.web_path),
      };
      route.children.push(newRoute);
      route.routes.push(newRoute);
    }
  }
}

export function patchRouteWithRemoteMenus(routes: any) {
  if (remoteMenu === null) {
    return;
  }
  let proLayout = null;
  for (const routeItem of routes) {
    if (routeItem.id === 'ant-design-pro-layout') {
      proLayout = routeItem;
      break;
    }
  }
  patchRouteItems(proLayout, remoteMenu, '');
}

export async function getUserInfo(options?: Record<string, any>): Promise<UserInfoResponse> {
  return request<UserInfoResponse>('/api/auth/user_info/', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function refreshToken() {
  return request('/api/auth/refresh', {
    method: 'post',
  });
}

function buildMenuTree(flatMenus: NewMenuDataItem[]): NewMenuDataItem[] {
  const menuMap = new Map<string, NewMenuDataItem & { children?: NewMenuDataItem[] }>();
  const rootMenus: (NewMenuDataItem & { children?: NewMenuDataItem[] })[] = [];

  flatMenus.forEach(menu => {
    menuMap.set(menu.id, { ...menu, children: [] });
  });

  flatMenus.forEach(menu => {
    const menuItem = menuMap.get(menu.id)!;
    if (menu.parent) {
      const parent = menuMap.get(menu.parent);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(menuItem);
      }
    } else {
      rootMenus.push(menuItem);
    }
  });

  return rootMenus;
}

export function convertNewMenuFormat(menuItems: NewMenuDataItem[]): any[] {
  return menuItems.map((item: NewMenuDataItem) => {
    let componentPath = '';
    if (item.web_path) {
      const pathSegments = item.web_path.split(/(?=[A-Z])/).map(segment =>
        segment.toLowerCase()
      );
      componentPath = pathSegments.join('/');
    }

    return {
      path: item.path || item.web_path,
      icon: createIcon(item.icon),
      name: item.title || item.name,
      routes: item.children ? convertNewMenuFormat(item.children) : undefined,
      hideChildrenInMenu: item.visible === 0,
      hideInMenu: item.visible === 0,
      component: componentPath || item.component,
      authority: item.menuPermission,
      children: item.children ? convertNewMenuFormat(item.children) : undefined,
    };
  });
}

export async function getRoutersInfo(): Promise<MenuDataItem[]> {
  const res: ApiResponse = staticMenuData;
  if (res.code === 2000 && res.data?.data) {
    const treeMenus = buildMenuTree(res.data.data);
    return convertNewMenuFormat(treeMenus);
  }
  return [];
}

export function getMatchMenuItem(
  path: string,
  menuData: MenuDataItem[] | undefined,
): MenuDataItem[] {
  if (!menuData) return [];
  let items: MenuDataItem[] = [];
  menuData.forEach((item) => {
    if (item.path) {
      if (item.path === path) {
        items.push(item);
        return;
      }
      if (path.length >= item.path.length) {
        const exp = `${item.path}/*`;
        if (path.match(exp)) {
          if (item.routes) {
            const subpath = path.substr(item.path.length + 1);
            const subItem: MenuDataItem[] = getMatchMenuItem(subpath, item.routes);
            items = items.concat(subItem);
          } else {
            const paths = path.split('/');
            if (paths.length >= 2 && paths[0] === item.path && paths[1] === 'index') {
              items.push(item);
            }
          }
        }
      }
    }
  });
  return items;
}
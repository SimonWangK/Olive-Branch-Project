// src/data/staticMenuData.ts
export interface NewMenuDataItem {
  id: number;

  path: string | null;
  title: string;

  name: string;
  sort: number;
  is_link: number;
  web_path: string | null;


}

export interface ApiResponse {
  code: number;
  data: {
    page: number;
    limit: number;
    total: number;
    data: NewMenuDataItem[];
  };
  msg?: string;
}

export const staticMenuData: ApiResponse = {
  code: 2000,
  data: {
    page: 1,
    limit: 1,
    total: 1,
    data: [
      {
        id: 1,

        path: "system/dashboard",
        title: "DashBoard",


        name: "DashBoard",
        sort: 1,
        is_link: 0,
        web_path: "system/dashboard",

      },

      {
        id: 2,

        path: "/system/case",
        title: "case manage",
  
        name: "case manage",
        sort: 10,
        is_link: 0,
        web_path: "/system/case",

      },

      {
        id: 3,

        path: "account/center",
        title: "personal center",

        name: "personal center",
        sort: 99,
        is_link: 0,
        web_path: "account/center",

      },
    ],
  },
  msg: "SUCCESS",
};
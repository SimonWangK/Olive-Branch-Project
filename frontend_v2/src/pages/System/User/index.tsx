import React, { useState, useRef } from "react";
import { Button, message, Modal } from "antd";
import { ActionType, FooterToolbar, PageContainer, ProColumns, ProTable } from "@ant-design/pro-components";
import { PlusOutlined, DeleteOutlined, UserAddOutlined, EditOutlined } from "@ant-design/icons";
import { getUserList } from "@/services/system/user"; //
// import { history } from 'umi';
import AddForm from './add';
import {addUser,removeUser} from '@/services/system/user';
// import { curry } from "lodash";

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  mobile?: string;
  gender?: number;
  case_count: number;
  task_count: number;
  time_entry_count: number;
  created_at: string;
}

const UserTableList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<User[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const columns: ProColumns<User>[] = [
    {
      title: "Name",
      dataIndex: "name",
      valueType: "text",
      // width: 120,
    },
    {
      title: "Username",
      dataIndex: "username",
      valueType: "text",
      // width: 120,
    },
    {
      title: "Email",
      dataIndex: "email",
      valueType: "text",
      // width: 180,
    },
    {
      title: "Role",
      dataIndex: "role",
      valueType: "select",
      valueEnum: {
        admin: { text: "Admin", status: "Success" },
        staff: { text: "Staff", status: "Processing" },
        viewer: { text: "Viewer", status: "Default" },
      },
      // width: 100,
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      valueType: "text",
      // width: 120,
    },
    {
      title: "Gender",
      dataIndex: "gender",
      valueType: "select",
      valueEnum: {
        0: { text: "Male", status: "Default" },
        1: { text: "Female", status: "Default" },
      },
      // width: 80,
    },
    {
      title: "Cases",
      dataIndex: "case_count",
      valueType: "digit",
      // width: 80,
    },
    {
      title: "Tasks",
      dataIndex: "task_count",
      valueType: "digit",
      // width: 80,
    },
    {
      title: "Time Entries",
      dataIndex: "time_entry_count",
      valueType: "digit",
      // width: 100,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      valueType: "dateTime",
      // width: 140,
    },
    {
        title: "Action",
        dataIndex: "option",
        valueType: "option",
        width: 120,
        fixed: "right",
        render: (_, record) => [
          <Button
            type="link"
            size="small"
            danger
            key="remove"
            onClick={() => {
              Modal.confirm({
                title: "Delete Confirm",
                content: `Confirm delete "${record.name}"?`,
                okText: "Confirm",
                cancelText: "Cancel",
                onOk: async () => {
                  const success = await handleRemove(record); // Pass single user record
                  if (success) actionRef.current?.reload();
                },
              });
            }}
          >
            Delete
          </Button>,
        ],
      },
  ];

    const onCancel = () => {
      setAddModalVisible(false);
    };

    const handleRemove = async (user: User) => {
      const hide = message.loading("Deleting...");
      try {
        const response = await removeUser(user.id);
        hide();
        if (response.code === 2000) {
          message.success("User deleted successfully");
          setSelectedRows([]);
          actionRef.current?.reloadAndRest?.();
          return true;
        } else {
          message.error(response.message || "Failed to delete user");
          return false;
        }
      } catch (error) {
        hide();
        message.error("Failed to delete user, please try again");
        return false;
      }
    };



    const handleAdd = async (fields: FormData) => {
      const hide = message.loading("adding");
      try {
        const response = await addUser(fields);
        if (response.code === 2000) {
          message.success("added success");
          hide();
          onCancel();
          actionRef.current?.reload();
          return true;
        } else {
          message.error(response.msg || "submit failed");
        }
      } catch (error) {
        hide();
        message.error("form submit failed");
        return false;
      }
    };



  return (
    <PageContainer
      header={{
        title: "User Management",
        // breadcrumb: { routes: [{ path: "", breadcrumbName: "User List" }] },
      }}
    >
      <ProTable<User>
        headerTitle="User List"
        actionRef={actionRef}
        search={false}
        rowKey="id"
        scroll={{ x: 'max-content' }}
   
        options={{ search: false, density: true, fullScreen: true, reload: true }}
        request={async (params, sorter, filter) => {
          try {

            const filters = {
              name: filter.name?.[0] || params.name,
              email: filter.email?.[0] || params.email,
              role: filter.role?.[0] || params.role,
            };

            const response = await getUserList( {
              skip: (params.current! - 1) * (params.pageSize! || 10),
              take: params.pageSize! || 10, },
              filters 
            );
            if (response.code === 2000 && response.details) {
              return {
                data: response.details || [],
                total: response.pagination.total || 0,
                success: true,
              };
            }
            return {
              data: [],
              total: 0,
              success: false,
            };
          } catch (error) {
            console.error("Failed to fetch user list:", error);
            message.error("Failed to fetch user list");
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              setAddModalVisible(true)
            }}
          >
            New User
          </Button>,
        ]}
      />
      {selectedRows.length > 0 && (
        <FooterToolbar

        >

        </FooterToolbar>
      )}


        <AddForm
          visible={addModalVisible}
          onCancel={onCancel}
          onSubmit={handleAdd}
        />
    </PageContainer>
  );
};

export default UserTableList;
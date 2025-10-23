import React, { useState, useRef } from 'react';
import { Button, message, Modal } from 'antd';
import { ActionType, FooterToolbar, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getComplianceTemplateList,
  addComplianceTemplate,

  removeComplianceTemplate,

} from '@/services/system/compliance_template';
import AddComplianceTemplateForm from './add';

interface ComplianceTemplate {
  id: number;
  case_type: string;
  jurisdiction: string;
  title: string;
  mandatory: boolean;
  due_days: number;
  created_at: string;
}

const ComplianceTemplateTableList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<ComplianceTemplate[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ComplianceTemplate | null>(null);

  const columns: ProColumns<ComplianceTemplate>[] = [
    {
      title: 'Case Type',
      dataIndex: 'case_type',
      valueType: 'text',
      filters: [
        { text: 'Bankruptcy', value: 'BANKRUPTCY' },
        { text: 'Liquidation', value: 'LIQUIDATION' },
        { text: 'Restructuring', value: 'RESTRUCTURING' },
      ],
    },
    {
      title: 'Jurisdiction',
      dataIndex: 'jurisdiction',
      valueType: 'text',
      filters: [
        { text: 'New York', value: 'NY' },
        { text: 'California', value: 'CA' },
      ],
    },
    {
      title: 'Title',
      dataIndex: 'title',
      valueType: 'text',
    },
    {
      title: 'Mandatory',
      dataIndex: 'mandatory',
      valueType: 'select',
      valueEnum: {
        true: { text: 'Yes', status: 'Success' },
        false: { text: 'No', status: 'Default' },
      },
    },
    {
      title: 'Due Days',
      dataIndex: 'due_days',
      valueType: 'digit',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      valueType: 'dateTime',
    },
    {
      title: 'Action',
      dataIndex: 'option',
      valueType: 'option',
      fixed: 'right',
      render: (_, record) => [

        <Button
          type="link"
          danger
          key="delete"
          onClick={() => {
            Modal.confirm({
              title: 'Delete Confirm',
              content: `Confirm delete "${record.title}"?`,
              okText: 'Confirm',
              cancelText: 'Cancel',
              onOk: async () => {
                const success = await handleRemove(record);
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

  const handleAdd = async (values: ComplianceTemplate) => {
    const hide = message.loading('Adding...');
    if (values.due_days) {
      values.due_days = Number(values.due_days); // Ensure due_days is a number
    }
    try {
      const response = await addComplianceTemplate(values);
      hide();
      if (response.code === 2000) {
        message.success('Template added successfully');
        setAddModalVisible(false);
        actionRef.current?.reload();
        return true;
      } else {
        message.error(response.message || 'Failed to add template');
        return false;
      }
    } catch (error: any) {
      hide();
      if (error.response?.data?.code === 'DUPLICATE_TEMPLATE') {
        message.error('A template with this case type, jurisdiction, and title already exists');
      } else {
        message.error('Failed to add template, please try again');
      }
      return false;
    }
  };



  const handleRemove = async (record: ComplianceTemplate) => {
    const hide = message.loading('Deleting...');
    try {
      const response = await removeComplianceTemplate(record.id);
      hide();
      if (response.code === 2000) {
        message.success('Template deleted successfully');
        setSelectedRows([]);
        actionRef.current?.reloadAndRest?.();
        return true;
      } else {
        message.error(response.message || 'Failed to delete template');
        return false;
      }
    } catch (error: any) {
      hide();
      if (error.response?.data?.code === 'TEMPLATE_NOT_FOUND') {
        message.error('Template not found');
      } else {
        message.error('Failed to delete template, please try again');
      }
      return false;
    }
  };


  return (
    <PageContainer
      header={{
        title: 'Compliance Template Management',
      }}
    >
      <ProTable<ComplianceTemplate>
        headerTitle="Compliance Template List"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        search={false}
        options={{ search: false, density: true, fullScreen: true, reload: true }}
        request={async (params, sorter, filter) => {
          try {
            const filters = {
              case_type: filter.case_type?.[0] || params.case_type,
              jurisdiction: filter.jurisdiction?.[0] || params.jurisdiction,
            };

            const response = await getComplianceTemplateList(
              {
                skip: (params.current! - 1) * (params.pageSize! || 10),
                take: params.pageSize! || 10,
              },
              filters
            );

            if (response.code === 2000) {
              return {
                data: response.data || [],
                total: response.pagination?.totalCount || 0,
                success: true,
              };
            }
            return {
              data: [],
              total: 0,
              success: false,
            };
          } catch (error) {
            console.error('Failed to fetch compliance template list:', error);
            message.error('Failed to fetch compliance template list');
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
            key="add"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
          >
            New Template
          </Button>,

        ]}
      />
      {selectedRows.length > 0 && (
        <FooterToolbar>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Delete Selected Templates',
                content: `Confirm delete ${selectedRows.length} selected template(s)?`,
                okText: 'Confirm',
                cancelText: 'Cancel',
                onOk: async () => {
                  const promises = selectedRows.map((row) => handleRemove(row));
                  const results = await Promise.all(promises);
                  if (results.every((r) => r)) {
                    actionRef.current?.reloadAndRest?.();
                  }
                },
              });
            }}
          >
            Delete Selected
          </Button>
        </FooterToolbar>
      )}
      <AddComplianceTemplateForm
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onSubmit={handleAdd}
      />
      {/* <AddComplianceTemplateForm
        visible={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentRecord(null);
        }}
        onSubmit={handleUpdate}
        initialValues={currentRecord}
      /> */}
    </PageContainer>
  );
};

export default ComplianceTemplateTableList;
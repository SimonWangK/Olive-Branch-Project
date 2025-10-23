// src/pages/system/case/list.tsx
import React, { useState, useRef } from 'react';
import { Button, message, Modal } from 'antd';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { getCaseList, closeCase } from '@/services/system/case';
import TaskModal from './task_modal';
import ComplianceModal from './compliance_modal';
import AddCaseForm from './add';
import EditCaseForm from './edit';
import BillModal from './bill_modal';
import { useNavigate } from 'react-router-dom';

interface Case {
  id: number;
  case_num: string;
  case_type: string;
  jurisdiction: string;
  description: string;
  status: string;
  opened_at: string;
  target_close: string;
  updated_at: string;
  version: number;
  user?: { id: number };
}

const CaseTableList: React.FC = () => {
  const navigate = useNavigate();
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<Case[]>([]);
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [taskModalVisible, setTaskModalVisible] = useState<boolean>(false);
  const [complianceModalVisible, setComplianceModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [billModalVisible, setBillModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<Case | undefined>();

  const handleCloseCase = async (caseId: number) => {
    try {
      const response = await closeCase(caseId);
      message.success('Case closed successfully');
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.error('Cannot close case: Mandatory compliance items incomplete or balance due');
      } else if (error.response?.status === 404) {
        message.error('Case not found');
      } else {
        message.error('Failed to close case');
      }
      return false;
    }
  };

  const onCancel = () => {
    setTaskModalVisible(false);
    setComplianceModalVisible(false);
    setEditModalVisible(false);
    setBillModalVisible(false);
  };

  const handleAddCaseSuccess = () => {
    actionRef.current?.reload();
  };

  const handleEditCaseSuccess = () => {
    actionRef.current?.reload();
  };

  const columns: ProColumns<Case>[] = [
    {
      title: 'Case Number',
      dataIndex: 'case_num',
      valueType: 'text',

      hideInTable: false,
      render: (_, record) => (
        <a
          onClick={() => {
            navigate(`/system/case/detail/${record.id}`);
          }}
        >
          {record.case_num}
        </a>
      ),
    },
    {
      title: 'Case Type',
      dataIndex: 'case_type',
      valueType: 'text',

      hideInTable: false,
    },
    {
      title: 'Jurisdiction',
      dataIndex: 'jurisdiction',
      valueType: 'text',

      hideInTable: false,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      valueType: 'text',
      ellipsis: true,
  
      hideInSearch: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      valueType: 'text',

      hideInSearch: true,
      render: (text) => {
        const colors: Record<string, string> = {
          ACTIVE: '#52c41a',
          ON_HOLD: '#faad14',
          CLOSED: '#999',
        };
        return <span style={{ color: colors[text as string] || '#000' }}>{text}</span>;
      },
    },
    {
      title: 'Opened At',
      dataIndex: 'opened_at',
      valueType: 'dateTime',

      hideInSearch: true,
    },
    {
      title: 'Target Close',
      dataIndex: 'target_close',
      valueType: 'dateTime',

      hideInSearch: true,
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      valueType: 'dateTime',
      
      hideInSearch: true,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      valueType: 'text',
      width: 80,

      hideInSearch: true,
    },
    {
      title: 'Action',
      dataIndex: 'option',
      valueType: 'option',
      fixed: 'right',
      width: 300,

      hideInSearch: true,
      render: (_, record) => [
        <Button
          type="link"
          key="edit"
          size="small"
          onClick={() => {
            setCurrentRow(record);
            setEditModalVisible(true);
          }}
        >
          Edit
        </Button>,
        <Button
          type="link"
          key="compliance"
          size="small"
          onClick={() => {
            setCurrentRow(record);
            setComplianceModalVisible(true);
          }}
        >
          Compliance
        </Button>,
        <Button
          type="link"
          key="task"
          size="small"
          onClick={() => {
            setCurrentRow(record);
            setTaskModalVisible(true);
          }}
        >
          Task
        </Button>,
        <Button
          type="link"
          key="bill"
          size="small"
          onClick={() => {
            setCurrentRow(record);
            setBillModalVisible(true);
          }}
        >
          Bill
        </Button>,
        <Button
          type="link"
          danger
          key="close"
          size="small"
          disabled={record.status === 'CLOSED'}
          onClick={() => {
            Modal.confirm({
              title: 'Close Case',
              content: `Are you sure you want to close case "${record.case_num}"?`,
              okText: 'Confirm',
              cancelText: 'Cancel',
              onOk: async () => {
                const success = await handleCloseCase(record.id);
                if (success) {
                  actionRef.current?.reload();
                }
              },
            });
          }}
        >
          Close
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<Case>
        headerTitle="Case List"
        actionRef={actionRef}
        search={{
          labelWidth: 120,

          // collapsed: false,
        }}
        rowKey="case_num"
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          try {

            const filterParams = {
              current: params.current,
              pageSize: params.pageSize,
              case_num: params.case_num,
              case_type: params.case_type,
              jurisdiction: params.jurisdiction,
            };
            
            const response = await getCaseList(filterParams);
            return {
              data: response.details || [],
              total: response.pagination?.total || 0,
              success: true,
            };
          } catch (error) {
            console.error('Failed to fetch case list:', error);
            message.error('Failed to fetch case list');
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
            icon={<PlusOutlined />}
            onClick={() => {
              setAddModalVisible(true);
            }}
          >
            New Case
          </Button>,
        ]}
      />

      <AddCaseForm
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onSuccess={handleAddCaseSuccess}
      />

      <EditCaseForm
        visible={editModalVisible}
        currentRow={currentRow}
        onCancel={onCancel}
        onSuccess={handleEditCaseSuccess}
      />

      <TaskModal
        currentRow={currentRow}
        visible={taskModalVisible}
        onCancel={onCancel}
      />

      <ComplianceModal
        currentRow={currentRow}
        visible={complianceModalVisible}
        onCancel={onCancel}
      />

      <BillModal
        currentRow={currentRow}
        visible={billModalVisible}
        onCancel={onCancel}
      />
    </PageContainer>
  );
};

export default CaseTableList;
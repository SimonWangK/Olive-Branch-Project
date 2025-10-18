import React, { useState, useRef } from "react";
import { Button, message, Modal } from "antd";
import { ActionType, FooterToolbar, PageContainer, ProColumns, ProTable } from "@ant-design/pro-components";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { getCaseList } from "@/services/system/case";
import { history } from 'umi'; // Use Umi's history for navigation

interface Case {
  case_num: string;
  case_type: string;
  jurisdiction: string;
  description: string;
  status: string;
  opened_at: string;
  target_close: string;
  updated_at: string;
}

const CaseTableList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<Case[]>([]);

  const columns: ProColumns<Case>[] = [
    {
      title: "Case Number",
      dataIndex: "case_num",
      valueType: "text",
      render: (_, record) => (
        <a
          onClick={() => {
            history.push(`/system/case/detail/${record.case_num}`); // Navigate to case detail page
          }}
        >
          {record.case_num}
        </a>
      ),
    },
    {
      title: "Case Type",
      dataIndex: "case_type",
      valueType: "text",
    },
    {
      title: "Jurisdiction",
      dataIndex: "jurisdiction",
      valueType: "text",
    },
    {
      title: "Description",
      dataIndex: "description",
      valueType: "text",
    },
    {
      title: "Status",
      dataIndex: "status",
      valueType: "text",
    },
    {
      title: "Opened At",
      dataIndex: "opened_at",
      valueType: "text",
    },
    {
      title: "Target Close",
      dataIndex: "target_close",
      valueType: "text",
    },
    {
      title: "Updated At",
      dataIndex: "updated_at",
      valueType: "dateTime",
    },
  ];

  return (
    <PageContainer>
      <ProTable<Case>
        headerTitle="Case List"
        actionRef={actionRef}
        search={false}
        rowKey="case_num"
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          try {
            const response = await getCaseList(params);
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
            console.error("Failed to fetch case list:", error);
            message.error("Failed to fetch case list");
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
      />
      {selectedRows.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              <span>{`Selected ${selectedRows.length} item(s)`}</span>
            </div>
          }
        >
          <Button
            key="remove"
            onClick={() => {
              Modal.confirm({
                title: "Batch Delete",
                content: `Are you sure you want to delete the selected ${selectedRows.length} cases?`,
                okText: "Yes",
                cancelText: "No",
                onOk: async () => {
                  const success = true; // Replace with actual delete logic
                  if (success) {
                    setSelectedRows([]);
                    actionRef.current?.reloadAndRest?.();
                  } else {
                    message.error("Batch delete failed.");
                  }
                },
              });
            }}
          >
            <DeleteOutlined /> Batch Delete
          </Button>
        </FooterToolbar>
      )}
    </PageContainer>
  );
};

export default CaseTableList;

import React, { useEffect, useRef, useState } from "react";
import { Button, message, Modal, Input, DatePicker, Select } from "antd";
import { ProColumns, ProTable, ActionType } from "@ant-design/pro-components";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getComplianceItems, createComplianceItem, updateComplianceItem, deleteComplianceItem } from "@/services/system/case";
import dayjs, { Dayjs } from "dayjs";

const { Option } = Select;

// Compliance interface to match the API response
interface ComplianceItem {
  id: number;
  case_id: number;
  title: string;
  mandatory: boolean;
  due_at: string | null;
  status: string;
}

interface ComplianceModalProps {
  currentRow: any; // Case record passed from CaseTableList
  visible: boolean;
  onCancel: () => void;
}

const ComplianceModal: React.FC<ComplianceModalProps> = ({ currentRow, visible, onCancel }) => {
  const actionRef = useRef<ActionType>();
  const [editingCompliance, setEditingCompliance] = useState<ComplianceItem | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [complianceForm, setComplianceForm] = useState<{
    title: string;
    mandatory: boolean;
    due_at: string | null;
    case_id: number;
    status: string; 
  }>({
    title: "",
    mandatory: true,
    due_at: null,
    case_id: currentRow?.id || 0,
    status: "PENDING",  // Set default status
  });

  // Update complianceForm.case_id when currentRow changes
  useEffect(() => {
    setComplianceForm((prev) => ({ ...prev, case_id: currentRow?.id || 0 }));
  }, [currentRow]);

  // Reload table when currentRow changes
  useEffect(() => {
    if (currentRow?.id && actionRef.current) {
      actionRef.current.reload();
    }
  }, [currentRow]);

  const handleCreateOrUpdateCompliance = async () => {
    if (!currentRow?.id) {
      message.error("Invalid case selected");
      return;
    }

    if (!complianceForm.title) {
      message.error("Please fill in all required fields");
      return;
    }

    try {
      const formattedDueAt = dayjs(complianceForm.due_at).toISOString(); // Ensure ISO 8601 format

      const complianceData = {
        title: complianceForm.title,
        mandatory: complianceForm.mandatory,
        due_at: formattedDueAt,
        status: complianceForm.status, 
      };

      if (editingCompliance) {
        // Update existing compliance
        const response = await updateComplianceItem(currentRow.id, editingCompliance.id, complianceData);
        if (response.code === 2000) {
          message.success("Compliance item updated successfully");
          actionRef.current?.reload();
          setCreateModalVisible(false);
          setEditingCompliance(null);
          setComplianceForm({ title: "", mandatory: true, due_at: null, case_id: currentRow.id ,status: "PENDING",});
        } else {
          message.error(response.message || "Failed to update compliance item");
        }
      } else {
        // Create new compliance item
        const response = await createComplianceItem(currentRow.id, complianceData);
        if (response.code === 2000) {
          message.success("Compliance item created successfully");
          actionRef.current?.reload();
          setCreateModalVisible(false);
          setComplianceForm({ title: "", mandatory: true, due_at: null, case_id: currentRow.id,status: "PENDING", });
        } else {
          message.error(response.message || "Failed to create compliance item");
        }
      }
    } catch (error) {
      message.error("Operation failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleDeleteCompliance = async (complianceId: number) => {
    if (!currentRow?.id) {
      message.error("Invalid case selected");
      return;
    }

    try {
      const response = await deleteComplianceItem(currentRow.id, complianceId);
      if (response?.code === 2000) {
        message.success("Compliance item deleted successfully");
        actionRef.current?.reload();
      } else {
        message.error(response.message || "Failed to delete compliance item");
      }
    } catch (error) {
      message.error("Failed to delete compliance item: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const columns: ProColumns<ComplianceItem>[] = [
    {
      title: "Compliance Title",
      dataIndex: "title",
      valueType: "text",
    },
    {
      title: "Due At",
      dataIndex: "due_at",
      valueType: "dateTime",
    },
    {
      title: "Status",
      dataIndex: "status",
      valueType: "text",
    },
    {
      title: "Action",
      dataIndex: "option",
      valueType: "option",
      render: (_, record) => [
        <Button
          type="link"
          key="edit"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingCompliance(record);
            setComplianceForm({
              title: record.title,
              mandatory: record.mandatory,
              due_at: record.due_at,
              case_id: record.case_id,
              status: record.status,
            });
            setCreateModalVisible(true);
          }}
        >
          Edit
        </Button>,
        <Button
          type="link"
          danger
          key="delete"
          icon={<DeleteOutlined />}
          onClick={() => {
            Modal.confirm({
              title: "Delete Compliance Item",
              content: `Are you sure you want to delete compliance item "${record.title}"?`,
              okText: "Confirm",
              cancelText: "Cancel",
              onOk: () => handleDeleteCompliance(record.id),
            });
          }}
        >
          Delete
        </Button>,
      ],
    },
  ];

  return (
    <>
      <Modal
        title={`Compliance Items for Case: ${currentRow?.case_num || "Unknown"}`}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width="85%"
      >
        <ProTable<ComplianceItem>
          key={currentRow?.id}
          headerTitle="Compliance Item List"
          actionRef={actionRef}
          rowKey="id"
          scroll={{ x: "max-content" }}
          search={false}
          toolBarRender={() => [
            <Button
              type="primary"
              key="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCompliance(null);
                setComplianceForm({ title: "", mandatory: true, due_at: null, case_id: currentRow?.id || 0,status:"PENDING" });
                setCreateModalVisible(true);
              }}
            >
              Add Compliance Item
            </Button>,
          ]}
          request={async (params) => {
            if (!currentRow?.id) {
              return { data: [], total: 0, success: false };
            }
            try {
              const response = await getComplianceItems(currentRow.id, params);
              if (response.code === 2000 && response.details) {
                return {
                  data: response.details || [],
                  total: response.pagination?.total || 0,
                  success: true,
                };
              }
              return { data: [], total: 0, success: false };
            } catch (error) {
              message.error("Failed to fetch compliance items: " + (error instanceof Error ? error.message : "Unknown error"));
              return { data: [], total: 0, success: false };
            }
          }}
          columns={columns}
        />
      </Modal>
      <Modal
        title={editingCompliance ? "Edit Compliance Item" : "Create Compliance Item"}
        open={createModalVisible}
        onOk={handleCreateOrUpdateCompliance}
        onCancel={() => {
          setCreateModalVisible(false);
          setEditingCompliance(null);
          setComplianceForm({ title: "", mandatory: true, due_at: null, case_id: currentRow?.id || 0,status:"PENDING" });
        }}
        okText={editingCompliance ? "Update" : "Create"}
        cancelText="Cancel"
      >
        <div style={{ marginBottom: 16 }}>
          <label>Title</label>
          <Input
            value={complianceForm.title}
            onChange={(e) => setComplianceForm({ ...complianceForm, title: e.target.value })}
            placeholder="Enter compliance item title"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Due At</label>
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            value={complianceForm.due_at ? dayjs(complianceForm.due_at) : null}
            onChange={(date: Dayjs | null) =>
              setComplianceForm({ ...complianceForm, due_at: date ? date.format("YYYY-MM-DD HH:mm:ss") : null })
            }
            placeholder="Select due date and time"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Status</label>
          <Select
            value={complianceForm.status}
            onChange={(value) => setComplianceForm({ ...complianceForm, status: value })}
            style={{ width: "100%" }}
          >
            <Option value="PENDING">PENDING</Option>
            <Option value="DONE">DONE</Option>
            {/* <Option value="OVERDUE">OVERDUE</Option> */}
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Mandatory</label>
          <Select
            value={complianceForm.mandatory ? "Yes" : "No"}
            onChange={(value) => setComplianceForm({ ...complianceForm, mandatory: value === "Yes" })}
            style={{ width: "100%" }}
          >
            <Option value="Yes">Yes</Option>
            <Option value="No">No</Option>
          </Select>
        </div>
      </Modal>
    </>
  );
};

export default ComplianceModal;

import React, { useEffect, useRef, useState } from 'react';
import { Button, message, Modal, Input, DatePicker, Select } from 'antd';
import { ProColumns, ProTable, ActionType } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { getTaskList, createTask, updateTask, deleteTask } from '@/services/system/case';
import { getUserList } from '@/services/system/user';

const { Option } = Select;

// Task interface to match the API response
interface Task {
  id: number;
  case_id: number;
  title: string;
  assignee_id: number | null;
  assignee: { id: number; name: string; username: string } | null;
  due_at: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// User interface to match the getUserList response
interface User {
  id: number;
  name: string;
  username: string;
  mobile:string;
}

interface TaskModalProps {
  currentRow: any; // Case record with id and case_num
  visible: boolean;
  onCancel: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ currentRow, visible, onCancel }) => {
  const actionRef = useRef<ActionType>();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [taskForm, setTaskForm] = useState<{
    title: string;
    due_at: string | null;
    status: string;
    case_id: number;
    assignee_id: number | null;
  }>({
    title: '',
    due_at: null,
    status: 'TODO',
    case_id: currentRow?.id || 0,
    assignee_id: null,
  });

  // Fetch users for assignee dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUserList();
        if (response.code === 2000 && response.details) {
          setUsers(response.details);
        } else {
          console.log("error",response.message)
          // message.error(response.message || 'Failed to fetch users');
        }
      } catch (error) {
        // message.error('Failed to fetch users: ' + (error instanceof Error ? error.message : 'Unknown error'));
        console.log("error",error)
      }
    };
    fetchUsers();
  }, []);

  // Update taskForm.case_id when currentRow changes
  useEffect(() => {
    setTaskForm((prev) => ({ ...prev, case_id: currentRow?.id || 0 }));
  }, [currentRow]);

  // Reload table when currentRow changes
  useEffect(() => {
    if (currentRow?.id && actionRef.current) {
      actionRef.current.reload();
    }
  }, [currentRow]);

  const handleCreateOrUpdateTask = async () => {
    if (!currentRow?.id) {
      message.error('Invalid case selected');
      return;
    }

    if (!taskForm.title || !taskForm.due_at) {
      message.error('Please fill in all required fields');
      return;
    }

    try {
      const formattedDueAt = dayjs(taskForm.due_at).toISOString();
      const taskData = {
        title: taskForm.title,
        due_at: formattedDueAt,
        status: taskForm.status,
        assignee_id: taskForm.assignee_id,
      };

      if (editingTask) {
        // Update existing task
        const response = await updateTask(currentRow.id, editingTask.id, taskData);
        if (response.code === 2000) {
          message.success('Task updated successfully');
          actionRef.current?.reload();
          setCreateModalVisible(false);
          setEditingTask(null);
          setTaskForm({ title: '', due_at: null, status: 'TODO', case_id: currentRow.id, assignee_id: null });
        } else {
          message.error(response.message || 'Failed to update task');
        }
      } else {
        // Create new task
        const response = await createTask(currentRow.id, taskData);
        if (response.code === 2000) {
          message.success('Task created successfully');
          actionRef.current?.reload();
          setCreateModalVisible(false);
          setTaskForm({ title: '', due_at: null, status: 'TODO', case_id: currentRow.id, assignee_id: null });
        } else {
          message.error(response.message || 'Failed to create task');
        }
      }
    } catch (error) {
      message.error('Operation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!currentRow?.id) {
      message.error('Invalid case selected');
      return;
    }

    try {
      const response = await deleteTask(currentRow.id, taskId);
      if (response.code === 2000) {
        message.success('Task deleted successfully');
        actionRef.current?.reload();
      } else {
        message.error(response.message || 'Failed to delete task');
      }
    } catch (error) {
      message.error('Failed to delete task: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const columns: ProColumns<Task>[] = [
    {
      title: 'Task Title',
      dataIndex: 'title',
      valueType: 'text',
    },
    {
      title: 'Assignee',
      dataIndex: ['assignee', 'name'],
      valueType: 'text',
      render: (_, record) => record.assignee?.name || 'Unassigned',
    },
    {
      title: 'Due At',
      dataIndex: 'due_at',
      valueType: 'dateTime',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      valueType: 'text',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      valueType: 'dateTime',
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      valueType: 'dateTime',
    },
    {
      title: 'Action',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Button
          type="link"
          key="edit"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingTask(record);
            setTaskForm({
              title: record.title,
              due_at: record.due_at,
              status: record.status,
              case_id: record.case_id,
              assignee_id: record.assignee_id,
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
              title: 'Delete Task',
              content: `Are you sure you want to delete task "${record.title}"?`,
              okText: 'Confirm',
              cancelText: 'Cancel',
              onOk: () => handleDeleteTask(record.id),
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
        title={`Tasks for Case: ${currentRow?.case_num || 'Unknown'}`}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width="85%"
      >
        <ProTable<Task>
          key={currentRow?.id}
          headerTitle="Task List"
          actionRef={actionRef}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          search={false}
          toolBarRender={() => [
            <Button
              type="primary"
              key="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTask(null);
                setTaskForm({ title: '', due_at: null, status: 'TODO', case_id: currentRow?.id || 0, assignee_id: null });
                setCreateModalVisible(true);
              }}
            >
              Add Task
            </Button>,
          ]}
          request={async (params) => {
            if (!currentRow?.id) {
              return { data: [], total: 0, success: false };
            }
            try {
              const response = await getTaskList(currentRow.id, params);
              if (response.code === 2000 && response.details) {
                return {
                  data: response.details || [],
                  total: response.pagination?.total || 0,
                  success: true,
                };
              }
              return { data: [], total: 0, success: false };
            } catch (error) {
              message.error('Failed to fetch task list: ' + (error instanceof Error ? error.message : 'Unknown error'));
              return { data: [], total: 0, success: false };
            }
          }}
          columns={columns}
        />
      </Modal>
      <Modal
        title={editingTask ? 'Edit Task' : 'Create Task'}
        open={createModalVisible}
        onOk={handleCreateOrUpdateTask}
        onCancel={() => {
          setCreateModalVisible(false);
          setEditingTask(null);
          setTaskForm({ title: '', due_at: null, status: 'TODO', case_id: currentRow?.id || 0, assignee_id: null });
        }}
        okText={editingTask ? 'Update' : 'Create'}
        cancelText="Cancel"
      >
        <div style={{ marginBottom: 16 }}>
          <Input value={taskForm.case_id} disabled hidden placeholder="Case ID" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Title</label>
          <Input
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="Enter task title"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Assignee</label>
          <Select
            value={taskForm.assignee_id}
            onChange={(value) => setTaskForm({ ...taskForm, assignee_id: value })}
            placeholder="Select assignee"
            style={{ width: '100%' }}
            allowClear
          >
            {users.map((user) => (
              <Option key={user.id} value={user.id}>
                {user.name} ({user.mobile})
              </Option>
            ))}
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Due At</label>
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            value={taskForm.due_at ? dayjs(taskForm.due_at) : null}
            onChange={(date: Dayjs | null) =>
              setTaskForm({ ...taskForm, due_at: date ? date.format('YYYY-MM-DD HH:mm:ss') : null })
            }
            placeholder="Select due date and time"
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Status</label>
          <Select
            value={taskForm.status}
            onChange={(value) => setTaskForm({ ...taskForm, status: value })}
            style={{ width: '100%' }}
          >
            <Option value="TODO">TODO</Option>
            <Option value="IN_PROGRESS">IN_PROGRESS</Option>
            <Option value="DONE">DONE</Option>
          </Select>
        </div>
      </Modal>
    </>
  );
};

export default TaskModal;
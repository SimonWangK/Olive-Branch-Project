import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Space, Modal, Select } from 'antd';

const { Option } = Select;
const { Password } = Input;

interface UserFormData {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: 'staff' | 'viewer';
  mobile?: string;
  gender?: number;
}

interface AddUserFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: UserFormData) => Promise<boolean>;
}

const AddUserForm: React.FC<AddUserFormProps> = ({ visible, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const success = await onSubmit(values); // Send JSON directly
      if (success) {
        form.resetFields();
      }
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Form validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create User"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: '',
          username: '',
          email: '',
          password: '',
          role: 'staff',
          mobile: '',
          gender: 0,
        }}
      >
        <Form.Item
          label="Nick Name"
          name="name"
          rules={[{ required: true, message: 'Please input the name!' }]}
        >
          <Input placeholder="Enter name" maxLength={255} />
        </Form.Item>

        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please input the username!' }]}
        >
          <Input placeholder="Enter username" maxLength={255} />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
        >
          <Input placeholder="Enter email" maxLength={255} />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Please input the password!' },
            { min: 6, message: 'Password must be at least 6 characters!' },
          ]}
        >
          <Password placeholder="Enter password" maxLength={255} />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Please select a role!' }]}
        >
          <Select>
            <Option value="staff">Staff</Option>
            <Option value="viewer">Viewer</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Mobile"
          name="mobile"
          rules={[{ required: false, message: 'Please input a valid mobile number!' }]}
        >
          <Input placeholder="Enter mobile number" maxLength={20} />
        </Form.Item>

        <Form.Item
          label="Gender"
          name="gender"
          rules={[{ required: true, message: 'Please select a gender!' }]}
        >
          <Select>
            <Option value={0}>Male</Option>
            <Option value={1}>Female</Option>
          </Select>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              Create
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddUserForm;
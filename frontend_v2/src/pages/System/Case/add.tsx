import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message, Modal, Select, DatePicker } from 'antd';
import moment from 'moment';
import { createCase } from '@/services/system/case'; // Adjust path as needed

const { Option } = Select;
const { TextArea } = Input;

interface CaseFormData {
  case_type: string;
  jurisdiction: string;
  description?: string;
  opened_at: string;
  target_close?: string;
}

interface AddCaseFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AddCaseForm: React.FC<AddCaseFormProps> = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({
        opened_at: moment(), // Default to current date/time
      });
    }
  }, [visible, form]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Format dates to ISO string
      const payload = {
        ...values,
        opened_at: values.opened_at.toISOString(),
        target_close: values.target_close ? values.target_close.toISOString() : undefined,
      };

      const response = await createCase(payload);
      if (response) {
        message.success('Case created successfully');
        form.resetFields();
        onSuccess(); // Trigger table reload
        onCancel(); // Close modal
      } else {
        message.error('Failed to create case');
      }
    } catch (error: any) {
      console.error('Case creation failed:', error);
      message.error(error.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create New Case"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          case_type: '',
          jurisdiction: '',
          description: '',
          opened_at: moment(),
          target_close: null,
        }}
      >
        <Form.Item
          label="Case Type"
          name="case_type"
          rules={[{ required: true, message: 'Please select the case type!' }]}
        >
          <Select placeholder="Select case type">
            <Option value="BANKRUPTCY">Bankruptcy</Option>
            <Option value="LIQUIDATION">Liquidation</Option>
            <Option value="RESTRUCTURING">Restructuring</Option>
            <Option value="COMPLIANCE REVIEW">Compliance Review</Option>
            <Option value="VOLUNTARY ADMINISTRATION">Voluntary Administration</Option>
            <Option value="INSOLVENCY INVESTIGATION">Insolvency Investigation</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Jurisdiction"
          name="jurisdiction"
          rules={[{ required: true, message: 'Please select the jurisdiction!' }]}
        >
          <Select placeholder="Select jurisdiction">
            <Option value="NSW-New South Wales">NSW-New South Wales</Option>
            <Option value="VIC-Victoria">VIC-Victoria</Option>
            <Option value="QLD-Queensland">QLD-Queensland</Option>
            <Option value="SA-South Australia">SA-South Australia</Option>
            <Option value="WA-Western Australia">WA-Western Australia</Option>
            <Option value="TAS-Tasmania">TAS-Tasmania</Option>
            <Option value="ACT-Australian Capital Territory">ACT-Australian Capital Territory</Option>
            <Option value="TNT - Northern Territory">NT - Northern Territory</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: false }]}
        >
          <TextArea placeholder="Enter description" rows={4} maxLength={500} />
        </Form.Item>

        <Form.Item
          label="Opened At"
          name="opened_at"
          rules={[{ required: true, message: 'Please select the opened date!' }]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
            placeholder="Select opened date"
          />
        </Form.Item>

        <Form.Item
          label="Target Close"
          name="target_close"
          rules={[{ required: false }]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
            placeholder="Select target close date"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCaseForm;
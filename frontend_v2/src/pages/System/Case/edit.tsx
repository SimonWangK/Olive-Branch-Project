import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, message } from 'antd';
import dayjs from 'dayjs';
import { updateCase } from '@/services/system/case';

interface EditCaseFormProps {
  visible: boolean;
  currentRow: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditCaseForm: React.FC<EditCaseFormProps> = ({ visible, currentRow, onCancel, onSuccess }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentRow) {
      form.setFieldsValue({
        case_type: currentRow.case_type,
        jurisdiction: currentRow.jurisdiction,
        description: currentRow.description,
        opened_at: currentRow.opened_at ? dayjs(currentRow.opened_at) : null,
        target_close: currentRow.target_close ? dayjs(currentRow.target_close) : null,
        status: currentRow.status,
        version: currentRow.version, // Include version
      });
    }
  }, [currentRow, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Format dates to ISO 8601 strings
      const formattedValues = {
        ...values,
        opened_at: values.opened_at ? values.opened_at.toISOString() : undefined,
        target_close: values.target_close ? values.target_close.toISOString() : undefined,
      };
      const response = await updateCase(currentRow.id, formattedValues, (currentRow as any).user?.id);
      message.success('Case updated successfully');
      onSuccess();
      onCancel();
    } catch (error: any) {
      if (error?.code === 'CONFLICT') {
        message.error('Case version mismatch. Please refresh and try again.');
      } else if (error?.code === 'CASE_NOT_FOUND') {
        message.error('Case not found.');
      } else {
        message.error(error?.message || 'Failed to update case');
      }
    }
  };

  return (
    <Modal
      visible={visible}
      title="Edit Case"
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Submit
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" name="edit_case_form">
        <Form.Item label="Case Type" name="case_type" hidden>
          <Input  />
        </Form.Item>
        <Form.Item label="Jurisdiction" name="jurisdiction" hidden>
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description" rules={[{ required: false }]}>
          <Input.TextArea />
        </Form.Item>
        <Form.Item label="Opened At" name="opened_at">
          <DatePicker format="YYYY-MM-DD HH:mm:ss" showTime />
        </Form.Item>
        <Form.Item label="Target Close Date" name="target_close">
          <DatePicker format="YYYY-MM-DD HH:mm:ss" showTime />
        </Form.Item>
        <Form.Item label="Status" name="status" hidden>
          <Select >
            <Select.Option value="ACTIVE">Active</Select.Option>
            <Select.Option value="ON_HOLD">On Hold</Select.Option>
            <Select.Option value="CLOSED">Closed</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="Version"
          name="version"
          rules={[{ required: true, message: 'Version is required' }]}
        >
          <Input type="number" disabled />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditCaseForm;
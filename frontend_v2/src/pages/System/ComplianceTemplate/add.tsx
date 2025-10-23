import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message, Modal, Switch, Select } from 'antd';

const { Option } = Select;

interface ComplianceTemplateFormData {
  case_type?: string;
  jurisdiction?: string;
  title?: string;
  mandatory?: boolean;
  due_days?: number;
}

interface ComplianceTemplateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: ComplianceTemplateFormData) => Promise<boolean>;
  initialValues?: ComplianceTemplateFormData;
}

const AddComplianceTemplateForm: React.FC<ComplianceTemplateFormProps> = ({
  visible,
  onCancel,
  onSubmit,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens or initialValues change
  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (initialValues) {
        form.setFieldsValue(initialValues);
      }
    }
  }, [visible, initialValues, form]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const success = await onSubmit(values);
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
      title={initialValues ? 'Edit Template' : 'Create Template'}
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
          title: '',
          mandatory: true,
          due_days: 0,
          ...initialValues,
        }}
      >
        <Form.Item
          label="Case Type"
          name="case_type"
          rules={[{ required: true, message: 'Please input the case type!' }]}
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
          rules={[{ required: true, message: 'Please input the jurisdiction!' }]}
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
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please input the title!' }]}
        >
          <Input placeholder="Enter title" maxLength={255} />
        </Form.Item>

        <Form.Item
          label="Mandatory"
          name="mandatory"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Due Days"
          name="due_days"
          rules={[{ required: true, message: 'Please input the due days!' }]}
        >
          <Input type="number" placeholder="Enter due days" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            {initialValues ? 'Update' : 'Create'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddComplianceTemplateForm;
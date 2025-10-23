// src/pages/system/case/bill_modal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Progress, Form, Input, DatePicker, Select, message, Space, Tabs, Table, Popconfirm } from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import {
  getMoneySummary,
  getTimeEntries,
  getExpenses,
  getInvoices,
  getPayments,
  addTimeEntry,
  updateTimeEntry,
  addExpense,
  updateExpense,
  createInvoice,
  addInvoiceLine,
  updateInvoice,
  sendInvoice,
  voidInvoice,
  addPayment,
  deletePayment,
  exportCaseFinancials,
  MoneySummary,
  TimeEntry,
  Expense,
  Invoice,
  InvoiceLine,
  Payment,
} from '@/services/system/money';
import moment from 'moment';
import { useAccess } from '@umijs/max';

interface BillModalProps {
  visible: boolean;
  currentRow?: { id: number; case_num: string };
  onCancel: () => void;
}

const BillModal: React.FC<BillModalProps> = ({ visible, currentRow, onCancel }) => {
  const [summary, setSummary] = useState<MoneySummary | null>(null);
  const [timeForm] = Form.useForm();
  const [expenseForm] = Form.useForm();
  const [invoiceLineForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [addTimeVisible, setAddTimeVisible] = useState(false);
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  const [createInvoiceVisible, setCreateInvoiceVisible] = useState(false);
  const [addLineVisible, setAddLineVisible] = useState(false);
  const [addPaymentVisible, setAddPaymentVisible] = useState(false);
  const [selectedTimeEntries, setSelectedTimeEntries] = useState<number[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const timeActionRef = useRef<ActionType>();
  const expenseActionRef = useRef<ActionType>();
  const invoiceActionRef = useRef<ActionType>();
  const paymentActionRef = useRef<ActionType>();
  const access = useAccess();

  const caseId = currentRow?.id;

  useEffect(() => {
    if (visible && caseId) {
      fetchSummary();
    }
  }, [visible, caseId]);

  const fetchSummary = async () => {
    try {
      const response = await getMoneySummary(caseId!);
      setSummary(response);
    } catch (error) {
      message.error('Failed to fetch financial summary');
    }
  };

const handleAddTime = async (values: any) => {
  try {
    await addTimeEntry(caseId!, {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
      rate_cents: parseInt(values.rate_cents, 10), // Convert to integer
    });
    message.success('Time entry added');
    timeActionRef.current?.reload();
    timeForm.resetFields();
    setAddTimeVisible(false);
    fetchSummary();
  } catch (error) {
    message.error('Failed to add time entry');
  }
};

const handleAddExpense = async (values: any) => {
  try {
    await addExpense(caseId!, {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
      amount_cents: parseInt(values.amount_cents, 10), // Convert to integer
    });
    message.success('Expense added');
    expenseActionRef.current?.reload();
    expenseForm.resetFields();
    setAddExpenseVisible(false);
    fetchSummary();
  } catch (error) {
    message.error('Failed to add expense');
  }
};

  const handleCreateInvoice = async () => {
    if (selectedTimeEntries.length === 0 && selectedExpenses.length === 0) {
      message.warning('Please select at least one time entry or expense');
      return;
    }
    try {
      await createInvoice(caseId!, {
        timeEntryIds: selectedTimeEntries,
        expenseIds: selectedExpenses,
      });
      message.success('Invoice created');
      invoiceActionRef.current?.reload();
      timeActionRef.current?.reload();
      expenseActionRef.current?.reload();
      setSelectedTimeEntries([]);
      setSelectedExpenses([]);
      setCreateInvoiceVisible(false);
      fetchSummary();
    } catch (error) {
      message.error('Failed to create invoice');
    }
  };

  const handleAddInvoiceLine = async (values: any) => {
    try {
      await addInvoiceLine(caseId!, editingInvoice!.id, {
        ...values,
        qty: parseFloat(values.qty),
      });
      message.success('Invoice line added');
      invoiceActionRef.current?.reload();
      invoiceLineForm.resetFields();
      setAddLineVisible(false);
      setEditingInvoice(null);
      fetchSummary();
    } catch (error) {
      message.error('Failed to add invoice line');
    }
  };

  const handleSendInvoice = async (invoiceId: number) => {
    try {
      await sendInvoice(caseId!, invoiceId);
      message.success('Invoice sent');
      invoiceActionRef.current?.reload();
      fetchSummary();
    } catch (error) {
      message.error('Failed to send invoice');
    }
  };

  const handleVoidInvoice = async (invoiceId: number) => {
    try {
      await voidInvoice(caseId!, invoiceId);
      message.success('Invoice voided');
      invoiceActionRef.current?.reload();
      fetchSummary();
    } catch (error) {
      message.error('Failed to void invoice');
    }
  };

  const handleAddPayment = async (values: any) => {
    try {
      await addPayment(caseId!, editingInvoice!.id, {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      });
      message.success('Payment recorded');
      paymentActionRef.current?.reload();
      invoiceActionRef.current?.reload();
      paymentForm.resetFields();
      setAddPaymentVisible(false);
      setEditingInvoice(null);
      fetchSummary();
    } catch (error) {
      message.error('Failed to record payment');
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    try {
      await deletePayment(caseId!, paymentId);
      message.success('Payment deleted');
      paymentActionRef.current?.reload();
      invoiceActionRef.current?.reload();
      fetchSummary();
    } catch (error) {
      message.error('Failed to delete payment');
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = await exportCaseFinancials(caseId!);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `case-${caseId}-financials.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Financials exported');
    } catch (error) {
      message.error('Failed to export financials');
    }
  };

  const timeColumns: ProColumns<TimeEntry>[] = [
    { title: 'Date', dataIndex: 'date', valueType: 'date', width: 120 },
    { title: 'User', dataIndex: ['user', 'name'], valueType: 'text', width: 100 },
    { title: 'Hours', dataIndex: 'hours', valueType: 'text', width: 80 },
    { 
      title: 'Rate ($)', 
      dataIndex: 'rate_cents', 
      valueType: 'text',
      width: 100,
      render: (text) => `$${(Number(text) / 100).toFixed(2)}` 
    },
    { 
      title: 'Amount ($)',
      valueType: 'text',
      width: 100,
      render: (_, record) => `$${((record.hours * record.rate_cents) / 100).toFixed(2)}`
    },
    { 
      title: 'Taxable', 
      dataIndex: 'taxable', 
      valueType: 'text',
      width: 80,
      render: (text) => text ? 'Yes' : 'No'
    },
    { title: 'Notes', dataIndex: 'notes', valueType: 'text', ellipsis: true },
  ];

  const expenseColumns: ProColumns<Expense>[] = [
    { title: 'Date', dataIndex: 'date', valueType: 'date', width: 120 },
    { title: 'Description', dataIndex: 'description', valueType: 'text', ellipsis: true },
    { 
      title: 'Amount ($)', 
      dataIndex: 'amount_cents',
      valueType: 'text',
      width: 120,
      render: (text) => `$${(Number(text) / 100).toFixed(2)}` 
    },
    { 
      title: 'Taxable', 
      dataIndex: 'taxable',
      valueType: 'text',
      width: 80,
      render: (text) => text ? 'Yes' : 'No'
    },
    { title: 'Vendor', dataIndex: 'vendor', valueType: 'text', width: 150 },
  ];

  const invoiceColumns: ProColumns<Invoice>[] = [
    { title: 'Number', dataIndex: 'number', valueType: 'text', width: 150 },
    { title: 'Issue Date', dataIndex: 'issue_date', valueType: 'date', width: 120 },
    { title: 'Due Date', dataIndex: 'due_date', valueType: 'date', width: 120 },
    { 
      title: 'Subtotal ($)', 
      dataIndex: 'subtotal_cents',
      valueType: 'text',
      width: 120,
      render: (text) => `$${(Number(text) / 100).toFixed(2)}` 
    },
    { 
      title: 'Tax ($)', 
      dataIndex: 'tax_cents',
      valueType: 'text',
      width: 100,
      render: (text) => `$${(Number(text) / 100).toFixed(2)}` 
    },
    { 
      title: 'Total ($)', 
      dataIndex: 'total_cents',
      valueType: 'text',
      width: 120,
      render: (text) => `$${(Number(text) / 100).toFixed(2)}` 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      valueType: 'text',
      width: 100,
      render: (text) => {
        const colors: Record<string, string> = {
          DRAFT: '#999',
          SENT: '#1890ff',
          PART_PAID: '#faad14',
          PAID: '#52c41a',
          VOID: '#f5222d',
        };
        return <span style={{ color: colors[text as string] }}>{text}</span>;
      }
    },
    {
      title: 'Action',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => [
        <Button
          type="link"
          key="send"
          size="small"
          onClick={() => handleSendInvoice(record.id)}
          disabled={record.status !== 'DRAFT' || !access.canAdmin}
        >
          Send
        </Button>,
        <Button
          type="link"
          key="addLine"
          size="small"
          onClick={() => {
            setEditingInvoice(record);
            setAddLineVisible(true);
          }}
          disabled={record.status !== 'DRAFT' || !access.canStaff}
        >
          Add Line
        </Button>,
        <Button
          type="link"
          key="addPayment"
          size="small"
          onClick={() => {
            setEditingInvoice(record);
            setAddPaymentVisible(true);
          }}
          disabled={record.status === 'VOID' || record.status === 'PAID' || !access.canAdmin}
        >
          Add Payment
        </Button>,
        <Popconfirm
          key="void"
          title="Are you sure you want to void this invoice?"
          onConfirm={() => handleVoidInvoice(record.id)}
          disabled={record.status === 'PAID' || record.status === 'VOID' || !access.canAdmin}
        >
          <Button
            type="link"
            danger
            size="small"
            disabled={record.status === 'PAID' || record.status === 'VOID' || !access.canAdmin}
          >
            Void
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const paymentColumns: ProColumns<Payment>[] = [
    { title: 'Date', dataIndex: 'date', valueType: 'date', width: 120 },
    { 
      title: 'Invoice', 
      dataIndex: ['invoice', 'number'], 
      valueType: 'text',
      width: 150
    },
    { 
      title: 'Amount ($)', 
      dataIndex: 'amount_cents',
      valueType: 'text',
      width: 120,
      render: (text) => `$${(Number(text) / 100).toFixed(2)}` 
    },
    { title: 'Method', dataIndex: 'method', valueType: 'text', width: 100 },
    { title: 'Reference', dataIndex: 'reference', valueType: 'text', ellipsis: true },
    {
      title: 'Action',
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, record) => [
        <Popconfirm
          key="delete"
          title="Are you sure you want to delete this payment?"
          onConfirm={() => handleDeletePayment(record.id)}
          disabled={!access.canAdmin}
        >
          <Button
            type="link"
            danger
            size="small"
            disabled={!access.canAdmin}
          >
            Delete
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <Modal
      title={`Billing for Case ${currentRow?.case_num}`}
      open={visible}
      onCancel={onCancel}
      width={1400}
      footer={null}
      destroyOnClose
    >
      {summary && (
        <div style={{ marginBottom: 24 }}>
          <h3>Financial Summary</h3>
          <Progress
            percent={summary.budget_cents > 0 ? Math.min(
              (summary.actual_spend_cents / summary.budget_cents) * 100,
              100
            ) : 0}
            format={() =>
              `Budget: $${(summary.budget_cents / 100).toFixed(2)} | Actual: $${(
                summary.actual_spend_cents / 100
              ).toFixed(2)} | Variance: $${(summary.budget_variance_cents / 100).toFixed(2)}`
            }
            strokeColor={summary.budget_variance_cents >= 0 ? '#52c41a' : '#f5222d'}
          />
          <p style={{ marginTop: 8, fontSize: 16, fontWeight: 'bold' }}>
            Balance Due: <span style={{ color: summary.balance_due_cents > 0 ? '#f5222d' : '#52c41a' }}>
              ${(summary.balance_due_cents / 100).toFixed(2)}
            </span>
          </p>
        </div>
      )}

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddTimeVisible(true)}
        //   disabled={!access.canStaff}
        >
          Add Time
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddExpenseVisible(true)}
        //   disabled={!access.canStaff}
        >
          Add Expense
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateInvoiceVisible(true)}
        //   disabled={!access.canStaff}
        >
          Create Invoice
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExportCsv}
        //   disabled={!access.canAdmin}
        >
          Export CSV
        </Button>
      </Space>

      {/* Add Time Entry Modal */}
      <Modal
        title="Add Time Entry"
        open={addTimeVisible}
        onCancel={() => {
          setAddTimeVisible(false);
          timeForm.resetFields();
        }}
        onOk={() => timeForm.submit()}
        destroyOnClose
      >
        <Form form={timeForm} onFinish={handleAddTime} layout="vertical">
          <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Please select date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item 
            name="hours" 
            label="Hours" 
            rules={[{ required: true, message: 'Please enter hours' }]}
          >
            <Input type="number" step="0.01" min="0" placeholder="e.g., 2.5" />
          </Form.Item>
<Form.Item 
  name="rate_cents" 
  label="Rate (cents)" 
  rules={[
    { required: true, message: 'Please enter rate' },
    { pattern: /^[0-9]+$/, message: 'Please enter a valid integer' }
  ]}
>
  <Input type="number" min="0" placeholder="e.g., 15000 for $150.00" />
</Form.Item>
          <Form.Item name="taxable" label="Taxable" initialValue={false}>
            <Select>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Description of work performed" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        title="Add Expense"
        open={addExpenseVisible}
        onCancel={() => {
          setAddExpenseVisible(false);
          expenseForm.resetFields();
        }}
        onOk={() => expenseForm.submit()}
        destroyOnClose
      >
        <Form form={expenseForm} onFinish={handleAddExpense} layout="vertical">
          <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Please select date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item 
            name="description" 
            label="Description" 
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input placeholder="e.g., Travel expenses" />
          </Form.Item>
<Form.Item 
  name="amount_cents" 
  label="Amount (cents)" 
  rules={[
    { required: true, message: 'Please enter amount' },
    { pattern: /^[0-9]+$/, message: 'Please enter a valid integer' }
  ]}
>
  <Input type="number" min="0" placeholder="e.g., 5000 for $50.00" />
</Form.Item>
          <Form.Item name="taxable" label="Taxable" initialValue={false}>
            <Select>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="vendor" label="Vendor">
            <Input placeholder="Vendor name" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        title="Create Invoice from Time & Expenses"
        open={createInvoiceVisible}
        onCancel={() => {
          setCreateInvoiceVisible(false);
          setSelectedTimeEntries([]);
          setSelectedExpenses([]);
        }}
        onOk={handleCreateInvoice}
        width={1000}
        destroyOnClose
      >
        <Tabs>
          <Tabs.TabPane tab="Time Entries" key="time">
            <ProTable<TimeEntry>
              rowKey="id"
              rowSelection={{
                selectedRowKeys: selectedTimeEntries,
                onChange: (selectedRowKeys) => setSelectedTimeEntries(selectedRowKeys as number[]),
              }}
              request={async () => {
                const response = await getTimeEntries(caseId!);
                return { data: response, success: true };
              }}
              columns={timeColumns}
              search={false}
              pagination={{ pageSize: 5 }}
              toolBarRender={false}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Expenses" key="expenses">
            <ProTable<Expense>
              rowKey="id"
              rowSelection={{
                selectedRowKeys: selectedExpenses,
                onChange: (selectedRowKeys) => setSelectedExpenses(selectedRowKeys as number[]),
              }}
              request={async () => {
                const response = await getExpenses(caseId!);
                return { data: response, success: true };
              }}
              columns={expenseColumns}
              search={false}
              pagination={{ pageSize: 5 }}
              toolBarRender={false}
            />
          </Tabs.TabPane>
        </Tabs>
      </Modal>

      {/* Add Invoice Line Modal */}
      <Modal
        title="Add Invoice Line"
        open={addLineVisible}
        onCancel={() => {
          setAddLineVisible(false);
          setEditingInvoice(null);
          invoiceLineForm.resetFields();
        }}
        onOk={() => invoiceLineForm.submit()}
        destroyOnClose
      >
        <Form form={invoiceLineForm} onFinish={handleAddInvoiceLine} layout="vertical">
          <Form.Item name="kind" label="Type" initialValue="FEE">
            <Select>
              <Select.Option value="FEE">Fee</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="qty" 
            label="Quantity" 
            rules={[{ required: true, message: 'Please enter quantity' }]}
            initialValue="1"
          >
            <Input type="number" step="0.01" min="0" />
          </Form.Item>
          <Form.Item 
            name="unit_rate_cents" 
            label="Unit Rate (cents)" 
            rules={[{ required: true, message: 'Please enter unit rate' }]}
          >
            <Input type="number" min="0" placeholder="e.g., 10000 for $100.00" />
          </Form.Item>
          <Form.Item name="taxable" label="Taxable" initialValue={false}>
            <Select>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="description" 
            label="Description" 
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input placeholder="Line item description" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        title={`Add Payment for Invoice ${editingInvoice?.number}`}
        open={addPaymentVisible}
        onCancel={() => {
          setAddPaymentVisible(false);
          setEditingInvoice(null);
          paymentForm.resetFields();
        }}
        onOk={() => paymentForm.submit()}
        destroyOnClose
      >
        <Form form={paymentForm} onFinish={handleAddPayment} layout="vertical">
          <Form.Item name="date" label="Payment Date" rules={[{ required: true, message: 'Please select date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item 
            name="amount_cents" 
            label="Amount (cents)" 
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <Input type="number" min="0" placeholder="e.g., 50000 for $500.00" />
          </Form.Item>
          <Form.Item 
            name="method" 
            label="Payment Method" 
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select>
              <Select.Option value="CASH">Cash</Select.Option>
              <Select.Option value="BANK">Bank Transfer</Select.Option>
              <Select.Option value="CARD">Card</Select.Option>
              <Select.Option value="OTHER">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="reference" label="Reference">
            <Input placeholder="Transaction reference or check number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Data Tables */}
      <Tabs defaultActiveKey="time">
        <Tabs.TabPane tab="Time Entries" key="time">
          <ProTable<TimeEntry>
            actionRef={timeActionRef}
            rowKey="id"
            request={async () => {
              const response = await getTimeEntries(caseId!);
              return { data: response, success: true };
            }}
            columns={timeColumns}
            search={false}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
            expandable={{
              expandedRowRender: (record) => (
                <Table
                  dataSource={record.lines}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Type', dataIndex: 'kind', key: 'kind', width: 100 },
                    { title: 'Description', dataIndex: 'description', key: 'description' },
                    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 80 },
                    { 
                      title: 'Unit Rate ($)', 
                      dataIndex: 'unit_rate_cents', 
                      key: 'unit_rate_cents',
                      width: 120,
                      render: (text) => `${(Number(text) / 100).toFixed(2)}`
                    },
                    { 
                      title: 'Subtotal ($)', 
                      dataIndex: 'line_subtotal_cents', 
                      key: 'line_subtotal_cents',
                      width: 120,
                      render: (text) => `${(Number(text) / 100).toFixed(2)}`
                    },
                    { 
                      title: 'Tax ($)', 
                      dataIndex: 'tax_cents', 
                      key: 'tax_cents',
                      width: 100,
                      render: (text) => `${(Number(text) / 100).toFixed(2)}`
                    },
                    { 
                      title: 'Total ($)', 
                      dataIndex: 'line_total_cents', 
                      key: 'line_total_cents',
                      width: 120,
                      render: (text) => `${(Number(text) / 100).toFixed(2)}`
                    },
                  ]}
                />
              ),
            }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Payments" key="payments">
          <ProTable<Payment>
            actionRef={paymentActionRef}
            rowKey="id"
            request={async () => {
              const response = await getPayments(caseId!);
              return { data: response, success: true };
            }}
            columns={paymentColumns}
            search={false}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default BillModal;
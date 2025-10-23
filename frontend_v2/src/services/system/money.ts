// src/services/system/money.ts
import { request } from '@umijs/max';

export interface MoneySummary {
  budget_cents: number;
  actual_spend_cents: number;
  balance_due_cents: number;
  budget_variance_cents: number;
}

export interface TimeEntry {
  id: number;
  case_id: number;
  user_id: number;
  date: string;
  hours: number;
  rate_cents: number;
  taxable: boolean;
  notes?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface Expense {
  id: number;
  case_id: number;
  date: string;
  description: string;
  amount_cents: number;
  taxable: boolean;
  vendor?: string;
}

export interface Invoice {
  id: number;
  case_id: number;
  number: string;
  issue_date: string;
  due_date: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  status: 'DRAFT' | 'SENT' | 'PART_PAID' | 'PAID' | 'VOID';
  created_by: number;
  lines: InvoiceLine[];
  payments: Payment[];
}

export interface InvoiceLine {
  id: number;
  invoice_id: number;
  kind: 'TIME' | 'EXPENSE' | 'FEE';
  ref_id?: number;
  qty: number;
  unit_rate_cents: number;
  line_subtotal_cents: number;
  tax_cents: number;
  line_total_cents: number;
  description: string;
}

export interface Payment {
  id: number;
  case_id: number;
  invoice_id: number;
  date: string;
  amount_cents: number;
  method: 'CASH' | 'BANK' | 'CARD' | 'OTHER';
  reference?: string;
  invoice?: {
    number: string;
  };
}

export async function getMoneySummary(caseId: number) {
  return request<MoneySummary>(`/api/cases/${caseId}/money/summary`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}

export async function getTimeEntries(caseId: number) {
  return request<TimeEntry[]>(`/api/cases/${caseId}/money/time`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}

export async function addTimeEntry(caseId: number, data: Partial<TimeEntry>) {
  return request<TimeEntry>(`/api/cases/${caseId}/money/time`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data,
  });
}

export async function updateTimeEntry(caseId: number, timeId: number, data: Partial<TimeEntry>) {
  return request<TimeEntry>(`/api/cases/${caseId}/money/time/${timeId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data,
  });
}

export async function getExpenses(caseId: number) {
  return request<Expense[]>(`/api/cases/${caseId}/money/expenses`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}

export async function addExpense(caseId: number, data: Partial<Expense>) {
  return request<Expense>(`/api/cases/${caseId}/money/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data,
  });
}

export async function updateExpense(caseId: number, expenseId: number, data: Partial<Expense>) {
  return request<Expense>(`/api/cases/${caseId}/money/expenses/${expenseId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data,
  });
}

export async function getInvoices(caseId: number) {
  return request<Invoice[]>(`/api/cases/${caseId}/money/invoices`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}

export async function createInvoice(caseId: number, data: { timeEntryIds: number[]; expenseIds: number[] }) {
  return request<Invoice>(`/api/cases/${caseId}/money/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data,
  });
}

export async function addInvoiceLine(caseId: number, invoiceId: number, data: Partial<InvoiceLine> & { taxable: boolean }) {
  return request<InvoiceLine>(`/api/cases/${caseId}/money/invoices/${invoiceId}/lines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data,
  });
}

export async function updateInvoice(caseId: number, invoiceId: number, data: Partial<Invoice>) {
  return request<Invoice>(`/api/cases/${caseId}/money/invoices/${invoiceId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data,
  });
}

export async function sendInvoice(caseId: number, invoiceId: number) {
  return request<Invoice>(`/api/cases/${caseId}/money/invoices/${invoiceId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}

export async function voidInvoice(caseId: number, invoiceId: number) {
  return request<Invoice>(`/api/cases/${caseId}/money/invoices/${invoiceId}/void`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}

export async function getPayments(caseId: number) {
  return request<Payment[]>(`/api/cases/${caseId}/money/payments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}

export async function addPayment(caseId: number, invoiceId: number, data: Partial<Payment>) {
  return request<Payment>(`/api/cases/${caseId}/money/invoices/${invoiceId}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data,
  });
}

export async function deletePayment(caseId: number, paymentId: number) {
  return request(`/api/cases/${caseId}/money/payments/${paymentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}

export async function exportCaseFinancials(caseId: number) {
  return request<string>(`/api/cases/${caseId}/money/export.csv`, {
    method: 'GET',
    headers: {
      'Content-Type': 'text/csv',
    },
    responseType: 'text',
  });
}
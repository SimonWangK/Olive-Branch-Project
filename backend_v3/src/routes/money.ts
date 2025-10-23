// money.router.ts
import { Router } from 'express';
import { auth } from '@/middleware/auth';
import {
  getMoneySummary,
  getTimeEntries,
  getExpenses,
  getInvoices,
  getPayments,
  addTimeEntry,
  addExpense,
  updateTimeEntry,
  updateExpense,
  createInvoice,
  addInvoiceLine,
  updateInvoice,
  sendInvoice,
  voidInvoice,
  addPayment,
  deletePayment,
  exportCaseFinancials,
} from '@/services/money.service';

const router = Router({ mergeParams: true });

// Get financial summary
router.get('/summary', auth(['staff', 'admin', 'viewer']), async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const summary = await getMoneySummary(caseId);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// Get time entries list
router.get('/time', auth(['staff', 'admin', 'viewer']), async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const entries = await getTimeEntries(caseId);
    res.json(entries);
  } catch (err) {
    next(err);
  }
});

// Add time entry
router.post('/time', auth(['staff', 'admin']), async (req: any, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const userId = req.user.id;
    const entry = await addTimeEntry(caseId, userId, req.body);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// Update time entry
router.patch('/time/:timeId', auth(['staff', 'admin']), async (req, res, next) => {
  try {
    const entry = await updateTimeEntry(Number(req.params.timeId), req.body);
    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// Get expenses list
router.get('/expenses', auth(['staff', 'admin', 'viewer']), async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const expenses = await getExpenses(caseId);
    res.json(expenses);
  } catch (err) {
    next(err);
  }
});

// Add expense
router.post('/expenses', auth(['staff', 'admin']), async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const expense = await addExpense(caseId, req.body);
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
});

// Update expense
router.patch('/expenses/:expenseId', auth(['staff', 'admin']), async (req, res, next) => {
  try {
    const expense = await updateExpense(Number(req.params.expenseId), req.body);
    res.json(expense);
  } catch (err) {
    next(err);
  }
});

// Get invoices list
router.get('/invoices', auth(['staff', 'admin', 'viewer']), async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const invoices = await getInvoices(caseId);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

// Create invoice from time entries and expenses
router.post('/invoices', auth(['staff', 'admin']), async (req: any, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const { timeEntryIds, expenseIds } = req.body;
    const invoice = await createInvoice(caseId, req.user.id, timeEntryIds || [], expenseIds || []);
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

// Add invoice line
router.post('/invoices/:invoiceId/lines', auth(['staff', 'admin']), async (req, res, next) => {
  try {
    const line = await addInvoiceLine(Number(req.params.invoiceId), req.body);
    res.status(201).json(line);
  } catch (err) {
    next(err);
  }
});

// Update invoice
router.patch('/invoices/:invoiceId', auth(['staff', 'admin']), async (req, res, next) => {
  try {
    const invoice = await updateInvoice(Number(req.params.invoiceId), req.body);
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// Send invoice
router.post('/invoices/:invoiceId/send', auth(['admin']), async (req, res, next) => {
  try {
    const invoice = await sendInvoice(Number(req.params.invoiceId));
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// Void invoice
router.post('/invoices/:invoiceId/void', auth(['admin']), async (req, res, next) => {
  try {
    const invoice = await voidInvoice(Number(req.params.invoiceId));
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// Get payments list
router.get('/payments', auth(['staff', 'admin', 'viewer']), async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const payments = await getPayments(caseId);
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

// Add payment to invoice
router.post('/invoices/:invoiceId/payments', auth(['admin']), async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const payment = await addPayment(Number(req.params.invoiceId), caseId, req.body);
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

// Delete payment
router.delete('/payments/:paymentId', auth(['admin']), async (req, res, next) => {
  try {
    await deletePayment(Number(req.params.paymentId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Export financials as CSV
router.get('/export.csv', auth(['admin']), async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const csv = await exportCaseFinancials(caseId);
    res.header('Content-Type', 'text/csv');
    res.attachment(`case-${caseId}-financials.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export default router;
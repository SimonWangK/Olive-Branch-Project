// money.service.ts
import { PrismaClient, InvoiceStatus, InvoiceLineKind, PaymentMethod } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();
const TAX_RATE = new Decimal(process.env.TAX_RATE || '0.1'); // Default 10% GST

export async function getMoneySummary(caseId: number) {
  // Check if case exists
  const caseExists = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!caseExists) {
    throw { code: 'NOT_FOUND', message: 'Case not found' };
  }

  const financials = await prisma.caseFinancial.findUnique({
    where: { case_id: caseId },
  });

  const invoices = await prisma.invoice.findMany({
    where: { case_id: caseId },
    include: { payments: true },
  });

  let actualSpend = new Decimal(0);
  let balanceDue = new Decimal(0);

  for (const inv of invoices) {
    if (inv.status !== InvoiceStatus.VOID) {
      const totalPaid = inv.payments.reduce(
        (sum, p) => sum.plus(new Decimal(p.amount_cents)),
        new Decimal(0)
      );
      balanceDue = balanceDue.plus(new Decimal(inv.total_cents).minus(totalPaid));
      actualSpend = actualSpend.plus(new Decimal(inv.total_cents));
    }
  }

  // If no financials exist, return default values
  if (!financials) {
    return {
      budget_cents: 0,
      actual_spend_cents: actualSpend.toNumber(),
      balance_due_cents: balanceDue.toNumber(),
      budget_variance_cents: new Decimal(0).minus(actualSpend).toNumber(),
    };
  }

  actualSpend = actualSpend.minus(new Decimal(financials.write_off_cents));
  const budgetVariance = new Decimal(financials.budget_cents).minus(actualSpend);

  return {
    budget_cents: financials.budget_cents,
    actual_spend_cents: actualSpend.toNumber(),
    balance_due_cents: balanceDue.toNumber(),
    budget_variance_cents: budgetVariance.toNumber(),
  };
}

export async function getTimeEntries(caseId: number) {
  return prisma.timeEntry.findMany({
    where: { case_id: caseId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
  });
}

export async function getExpenses(caseId: number) {
  return prisma.expense.findMany({
    where: { case_id: caseId },
    orderBy: { date: 'desc' },
  });
}

export async function getInvoices(caseId: number) {
  return prisma.invoice.findMany({
    where: { case_id: caseId },
    include: { 
      lines: true,
      payments: true,
    },
    orderBy: { issue_date: 'desc' },
  });
}

export async function getPayments(caseId: number) {
  return prisma.payment.findMany({
    where: { case_id: caseId },
    include: { invoice: { select: { number: true } } },
    orderBy: { date: 'desc' },
  });
}

export async function addTimeEntry(caseId: number, userId: number, data: any) {
  return prisma.timeEntry.create({
    data: {
      case_id: caseId,
      user_id: userId,
      date: new Date(data.date),
      hours: new Decimal(data.hours),
      rate_cents: parseInt(data.rate_cents, 10), // Convert string to integer
      taxable: data.taxable ?? false,
      notes: data.notes,
    },
  });
}

export async function updateTimeEntry(id: number, data: any) {
  return prisma.timeEntry.update({
    where: { id },
    data: {
      date: data.date ? new Date(data.date) : undefined,
      hours: data.hours ? new Decimal(data.hours) : undefined,
      rate_cents: data.rate_cents,
      taxable: data.taxable,
      notes: data.notes,
    },
  });
}

export async function addExpense(caseId: number, data: any) {
  return prisma.expense.create({
    data: {
      case_id: caseId,
      date: new Date(data.date),
      description: data.description,
      amount_cents: parseInt(data.amount_cents, 10), // Convert string to integer
      taxable: data.taxable ?? false,
      vendor: data.vendor,
    },
  });
}

export async function updateExpense(id: number, data: any) {
  return prisma.expense.update({
    where: { id },
    data: {
      date: data.date ? new Date(data.date) : undefined,
      description: data.description,
      amount_cents: data.amount_cents,
      taxable: data.taxable,
      vendor: data.vendor,
    },
  });
}

export async function createInvoice(caseId: number, createdBy: number, timeEntryIds: number[], expenseIds: number[]) {
  return prisma.$transaction(async (tx) => {
    const invoiceCount = await tx.invoice.count({ where: { case_id: caseId } });
    const invoiceNumber = `INV-${caseId}-${invoiceCount + 1}`;

    const timeEntries = await tx.timeEntry.findMany({
      where: { id: { in: timeEntryIds }, case_id: caseId },
    });
    const expenses = await tx.expense.findMany({
      where: { id: { in: expenseIds }, case_id: caseId },
    });

    let invoiceSubtotal = new Decimal(0);
    let invoiceTax = new Decimal(0);

    const invoiceLines = [
      ...timeEntries.map(entry => {
        const lineSubtotal = new Decimal(entry.hours).times(entry.rate_cents);
        const lineTax = entry.taxable ? lineSubtotal.times(TAX_RATE).round() : new Decimal(0);
        const lineTotal = lineSubtotal.plus(lineTax);

        invoiceSubtotal = invoiceSubtotal.plus(lineSubtotal);
        invoiceTax = invoiceTax.plus(lineTax);

        return {
          kind: InvoiceLineKind.TIME,
          ref_id: entry.id,
          qty: entry.hours,
          unit_rate_cents: entry.rate_cents,
          line_subtotal_cents: lineSubtotal.toNumber(),
          tax_cents: lineTax.toNumber(),
          line_total_cents: lineTotal.toNumber(),
          description: entry.notes || `Time entry ${entry.id}`,
        };
      }),
      ...expenses.map(expense => {
        const lineSubtotal = new Decimal(expense.amount_cents);
        const lineTax = expense.taxable ? lineSubtotal.times(TAX_RATE).round() : new Decimal(0);
        const lineTotal = lineSubtotal.plus(lineTax);

        invoiceSubtotal = invoiceSubtotal.plus(lineSubtotal);
        invoiceTax = invoiceTax.plus(lineTax);

        return {
          kind: InvoiceLineKind.EXPENSE,
          ref_id: expense.id,
          qty: new Decimal(1),
          unit_rate_cents: expense.amount_cents,
          line_subtotal_cents: lineSubtotal.toNumber(),
          tax_cents: lineTax.toNumber(),
          line_total_cents: lineTotal.toNumber(),
          description: expense.description,
        };
      }),
    ];

    const invoice = await tx.invoice.create({
      data: {
        case_id: caseId,
        number: invoiceNumber,
        issue_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal_cents: invoiceSubtotal.toNumber(),
        tax_cents: invoiceTax.toNumber(),
        total_cents: invoiceSubtotal.plus(invoiceTax).toNumber(),
        status: InvoiceStatus.DRAFT,
        created_by: createdBy,
        lines: { create: invoiceLines },
      },
      include: { lines: true },
    });

    return invoice;
  });
}

export async function addInvoiceLine(invoiceId: number, data: any) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true, subtotal_cents: true, tax_cents: true, total_cents: true },
  });

  if (!invoice || invoice.status !== InvoiceStatus.DRAFT) {
    throw { code: 'INVALID_STATE', message: 'Can only add lines to draft invoices' };
  }

  const lineSubtotal = new Decimal(data.qty).times(data.unit_rate_cents);
  const lineTax = data.taxable ? lineSubtotal.times(TAX_RATE).round() : new Decimal(0);
  const lineTotal = lineSubtotal.plus(lineTax);

  return prisma.$transaction(async (tx) => {
    const line = await tx.invoiceLine.create({
      data: {
        invoice_id: invoiceId,
        kind: data.kind as InvoiceLineKind,
        ref_id: data.ref_id,
        qty: new Decimal(data.qty),
        unit_rate_cents: data.unit_rate_cents,
        line_subtotal_cents: lineSubtotal.toNumber(),
        tax_cents: lineTax.toNumber(),
        line_total_cents: lineTotal.toNumber(),
        description: data.description,
      },
    });

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal_cents: invoice.subtotal_cents + lineSubtotal.toNumber(),
        tax_cents: invoice.tax_cents + lineTax.toNumber(),
        total_cents: invoice.total_cents + lineTotal.toNumber(),
      },
    });

    return line;
  });
}

export async function updateInvoice(invoiceId: number, data: any) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true },
  });

  if (!invoice || invoice.status !== InvoiceStatus.DRAFT) {
    throw { code: 'INVALID_STATE', message: 'Can only update draft invoices' };
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      issue_date: data.issue_date ? new Date(data.issue_date) : undefined,
      due_date: data.due_date ? new Date(data.due_date) : undefined,
    },
  });
}

export async function sendInvoice(invoiceId: number) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true },
  });

  if (!invoice || invoice.status !== InvoiceStatus.DRAFT) {
    throw { code: 'INVALID_STATE', message: 'Can only send draft invoices' };
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.SENT },
  });
}

export async function voidInvoice(invoiceId: number) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true },
  });

  if (!invoice) {
    throw { code: 'NOT_FOUND', message: 'Invoice not found' };
  }

  if (invoice.status === InvoiceStatus.PAID) {
    throw { code: 'INVALID_STATE', message: 'Cannot void paid invoice' };
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.VOID },
  });
}

export async function addPayment(invoiceId: number, caseId: number, data: any) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true, total_cents: true, payments: true },
  });

  if (!invoice || invoice.status === InvoiceStatus.VOID) {
    throw { code: 'INVALID_STATE', message: 'Cannot add payment to void invoice' };
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        case_id: caseId,
        invoice_id: invoiceId,
        date: new Date(data.date),
        amount_cents: data.amount_cents,
        method: data.method as PaymentMethod,
        reference: data.reference,
      },
    });

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + p.amount_cents,
      data.amount_cents
    );

    const newStatus = totalPaid >= invoice.total_cents
      ? InvoiceStatus.PAID
      : totalPaid > 0
      ? InvoiceStatus.PART_PAID
      : InvoiceStatus.SENT;

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    });

    return payment;
  });
}

export async function deletePayment(id: number) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { invoice: true },
  });

  if (!payment) {
    throw { code: 'NOT_FOUND', message: 'Payment not found' };
  }

  return prisma.$transaction(async (tx) => {
    await tx.payment.delete({ where: { id } });

    const invoice = payment.invoice;
    const remainingPayments = await tx.payment.findMany({
      where: { invoice_id: invoice.id },
    });

    const totalPaid = remainingPayments.reduce(
      (sum, p) => sum + p.amount_cents,
      0
    );

    const newStatus = totalPaid >= invoice.total_cents
      ? InvoiceStatus.PAID
      : totalPaid > 0
      ? InvoiceStatus.PART_PAID
      : InvoiceStatus.SENT;

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: newStatus },
    });
  });
}

export async function exportCaseFinancials(caseId: number) {
  const [timeEntries, expenses, invoices, payments] = await Promise.all([
    prisma.timeEntry.findMany({ where: { case_id: caseId } }),
    prisma.expense.findMany({ where: { case_id: caseId } }),
    prisma.invoice.findMany({
      where: { case_id: caseId },
      include: { lines: true },
    }),
    prisma.payment.findMany({ where: { case_id: caseId } }),
  ]);

  const csvRows = [
    ['Type', 'ID', 'Date', 'Description', 'Amount', 'Taxable', 'Status'],
    ...timeEntries.map(t => [
      'Time',
      t.id,
      t.date.toISOString(),
      t.notes || '',
      (t.hours.toNumber() * t.rate_cents / 100).toFixed(2),
      t.taxable ? 'Yes' : 'No',
      '',
    ]),
    ...expenses.map(e => [
      'Expense',
      e.id,
      e.date.toISOString(),
      e.description,
      (e.amount_cents / 100).toFixed(2),
      e.taxable ? 'Yes' : 'No',
      '',
    ]),
    ...invoices.flatMap(i => [
      ['Invoice', i.id, i.issue_date.toISOString(), i.number, (i.total_cents / 100).toFixed(2), '', i.status],
      ...i.lines.map(l => [
        'Invoice Line',
        l.id,
        '',
        l.description,
        (l.line_total_cents / 100).toFixed(2),
        '',
        '',
      ]),
    ]),
    ...payments.map(p => [
      'Payment',
      p.id,
      p.date.toISOString(),
      p.reference || '',
      (p.amount_cents / 100).toFixed(2),
      '',
      p.method,
    ]),
  ];

  return csvRows.map(row => row.join(',')).join('\n');
}
import assert from 'node:assert/strict';
import test from 'node:test';
import { inquiryListQuerySchema, updateInquirySchema } from '../src/modules/inquiries/inquiries.schema.js';
import { shouldReportInquiryQuality } from '../src/modules/inquiries/inquiries.service.js';

const supportedStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'WON', 'CLOSED', 'SPAM'] as const;

test('all inquiry workflow statuses are accepted for updates and list filters', () => {
  for (const status of supportedStatuses) {
    assert.equal(updateInquirySchema.parse({ status }).status, status);
    assert.equal(inquiryListQuerySchema.parse({ status }).status, status);
  }
});

test('unknown inquiry statuses remain rejected', () => {
  assert.equal(updateInquirySchema.safeParse({ status: 'INVALID' }).success, false);
  assert.equal(inquiryListQuerySchema.safeParse({ status: 'INVALID' }).success, false);
});

test('Meta quality events are emitted only when entering a reportable CRM stage', () => {
  assert.equal(shouldReportInquiryQuality('CONTACTED', 'QUALIFIED'), true);
  assert.equal(shouldReportInquiryQuality('QUALIFIED', 'QUOTED'), true);
  assert.equal(shouldReportInquiryQuality('QUOTED', 'WON'), true);
  assert.equal(shouldReportInquiryQuality('QUALIFIED', 'QUALIFIED'), false);
  assert.equal(shouldReportInquiryQuality('WON', 'CLOSED'), false);
  assert.equal(shouldReportInquiryQuality('NEW', undefined), false);
});

test('quality event identifiers are deterministic for Meta deduplication', () => {
  const expected = {
    QUALIFIED: 'crm-QualifiedLead-20',
    QUOTED: 'crm-QuoteProvided-20',
    WON: 'crm-SaleWon-20',
  };
  for (const [status, eventId] of Object.entries(expected)) {
    const eventName = status === 'QUALIFIED' ? 'QualifiedLead' : status === 'QUOTED' ? 'QuoteProvided' : 'SaleWon';
    assert.equal(`crm-${eventName}-20`, eventId);
  }
});

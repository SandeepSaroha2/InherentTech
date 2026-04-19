export * from './email';

// Ecafy and Payments both export parseWebhookEvent — use namespaced re-exports
export {
  syncContacts,
  addContact,
  removeContact,
  tagContacts,
  createCampaign,
  sendCampaign,
  getCampaignStats,
  listCampaigns,
  createSequence,
  enrollInSequence,
  pauseSequence,
  resumeSequence,
  listTemplates,
  getTemplate,
  getDashboardStats as getEcafyDashboardStats,
  contactsToCSV,
  parseWebhookEvent as parseEcafyWebhookEvent,
} from './ecafy';
export type { EcafyCampaign, EcafyContact, EcafyWebhookEvent, EcafySequence, EcafySequenceStep, EcafyCampaignStats } from './ecafy';

export {
  createCustomer,
  getCustomer,
  updateCustomer,
  createInvoice,
  sendInvoice,
  voidInvoice,
  createPaymentIntent,
  getPaymentIntent,
  createSubscription,
  cancelSubscription,
  createCheckoutSession,
  recordPayout,
  getPaymentDashboard,
  getPublishableKey,
  parseWebhookEvent as parsePaymentWebhookEvent,
} from './payments';
export type { PaymentWebhookEvent, PaymentCustomer, PaymentInvoice, PaymentIntent, PaymentSubscription, PaymentPayout, PaymentProvider, PaymentLineItem } from './payments';

// Entity Extraction Utility - Detects entities like order IDs, dates, emails, etc.

export interface ExtractedEntity {
  type: 'orderId' | 'trackingNumber' | 'email' | 'date' | 'phoneNumber' | 'ticketNumber' | 'amount';
  value: string;
  originalText: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  hasEntities: boolean;
  summary: string;
}

// Order ID patterns (e.g., ORD123456, #12345, order 98765)
const ORDER_ID_PATTERNS = [
  /\b(?:order|order\s*#|order\s*id|ord)\s*[:#]?\s*([A-Z0-9]{5,})/gi,
  /\b#(\d{5,})/g,
  /\b([A-Z]{3}\d{6,})/g,
  /\border\s+(\d{5,})/gi,
];

// Tracking number patterns (e.g., 1Z999AA10123456784, 9400111899561234567890)
const TRACKING_PATTERNS = [
  /\b(1Z[A-Z0-9]{16})\b/g, // UPS
  /\b(\d{20,22})\b/g, // USPS
  /\b(\d{12,14})\b/g, // FedEx
  /\btracking\s*[:#]?\s*([A-Z0-9]{10,})/gi,
];

// Email pattern
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Date patterns (e.g., 12/25/2024, 2024-12-25, Dec 25, December 25th)
const DATE_PATTERNS = [
  /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/g,
  /\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/g,
  /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)\b/gi,
  /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)\b/gi,
];

// Phone number patterns
const PHONE_PATTERNS = [
  /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  /\b(\d{10})\b/g,
];

// Ticket number patterns (e.g., TKT-0001, TICKET-12345)
const TICKET_PATTERNS = [
  /\b(TKT-\d{4,})\b/gi,
  /\bticket\s*[:#]?\s*([A-Z0-9]{4,})/gi,
];

// Amount/price patterns (e.g., $99.99, £50, €100)
const AMOUNT_PATTERNS = [
  /\b[\$£€¥]\s*\d+(?:[.,]\d{2})?\b/g,
  /\b\d+(?:[.,]\d{2})?\s*(?:USD|EUR|GBP|INR|dollars?|rupees?|pounds?|euros?)\b/gi,
];

/**
 * Extract order IDs from text
 */
function extractOrderIds(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const foundValues = new Set<string>();

  ORDER_ID_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[1] || match[0];
      const cleanValue = value.replace(/^[#\s]+/, '').trim();
      
      if (cleanValue && !foundValues.has(cleanValue) && cleanValue.length >= 5) {
        foundValues.add(cleanValue);
        entities.push({
          type: 'orderId',
          value: cleanValue,
          originalText: match[0],
          confidence: /^[A-Z]{3}\d{6,}/.test(cleanValue) ? 'high' : 'medium',
        });
      }
    }
  });

  return entities;
}

/**
 * Extract tracking numbers from text
 */
function extractTrackingNumbers(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const foundValues = new Set<string>();

  TRACKING_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[1] || match[0];
      const cleanValue = value.trim();
      
      if (cleanValue && !foundValues.has(cleanValue)) {
        foundValues.add(cleanValue);
        entities.push({
          type: 'trackingNumber',
          value: cleanValue,
          originalText: match[0],
          confidence: /^1Z/.test(cleanValue) || cleanValue.length === 20 ? 'high' : 'medium',
        });
      }
    }
  });

  return entities;
}

/**
 * Extract email addresses from text
 */
function extractEmails(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const matches = text.matchAll(EMAIL_PATTERN);

  for (const match of matches) {
    entities.push({
      type: 'email',
      value: match[0],
      originalText: match[0],
      confidence: 'high',
    });
  }

  return entities;
}

/**
 * Extract dates from text
 */
function extractDates(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const foundValues = new Set<string>();

  DATE_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[1] || match[0];
      
      if (value && !foundValues.has(value)) {
        foundValues.add(value);
        entities.push({
          type: 'date',
          value: value,
          originalText: match[0],
          confidence: /\d{4}/.test(value) ? 'high' : 'medium',
        });
      }
    }
  });

  return entities;
}

/**
 * Extract phone numbers from text
 */
function extractPhoneNumbers(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const foundValues = new Set<string>();

  PHONE_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[0];
      
      if (value && !foundValues.has(value)) {
        foundValues.add(value);
        entities.push({
          type: 'phoneNumber',
          value: value,
          originalText: match[0],
          confidence: /\+/.test(value) || /\(\d{3}\)/.test(value) ? 'high' : 'medium',
        });
      }
    }
  });

  return entities;
}

/**
 * Extract ticket numbers from text
 */
function extractTicketNumbers(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const foundValues = new Set<string>();

  TICKET_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = match[1] || match[0];
      const cleanValue = value.trim();
      
      if (cleanValue && !foundValues.has(cleanValue)) {
        foundValues.add(cleanValue);
        entities.push({
          type: 'ticketNumber',
          value: cleanValue,
          originalText: match[0],
          confidence: /^TKT-/.test(cleanValue) ? 'high' : 'medium',
        });
      }
    }
  });

  return entities;
}

/**
 * Extract amounts/prices from text
 */
function extractAmounts(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const matches = text.matchAll(AMOUNT_PATTERNS[0]);

  for (const match of matches) {
    entities.push({
      type: 'amount',
      value: match[0],
      originalText: match[0],
      confidence: 'high',
    });
  }

  return entities;
}

/**
 * Main extraction function
 */
export function extractEntities(text: string): EntityExtractionResult {
  const entities: ExtractedEntity[] = [
    ...extractOrderIds(text),
    ...extractTrackingNumbers(text),
    ...extractEmails(text),
    ...extractDates(text),
    ...extractPhoneNumbers(text),
    ...extractTicketNumbers(text),
    ...extractAmounts(text),
  ];

  const summary = generateSummary(entities);

  return {
    entities,
    hasEntities: entities.length > 0,
    summary,
  };
}

/**
 * Generate a human-readable summary of extracted entities
 */
function generateSummary(entities: ExtractedEntity[]): string {
  if (entities.length === 0) return '';

  const summaryParts: string[] = [];
  const grouped = groupEntitiesByType(entities);

  Object.entries(grouped).forEach(([type, items]) => {
    const label = getEntityLabel(type as ExtractedEntity['type']);
    if (items.length === 1) {
      summaryParts.push(`${label}: ${items[0].value}`);
    } else {
      summaryParts.push(`${label}s: ${items.map(e => e.value).join(', ')}`);
    }
  });

  return summaryParts.join(' | ');
}

/**
 * Group entities by type
 */
function groupEntitiesByType(entities: ExtractedEntity[]): Record<string, ExtractedEntity[]> {
  return entities.reduce((acc, entity) => {
    if (!acc[entity.type]) {
      acc[entity.type] = [];
    }
    acc[entity.type].push(entity);
    return acc;
  }, {} as Record<string, ExtractedEntity[]>);
}

/**
 * Get human-readable label for entity type
 */
function getEntityLabel(type: ExtractedEntity['type']): string {
  const labels: Record<ExtractedEntity['type'], string> = {
    orderId: 'Order ID',
    trackingNumber: 'Tracking Number',
    email: 'Email',
    date: 'Date',
    phoneNumber: 'Phone',
    ticketNumber: 'Ticket',
    amount: 'Amount',
  };
  return labels[type] || type;
}

/**
 * Format entities for API context
 */
export function formatEntitiesForAPI(entities: ExtractedEntity[]): string {
  if (entities.length === 0) return '';

  const formatted = entities.map(e => `${getEntityLabel(e.type)}: ${e.value}`).join(', ');
  return `[Detected entities: ${formatted}]`;
}

/**
 * Get entity icon for display
 */
export function getEntityIcon(type: ExtractedEntity['type']): string {
  const icons: Record<ExtractedEntity['type'], string> = {
    orderId: '📦',
    trackingNumber: '🚚',
    email: '📧',
    date: '📅',
    phoneNumber: '📞',
    ticketNumber: '🎫',
    amount: '💰',
  };
  return icons[type] || '🏷️';
}

/**
 * Get color class for entity type
 */
export function getEntityColorClass(type: ExtractedEntity['type']): string {
  const colors: Record<ExtractedEntity['type'], string> = {
    orderId: 'bg-blue-100 text-blue-700 border-blue-300',
    trackingNumber: 'bg-green-100 text-green-700 border-green-300',
    email: 'bg-purple-100 text-purple-700 border-purple-300',
    date: 'bg-orange-100 text-orange-700 border-orange-300',
    phoneNumber: 'bg-pink-100 text-pink-700 border-pink-300',
    ticketNumber: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    amount: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  };
  return colors[type] || 'bg-gray-100 text-gray-700 border-gray-300';
}

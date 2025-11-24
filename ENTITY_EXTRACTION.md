# Entity Extraction Feature

## Overview
The chatbot now automatically detects and extracts key entities from user messages to provide better context and more accurate responses.

## Detected Entity Types

### 1. **Order IDs** 📦
- Patterns: `ORD123456`, `#12345`, `order 98765`, `ABC123456`
- Example: "I want to track order #12345"
- Detected: `Order ID: 12345`

### 2. **Tracking Numbers** 🚚
- UPS: `1Z999AA10123456784`
- USPS: `9400111899561234567890`
- FedEx: `123456789012`
- Example: "My tracking number is 1Z999AA10123456784"
- Detected: `Tracking Number: 1Z999AA10123456784`

### 3. **Email Addresses** 📧
- Pattern: Standard email format
- Example: "Send confirmation to user@example.com"
- Detected: `Email: user@example.com`

### 4. **Dates** 📅
- Formats supported:
  - `12/25/2024`
  - `2024-12-25`
  - `Dec 25, 2024`
  - `December 25th`
- Example: "I placed my order on Dec 25, 2024"
- Detected: `Date: Dec 25, 2024`

### 5. **Phone Numbers** 📞
- Formats: `(123) 456-7890`, `123-456-7890`, `1234567890`
- Example: "Call me at (555) 123-4567"
- Detected: `Phone: (555) 123-4567`

### 6. **Ticket Numbers** 🎫
- Patterns: `TKT-0001`, `TICKET-12345`
- Example: "My ticket number is TKT-0001"
- Detected: `Ticket: TKT-0001`

### 7. **Amounts/Prices** 💰
- Formats: `$99.99`, `£50`, `€100`, `100 USD`
- Example: "I was charged $99.99"
- Detected: `Amount: $99.99`

## How It Works

### 1. **Detection**
When you send a message, the system automatically scans it for recognized patterns:
```
User: "I need to track order #12345, I ordered on Dec 25"
```

### 2. **Display**
Detected entities are shown as colored tags below the message:
```
[📦 Order ID: 12345] [📅 Date: Dec 25]
```

### 3. **Context**
The entities are passed to the AI for better understanding:
```
AI receives: "I need to track order #12345, I ordered on Dec 25 [Detected entities: Order ID: 12345, Date: Dec 25]"
```

## Visual Indicators

Each entity type has a unique color:
- **Order ID**: Blue 📦
- **Tracking Number**: Green 🚚
- **Email**: Purple 📧
- **Date**: Orange 📅
- **Phone**: Pink 📞
- **Ticket**: Indigo 🎫
- **Amount**: Yellow 💰

## Benefits

1. **Improved Context**: AI understands specific identifiers
2. **Visual Feedback**: See what information was detected
3. **Better Responses**: More accurate and relevant replies
4. **Quick Reference**: Easily identify important data in conversation

## Examples

### Order Tracking
```
User: "Where is my order ORD123456?"
Detected: [📦 Order ID: ORD123456]
AI: "Let me check the status of order ORD123456 for you..."
```

### Refund Request
```
User: "I want a refund for $49.99 charged on 11/20/2024"
Detected: [💰 Amount: $49.99] [📅 Date: 11/20/2024]
AI: "I'll help you process a refund for $49.99 from 11/20/2024..."
```

### Support Ticket
```
User: "What's the status of ticket TKT-0025?"
Detected: [🎫 Ticket: TKT-0025]
AI: "Let me pull up the details for ticket TKT-0025..."
```

### Contact Update
```
User: "Update my email to newemail@example.com and phone to (555) 123-4567"
Detected: [📧 Email: newemail@example.com] [📞 Phone: (555) 123-4567]
AI: "I'll update your contact information..."
```

## Technical Details

### Files Created
- `src/utils/entityExtractor.ts` - Core extraction logic with pattern matching

### Integration Points
- `ChatBot.tsx` - Extracts entities on message send
- Message display - Shows entity tags visually
- API calls - Includes entity context for better AI responses

### Pattern Matching
Uses regex patterns to identify entities with varying confidence levels:
- **High Confidence**: Exact format matches (e.g., 1Z prefix for UPS)
- **Medium Confidence**: Common patterns (e.g., 5+ digit numbers for orders)
- **Low Confidence**: Generic patterns (less commonly used)

## Usage in Chat

Simply type naturally - entity extraction works automatically:
- ✅ "Track order #12345"
- ✅ "My email is user@example.com"
- ✅ "I ordered on December 25th"
- ✅ "Call me at 555-123-4567"
- ✅ "Refund my $99.99"

No special commands needed - the system recognizes entities automatically!

# IAP API Documentation

## Overview
This document describes the In-App Purchase (IAP) API endpoints for the LaborLink backend.

---

## Endpoints

### 1. Validate IAP Receipt

Validates an Apple IAP receipt with Apple's servers.

**Endpoint:** `POST /api/user/validateIAPReceipt`

**Request Body:**
```json
{
  "receipt": "base64_encoded_receipt_data",
  "productId": "com.laborlink.employee.basic",
  "transactionId": "1000000123456789",
  "platform": "ios",
  "userId": "user_id_optional"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Receipt validated successfully",
  "data": {
    "transactionId": "1000000123456789",
    "productId": "com.laborlink.employee.basic",
    "purchaseDate": "2024-01-01T00:00:00.000Z",
    "expiresDate": "2024-02-01T00:00:00.000Z",
    "environment": "sandbox"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Receipt validation failed",
  "error": "The receipt could not be authenticated."
}
```

---

### 2. Activate Subscription

Activates a subscription after successful IAP purchase.

**Endpoint:** `POST /api/user/activateSubscription`

**Request Body:**
```json
{
  "userId": "user_object_id",
  "subscriptionId": "subscription_plan_object_id",
  "transactionId": "1000000123456789",
  "amount": 299,
  "status": "active",
  "startDate": "2024-01-01T00:00:00.000Z",
  "paymentMethod": "Apple IAP",
  "planName": "Basic Plan",
  "serviceType": "job_portal_subscription",
  "serviceDescription": "Job posting and recruitment platform access",
  "userType": "employee",
  "iapReceipt": "base64_receipt_data",
  "iapProductId": "com.laborlink.employee.basic"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Subscription activated successfully",
  "data": {
    "_id": "subscription_record_id",
    "userId": "user_object_id",
    "subscriptionId": "subscription_plan_object_id",
    "transactionId": "1000000123456789",
    "status": "active",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (Error - Duplicate):**
```json
{
  "success": false,
  "message": "Transaction already processed",
  "data": {
    "_id": "existing_subscription_id",
    "transactionId": "1000000123456789"
  }
}
```

---

### 3. Get User Subscriptions

Retrieves all subscriptions for a user.

**Endpoint:** `GET /api/user/subscriptions/:userId`

**Parameters:**
- `userId` (path parameter): User's MongoDB ObjectId

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "subscription_record_id",
      "userId": "user_object_id",
      "subscriptionId": {
        "_id": "plan_id",
        "displayName": "Basic Plan",
        "price": 299,
        "type": "employee"
      },
      "transactionId": "1000000123456789",
      "status": "active",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-02-01T00:00:00.000Z",
      "paymentMethod": "Apple IAP",
      "planName": "Basic Plan",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4. Apple Webhook (Server-to-Server Notifications)

Receives notifications from Apple about subscription events.

**Endpoint:** `POST /api/user/iap/webhook`

**Request Body (from Apple):**
```json
{
  "notification_type": "DID_RENEW",
  "latest_receipt_info": {
    "transaction_id": "1000000123456789",
    "original_transaction_id": "1000000123456789",
    "product_id": "com.laborlink.employee.basic",
    "purchase_date_ms": "1704067200000",
    "expires_date_ms": "1706745600000"
  }
}
```

**Notification Types Handled:**
- `INITIAL_BUY` - New subscription purchased
- `DID_RENEW` - Subscription renewed
- `DID_FAIL_TO_RENEW` - Renewal failed
- `CANCEL` - Subscription cancelled
- `DID_CHANGE_RENEWAL_STATUS` - Auto-renewal status changed

**Response:**
```
200 OK
```

---

## Database Schema

### UserSubscription Model

```javascript
{
  userId: ObjectId,              // Reference to user
  subscriptionId: ObjectId,      // Reference to subscription plan
  planName: String,              // Plan display name
  userType: String,              // 'employee' or 'employer'
  transactionId: String,         // Unique transaction ID
  amount: Number,                // Subscription amount
  paymentMethod: String,         // 'Apple IAP', 'PhonePe', etc.
  status: String,                // 'active', 'expired', 'cancelled', 'pending'
  startDate: Date,               // Subscription start date
  endDate: Date,                 // Subscription end date (null for lifetime)
  serviceType: String,           // Service type identifier
  serviceDescription: String,    // Service description
  iapReceipt: String,           // Apple receipt data
  iapProductId: String,         // Apple product ID
  iapEnvironment: String,       // 'sandbox' or 'production'
  originalTransactionId: String, // Original transaction ID from Apple
  autoRenew: Boolean,           // Auto-renewal enabled
  renewalDate: Date,            // Next renewal date
  metadata: Mixed,              // Additional metadata
  createdAt: Date,              // Record creation date
  updatedAt: Date               // Record update date
}
```

---

## Error Codes

### Apple Receipt Validation Status Codes

| Code  | Description |
|-------|-------------|
| 0     | Success |
| 21000 | The App Store could not read the JSON object |
| 21002 | The receipt data was malformed or missing |
| 21003 | The receipt could not be authenticated |
| 21004 | The shared secret does not match |
| 21005 | The receipt server is not currently available |
| 21006 | Receipt is valid but subscription has expired |
| 21007 | Receipt is from the test environment |
| 21008 | Receipt is from the production environment |
| 21009 | Internal data access error |
| 21010 | User account cannot be found or has been deleted |

---

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# Apple In-App Purchase Configuration
APPLE_SHARED_SECRET=your_apple_shared_secret_here
```

### Getting the Shared Secret

1. Go to App Store Connect
2. Select your app
3. Go to "App Information"
4. Find "App-Specific Shared Secret"
5. Click "Generate" if not already generated
6. Copy and add to `.env`

---

## Testing

### Sandbox Testing

1. Use Apple's sandbox environment for testing
2. Create sandbox test accounts in App Store Connect
3. Test receipts will have status code 21007 (sandbox)
4. Backend automatically handles sandbox receipts

### Test Receipt Validation

```bash
curl -X POST https://laborlink.co.in/api/user/validateIAPReceipt \
  -H "Content-Type: application/json" \
  -d '{
    "receipt": "base64_receipt_data",
    "productId": "com.laborlink.employee.basic",
    "transactionId": "1000000123456789",
    "platform": "ios"
  }'
```

### Test Subscription Activation

```bash
curl -X POST https://laborlink.co.in/api/user/activateSubscription \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "subscriptionId": "plan_id",
    "transactionId": "1000000123456789",
    "amount": 299,
    "status": "active",
    "paymentMethod": "Apple IAP",
    "planName": "Basic Plan",
    "userType": "employee"
  }'
```

---

## Security Considerations

1. **Receipt Validation:**
   - Always validate receipts server-side
   - Never trust client-side validation alone
   - Store receipts securely

2. **Transaction IDs:**
   - Check for duplicate transactions
   - Use unique transaction IDs
   - Prevent replay attacks

3. **Shared Secret:**
   - Keep shared secret secure
   - Never expose in client code
   - Use environment variables

4. **Webhook Security:**
   - Verify webhook requests from Apple
   - Use HTTPS for webhook endpoint
   - Log all webhook events

---

## Monitoring

### Key Metrics to Track

1. Receipt validation success rate
2. Failed validations by error code
3. Subscription activation rate
4. Active subscriptions count
5. Renewal success rate
6. Cancellation rate

### Logging

All IAP operations are logged with:
- Transaction ID
- Product ID
- User ID
- Status
- Timestamp
- Error details (if any)

---

## Support

For issues:
1. Check backend logs for errors
2. Verify Apple shared secret is correct
3. Ensure products are configured in App Store Connect
4. Test with sandbox account first
5. Check Apple's system status: https://developer.apple.com/system-status/

---

## References

- [Apple IAP Documentation](https://developer.apple.com/in-app-purchase/)
- [Receipt Validation Guide](https://developer.apple.com/documentation/appstorereceipts/verifyreceipt)
- [Server-to-Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications)

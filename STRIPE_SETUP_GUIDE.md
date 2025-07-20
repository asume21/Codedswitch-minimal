# 🔥 COMPLETE STRIPE SETUP GUIDE FOR CODEDSWITCH

## 🚀 **STEP-BY-STEP STRIPE INTEGRATION**

### **Step 1: Create Stripe Account**
1. Go to https://dashboard.stripe.com
2. Sign up or log in to your account
3. Complete account verification (required for live payments)

### **Step 2: Get Your API Keys**
1. Navigate to **Developers → API Keys**
2. Copy these keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

### **Step 3: Update Environment Variables**

#### **Backend (.env file)**
```bash
# Replace with your actual Stripe keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
ADMIN_KEY=codedswitch_admin_2025
```

#### **Frontend (.env file)**
```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### **Step 4: Set Up Webhooks**
1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-backend-url.com/api/stripe/webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

---

## 💰 **PRICING CONFIGURATION**

### **Current Plans**
- **Free**: $0/month (5 lyrics, 2 music, 10 translations)
- **Pro**: $9.99/month (100 lyrics, 25 music, 500 translations)
- **Premium**: $29.99/month (Unlimited everything)

### **How It Works**
1. **User clicks "Subscribe"** on your pricing page
2. **Stripe checkout** opens with plan details
3. **Payment succeeds** → Webhook triggers
4. **API key automatically generated** for user
5. **User gets email** with their new API key

---

## 🔧 **API ENDPOINTS READY**

### **Payment Flow**
```bash
# 1. Create checkout session
POST /api/create-checkout-session
{
  "planId": "pro",
  "email": "user@example.com"
}

# 2. Stripe redirects to success page
GET /api/stripe/success?session_id=cs_test_...

# 3. Webhook automatically generates API key
POST /api/stripe/webhook
```

### **Key Management**
```bash
# Generate API key manually
POST /api/keys/generate
{
  "adminKey": "codedswitch_admin_2025",
  "plan": "pro",
  "userId": "user@example.com"
}

# Create God mode key
POST /api/keys/god
{
  "adminKey": "codedswitch_admin_2025"
}
```

---

## 🧪 **TESTING STRIPE**

### **Test Credit Cards**
- **Visa**: `4242424242424242`
- **Visa (Debit)**: `4000056655665556`
- **Mastercard**: `5555555555554444`
- **American Express**: `378282246310005`
- **Declined**: `4000000000000002`

### **Test Flow**
1. Use test API keys (start with `pk_test_` and `sk_test_`)
2. Go to your pricing page
3. Click "Subscribe to Pro"
4. Use test card: `4242424242424242`
5. Check webhook logs for API key generation
6. Verify key works with API calls

---

## 🔐 **SECURITY BEST PRACTICES**

### **Environment Variables**
- ✅ **Never commit** API keys to Git
- ✅ **Use test keys** for development
- ✅ **Switch to live keys** only for production
- ✅ **Rotate keys** if compromised

### **Webhook Security**
- ✅ **Verify webhook signatures** (implemented)
- ✅ **Use HTTPS** for webhook endpoints
- ✅ **Log webhook events** for debugging

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Before Going Live**
- [ ] Complete Stripe account verification
- [ ] Switch to live API keys (`pk_live_`, `sk_live_`)
- [ ] Update webhook endpoint to production URL
- [ ] Test full payment flow
- [ ] Set up email notifications for API keys
- [ ] Configure proper error handling

### **Production Environment Variables**
```bash
# Live Stripe keys
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET

# Other production settings
ADMIN_KEY=your_secure_admin_key_change_this
```

---

## 📧 **AUTOMATIC API KEY DELIVERY**

### **Current Flow**
1. **Payment succeeds** → Webhook triggered
2. **API key generated** automatically
3. **Console log** shows key (for now)
4. **TODO**: Send email with API key

### **Email Integration (Next Step)**
```python
# Add to webhook handler
def send_api_key_email(user_email, api_key, plan):
    msg = Message(
        subject=f'Your CodedSwitch {plan.title()} API Key',
        sender=app.config['MAIL_USERNAME'],
        recipients=[user_email]
    )
    msg.body = f'''
    Welcome to CodedSwitch {plan.title()}!
    
    Your API Key: {api_key}
    
    Use this key in your API requests as:
    - Header: X-API-Key: {api_key}
    - Or in JSON body: "apiKey": "{api_key}"
    
    Happy coding and creating!
    '''
    mail.send(msg)
```

---

## 🎯 **QUICK START**

1. **Get Stripe keys** from dashboard
2. **Update both .env files** with your keys
3. **Deploy your changes**
4. **Test with test card** `4242424242424242`
5. **Check webhook logs** for API key generation
6. **Go live** when ready!

**Your complete payment system is ready! 🔥💳✨**

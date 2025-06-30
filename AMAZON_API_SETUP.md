# Amazon Product Advertising API Setup Guide

This guide will help you set up the Amazon Product Advertising API to get real, working Amazon affiliate links and accurate pricing data.

## Prerequisites

### 1. Amazon Associates Account
- **Join Amazon Associates**: Visit https://affiliate-program.amazon.com/
- **Complete Application**: Fill out application with your website/app details
- **Get Approved**: Wait for approval (can take a few days)
- **Make Your First Sale**: You MUST make at least one qualifying sale before applying for PA API

### 2. Product Advertising API Access
- **Apply for PA API**: After making a sale, go to Associates Central > Tools > Product Advertising API
- **Click "Join"**: Request access to the PA API
- **Wait for Approval**: This requires existing sales history
- **Important**: API access is only available to associates with proven sales

## Getting Your API Credentials

### Step 1: Access Your Credentials
1. Login to Amazon Associates Central
2. Go to **Tools** > **Product Advertising API**
3. Click **"Manage Credentials"**
4. Click **"Continue to Security Credentials"**
5. Expand the **"Access Keys"** section

### Step 2: Create or View Access Keys
- You can have a maximum of 2 access key pairs
- If you don't have keys, click **"Create New Access Key"**
- **Important**: New keys take 48 hours to become active

### Step 3: Get Your Partner Tag
- Your Partner Tag is your Associate ID (e.g., `yoursite-20`)
- Found in Associates Central under your account settings

## Environment Variable Setup

Create a `.env` file in your project root with your credentials:

```bash
# US Market (Required)
AMAZON_ACCESS_KEY_US=your_us_access_key_here
AMAZON_SECRET_KEY_US=your_us_secret_key_here
AMAZON_PARTNER_TAG_US=yoursite-20

# Other Markets (Optional)
AMAZON_ACCESS_KEY_CA=your_ca_access_key_here
AMAZON_SECRET_KEY_CA=your_ca_secret_key_here
AMAZON_PARTNER_TAG_CA=yoursite-ca-20

AMAZON_ACCESS_KEY_UK=your_uk_access_key_here
AMAZON_SECRET_KEY_UK=your_uk_secret_key_here
AMAZON_PARTNER_TAG_UK=yoursite-21

AMAZON_ACCESS_KEY_DE=your_de_access_key_here
AMAZON_SECRET_KEY_DE=your_de_secret_key_here
AMAZON_PARTNER_TAG_DE=yoursite-21

AMAZON_ACCESS_KEY_AU=your_au_access_key_here
AMAZON_SECRET_KEY_AU=your_au_secret_key_here
AMAZON_PARTNER_TAG_AU=yoursite-au-20
```

## Important Limitations & Requirements

### Sales Requirement
- **30-Day Rule**: You must make at least one qualifying sale every 30 days
- **No Sales = No Data**: If you don't sell anything within 30 days, API returns no product data
- **Account Suspension**: Inactive accounts lose API access

### Rate Limits
- **8,640 requests per day** (1 request every 10 seconds)
- **1 request per second** maximum
- Exceeding limits results in throttling

### Market Restrictions
- **Separate Applications**: Each marketplace (US, CA, UK, etc.) requires separate Associate accounts
- **Regional Keys**: Use market-specific access keys for each region

## Testing Your Setup

### Step 1: Check Console Logs
When you run the application, look for these console messages:

```
✅ Amazon PA API service initialized
🏆 Using Amazon PA API for Intel Core i5-14600K: B0CHX4VZ5Q
```

### Step 2: Test a Product Search
The system will automatically try to use PA API for all component searches. If working, you'll see:
- Real product titles
- Current Amazon prices
- Working affiliate links
- Product images and reviews

### Step 3: Fallback Behavior
If PA API is not configured, you'll see:
```
⚠️ Amazon PA API not available (setup required)
🕷️ Using real scraped ASIN for Intel Core i5-14600K: B0CHX4VZ5Q
```

## Troubleshooting

### "API credentials not found"
- Check your `.env` file exists and has correct variable names
- Ensure no extra spaces around `=` signs
- Restart your development server after adding environment variables

### "API keys not working"
- New API keys take **48 hours to activate**
- Verify keys are correct (no extra spaces or characters)
- Check that your Associate account is in good standing

### "No product data returned"
- Ensure you've made a qualifying sale in the last 30 days
- Check that your search terms are valid
- Verify you're using the correct marketplace/region

### "Request limit exceeded"
- You're making too many API calls (max 1 per second)
- Implement caching to reduce API calls
- Consider upgrading to higher limits if available

## Benefits of PA API Setup

When properly configured, you get:

1. **Real Amazon Links**: Always current and working affiliate links
2. **Accurate Pricing**: Live Amazon prices updated in real-time
3. **Product Data**: Images, reviews, ratings, availability
4. **Better Conversion**: Official Amazon links have higher trust
5. **Regional Support**: Proper marketplace handling for international users

## Alternative: Development Mode

Without PA API credentials, the system will:
- Use fallback scraping methods (may break)
- Show mock data for development
- Still generate working affiliate links using verified ASINs
- Display setup instructions in console

The app will work without PA API, but you'll get the best results with proper API setup.
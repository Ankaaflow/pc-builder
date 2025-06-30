# Comprehensive Component Database System Setup

This guide sets up the complete automated component database system that automatically maintains working Amazon links for ALL products by extracting components from Reddit and validating links continuously.

## 🏗️ System Architecture Overview

```
Reddit Posts (r/buildapc, r/buildapcforme)
    ↓
Component Extraction Service
    ↓
Supabase Database (7 tables)
    ↓
Amazon Product Matching (PA API + Scraping)
    ↓
Automated Link Validation
    ↓
Working Amazon Links for ALL Components
```

## 📊 Database Tables Created

### Core Tables
1. **`components`** - Master component registry
2. **`component_pricing`** - Regional pricing data
3. **`amazon_links`** - ASIN tracking with validation status
4. **`reddit_mentions`** - Component mentions from Reddit
5. **`link_validations`** - Historical validation results
6. **`component_popularity`** - Popularity scores and metrics
7. **`system_logs`** - Process monitoring and debugging

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Execute the migration to create all tables:

```bash
# Apply the migration to your Supabase instance
supabase db reset
# or apply the migration file directly in Supabase dashboard
```

The migration file is located at: `supabase/migrations/001_create_component_tables.sql`

### Step 2: Start the Automated System

```typescript
import { automatedMaintenanceService } from './src/services/automatedMaintenanceService';

// Start all automated processes
automatedMaintenanceService.start();
```

### Step 3: Access Database Admin Interface

Navigate to `/database-admin` to monitor the system:

- View component statistics
- Monitor link health
- Control automated processes
- View system logs
- Manage popular components

## 🔄 Automated Processes

### 1. Reddit Component Extraction (Every 2 Hours)
- Fetches latest posts from r/buildapc and r/buildapcforme
- Extracts component mentions using pattern matching
- Stores components in database with confidence scores
- Updates popularity metrics

### 2. Amazon Link Updates (Every 4 Hours)
- Finds Amazon products for database components
- Uses Amazon PA API when available
- Falls back to web scraping
- Updates ASINs with confidence scores
- Supports all regions (US, CA, UK, DE, AU)

### 3. Link Validation (Every 6 Hours)
- Validates existing Amazon links
- Marks invalid links for re-processing
- Tracks validation history
- Triggers automatic link refresh for broken links

### 4. Popularity Recalculation (Daily)
- Recalculates popularity scores based on:
  - Reddit mention frequency
  - Component selection in app
  - Recency of mentions
  - User engagement metrics

## 📈 Key Benefits

### ✅ Automatic Link Maintenance
- **No more broken links**: System automatically finds and validates Amazon products
- **Always current**: Links updated based on latest Amazon inventory
- **High confidence matching**: Multiple validation layers ensure correct products

### ✅ Reddit-Powered Discovery
- **Real components**: Only includes parts actually discussed by PC builders
- **Popularity-based**: Most mentioned components get priority
- **Budget-aware**: Tracks component mentions in budget contexts

### ✅ Multi-Region Support
- **Global coverage**: Automatic region-specific Amazon links
- **Currency conversion**: Pricing adjusted for local markets
- **Localized availability**: Region-specific inventory tracking

### ✅ Comprehensive Monitoring
- **Health metrics**: Track link validity percentages
- **Process logging**: Monitor all automated operations
- **Performance insights**: Component popularity and selection trends

## 🔧 Manual Operations

### Initialize with Existing Components
```typescript
import { redditComponentExtractor } from './src/services/redditComponentExtractor';

// Extract components from recent Reddit posts
await redditComponentExtractor.runExtractionProcess();
```

### Force Amazon Link Refresh
```typescript
import { amazonProductMatchingService } from './src/services/amazonProductMatchingService';

// Update links for specific region
await amazonProductMatchingService.bulkUpdateAmazonLinks('US', 50);
```

### Run Complete Maintenance Cycle
```typescript
import { automatedMaintenanceService } from './src/services/automatedMaintenanceService';

// Run all maintenance tasks manually
await automatedMaintenanceService.runManualMaintenance();
```

## 📊 Monitoring and Analytics

### Database Admin Dashboard
Access real-time metrics at `/database-admin`:

- **Component Count**: Total tracked components
- **Link Health**: Percentage of working Amazon links
- **Recent Activity**: New Reddit mentions and extractions
- **Popular Components**: Most discussed components
- **System Status**: Automated process health

### Key Metrics to Monitor
- **Link Validity Rate**: Should stay above 85%
- **Component Growth**: New components added from Reddit
- **Processing Success**: Reddit extraction and Amazon matching rates
- **System Uptime**: Automated maintenance service status

## 🛠️ Advanced Configuration

### Extraction Patterns
Components are extracted using sophisticated patterns:

```typescript
// CPU patterns
/(?:Intel )?Core i[3579]-\d{4,5}[KF]?[S]?/gi
/(?:AMD )?Ryzen [3579] \d{4}[X]?[3D]?/gi

// GPU patterns  
/(?:NVIDIA )?(?:GeForce )?RTX \d{4}[\w\s]*?(?:Ti|Super)?/gi
/(?:AMD )?(?:Radeon )?RX \d{4}[\w\s]*?(?:XT|XTX)?/gi
```

### Amazon Matching Logic
1. **PA API Search** (highest confidence)
2. **Web Scraping** (fallback)
3. **Brand + Model** (precise matching)
4. **Confidence Scoring** (0-1 scale)

### Popularity Algorithm
```
Score = (Reddit Mentions × 10 + App Selections × 5) × Recency Factor
Recency Factor: 2.0 (< 7 days), 1.5 (< 30 days), 1.0 (< 90 days), 0.5 (older)
```

## 🚨 Troubleshooting

### High Invalid Link Rate
1. Check Amazon PA API credentials
2. Review scraping rate limits
3. Examine validation logs for patterns

### Low Component Discovery
1. Verify Reddit API access
2. Check extraction pattern effectiveness
3. Monitor subreddit activity levels

### Performance Issues
1. Review database query performance
2. Check automated process intervals
3. Monitor memory usage during bulk operations

## 🔐 Security Considerations

- **RLS Enabled**: Row Level Security on all tables
- **Read-Only Public**: Public users can only read data
- **Admin Controls**: Sensitive operations require authentication
- **Rate Limiting**: API calls properly rate-limited
- **Error Handling**: Comprehensive error logging

## 📈 Scaling Recommendations

### For High Volume
- Implement database connection pooling
- Add Redis caching for popular components
- Use queue system for bulk operations
- Consider read replicas for analytics

### For Multiple Regions
- Add region-specific Reddit sources
- Implement currency conversion APIs
- Expand Amazon marketplace coverage
- Localize component naming patterns

This system provides a completely autonomous solution for maintaining accurate, working Amazon affiliate links for ALL PC components mentioned in the community, eliminating the broken link problem permanently.
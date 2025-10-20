# 🚀 Deployment Guide - Anclora RAG Landing Page

## 📋 Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**

   ```bash
   # Push this code to a GitHub repository
   git init
   git add .
   git commit -m "Initial landing page setup"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repository
   - Vercel will auto-detect Next.js configuration
   - Click "Deploy"

3. **Configure Domain**
   - In Vercel dashboard, go to Project Settings → Domains
   - Add your custom domain (e.g., `www.anclora.com`)
   - Vercel will provide DNS records to configure

4. **Environment Variables**
   Add these in Vercel dashboard (Project Settings → Environment Variables):

   ```bash
   BACKEND_API_URL=https://api.anclora.com
   NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID
   NEXT_PUBLIC_APP_URL=https://www.anclora.com
   ```

### Option 2: Netlify

1. **Alternative Configuration**

   ```bash
   # Create netlify.toml if using Netlify
   [build]
   command = "npm run build"
   publish = ".next"

   [[redirects]]
   from = "/api/*"
   to = "https://api.anclora.com/api/:splat"
   status = 200
   ```

## 🔒 SSL Configuration

### Automatic (Vercel/Netlify)

- SSL certificate is automatically provisioned
- Supports both `www.anclora.com` and `anclora.com`
- Auto-renewal included

### Manual (Other Hosts)

If hosting elsewhere, configure SSL through:

- **Let's Encrypt** (Free)
- **Cloudflare** (Free with CDN)
- **AWS Certificate Manager** (If using AWS)

## 🌐 DNS Configuration

### Required Records

**For `anclora.com`:**

1. **A Record** (for root domain)

```dns
Name: @
Value: [Vercel/Netlify IP or CNAME]
TTL: 300
```

2. **CNAME Record** (for www subdomain)

```dns
Name: www
Value: [Vercel/Netlify provided URL]
TTL: 300
```

### DNS Providers

- **Namecheap**: Use Advanced DNS
- **GoDaddy**: DNS Management
- **Cloudflare**: DNS tab (recommended for performance)

## 📊 Google Analytics Setup

1. **Create GA4 Property**
   - Go to [Google Analytics](https://analytics.google.com)
   - Create new property for `anclora.com`
   - Copy the Measurement ID (G-XXXXXXXXXX)

2. **Add to Environment**

   ```bash
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

## 🚀 Production Checklist

- [ ] Domain configured and pointing to hosting
- [ ] SSL certificate active (green padlock)
- [ ] Environment variables set
- [ ] Google Analytics tracking
- [ ] Backend API accessible from domain
- [ ] Email functionality tested
- [ ] Mobile responsiveness verified

## 🔧 Environment Variables Reference

```bash
# Production Environment
BACKEND_API_URL=https://api.anclora.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_APP_URL=https://www.anclora.com

# Development Environment
BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 📞 Support

For deployment issues:

- **Vercel**: 24/7 chat support
- **Netlify**: Community forums + email support
- **Domain Issues**: Contact your DNS provider

---

**Next Steps After Deployment:**

1. Test waitlist form submission
2. Verify email delivery
3. Check Google Analytics data collection
4. Monitor for errors in hosting dashboard

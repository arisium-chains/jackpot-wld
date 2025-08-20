# World App Dev Portal Configuration Checklist

## Required Configuration for JackpotWLD Mini App

### 1. App Information

- **App Name**: JackpotWLD
- **App Description**: Earn yield and win prizes with World ID verification on Worldchain
- **Category**: DeFi/Gaming
- **Network**: World Chain Sepolia (4801)

### 2. Allowed Origins (Required)

These domains must be added to the "Allowed Origins" section in the Dev Portal:

```
http://localhost:3000
https://localhost:3000
https://your-staging-domain.vercel.app
https://your-production-domain.com
```

**Note**: Replace `your-staging-domain` and `your-production-domain` with actual deployment URLs.

### 3. Redirect URIs (Required)

These URIs must be added to the "Redirect URIs" section:

```
http://localhost:3000/api/auth/callback
https://localhost:3000/api/auth/callback
https://your-staging-domain.vercel.app/api/auth/callback
https://your-production-domain.com/api/auth/callback
```

### 4. World ID Action Configuration

- **Action ID**: `pool-together-deposit`
- **Action Description**: "Verify identity for PoolTogether deposit"
- **Verification Level**: `orb` (recommended) or `device`
- **Max Verifications**: `1` (one verification per person)

### 5. Environment Variables to Update

After configuring the Dev Portal, update these values in `.env.local`:

```bash
# Replace with actual values from Dev Portal
NEXT_PUBLIC_WORLD_APP_ID=app_staging_xxxxxxxxxx
NEXT_PUBLIC_WORLD_ID_APP_ID=app_xxxxxxxxxx
NEXT_PUBLIC_WORLD_ID_ACTION_ID=pool-together-deposit
```

### 6. Testing Checklist

#### Local Development

- [ ] App loads at `http://localhost:3000`
- [ ] World ID verification component appears on `/deposit` page
- [ ] Mock verification works in development mode
- [ ] No console errors related to World ID configuration

#### Staging Environment

- [ ] App deployed to staging URL
- [ ] Staging URL added to Allowed Origins
- [ ] World ID verification works with real World App
- [ ] Can complete full deposit flow with World ID

#### Production Readiness

- [ ] Production domain configured
- [ ] SSL certificate valid
- [ ] All environment variables set correctly
- [ ] World ID action properly configured
- [ ] Rate limiting and security measures in place

### 7. Security Considerations

#### HTTPS Requirements

- All production URLs **must** use HTTPS
- SSL certificates must be valid and not self-signed
- Redirect URIs must match exactly (including trailing slashes)

#### Domain Validation

- Only add trusted domains to Allowed Origins
- Verify domain ownership before adding to production
- Use environment-specific configurations

### 8. Common Issues and Solutions

#### "Invalid Origin" Error

- **Cause**: Domain not in Allowed Origins list
- **Solution**: Add exact domain (including protocol and port) to Dev Portal

#### "Action Not Found" Error

- **Cause**: Action ID mismatch or not configured
- **Solution**: Verify Action ID matches between code and Dev Portal

#### "Verification Failed" Error

- **Cause**: Invalid proof or configuration mismatch
- **Solution**: Check World ID configuration and ensure proper signal handling

### 9. Deployment URLs Template

```bash
# Development
http://localhost:3000

# Staging (Vercel)
https://jackpotwld-staging.vercel.app

# Production
https://jackpotwld.com
```

### 10. Final Verification Steps

1. **Test in World App Simulator**: Use World App's testing tools
2. **Verify API Endpoints**: Ensure `/api/worldid/verify` responds correctly
3. **Check Network Configuration**: Confirm World Chain Sepolia (4801) is supported
4. **Validate Contract Addresses**: Ensure all contract addresses are correct
5. **Test Complete Flow**: From World ID verification to successful deposit

---

**Important**: Keep this checklist updated as the application evolves and new domains are added.

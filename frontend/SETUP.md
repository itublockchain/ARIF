# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```bash
# WalletConnect Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_actual_walletconnect_project_id

# Persona KYC Configuration
PERSONA_API_KEY=your_persona_api_key
PERSONA_INQUIRY_TEMPLATE_ID=your_persona_template_id
PERSONA_WEBHOOK_SECRET=your_persona_webhook_secret

# RISE Network Configuration
NEXT_PUBLIC_RISE_RPC=https://testnet.riselabs.xyz

# EAS Configuration (for attestations)
NEXT_PUBLIC_EAS_ADDRESS=0x4200000000000000000000000000000000000021
NEXT_PUBLIC_EAS_SCHEMA_KYC=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
NEXT_PUBLIC_EAS_SCHEMA_GRADE=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Attestation Signer (for creating EAS attestations)
ATTESTATION_SIGNER_PRIVATE_KEY=your_private_key_here
```

## Getting Started

1. **WalletConnect Project ID**:

   - Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy the Project ID

2. **Persona API Key**:

   - Sign up at [Persona](https://withpersona.com/)
   - Get your API key from the dashboard
   - Create an inquiry template

3. **Private Key for Attestations**:
   - Generate a new private key for creating attestations
   - Make sure it has enough funds for gas fees

## Development Mode

If you don't have all the API keys yet, the application will work in development mode with mock responses for:

- KYC status checking
- EAS attestation creation

## Current Issues Fixed

✅ React hydration mismatch
✅ WalletConnect configuration errors
✅ KYC attestation API errors
✅ Persona integration issues
✅ Wallet address undefined errors

The application should now work properly in development mode!

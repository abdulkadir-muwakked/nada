# Nada App (Expo)

## Start (Dev Client)
```bash
cd /Users/macbookm3/Documents/nada-project/nada
npx expo start --dev-client --clear
```

## Clerk Environment (EAS)
`ClerkProvider` reads the key from:

- `process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

Set this in EAS environments (preview/production). Do not rely on local `.env` for TestFlight/production builds.

### Production
```bash
eas env:create --environment production --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value <pk_...>
```

### Preview
```bash
eas env:create --environment preview --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value <pk_...>
```

### Build
```bash
eas build --platform ios --profile production
```

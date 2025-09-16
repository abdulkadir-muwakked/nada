# App Store Submission Guide

This README provides instructions for preparing and submitting the Nada app to the Apple App Store.

## Preparation Checklist

Follow these steps in order:

1. ✅ **Update PrivacyInfo.xcprivacy**

   - The file has been updated with proper API access and data collection declarations
   - Includes Face ID and advertising data usage declarations

2. ✅ **Generate App Store Screenshots**

   - Use the provided screenshot helper:

     ```zsh
     # Make the script executable
     chmod +x ./scripts/generate-app-store-screenshots.sh

     # Run the script
     ./scripts/generate-app-store-screenshots.sh
     ```

   - Launch the app in development mode and navigate to the Screenshots tab
   - Take screenshots for all required device sizes

3. ✅ **Privacy Policy**

   - A privacy policy HTML file has been created at `/privacy-policy.html`
   - This file needs to be uploaded to your website
   - Add the URL to App Store Connect

4. ✅ **Development-Only Protection**

   - All development and test screens are protected from production access
   - Screenshots helper and AdMob test screens will only be accessible in development builds

5. ✅ **Content Rating Questionnaire**
   - Refer to the `APP_STORE_CONNECT_GUIDE.md` for content rating options
   - This app should receive a 4+ age rating based on content

## Build & Submission Process

1. **Clean the Project**

   ```zsh
   # Clean the iOS project
   cd ios
   rm -rf build
   rm -rf Pods
   pod install
   cd ..

   # Clean node_modules if needed
   # rm -rf node_modules
   # npm install
   ```

2. **Create Archive in Xcode**

   ```zsh
   # Open the workspace in Xcode
   open ios/MyApp.xcworkspace

   # Then in Xcode:
   # 1. Select "Any iOS Device" as the build target
   # 2. Select Product > Archive from the menu
   # 3. Wait for the archive to complete
   ```

3. **Validate and Upload**

   - In the Xcode Organizer window that appears after archiving:
     1. Select the archive
     2. Click "Validate App"
     3. Fix any validation issues
     4. Click "Distribute App"
     5. Follow the prompts to upload to App Store Connect

4. **App Store Connect Setup**

   - Log in to [App Store Connect](https://appstoreconnect.apple.com/)
   - Select your app
   - Complete all required information:
     - App metadata
     - Privacy policy URL
     - Screenshots
     - Content rating questionnaire
     - Review information

5. **Submit for Review**
   - Once all information is complete and your build is processed
   - Select the build for your version
   - Click "Submit for Review"

## Additional Resources

- **App Store Connect Guide**: See `APP_STORE_CONNECT_GUIDE.md` for detailed instructions on completing App Store Connect setup
- **Submission Checklist**: See `APP_STORE_SUBMISSION_CHECKLIST.md` for a comprehensive checklist
- **AdMob Integration**: See `ADMOB_INTEGRATION.md` for details on the AdMob implementation

## Troubleshooting

### Common Validation Issues

1. **Missing Privacy Declarations**

   - Ensure the `PrivacyInfo.xcprivacy` file is properly configured
   - Verify all API access and data collection is declared

2. **Entitlements Issues**

   - If you encounter entitlements issues, check the app's entitlements in Xcode

3. **Invalid Icon**
   - Ensure your app icon is 1024x1024 pixels
   - No alpha channel or transparency
   - RGB color space

### Rejection Reasons

If your app is rejected, check for:

1. **Metadata Issues**

   - Incomplete or inaccurate App Store information
   - Missing privacy policy

2. **Functionality Issues**

   - App crashes or doesn't work as described
   - Missing features mentioned in description

3. **Privacy Issues**
   - Incomplete or inaccurate privacy declarations
   - Not handling user data properly

## Support

For assistance with App Store submission issues:

- [Apple Developer Forums](https://developer.apple.com/forums/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Contact App Review](https://developer.apple.com/contact/app-store/)

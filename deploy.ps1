# Build and Deploy to Cloudflare Pages
Write-Host "Building Angular production bundle..."
npx ng build --configuration production

Write-Host "Deploying to Firebase Hosting..."
firebase deploy --only hosting --project expensio-b16b0

Write-Host "Deployment complete!"

# Build and Deploy to Cloudflare Pages
Write-Host "Building Angular production bundle..."
npm run build --configuration production

Write-Host "Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist/expensio --project-name expensio

Write-Host "Deployment complete!"

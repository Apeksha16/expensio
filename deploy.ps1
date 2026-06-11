# deploy.ps1
# Usage: .\deploy.ps1

Write-Host "========================================"
Write-Host "🚀 STARTING DEPLOYMENT PIPELINE"
Write-Host "========================================"

# STEP 1: Deploy Database & Edge Functions
Write-Host ""
Write-Host "📦 [1/3] DEPLOYING DATABASE & EDGE FUNCTIONS..." -ForegroundColor Cyan

Write-Host "Pushing Database Migrations..."
npx supabase db push
if ($LASTEXITCODE -ne 0) { Write-Error "Database push failed!"; exit $LASTEXITCODE }

Write-Host "Deploying Edge Functions..."
npx supabase functions deploy list-expenses
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to deploy list-expenses!"; exit $LASTEXITCODE }

npx supabase functions deploy get-expense
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to deploy get-expense!"; exit $LASTEXITCODE }

# STEP 2: Deploy Backend
Write-Host ""
Write-Host "⚙️ [2/3] DEPLOYING BACKEND (RENDER)..." -ForegroundColor Cyan

# Since Render is connected to Git, pushing to the production branch will trigger the deployment.
# Alternatively, if you have a Render Deploy Hook URL, you can trigger it here:
# Invoke-RestMethod -Uri "YOUR_RENDER_DEPLOY_HOOK_URL" -Method Post
Write-Host "Backend deployment is typically triggered via git push to the main branch."
Write-Host "We will commit and push changes now to trigger the Render pipeline."

git add .
$status = git status --porcelain
if ($status) {
    git commit -m "chore: trigger deployment"
    git push origin 3.1
    if ($LASTEXITCODE -ne 0) { Write-Error "Git push failed!"; exit $LASTEXITCODE }
} else {
    Write-Host "No changes to commit. Proceeding..."
}

# STEP 3: Deploy Frontend
Write-Host ""
Write-Host "🌐 [3/3] DEPLOYING FRONTEND (VERCEL)..." -ForegroundColor Cyan

# Vercel is also triggered by the git push above.
# If you prefer to deploy manually via Vercel CLI, uncomment the next line:
# npx vercel --prod --yes
Write-Host "Frontend deployment has been triggered via the git push."

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================"

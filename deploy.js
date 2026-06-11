const { execSync } = require('child_process');

function run(command) {
  try {
    console.log(`\n> ${command}`);
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Command failed: ${command}`);
    process.exit(1);
  }
}

async function deploy() {
  console.log('========================================');
  console.log('🚀 STARTING SEQUENTIAL DEPLOYMENT');
  console.log('========================================');

  // STEP 1: Deploy Supabase (Database + Edge Functions)
  console.log('\n📦 [1/3] DEPLOYING DATABASE & EDGE FUNCTIONS...');
  run('npx supabase db push');
  run('npx supabase functions deploy list-expenses');
  run('npx supabase functions deploy get-expense');
  // Add other edge functions if needed

  // STEP 2: Deploy Backend
  console.log('\n⚙️  [2/3] DEPLOYING BACKEND (RENDER)...');
  // NOTE: If you use Render, it auto-deploys on git push.
  // To deploy it manually and wait, you can use a Render Deploy Hook:
  // e.g., run('curl -X POST https://api.render.com/deploy/srv-...');
  console.log('Backend is typically auto-deployed via GitHub.');
  console.log('Pushing changes to git to trigger backend...');
  run('git add .');
  try {
    execSync('git diff-index --quiet HEAD --');
    console.log('No git changes to commit.');
  } catch (e) {
    run('git commit -m "chore: manual sequential deploy"');
  }
  run('git push origin 3.1');

  // STEP 3: Deploy Frontend
  console.log('\n🌐 [3/3] DEPLOYING FRONTEND (VERCEL)...');
  // NOTE: If you use Vercel, it also auto-deploys on git push.
  // To specifically deploy frontend manually via CLI (bypassing git trigger):
  console.log('Frontend is typically auto-deployed via GitHub.');
  console.log(
    'If you wish to force a Vercel deploy manually via CLI, uncomment the next line in the script:'
  );
  // run('npx vercel --prod --yes');

  console.log('\n✅ DEPLOYMENT PIPELINE TRIGGERED SUCCESSFULLY!');
  console.log('========================================');
}

deploy();

# Quick Deployment Guide

## Git Issues? No Problem!

Since git commands are getting stuck, here are alternative ways to deploy:

### Option 1: GitHub Web Upload (Recommended)

1. **Go to your repository**: https://github.com/znanfelt/se-tool-matrix
2. **Delete existing files** (if any) or **create new repository**
3. **Upload files directly**:
   - Click "Add file" → "Upload files"
   - Drag all files from this folder into GitHub
   - Commit with message: "Update to Cloudflare AI"

### Option 2: Use GitHub CLI

```bash
# If you have GitHub CLI installed
gh repo clone znanfelt/se-tool-matrix temp-repo
cp -r * temp-repo/
cd temp-repo
git add .
git commit -m "Update to Cloudflare AI"
git push
cd ..
rm -rf temp-repo
```

### Option 3: Create New Repository

1. Create a fresh repository on GitHub
2. Upload these files
3. Connect to Cloudflare Pages

## Files to Upload

Make sure to upload all these files:
- `index.html`
- `functions/api/recommendations.js`
- `.github/workflows/deploy.yml`
- `package.json`
- `README.md`
- `SECURITY.md`
- `LICENSE`
- `.gitignore`
- `.env.example`
- `setup.sh`

## Cloudflare Pages Setup

Once files are in GitHub:

1. **Go to Cloudflare Pages**: https://pages.cloudflare.com/
2. **Connect to Git** → Select your repository
3. **Build settings**:
   - Build command: `echo "Static site"`
   - Build output: `/`
4. **Deploy** - No environment variables needed (Cloudflare AI works automatically!)

## Local Testing

Your local server is running at: http://localhost:8788
Test the AI recommendation feature to make sure everything works!

## Next Steps

Once deployed, the GitHub Actions will handle future deployments automatically.

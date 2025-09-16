# Game Fast - Unified Deployment System

This project now has a unified build and deployment system that handles both your original repository and GitHub Pages deployment automatically.

## 🚀 Quick Deployment Commands

### Deploy to GitHub Pages (Default)
```bash
npm run deploy:gh
# or
./deploy.sh github
```

### Deploy to Original Repository
```bash
npm run deploy:orig
# or
./deploy.sh original
```

### Deploy Script (Interactive)
```bash
npm run deploy
# or
./deploy.sh
```

## 🔧 How It Works

### Development
- **Local dev**: `npm run dev` - Uses normal base path (`/`)
- **Hot reload**: Works perfectly with TypeScript and Vite

### Production Builds
- **Original repo**: `npm run build` - Normal build for your main repo
- **GitHub Pages**: `npm run build:deploy` - Builds with `/miw2-deploy/` base path

### Automatic Deployment
- **Builds correctly** for each target
- **Copies files** to the right locations
- **Commits and pushes** automatically
- **No manual configuration** needed

## 📁 What Gets Deployed Where

### Original Repository
- Source code and `dist/` folder
- Normal build configuration
- Ready for any hosting platform

### GitHub Pages Repository
- Built files copied to root directory
- Correct base path configuration
- `vite.svg` favicon included
- Live at: `https://perfectjared.github.io/miw2-deploy/`

## 🎯 Benefits

✅ **No more manual switching** between build configs  
✅ **One command deployment** to either target  
✅ **Automatic file copying** and git operations  
✅ **Consistent development experience**  
✅ **No more MIME type errors** or path issues  

## 🔄 Workflow

1. **Develop**: `npm run dev` (works the same as always)
2. **Deploy to GitHub Pages**: `npm run deploy:gh`
3. **Deploy to original repo**: `npm run deploy:orig`

That's it! No more fucking around with build systems! 🎉

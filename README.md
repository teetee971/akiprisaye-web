# A KI PRI SA YÉ — Web Application

Modern Single Page Application (SPA) built with Vue 3, Vite, and Tailwind CSS for comparing prices and managing budgets in French overseas territories.

## 🚀 Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **ES Modules** - Modern JavaScript module system

## 📋 Features

- **Multilingual Support** - French, Kreyòl Guadeloupéen, and Spanish
- **Hero Carousel** - Full-screen image carousel with smooth fade transitions
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Modern Build System** - Fast HMR and optimized production builds
- **PWA Ready** - Progressive Web App capabilities with manifest

## 🛠️ Development

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/teetee971/akiprisaye-web.git
cd akiprisaye-web

# Install dependencies
npm install
```

### Development Server

```bash
# Start the development server with hot module replacement
npm run dev
```

The application will be available at `http://localhost:5173/` (or another port if 5173 is in use).

### Build for Production

```bash
# Create an optimized production build
npm run build
```

The build output will be in the `dist/` directory, ready for deployment.

### Preview Production Build

```bash
# Preview the production build locally
npm run preview
```

## 📁 Project Structure

```
akiprisaye-web/
├── src/
│   ├── assets/           # Images and static assets
│   │   ├── hero1.webp    # Carousel image 1
│   │   ├── hero2.webp    # Carousel image 2
│   │   └── hero3.webp    # Carousel image 3
│   ├── components/       # Vue components
│   │   ├── HeroCarousel.vue
│   │   ├── LanguageSwitcher.vue
│   │   └── StartButton.vue
│   ├── App.vue          # Main application component
│   ├── i18n.js          # Internationalization store
│   ├── main.js          # Application entry point
│   └── tailwind.css     # Tailwind CSS imports
├── public/              # Static public assets
│   └── _redirects       # Cloudflare Pages SPA routing
├── legacy/              # Archived old index files
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.cjs  # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

## 🌐 Deployment on Cloudflare Pages

### Configuration

1. **Build Command**: `npm run build`
2. **Build Output Directory**: `dist`
3. **Node Version**: 18 or higher

### Steps

1. Push your code to GitHub
2. Connect your repository to Cloudflare Pages
3. Configure the build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: Set `NODE_VERSION` to `18` or higher
4. Deploy!

The `public/_redirects` file ensures proper SPA routing on Cloudflare Pages by redirecting all routes to `index.html`.

## 🌍 Internationalization

The application supports three languages:

- **French (fr)** - Default language
- **Kreyòl Guadeloupéen (creole)** - Guadeloupean Creole
- **Spanish (es)** - Spanish

Language switching is instant and reactive, powered by a lightweight custom i18n store in `src/i18n.js`.

## 🎨 Customization

### Adding New Languages

Edit `src/i18n.js` and add your language to the `messages` object:

```javascript
messages: {
  en: {
    title: 'A KI PRI SA YÉ',
    subtitle: 'Manage your budget easily',
    // ... more translations
  }
}
```

### Modifying Carousel Images

Replace the images in `src/assets/` (hero1.webp, hero2.webp, hero3.webp) or update the imports in `src/components/HeroCarousel.vue`.

### Adjusting Carousel Timing

Edit the interval in `src/components/HeroCarousel.vue`:

```javascript
intervalId = setInterval(nextSlide, 5000); // Change 5000 to desired ms
```

## 🔧 Configuration Files

- **vite.config.js** - Vite configuration with Vue plugin and sourcemap enabled
- **tailwind.config.cjs** - Tailwind CSS configuration
- **postcss.config.js** - PostCSS configuration for Tailwind
- **package.json** - Project dependencies and scripts

## 📝 License

This project is part of the A KI PRI SA YÉ initiative to help residents of French overseas territories manage their budgets and fight against high living costs.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

---

Made with ❤️ for the French Caribbean communities

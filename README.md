# My Shop POS Application

A modern Point of Sale (POS) system built with Next.js, React, and TypeScript. Features include product management, multiple POS terminals, order processing, and mobile-responsive design.

## Features

- 🏪 **Multiple POS Terminals** - Support for multiple customizable POS terminals
- 📱 **Mobile Responsive** - Fully optimized for mobile devices and tablets
- 🛍️ **Product Management** - Add, edit, and manage products with images
- 📊 **Order Management** - Track orders and sales analytics
- 🎨 **Customizable Themes** - Each POS terminal can have its own theme color
- 📱 **Barcode Scanner** - Built-in barcode scanning functionality
- 💾 **Local Storage** - Data persistence using browser local storage
- 🖨️ **Receipt Generation** - Generate and download order receipts

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Icons**: Heroicons
- **Barcode Scanning**: html5-qrcode
- **Image Processing**: dom-to-image

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd my-shop-app
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Render.com

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Connect your repository to Render.com
3. The `render.yaml` file will automatically configure the deployment
4. Your app will be deployed with the following settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node.js
   - Port: 10000

### Manual Deployment Steps

1. Create a new Web Service on Render.com
2. Connect your Git repository
3. Set the following:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free (or your preferred plan)

## Usage

### Admin Features

1. **POS Management** (`/admin/pos`):
   - Create and manage POS terminals
   - Customize terminal themes
   - Enable/disable terminals

2. **Product Management** (`/admin/pos-products`):
   - Add products with images and details
   - Import products from CSV
   - Assign products to specific POS terminals
   - Toggle product visibility

3. **Order Management** (`/admin/orders`):
   - View all orders
   - Track sales analytics
   - Export order data

### POS Operations

1. **Terminal Selection** (`/pos`):
   - Choose from active POS terminals
   - Each terminal has its own product catalog

2. **Product Sales** (`/pos/[terminal]`):
   - Browse and search products
   - Add items to cart
   - Process orders with deposit options

3. **Checkout Process** (`/checkout`):
   - Review order details
   - Complete transactions
   - Generate receipts

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard pages
│   ├── pos/               # POS terminal pages
│   ├── checkout/          # Checkout process
│   └── order-complete/    # Order completion
├── components/            # Reusable React components
├── lib/                   # Utility functions and data management
├── store/                 # Zustand state management
└── types/                 # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository.
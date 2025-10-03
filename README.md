# AI Chat Platform - Frontend

A modern React frontend for the AI Chat Platform that allows users to interact with multiple AI models in a single interface.

## 🚀 Features

- 🤖 **Multiple AI Models**: GPT-4, Claude, Gemini, Perplexity, and more
- 🔄 **Smart Routing**: Auto mode intelligently selects the best model
- 💬 **Chat Management**: Session history and editable chat titles
- 📝 **Custom Templates**: Create and use prompt templates
- 🎨 **Modern UI**: Dark theme with responsive design
- 🔌 **Real-time Status**: Backend connection monitoring
- ⚡ **Fast Performance**: Built with Vite and React 19

## 🛠️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- Backend server running on http://localhost:3001

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   Frontend will be available at http://localhost:3000

3. **Test backend connection**:
   - Use the API Test panel in the right sidebar
   - Check the connection status indicator in the header

### Environment Configuration

The app uses `.env.development` for local development:
```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=AI Chat Platform
VITE_DEBUG=true
```

## Project Structure

```
src/
├── components/          # React components
│   ├── AIChat.jsx      # Main chat interface
│   ├── ModelSelector.jsx # AI model selection sidebar
│   ├── ChatMessage.jsx # Individual chat message component
│   ├── LoadingSpinner.jsx # Loading indicator
│   └── ErrorBoundary.jsx # Error handling
├── data/
│   └── models.js       # AI model configurations
├── config/
│   └── api.js          # API configuration and utilities
├── App.jsx             # Main app component
├── main.jsx           # React entry point
└── index.css          # Global styles
```

## Available Models

- **GPT-4**: Most capable GPT model for complex reasoning
- **Claude 3.5 Sonnet**: Excellent for coding and technical tasks
- **Perplexity Online**: Real-time web search and research
- **Gemini Pro**: Strong multimodal capabilities
- **GPT-3.5 Turbo**: Fast and efficient for everyday tasks
- **Claude 3 Haiku**: Optimized for speed and efficiency
- **Llama 2 70B**: Open-source model with strong performance
- **Mistral Large**: European AI with multilingual capabilities

## Auto-Routing Logic

The system automatically selects the best model based on query content:
- **Code-related**: Routes to Claude 3.5 Sonnet
- **Math/calculations**: Routes to GPT-4
- **Research/current events**: Routes to Perplexity Online
- **Creative writing**: Routes to Gemini Pro
- **Default**: Routes to GPT-4

## Technologies Used

- React 19
- Vite
- Tailwind CSS v4
- Modern JavaScript (ES6+)

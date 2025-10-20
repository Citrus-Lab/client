export const aiModels = [
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    icon: '🧠',
    description: 'OpenAI\'s most advanced model with multimodal capabilities, excellent for complex reasoning.',
    speed: 'Medium',
    cost: 'High',
    capabilities: [
      { name: 'Reasoning', color: '#3B82F6' },
      { name: 'Multimodal', color: '#10B981' },
      { name: 'Analysis', color: '#F59E0B' }
    ],
    bestFor: ['Complex reasoning', 'Analysis', 'General tasks', 'Problem solving']
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    icon: '🎭',
    description: 'Anthropic\'s most capable model, excellent for coding, writing, and complex analysis.',
    speed: 'Fast',
    cost: 'Medium',
    capabilities: [
      { name: 'Coding', color: '#8B5CF6' },
      { name: 'Writing', color: '#10B981' },
      { name: 'Analysis', color: '#F59E0B' }
    ],
    bestFor: ['Coding', 'Technical writing', 'Code review', 'Programming help']
  },
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B',
    icon: '🦙',
    description: 'Meta\'s powerful open-source model with excellent reasoning capabilities.',
    speed: 'Medium',
    cost: 'Medium',
    capabilities: [
      { name: 'Reasoning', color: '#EF4444' },
      { name: 'Open Source', color: '#F59E0B' },
      { name: 'General', color: '#10B981' }
    ],
    bestFor: ['General tasks', 'Reasoning', 'Open source projects', 'Cost-effective']
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    icon: '💎',
    description: 'Google\'s advanced AI model with strong multimodal capabilities and reasoning.',
    speed: 'Fast',
    cost: 'Medium',
    capabilities: [
      { name: 'Multimodal', color: '#EC4899' },
      { name: 'Creative', color: '#8B5CF6' },
      { name: 'Reasoning', color: '#3B82F6' }
    ],
    bestFor: ['Creative writing', 'Image analysis', 'Brainstorming', 'Content creation']
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    icon: '⚡',
    description: 'Fast and efficient model for everyday tasks, conversations, and quick responses.',
    speed: 'Very Fast',
    cost: 'Very Low',
    capabilities: [
      { name: 'Speed', color: '#10B981' },
      { name: 'Efficiency', color: '#F59E0B' },
      { name: 'General', color: '#6B7280' }
    ],
    bestFor: ['Quick questions', 'Casual chat', 'Simple tasks', 'Fast responses']
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    icon: '🌸',
    description: 'Anthropic\'s fastest model, optimized for speed and efficiency.',
    speed: 'Very Fast',
    cost: 'Low',
    capabilities: [
      { name: 'Speed', color: '#10B981' },
      { name: 'Efficiency', color: '#F59E0B' },
      { name: 'Concise', color: '#8B5CF6' }
    ],
    bestFor: ['Quick tasks', 'Summaries', 'Simple questions', 'Fast responses']
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    icon: '🚀',
    description: 'OpenAI\'s optimized GPT-4 model with better speed and efficiency.',
    speed: 'Fast',
    cost: 'Medium',
    capabilities: [
      { name: 'Reasoning', color: '#3B82F6' },
      { name: 'Speed', color: '#10B981' },
      { name: 'Efficiency', color: '#F59E0B' }
    ],
    bestFor: ['General tasks', 'Fast reasoning', 'Balanced performance']
  },
  {
    id: 'meta-llama/llama-3-8b-instruct:free',
    name: 'Llama 3 8B (Free)',
    icon: '🆓',
    description: 'Meta\'s free open-source model, good for general tasks without credits.',
    speed: 'Fast',
    cost: 'Free',
    capabilities: [
      { name: 'Free', color: '#22C55E' },
      { name: 'General', color: '#6B7280' },
      { name: 'Open Source', color: '#10B981' }
    ],
    bestFor: ['Free usage', 'General tasks', 'Testing', 'Learning']
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B (Free)',
    icon: '🌪️',
    description: 'European free model, fast and efficient for basic tasks.',
    speed: 'Very Fast',
    cost: 'Free',
    capabilities: [
      { name: 'Free', color: '#22C55E' },
      { name: 'Fast', color: '#10B981' },
      { name: 'European', color: '#EC4899' }
    ],
    bestFor: ['Free usage', 'Quick tasks', 'European languages']
  }
]
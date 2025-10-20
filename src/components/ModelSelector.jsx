import { useState } from 'react'

const ModelSelector = ({ models, selectedModel, onModelSelect, mode }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search models..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="space-y-2">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            onClick={() => onModelSelect(model)}
            className={`p-3 rounded-lg cursor-pointer transition-all border ${
              selectedModel.id === model.id
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{model.icon}</span>
                <h3 className="font-medium text-white text-sm">{model.name}</h3>
              </div>
              <div className="flex items-center space-x-1">
                {model.capabilities.map((cap, index) => (
                  <span
                    key={index}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cap.color }}
                    title={cap.name}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-gray-400 text-xs mb-2 line-clamp-2">
              {model.description}
            </p>
            
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-gray-500">
                  {model.speed}
                </span>
                <span className="text-gray-500">
                  {model.cost}
                </span>
              </div>
              {selectedModel.id === model.id && (
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
              )}
            </div>
            
            <div className="flex flex-wrap gap-1">
              {model.bestFor.slice(0, 2).map((use, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded text-xs ${
                    selectedModel.id === model.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {use}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">No models found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}

export default ModelSelector
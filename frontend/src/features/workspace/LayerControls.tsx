import { useState } from 'react'
import { Icon } from '../../shared/Icon'

interface LayerControlsProps {
  isOpen: boolean
  onClose: () => void
}

export function LayerControls({ isOpen, onClose }: LayerControlsProps) {
  const [layers, setLayers] = useState({
    aiDrawings: { visible: true, opacity: 100 },
    myNotes: { visible: true, opacity: 100 },
  })

  const toggleLayerVisibility = (layerKey: 'aiDrawings' | 'myNotes') => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        visible: !prev[layerKey].visible,
        opacity: prev[layerKey].visible ? 10 : 100,
      },
    }))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className="absolute top-16 right-4 z-50 bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 w-64 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Layer Controls</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        <div className="space-y-4">
          {/* AI Drawings Layer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="draw" className="text-primary" />
              <span className="text-sm text-gray-700 dark:text-gray-300">AI Drawings</span>
            </div>
            <button
              onClick={() => toggleLayerVisibility('aiDrawings')}
              className={`p-1 rounded transition-colors ${
                layers.aiDrawings.visible
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon name={layers.aiDrawings.visible ? 'visibility' : 'visibility_off'} />
            </button>
          </div>

          {/* My Notes Layer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="edit_note" className="text-secondary" />
              <span className="text-sm text-gray-700 dark:text-gray-300">My Notes</span>
            </div>
            <button
              onClick={() => toggleLayerVisibility('myNotes')}
              className={`p-1 rounded transition-colors ${
                layers.myNotes.visible
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon name={layers.myNotes.visible ? 'visibility' : 'visibility_off'} />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Hidden layers are faded to 10% opacity (non-destructive)
        </p>
      </div>
    </>
  )
}

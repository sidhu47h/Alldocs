interface SelectionMenuProps {
  position: { x: number; y: number };
  onAskAI: () => void;
  onSeeNotes: () => void;
}

export function SelectionMenu({ position, onAskAI, onSeeNotes }: SelectionMenuProps) {
  return (
    <div 
      className="fixed bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-2 flex gap-2"
      style={{ 
        left: position.x, 
        top: position.y - 45, // Position above the selection
        zIndex: 1000,
        transform: 'translateX(-50%)' // Center horizontally
      }}
    >
      <button
        onClick={onAskAI}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center gap-2"
      >
        <span>Ask AI</span>
      </button>
      <button
        onClick={onSeeNotes}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md flex items-center gap-2"
      >
        <span>See Notes</span>
      </button>
    </div>
  );
} 
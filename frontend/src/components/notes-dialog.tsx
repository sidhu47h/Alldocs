import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface NotesDialogProps {
  selectedText: string;
  onClose: () => void;
  onSave: (note: string) => void;
  existingNote?: string;
}

export function NotesDialog({ selectedText, onClose, onSave, existingNote }: NotesDialogProps) {
  const [note, setNote] = useState(existingNote || "");

  const handleSave = () => {
    onSave(note);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[500px] bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Add Notes</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
              ✕
            </Button>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Selected Text:</div>
            <div className="p-3 bg-gray-800 rounded-lg text-white text-sm">
              {selectedText}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Your Notes:</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-32 p-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add your notes here..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save Notes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
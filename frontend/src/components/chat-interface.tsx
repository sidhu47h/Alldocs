import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Send } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  selectedText: string
  onClose: () => void
  position: { x: number; y: number }
  onSubmit: (e: React.FormEvent) => void
  existingMessages?: Array<{ role: "user" | "assistant"; content: string; }>
}

export function ChatInterface({ 
  selectedText, 
  onClose, 
  position,
  onSubmit,
  existingMessages 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (existingMessages) {
      return existingMessages;
    }
    return [{
      role: "assistant",
      content: `Ask about "${selectedText}"`
    }];
  })
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Adjust position if chat would go off screen
  useEffect(() => {
    if (chatRef.current) {
      const rect = chatRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = position.x
      let y = position.y

      // Adjust horizontal position if chat would go off screen
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width
      }

      // Adjust vertical position if chat would go off screen
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height
      }

      chatRef.current.style.left = `${x}px`
      chatRef.current.style.top = `${y}px`
    }
  }, [position])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    // Simulate API response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "This is a mock response. The actual API integration will be added later." 
      }])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Card 
      ref={chatRef}
      className="fixed w-80 bg-gray-900 border-gray-800 shadow-lg chat-interface"
      style={{ 
        left: position.x, 
        top: position.y,
        zIndex: 1000
      }}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-white">Ask about highlighted text</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-white hover:text-gray-300">
            ✕
          </Button>
        </div>
        
        <div className="h-32 overflow-y-auto mb-2 space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-2 text-sm ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-white rounded-lg p-2 text-sm">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="flex gap-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" disabled={isLoading} size="sm" className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700">
            <Send className="h-3 w-3 text-white" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 
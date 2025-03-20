"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Menu } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { sampleTextbookContent } from "../sample-data"

// Dynamically import SyntaxHighlighter with no SSR
const SyntaxHighlighter = dynamic(() => import("react-syntax-highlighter").then((mod) => mod.Prism), { ssr: false })

// Import the style directly
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface Chapter {
  title: string
  content: string
}

interface TextbookContent {
  title: string
  chapters: Chapter[]
}

export default function TextbookView() {
  const [textbookContent, setTextbookContent] = useState<TextbookContent | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number>(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [progress, setProgress] = useState<number[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const storedContent = localStorage.getItem("textbookContent")
    if (storedContent) {
      const content = JSON.parse(storedContent)
      setTextbookContent(content)
      setProgress(new Array(content.chapters.length).fill(0))
    }
  }, [])

  useEffect(() => {
    if (!isClient) return

    const handleScroll = () => {
      if (textbookContent) {
        const scrollPosition = window.scrollY
        const windowHeight = window.innerHeight
        const fullHeight = document.documentElement.scrollHeight
        const newProgress = Math.min((scrollPosition / (fullHeight - windowHeight)) * 100, 100)
        setProgress((prev) => {
          const updated = [...prev]
          updated[selectedChapter] = newProgress
          return updated
        })
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [selectedChapter, textbookContent, isClient])

  const loadSampleData = () => {
    setTextbookContent(sampleTextbookContent)
    setProgress(new Array(sampleTextbookContent.chapters.length).fill(0))
  }

  // Custom code block component that doesn't rely on external packages
  const CodeBlock = ({ code }: { code: string }) => {
    return (
      <div className="my-6 overflow-auto rounded-md bg-gray-800 p-4">
        <pre className="text-sm text-gray-300">
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  // Function to render content with code blocks
  const renderContent = (content: string) => {
    // Split content by code blocks
    const parts = content.split(/```python|```/)

    return parts.map((part, index) => {
      // Even indices are regular text, odd indices are code blocks
      if (index % 2 === 0) {
        // Regular text - split by paragraphs and render
        return part.split("\n").map((paragraph, pIndex) => {
          // Check if paragraph is a header (starts with **)
          if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
            return (
              <h3 key={pIndex} className="text-lg font-bold mt-6 mb-2 text-white">
                {paragraph.replace(/\*\*/g, "")}
              </h3>
            )
          }
          // Regular paragraph
          return paragraph ? (
            <p key={pIndex} className="mb-4 text-white">
              {paragraph}
            </p>
          ) : null
        })
      } else {
        // Code block - use our custom component as fallback
        return (
          <div key={index} className="my-6">
            {SyntaxHighlighter ? (
              <SyntaxHighlighter language="python" style={vscDarkPlus} className="rounded-md" showLineNumbers>
                {part.trim()}
              </SyntaxHighlighter>
            ) : (
              <CodeBlock code={part.trim()} />
            )}
          </div>
        )
      }
    })
  }

  if (!isClient) {
    return null // or a loading state
  }

  if (!textbookContent) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="mb-4">No textbook content found. You can:</p>
        <div className="flex space-x-4">
          <Link href="/">
            <Button>Go to Generator</Button>
          </Link>
          <Button onClick={loadSampleData}>Load Sample Textbook</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Mobile sidebar toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-20 p-2 bg-gray-800 rounded"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition duration-200 ease-in-out md:w-64 bg-gray-900 p-4 overflow-y-auto z-10`}
      >
        <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
        <ul>
          {textbookContent.chapters.map((chapter, index) => (
            <li key={index} className="mb-2">
              <button
                onClick={() => {
                  setSelectedChapter(index)
                  setIsSidebarOpen(false)
                }}
                className={`text-left w-full py-2 px-4 rounded ${
                  selectedChapter === index ? "bg-blue-600" : "hover:bg-gray-800"
                }`}
              >
                {chapter.title}
              </button>
              <Progress value={progress[index]} className="mt-1" />
            </li>
          ))}
        </ul>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-y-auto md:ml-64">
        <div className="flex justify-between items-center mb-4">
          <Link href="/">
            <Button>Back to Generator</Button>
          </Link>
          <Button variant="outline" onClick={loadSampleData}>
            Load Sample Data
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-6 text-white">{textbookContent.title}</h1>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent>
            <div className="prose prose-invert max-w-none text-white">
              <h2 className="text-2xl font-bold mb-8 text-white">{textbookContent.chapters[selectedChapter].title}</h2>
              {renderContent(textbookContent.chapters[selectedChapter].content)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


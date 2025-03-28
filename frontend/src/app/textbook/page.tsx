"use client"

import { useState, useEffect, JSX } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Menu } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import pythonToc from "@/app/python_textbook/python_toc.json"
import chapter1Content from "@/app/python_textbook/chapter_1/1.1_introduction_to_python.json"
import chapter2Content from "@/app/python_textbook/chapter_2/2.1_variables,_data_types,_and_expressions.json"
import chapter3Content from "@/app/python_textbook/chapter_3/3.1_defining_and_calling_functions.json"
import chapter4Content from "@/app/python_textbook/chapter_4/4.1_object-oriented_programming_(oop).json"
import { ChatInterface } from "@/components/chat-interface"
import { SelectionMenu } from "@/components/selection-menu"
import { NotesDialog } from "@/components/notes-dialog"

// Dynamically import SyntaxHighlighter with no SSR
const SyntaxHighlighter = dynamic(() => import("react-syntax-highlighter").then((mod) => mod.Prism), { ssr: false })

// Import the style directly
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

// CodeBlock component for fallback
const CodeBlock = ({ code }: { code: string }) => (
  <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
    <code className="text-sm">{code}</code>
  </pre>
)

// Interfaces for TOC structure
interface TocSubsection {
  subsection_number: string;
  title: string;
  description: string;
}

interface TocSection {
  section_number: string;
  title: string;
  description: string;
  learning_outcomes: string[];
  subsections: TocSubsection[];
}

interface TocChapter {
  chapter_number: number;
  title: string;
  description: string;
  sections: TocSection[];
}

interface TocContent {
  title: string;
  description: string;
  target_audience: string;
  prerequisites: string[];
  chapters: TocChapter[];
}

// Interfaces for section file structure
interface Subsection {
  subsection_number: string;
  title: string;
  description: string;
  content: string;
}

interface Section {
  section_number: string;
  title: string;
  description: string;
  learning_outcomes: string[];
  subsections: Subsection[];
}

interface Chapter {
  chapter_number: number;
  title: string;
  description: string;
  sections: Section[];
}

interface TextbookContent {
  title: string;
  description: string;
  target_audience: string;
  prerequisites: string[];
  chapters: Chapter[];
}

interface HighlightedSection {
  text: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  id: string;
}

export default function TextbookView() {
  const [textbookContent, setTextbookContent] = useState<TextbookContent | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number>(0)
  const [selectedSection, setSelectedSection] = useState<number>(0)
  const [selectedSubsection, setSelectedSubsection] = useState<number>(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [progress, setProgress] = useState<number[]>([])
  const [sectionProgress, setSectionProgress] = useState<{ [key: string]: number }>({})
  const [subsectionProgress, setSubsectionProgress] = useState<{ [key: string]: number }>({})
  const [isClient, setIsClient] = useState(false)
  const [selectedText, setSelectedText] = useState<string>("")
  const [showChat, setShowChat] = useState(false)
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 })
  const [highlightedSections, setHighlightedSections] = useState<HighlightedSection[]>([])
  const [activeHighlight, setActiveHighlight] = useState<HighlightedSection | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [clickedHighlightId, setClickedHighlightId] = useState<string | null>(null)
  const [showSelectionMenu, setShowSelectionMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [notes, setNotes] = useState<{
    [key: string]: {
      text: string;
      note: string;
    };
  }>({})

  const handleComplete = () => {
    // Update subsection progress to 100%
    const subsectionKey = `${selectedChapter}-${selectedSection}-${selectedSubsection}`
    setSubsectionProgress((prev) => ({
      ...prev,
      [subsectionKey]: 100
    }))

    // Calculate section progress based on completed subsections
    const sectionKey = `${selectedChapter}-${selectedSection}`
    const currentSection = textbookContent?.chapters[selectedChapter].sections[selectedSection]
    const totalSubsections = currentSection?.subsections.length || 0
    
    // Get all completed subsections for this section, including the current one
    const completedSubsections = Object.entries(subsectionProgress)
      .filter(([key, value]) => 
        key.startsWith(`${selectedChapter}-${selectedSection}-`) && 
        value === 100
      ).length + 1 // Add 1 for the current subsection we just completed

    const sectionProgressValue = (completedSubsections / totalSubsections) * 100
    setSectionProgress((prev) => ({
      ...prev,
      [sectionKey]: sectionProgressValue
    }))

    // Calculate chapter progress based on completed sections
    setProgress((prev) => {
      const updated = [...prev]
      const chapterSections = textbookContent?.chapters[selectedChapter].sections.length || 0
      const completedSections = Object.entries(sectionProgress)
        .filter(([key, value]) => 
          key.startsWith(`${selectedChapter}-`) && 
          value === 100
        ).length
      updated[selectedChapter] = (completedSections / chapterSections) * 100
      return updated
    })
  }

  useEffect(() => {
    setIsClient(true)
    const loadContent = async () => {
      try {
        // Load the TOC
        const tocContent: TocContent = pythonToc
        
        // Map chapter content
        const chapterContents = {
          1: chapter1Content,
          2: chapter2Content,
          3: chapter3Content,
          4: chapter4Content
        }
        
        // Load content for each chapter
        const loadedChapters = tocContent.chapters.map((chapter) => {
          try {
            const sectionData = chapterContents[chapter.chapter_number as keyof typeof chapterContents]
            return {
              ...chapter,
              sections: [{
                section_number: sectionData.section_info.section_number,
                title: sectionData.section_info.title,
                description: sectionData.section_info.description,
                learning_outcomes: sectionData.section_info.learning_outcomes,
                subsections: sectionData.subsections.map(sub => ({
                  subsection_number: sub.subsection_info.subsection_number,
                  title: sub.subsection_info.title,
                  description: sub.subsection_info.description,
                  content: sub.content
                }))
              }]
            }
          } catch (error) {
            console.error(`Error loading chapter ${chapter.chapter_number}:`, error)
            return {
              ...chapter,
              sections: []
            }
          }
        })
        
        setTextbookContent({
          ...tocContent,
          chapters: loadedChapters
        })
        setProgress(new Array(tocContent.chapters.length).fill(0))
      } catch (error) {
        console.error('Error loading textbook content:', error)
      }
    }
    loadContent()
  }, [])

  useEffect(() => {
    if (!isClient || !textbookContent) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      const fullHeight = document.documentElement.scrollHeight
      const newProgress = Math.min((scrollPosition / (fullHeight - windowHeight)) * 100, 100)
      
      // Update subsection progress
      const subsectionKey = `${selectedChapter}-${selectedSection}-${selectedSubsection}`
      setSubsectionProgress((prev) => ({
        ...prev,
        [subsectionKey]: newProgress
      }))

      // Update section progress
      const sectionKey = `${selectedChapter}-${selectedSection}`
      setSectionProgress((prev) => ({
        ...prev,
        [sectionKey]: newProgress
      }))

      // Update chapter progress
      setProgress((prev) => {
        const updated = [...prev]
        updated[selectedChapter] = newProgress
        return updated
      })
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [selectedChapter, selectedSection, selectedSubsection, textbookContent, isClient])

  // Update the text selection handler
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (
        selectedText && 
        selectedText.length > 0 && 
        !selectedText.match(/^\s+$/) &&
        !(selection?.anchorNode?.parentElement?.closest('.chat-interface'))
      ) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        
        if (rect) {
          setSelectedText(selectedText);
          // Position menu above the selection
          setMenuPosition({
            x: rect.left + (rect.width / 2), // Center horizontally
            y: rect.top + window.scrollY // Position above selection
          });
          setShowSelectionMenu(true);
        }
      } else {
        setShowSelectionMenu(false);
      }
    };

    document.addEventListener("mouseup", handleTextSelection);
    return () => document.removeEventListener("mouseup", handleTextSelection);
  }, []);

  // Add click handler for highlighted text
  useEffect(() => {
    const handleHighlightClick = (e: MouseEvent) => {
      const highlightElement = (e.target as Element).closest('.highlighted-text');
      if (highlightElement) {
        e.preventDefault();
        e.stopPropagation();
        
        const highlightId = highlightElement.getAttribute('data-highlight-id');
        if (highlightId) {
          const highlight = highlightedSections.find(h => h.id === highlightId);
          if (highlight) {
            const rect = highlightElement.getBoundingClientRect();
            setChatPosition({
              x: rect.left,
              y: rect.bottom + window.scrollY + 10
            });
            setSelectedText(highlight.text);
            setClickedHighlightId(highlightId);
            setShowChat(true);
          }
        }
      }
    };

    document.addEventListener('click', handleHighlightClick, true);
    return () => document.removeEventListener('click', handleHighlightClick, true);
  }, [highlightedSections]);

  // Add click handler to close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showChat && !(e.target as Element).closest('.chat-interface')) {
        setShowChat(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showChat])

  // Add handlers for menu options
  const handleAskAI = () => {
    setShowSelectionMenu(false);
    setChatPosition({
      x: menuPosition.x,
      y: menuPosition.y + 45 // Position below the menu
    });
    setShowChat(true);
  };

  const handleSeeNotes = () => {
    setShowSelectionMenu(false);
    setShowNotesDialog(true);
  };

  const handleSaveNote = (note: string) => {
    setNotes(prev => ({
      ...prev,
      [selectedText]: {
        text: selectedText,
        note: note
      }
    }));
  };

  const renderMarkdownContent = (content: string) => {
    const parts = content.split(/```python|```/)

    return parts.map((part, index) => {
      if (index % 2 === 0) {
        const lines = part.split("\n")
        const elements: JSX.Element[] = []
        let currentList: JSX.Element[] = []
        let isInList = false
        let isInNumberedList = false

        lines.forEach((line, pIndex) => {
          // Skip empty lines
          if (!line.trim()) {
            if (isInList) {
              elements.push(
                <ul key={`list-${pIndex}`} className="list-disc pl-6 mb-4 text-white">
                  {currentList}
                </ul>
              )
              currentList = []
              isInList = false
            }
            if (isInNumberedList) {
              elements.push(
                <ol key={`numbered-list-${pIndex}`} className="list-decimal pl-6 mb-4 text-white">
                  {currentList}
                </ol>
              )
              currentList = []
              isInNumberedList = false
            }
            return
          }

          // Handle headers
          if (line.startsWith("# ")) {
            if (isInList || isInNumberedList) {
              elements.push(
                isInList ? (
                  <ul key={`list-${pIndex}`} className="list-disc pl-6 mb-4 text-white">
                    {currentList}
                  </ul>
                ) : (
                  <ol key={`numbered-list-${pIndex}`} className="list-decimal pl-6 mb-4 text-white">
                    {currentList}
                  </ol>
                )
              )
              currentList = []
              isInList = false
              isInNumberedList = false
            }
            const headerText = line.replace("# ", "")
            elements.push(
              <h1 key={pIndex} className="text-3xl font-bold mt-6 mb-4 text-white">
                {headerText.replace(/\*\*/g, "")}
              </h1>
            )
            return
          }
          if (line.startsWith("## ")) {
            if (isInList || isInNumberedList) {
              elements.push(
                isInList ? (
                  <ul key={`list-${pIndex}`} className="list-disc pl-6 mb-4 text-white">
                    {currentList}
                  </ul>
                ) : (
                  <ol key={`numbered-list-${pIndex}`} className="list-decimal pl-6 mb-4 text-white">
                    {currentList}
                  </ol>
                )
              )
              currentList = []
              isInList = false
              isInNumberedList = false
            }
            const headerText = line.replace("## ", "")
            elements.push(
              <h2 key={pIndex} className="text-2xl font-bold mt-5 mb-3 text-white">
                {headerText.replace(/\*\*/g, "")}
              </h2>
            )
            return
          }
          if (line.startsWith("### ")) {
            if (isInList || isInNumberedList) {
              elements.push(
                isInList ? (
                  <ul key={`list-${pIndex}`} className="list-disc pl-6 mb-4 text-white">
                    {currentList}
                  </ul>
                ) : (
                  <ol key={`numbered-list-${pIndex}`} className="list-decimal pl-6 mb-4 text-white">
                    {currentList}
                  </ol>
                )
              )
              currentList = []
              isInList = false
              isInNumberedList = false
            }
            const headerText = line.replace("### ", "")
            elements.push(
              <h3 key={pIndex} className="text-xl font-bold mt-4 mb-2 text-white">
                {headerText.replace(/\*\*/g, "")}
              </h3>
            )
            return
          }

          // Handle bold text within paragraphs
          if (line.includes("**")) {
            const parts = line.split(/(\*\*.*?\*\*)/g)
            const formattedParts = parts.map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <span key={i} className="font-bold">{part.replace(/\*\*/g, "")}</span>
              }
              return part
            })
            if (isInList || isInNumberedList) {
              currentList.push(
                <li key={pIndex} className="mb-2 text-white">
                  {formattedParts}
                </li>
              )
            } else {
              elements.push(
                <p key={pIndex} className="mb-4 text-white">
                  {formattedParts}
                </p>
              )
            }
            return
          }

          // Handle lists
          if (line.startsWith("- ")) {
            isInList = true
            currentList.push(
              <li key={pIndex} className="mb-2 text-white">
                {line.replace("- ", "")}
              </li>
            )
            return
          }

          // Handle numbered lists
          if (line.match(/^\d+\. /)) {
            isInNumberedList = true
            currentList.push(
              <li key={pIndex} className="mb-2 text-white">
                {line.replace(/^\d+\. /, "")}
              </li>
            )
            return
          }

          // Handle blockquotes
          if (line.startsWith("> ")) {
            if (isInList || isInNumberedList) {
              elements.push(
                isInList ? (
                  <ul key={`list-${pIndex}`} className="list-disc pl-6 mb-4 text-white">
                    {currentList}
                  </ul>
                ) : (
                  <ol key={`numbered-list-${pIndex}`} className="list-decimal pl-6 mb-4 text-white">
                    {currentList}
                  </ol>
                )
              )
              currentList = []
              isInList = false
              isInNumberedList = false
            }
            elements.push(
              <blockquote key={pIndex} className="border-l-4 border-gray-600 pl-4 my-4 italic text-white">
                {line.replace("> ", "")}
              </blockquote>
            )
            return
          }

          // Regular paragraph
          if (isInList || isInNumberedList) {
            elements.push(
              isInList ? (
                <ul key={`list-${pIndex}`} className="list-disc pl-6 mb-4 text-white">
                  {currentList}
                </ul>
              ) : (
                <ol key={`numbered-list-${pIndex}`} className="list-decimal pl-6 mb-4 text-white">
                  {currentList}
                </ol>
              )
            )
            currentList = []
            isInList = false
            isInNumberedList = false
          }
          elements.push(
            <p key={pIndex} className="mb-4 text-white">
              {line}
            </p>
          )
        })

        // Handle any remaining list
        if (isInList || isInNumberedList) {
          elements.push(
            isInList ? (
              <ul key="final-list" className="list-disc pl-6 mb-4 text-white">
                {currentList}
              </ul>
            ) : (
              <ol key="final-numbered-list" className="list-decimal pl-6 mb-4 text-white">
                {currentList}
              </ol>
            )
          )
        }

        return elements
      } else {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedText.trim() || isLoading) return;

    const userMessage = selectedText.trim();
    setIsLoading(true);

    // Simulate API response
    setTimeout(() => {
      const newHighlight: HighlightedSection = {
        text: selectedText,
        messages: [
          { role: "user", content: userMessage },
          { role: "assistant", content: "This is a mock response. The actual API integration will be added later." }
        ],
        id: `highlight-${Date.now()}`
      };
      
      setHighlightedSections(prev => [...prev, newHighlight]);
      
      // Add highlight to the selected text
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      if (range) {
        const span = document.createElement('span');
        span.className = 'highlighted-text';
        span.dataset.highlightId = newHighlight.id;
        span.addEventListener('mouseenter', () => {
          const highlight = highlightedSections.find(h => h.id === span.dataset.highlightId);
          if (highlight) {
            const rect = span.getBoundingClientRect();
            setHoverPosition({ x: rect.left, y: rect.bottom + window.scrollY });
            setActiveHighlight(highlight);
          }
        });
        span.addEventListener('mouseleave', (e) => {
          if (!(e.relatedTarget as Element)?.closest('.hover-dialog')) {
            setActiveHighlight(null);
          }
        });
        range.surroundContents(span);
      }
      
      setShowChat(false);
      setIsLoading(false);
    }, 500);
  };

  // Add HoverDialog component
  function HoverDialog({ highlight, position }: { 
    highlight: HighlightedSection; 
    position: { x: number; y: number; 
  }}) {
    return (
      <Card 
        className="fixed w-80 bg-gray-900 border-gray-800 shadow-lg hover-dialog"
        style={{ 
          left: position.x, 
          top: position.y + 10,
          zIndex: 1000
        }}
        onMouseLeave={() => setActiveHighlight(null)}
      >
        <CardContent className="p-3">
          <div className="h-48 overflow-y-auto space-y-2">
            <div className="text-sm font-semibold text-white mb-2">
              Highlighted text: &ldquo;{highlight.text}&rdquo;
            </div>
            {highlight.messages.map((message, index) => (
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
          </div>
        </CardContent>
      </Card>
    );
  }

  // Add styles for highlighted text
  const styles = `
    *::selection {
      background-color: rgba(222, 255, 78, 0.85) !important;
      color: black !important;
      text-shadow: 0 0 10px rgba(222, 255, 78, 0.9), 0 0 20px rgba(222, 255, 78, 0.5) !important;
      -webkit-box-shadow: 0 0 15px rgba(222, 255, 78, 0.9) !important;
      box-shadow: 0 0 15px rgba(222, 255, 78, 0.9) !important;
    }
    
    *::-moz-selection {
      background-color: rgba(222, 255, 78, 0.85) !important;
      color: black !important;
      text-shadow: 0 0 10px rgba(222, 255, 78, 0.9), 0 0 20px rgba(222, 255, 78, 0.5) !important;
      -moz-box-shadow: 0 0 15px rgba(222, 255, 78, 0.9) !important;
      box-shadow: 0 0 15px rgba(222, 255, 78, 0.9) !important;
    }

    .prose *::selection {
      background-color: rgba(222, 255, 78, 0.85) !important;
      color: black !important;
      text-shadow: 0 0 10px rgba(222, 255, 78, 0.9), 0 0 20px rgba(222, 255, 78, 0.5) !important;
      -webkit-box-shadow: 0 0 15px rgba(222, 255, 78, 0.9) !important;
      box-shadow: 0 0 15px rgba(222, 255, 78, 0.9) !important;
    }

    .prose *::-moz-selection {
      background-color: rgba(222, 255, 78, 0.85) !important;
      color: black !important;
      text-shadow: 0 0 10px rgba(222, 255, 78, 0.9), 0 0 20px rgba(222, 255, 78, 0.5) !important;
      -moz-box-shadow: 0 0 15px rgba(222, 255, 78, 0.9) !important;
      box-shadow: 0 0 15px rgba(222, 255, 78, 0.9) !important;
    }

    .highlighted-text {
      background: linear-gradient(120deg, transparent 0%, rgba(255, 235, 0, 0.4) 10%, rgba(255, 235, 0, 0.4) 90%, transparent 100%);
      box-shadow: 0 0 8px rgba(255, 235, 0, 0.3);
      cursor: pointer;
      position: relative;
      mix-blend-mode: multiply;
      padding: 0 2px;
      margin: 0 -2px;
      border-radius: 2px;
      color: inherit;
    }

    .highlighted-text:hover {
      background: linear-gradient(120deg, transparent 0%, rgba(255, 235, 0, 0.5) 10%, rgba(255, 235, 0, 0.5) 90%, transparent 100%);
    }

    .highlighted-text:hover::after {
      content: attr(title);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgb(17, 24, 39);
      color: white;
      padding: 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      white-space: pre-wrap;
      max-width: 200px;
      z-index: 50;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
  `;

  if (!isClient) {
    return null
  }

  if (!textbookContent) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="mb-4">Loading textbook content...</p>
      </div>
    )
  }

  const currentChapter = textbookContent.chapters[selectedChapter]
  const currentSection = currentChapter.sections[selectedSection]
  const currentSubsection = currentSection.subsections[selectedSubsection]

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Add styles */}
      <style jsx global>{styles}</style>

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
          {textbookContent.chapters.map((chapter, chapterIndex) => (
            <li key={chapterIndex} className="mb-2">
              <button
                onClick={() => {
                  setSelectedChapter(chapterIndex)
                  setSelectedSection(0)
                  setSelectedSubsection(0)
                  setIsSidebarOpen(false)
                }}
                className={`text-left w-full py-2 px-4 rounded ${
                  selectedChapter === chapterIndex ? "bg-blue-600" : "hover:bg-gray-800"
                }`}
              >
                {chapter.title}
              </button>
              <Progress 
                value={progress[chapterIndex]} 
                className="mt-1 bg-gray-700 [&>div]:bg-blue-500"
              />
              
              {/* Show sections when chapter is selected */}
              {selectedChapter === chapterIndex && (
                <ul className="ml-4 mt-2">
                  {chapter.sections.map((section, sectionIndex) => (
                    <li key={sectionIndex} className="mb-4">
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setSelectedSection(sectionIndex)
                            setSelectedSubsection(0)
                            setIsSidebarOpen(false)
                          }}
                          className={`text-left w-full py-2 px-4 rounded ${
                            selectedSection === sectionIndex ? "bg-blue-500" : "hover:bg-gray-800"
                          }`}
                        >
                          {section.title}
                        </button>
                        <Progress 
                          value={sectionProgress[`${chapterIndex}-${sectionIndex}`] || 0} 
                          className={`h-1 w-full bg-gray-700 [&>div]:${
                            sectionProgress[`${chapterIndex}-${sectionIndex}`] === 100 
                              ? "bg-green-500" 
                              : "bg-blue-500"
                          }`}
                        />
                        
                        {/* Show subsections when section is selected */}
                        {selectedSection === sectionIndex && (
                          <ul className="ml-4 mt-2">
                            {section.subsections.map((subsection, subsectionIndex) => (
                              <li key={subsectionIndex} className="mb-2">
                                <div className="space-y-2">
                                  <button
                                    onClick={() => {
                                      setSelectedSubsection(subsectionIndex)
                                      setIsSidebarOpen(false)
                                    }}
                                    className={`text-left w-full py-2 px-4 rounded ${
                                      selectedSubsection === subsectionIndex ? "bg-blue-400" : "hover:bg-gray-800"
                                    }`}
                                  >
                                    {subsection.title}
                                  </button>
                                  <Progress 
                                    value={subsectionProgress[`${chapterIndex}-${sectionIndex}-${subsectionIndex}`] || 0} 
                                    className={`h-1 w-full bg-gray-700 [&>div]:${
                                      subsectionProgress[`${chapterIndex}-${sectionIndex}-${subsectionIndex}`] === 100 
                                        ? "bg-green-500" 
                                        : "bg-blue-500"
                                    }`}
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
          <Button 
            onClick={handleComplete}
            className="bg-green-600 hover:bg-green-700"
          >
            Complete Section
          </Button>
        </div>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-white">{textbookContent.title}</h1>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent>
              <div className="prose prose-invert max-w-none text-white">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  {currentChapter.title}
                </h2>
                <p className="mb-6 text-white">{currentChapter.description}</p>
                
                <h3 className="text-xl font-bold mb-4 text-white">
                  {currentSection.title}
                </h3>
                <p className="mb-4 text-white">{currentSection.description}</p>
                
                <div className="mb-4">
                  <h4 className="text-lg font-bold mb-2 text-white">Learning Outcomes</h4>
                  <ul className="list-disc pl-6 text-white">
                    {currentSection.learning_outcomes.map((outcome, index) => (
                      <li key={index}>{outcome}</li>
                    ))}
                  </ul>
                </div>

                <h4 className="text-lg font-bold mb-4 text-white">
                  {currentSubsection.title}
                </h4>
                <p className="mb-4 text-white">{currentSubsection.description}</p>
                
                {renderMarkdownContent(currentSubsection.content)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hover Dialog */}
      {activeHighlight && (
        <HoverDialog 
          highlight={activeHighlight}
          position={hoverPosition}
        />
      )}

      {/* Notes Dialog */}
      {showNotesDialog && (
        <NotesDialog
          selectedText={selectedText}
          onClose={() => setShowNotesDialog(false)}
          onSave={handleSaveNote}
          existingNote={notes[selectedText]?.note}
        />
      )}

      {/* Selection Menu */}
      {showSelectionMenu && (
        <SelectionMenu
          position={menuPosition}
          onAskAI={handleAskAI}
          onSeeNotes={handleSeeNotes}
        />
      )}

      {/* Chat Interface */}
      {showChat && (
        <ChatInterface
          selectedText={selectedText}
          onClose={() => {
            setShowChat(false);
            setClickedHighlightId(null);
          }}
          position={chatPosition}
          onSubmit={handleSubmit}
          existingMessages={clickedHighlightId 
            ? highlightedSections.find(h => h.id === clickedHighlightId)?.messages 
            : undefined
          }
        />
      )}
    </div>
  )
}
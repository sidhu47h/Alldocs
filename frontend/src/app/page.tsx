"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { sampleTextbookContent } from "../app/sample-data"

export default function Home() {
  const router = useRouter()
  const [subject, setSubject] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Generate a detailed outline for a ${gradeLevel} grade textbook on ${subject}. Include a table of contents with at least 5 chapters, and for each chapter, provide a brief summary of its content. Include Python code examples where appropriate to illustrate concepts. Additional requirements: ${additionalInfo}`,
        system:
          "You are an expert textbook author and educator. Create a detailed and engaging textbook outline suitable for the specified grade level. Include Python code examples where appropriate to illustrate concepts. Format the response as JSON with the following structure: { title: string, chapters: [{ title: string, content: string }] }. For Python code examples, wrap the code in ```python and ``` tags within the content string.",
      })

      const textbookContent = JSON.parse(text)
      localStorage.setItem("textbookContent", JSON.stringify(textbookContent))
      router.push("/textbook")
    } catch (error) {
      console.error("Error generating textbook:", error)
      alert("An error occurred while generating the textbook. Please try again.")
    }
    setIsLoading(false)
  }

  const viewSampleTextbook = () => {
    localStorage.setItem("textbookContent", JSON.stringify(sampleTextbookContent))
    router.push("/textbook")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Textbook Generator</h1>
          <nav>
            <a href="#" className="text-gray-400 hover:text-white ml-4">
              About
            </a>
            <a href="#" className="text-gray-400 hover:text-white ml-4">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Generate Your Textbook</CardTitle>
            <CardDescription className="text-gray-400">
              Enter the details for your textbook and let AI do the rest! Your textbook will include interactive Python
              code examples.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-gray-300">
                  Subject
                </Label>
                <Input
                  id="subject"
                  placeholder="e.g., Biology, World History, Mathematics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gradeLevel" className="text-gray-300">
                  Grade Level
                </Label>
                <Input
                  id="gradeLevel"
                  placeholder="e.g., 5th, 9th, 12th"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalInfo" className="text-gray-300">
                  Additional Information
                </Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Any specific topics, learning objectives, or requirements?"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
              >
                {isLoading ? "Generating..." : "Generate Textbook"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-gray-400 mb-2">Want to see an example first?</p>
              <Button variant="outline" onClick={viewSampleTextbook}>
                View Sample Textbook with Python Examples
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-gray-800 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-400">&copy; 2025 AI Textbook Generator. All rights reserved.</p>
            <div>
              <a href="#" className="text-gray-400 hover:text-white mr-4">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


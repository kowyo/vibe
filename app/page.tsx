"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Play, RotateCcw, Code2, Eye } from "lucide-react"
import { CodeViewer } from "@/components/code-viewer"
import { PreviewWindow } from "@/components/preview-window"
import { StatusPanel } from "@/components/status-panel"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ path: string; content: string }>>([])
  const [previewUrl, setPreviewUrl] = useState("")
  const [logs, setLogs] = useState<Array<{ type: "info" | "error" | "success"; message: string }>>([])
  const [activeTab, setActiveTab] = useState("code")

  const addLog = (type: "info" | "error" | "success", message: string) => {
    setLogs((prev) => [...prev, { type, message }])
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addLog("error", "Please enter a prompt")
      return
    }

    setIsGenerating(true)
    setLogs([])
    addLog("info", "Starting generation...")
    addLog("info", `Prompt: ${prompt}`)

    try {
      // Call the mock API endpoint
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error("Generation failed")
      }

      const data = await response.json()

      addLog("success", `Generated ${data.files.length} files`)
      setGeneratedFiles(data.files)
      setPreviewUrl(data.preview_url)
      addLog("success", "Preview server started")
      setActiveTab("preview")
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setGeneratedFiles([])
    setPreviewUrl("")
    setLogs([])
    handleGenerate()
  }

  const handleRefreshPreview = () => {
    addLog("info", "Refreshing preview...")
    // Force iframe reload by updating the key
    setPreviewUrl((prev) => prev + "?t=" + Date.now())
    addLog("success", "Preview refreshed")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Code2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Lovable MVP</h1>
              <span className="text-sm text-muted-foreground">AI App Builder</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Input & Code */}
          <div className="flex flex-col gap-6">
            {/* Prompt Input */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Describe Your App</h2>
              <Textarea
                placeholder="Example: Build a todo app with React that has add, delete, and mark as complete features..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mb-4 min-h-[120px] font-mono text-sm"
                disabled={isGenerating}
              />
              <div className="flex gap-3">
                <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="flex-1">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
                {generatedFiles.length > 0 && (
                  <Button onClick={handleRegenerate} variant="outline" disabled={isGenerating}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                )}
              </div>
            </Card>

            {/* Status Panel */}
            <StatusPanel logs={logs} />
          </div>

          {/* Right Column - Code & Preview */}
          <div className="flex flex-col">
            <Card className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <div className="border-b border-border px-6 pt-4">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="code" className="gap-2">
                      <Code2 className="h-4 w-4" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2" disabled={!previewUrl}>
                      <Eye className="h-4 w-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="code" className="h-[calc(100vh-280px)] p-0">
                  <CodeViewer files={generatedFiles} />
                </TabsContent>

                <TabsContent value="preview" className="h-[calc(100vh-280px)] p-0">
                  <PreviewWindow url={previewUrl} onRefresh={handleRefreshPreview} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

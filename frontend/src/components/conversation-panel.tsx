"use client"

import { FormEvent, ChangeEvent, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ConversationMessage } from "@/hooks/use-generation-session"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Tool, ToolContent, ToolHeader, ToolInput } from "@/components/ai-elements/tool"
import { Sparkles } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import type { ToolInvocation, ContentPart } from "@/hooks/generation/types"

interface ConversationPanelProps {
  messages: ConversationMessage[]
  prompt: string
  onPromptChange: (value: string) => void
  onSubmit: () => void | Promise<void>
  isGenerating: boolean
}

export function ConversationPanel({
  messages,
  prompt,
  onPromptChange,
  onSubmit,
  isGenerating,
}: ConversationPanelProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  )
  const disableSend = isGenerating || !prompt.trim()

  const renderMessageContent = (message: ConversationMessage) => {
    // If we have ordered content parts (from loaded messages), render them in order
    if (message.contentParts && message.contentParts.length > 0) {
      return message.contentParts.map((part: ContentPart, index: number) => {
        if (part.type === "text") {
          return part.text ? (
            <MessageResponse key={`text-${index}`}>{part.text}</MessageResponse>
          ) : null
        }
        if (part.type === "tool_use") {
          return (
            <Tool key={part.id}>
              <ToolHeader title={part.name} type={`tool-${part.name}`} state={part.state} />
              <ToolContent>
                <ToolInput input={part.input} />
              </ToolContent>
            </Tool>
          )
        }
        return null
      })
    }

    // Fallback: render content first, then tool invocations (for live messages)
    return (
      <>
        {message.content && <MessageResponse>{message.content}</MessageResponse>}
        {message.toolInvocations?.map((tool: ToolInvocation) => (
          <Tool key={tool.id}>
            <ToolHeader title={tool.name} type={`tool-${tool.name}`} state={tool.state} />
            <ToolContent>
              <ToolInput input={tool.input} />
            </ToolContent>
          </Tool>
        ))}
      </>
    )
  }

  const handleSubmit = (
    message: { text?: string; files?: any[] },
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    // Check if user is logged in
    if (!session?.user) {
      router.push("/login")
      return
    }
    void onSubmit()
  }

  return (
    <div className="flex h-full flex-col">
      <Conversation className="flex-1 px-2">
        <ConversationContent className="px-2">
          {orderedMessages.length === 0 ? (
            <ConversationEmptyState
              title="Share your idea to begin"
              description="Tell the assistant what to build. You will see the conversation and build status appear here."
              icon={<Sparkles className="h-8 w-8" />}
            />
          ) : (
            <div className="space-y-2">
              {orderedMessages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>{renderMessageContent(message)}</MessageContent>
                </Message>
              ))}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="p-2 relative">
        <PromptInputTextarea
          name="message"
          value={prompt}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onPromptChange(e.target.value)}
          disabled={isGenerating}
          placeholder="What do you want to build today?"
        />
        <PromptInputFooter>
          <PromptInputTools></PromptInputTools>
          <PromptInputSubmit disabled={disableSend} status={"ready"} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}

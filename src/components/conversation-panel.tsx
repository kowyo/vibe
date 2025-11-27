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
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
} from "@/components/ai-elements/tool"
import { Sparkles } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import type { ToolInvocation } from "@/hooks/generation/types"

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
                  <MessageContent>
                    {message.content && (
                      <MessageResponse>{message.content}</MessageResponse>
                    )}
                    {message.toolInvocations?.map((tool: ToolInvocation) => (
                      <Tool key={tool.id}>
                        <ToolHeader
                          title={tool.name}
                          type={`tool-${tool.name}`}
                          state={tool.state}
                        />
                        <ToolContent>
                          <ToolInput input={tool.input} />
                        </ToolContent>
                      </Tool>
                    ))}
                  </MessageContent>
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
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            onPromptChange(e.target.value)
          }
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

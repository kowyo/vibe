import { useCallback, useEffect, useMemo, useRef } from "react"
import { createWebSocket } from "../services/websocket"
import type { WebSocketMessageHandler } from "../services/websocket"
import { getBackendOrigin, getWsBaseUrl } from "../utils/api"
import { toAbsolutePreviewUrl } from "../utils/preview"
import type { useProjectState } from "./use-project-state"
import type { SessionData } from "@/lib/auth-client"

type ProjectState = ReturnType<typeof useProjectState>

export function useProjectWebSocket(
  state: ProjectState,
  apiBaseUrl: string,
  session: SessionData | null
) {
  const wsRef = useRef<WebSocket | null>(null)
  const wsBaseEnv = useMemo(() => getWsBaseUrl(), [])
  const backendOrigin = useMemo(
    () => getBackendOrigin(apiBaseUrl),
    [apiBaseUrl]
  )

  const {
    setProjectStatus,
    addLog,
    updateActiveAssistantMessage,
    setActiveTab,
    basePreviewUrlRef,
    previewUrlWithTokenRef,
    setPreviewUrl,
    currentGenerationIdRef,
  } = state

  // Preview URL management wrapper
  const updatePreview = useCallback(
    async (raw?: string | null) => {
      if (!raw) {
        basePreviewUrlRef.current = ""
        previewUrlWithTokenRef.current = ""
        setPreviewUrl("")
        return
      }
      try {
        const url = await toAbsolutePreviewUrl(
          raw,
          backendOrigin,
          session,
          basePreviewUrlRef,
          previewUrlWithTokenRef
        )
        setPreviewUrl(url)
      } catch (error) {
        console.error("Error updating preview URL:", error)
        // Fallback: try without token
        try {
          let url: URL
          if (raw.startsWith("http://") || raw.startsWith("https://")) {
            url = new URL(raw)
          } else if (backendOrigin) {
            url = new URL(raw, backendOrigin)
          } else {
            setPreviewUrl(raw)
            return
          }
          setPreviewUrl(url.toString())
        } catch {
          setPreviewUrl(raw)
        }
      }
    },
    [
      backendOrigin,
      session,
      basePreviewUrlRef,
      previewUrlWithTokenRef,
      setPreviewUrl,
    ]
  )

  const wsHandlers: WebSocketMessageHandler = useMemo(
    () => ({
      onStatusSnapshot: (status, previewUrl) => {
        if (status) {
          setProjectStatus(status)
        }
        if (previewUrl) {
          updatePreview(previewUrl)
        }
      },
      onStatusUpdated: (status) => {
        setProjectStatus(status)
        addLog(
          status === "ready" ? "success" : "info",
          `Status changed to ${status}`
        )
        updateActiveAssistantMessage(() => ({
          status:
            status === "failed"
              ? "error"
              : status === "ready"
                ? "complete"
                : "pending",
        }))
      },
      onLogAppended: (message) => {
        addLog("info", message)
      },
      onPreviewReady: (preview) => {
        updatePreview(preview)
        addLog("success", "Preview ready")
      },
      onError: (message) => {
        addLog("error", message)
        updateActiveAssistantMessage((msg) => ({
          content: msg.content
            ? `${msg.content}\n\n❌ Error: ${message}`
            : message,
          status: "error",
        }))
        setProjectStatus("failed")
      },
      onProjectCreated: () => {
        // No-op
      },
      onAssistantMessage: (payload) => {
        const text = payload.text || ""
        if (text) {
          updateActiveAssistantMessage((msg) => {
            const existingParts = msg.contentParts || []
            return {
              content: msg.content ? `${msg.content}\n${text}`.trim() : text,
              contentParts: [...existingParts, { type: "text" as const, text }],
              status: "pending",
            }
          })
        }
      },
      onToolUse: (payload) => {
        const toolId = payload.id || crypto.randomUUID()
        const toolName = payload.name || "unknown"
        updateActiveAssistantMessage((msg) => {
          const existingTools = msg.toolInvocations || []
          const existingParts = msg.contentParts || []
          const existingIndex = existingTools.findIndex((t) => t.id === toolId)
          const toolInvocation = {
            id: toolId,
            name: toolName,
            state: "input-available" as const,
            input: payload.input,
          }
          const newTools =
            existingIndex >= 0
              ? existingTools.map((t, i) =>
                  i === existingIndex ? { ...t, ...toolInvocation } : t
                )
              : [...existingTools, toolInvocation]
          // Add to contentParts only if it's a new tool (not an update)
          const newParts =
            existingIndex >= 0
              ? existingParts
              : [
                  ...existingParts,
                  { type: "tool_use" as const, ...toolInvocation },
                ]
          return {
            toolInvocations: newTools,
            contentParts: newParts,
            status: "pending",
          }
        })
      },
      onToolResult: (payload) => {
        const toolUseId = payload.tool_use_id
        if (!toolUseId) return

        updateActiveAssistantMessage((msg) => {
          const existingTools = msg.toolInvocations || []
          const existingParts = msg.contentParts || []

          // Update tool state in toolInvocations
          const newTools = existingTools.map((tool) =>
            tool.id === toolUseId
              ? {
                  ...tool,
                  state: "output-available" as const,
                  output: payload.content,
                }
              : tool
          )

          // Update tool state in contentParts
          const newParts = existingParts.map((part) =>
            part.type === "tool_use" && part.id === toolUseId
              ? {
                  ...part,
                  state: "output-available" as const,
                  output: payload.content,
                }
              : part
          )

          return {
            toolInvocations: newTools,
            contentParts: newParts,
          }
        })
      },
      onResultMessage: (_payload) => {
        updateActiveAssistantMessage((msg) => ({
          content: msg.content,
          status: "complete",
          toolInvocations: msg.toolInvocations?.map((tool) => ({
            ...tool,
            state:
              tool.state === "input-available"
                ? "output-available"
                : tool.state,
          })),
          contentParts: msg.contentParts?.map((part) =>
            part.type === "tool_use" && part.state === "input-available"
              ? { ...part, state: "output-available" as const }
              : part
          ),
        }))
      },
      addLog,
      updateActiveAssistantMessage,
      setProjectStatus,
      setActiveTab,
      updatePreview,
    }),
    [
      addLog,
      updateActiveAssistantMessage,
      setProjectStatus,
      setActiveTab,
      updatePreview,
    ]
  )

  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const startWebSocket = useCallback(
    (id: string) => {
      closeWebSocket()
      const socket = createWebSocket(
        id,
        wsBaseEnv,
        backendOrigin,
        wsHandlers,
        (genId) => {
          // If we have a current generation ID, only process events that match it
          // or events that have no ID (system events)
          if (
            currentGenerationIdRef.current &&
            genId &&
            currentGenerationIdRef.current !== genId
          ) {
            return false
          }
          return true
        }
      )
      if (socket) {
        wsRef.current = socket
      }
    },
    [
      closeWebSocket,
      wsBaseEnv,
      backendOrigin,
      wsHandlers,
      currentGenerationIdRef,
    ]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeWebSocket()
    }
  }, [closeWebSocket])

  return {
    startWebSocket,
    closeWebSocket,
    updatePreview,
  }
}

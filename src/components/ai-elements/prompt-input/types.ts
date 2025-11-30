import type { ChatStatus, FileUIPart } from "ai"
import type { ReactNode, RefObject } from "react"

// Context Types
export type AttachmentsContext = {
  files: (FileUIPart & { id: string })[]
  add: (files: File[] | FileList) => void
  remove: (id: string) => void
  clear: () => void
  openFileDialog: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
}

export type TextInputContext = {
  value: string
  setInput: (v: string) => void
  clear: () => void
}

export type PromptInputControllerProps = {
  textInput: TextInputContext
  attachments: AttachmentsContext
  /** INTERNAL: Allows PromptInput to register its file textInput + "open" callback */
  __registerFileInput: (
    ref: RefObject<HTMLInputElement | null>,
    open: () => void
  ) => void
}

// Component Props
export type PromptInputMessage = {
  text: string
  files: FileUIPart[]
}

export type PromptInputAttachmentProps = React.HTMLAttributes<HTMLDivElement> & {
  data: FileUIPart & { id: string }
  className?: string
}

export type PromptInputAttachmentsProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children: (attachment: FileUIPart & { id: string }) => ReactNode
}

export type PromptInputActionAddAttachmentsProps = React.ComponentProps<
  typeof import("@/components/ui/dropdown-menu").DropdownMenuItem
> & {
  label?: string
}

// Speech Recognition Types
export interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

export type SpeechRecognitionResultList = {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

export type SpeechRecognitionResult = {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

export type SpeechRecognitionAlternative = {
  transcript: string
  confidence: number
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}
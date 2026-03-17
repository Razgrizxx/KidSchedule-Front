import { useState, useRef, useEffect } from 'react'
import { Send, ShieldCheck, FileDown, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { useFamilies } from '@/hooks/useDashboard'
import { useMessages, useSendMessage } from '@/hooks/useMessages'
import { toast } from '@/hooks/use-toast'
import type { Message } from '@/types/api'
import { cn } from '@/lib/utils'

function HashBadge({ hash }: { hash: string }) {
  const short = hash.slice(0, 8)
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 mt-1"
      title={`Full hash: ${hash}`}
    >
      <ShieldCheck className="w-2.5 h-2.5 text-teal-400" />
      {short}…
    </span>
  )
}

function MessageBubble({
  msg,
  isMine,
  senderInitials,
}: {
  msg: Message
  isMine: boolean
  senderInitials: string
}) {
  return (
    <div className={cn('flex gap-2.5 mb-4', isMine ? 'flex-row-reverse' : 'flex-row')}>
      {!isMine && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarFallback className="text-[10px]">{senderInitials}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-[70%]', isMine ? 'items-end' : 'items-start', 'flex flex-col')}>
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isMine
              ? 'bg-teal-400 text-white rounded-tr-sm'
              : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm',
          )}
        >
          {msg.content}
        </div>
        <div className={cn('flex items-center gap-1.5 mt-0.5', isMine ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-slate-300">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <HashBadge hash={msg.contentHash} />
        </div>
      </div>
    </div>
  )
}

function exportConversation(messages: Message[]) {
  const lines = messages.map(
    (m) =>
      `[${new Date(m.createdAt).toISOString()}] sender:${m.senderId}\n${m.content}\nhash:${m.contentHash}\n`,
  )
  const blob = new Blob([lines.join('\n---\n\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kidschedule-messages-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function MessagesPage() {
  const user = useAuthStore((s) => s.user)
  const { data: families } = useFamilies()
  const familyId = families?.[0]?.id
  const { data: messages, isLoading } = useMessages(familyId)
  const sendMessage = useSendMessage(familyId ?? '')

  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim() || !familyId) return
    const content = text.trim()
    setText('')
    try {
      await sendMessage.mutateAsync({ content, familyId })
    } catch {
      toast({ title: 'Failed to send message', variant: 'error' })
      setText(content)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="max-w-3xl h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Family Messages</h2>
          <p className="text-sm text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            Every message is cryptographically hashed for legal integrity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            if (messages) exportConversation(messages)
            else toast({ title: 'No messages to export', variant: 'error' })
          }}
        >
          <FileDown className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn('flex gap-2.5', i % 2 === 0 ? 'flex-row-reverse' : '')}>
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <Skeleton className={cn('h-16 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-64')} />
                </div>
              ))}
            </div>
          ) : !familyId ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Hash className="w-8 h-8 text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">You need a family to send messages.</p>
            </div>
          ) : messages && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Hash className="w-8 h-8 text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            <>
              {messages?.map((msg) => {
                const isMine = msg.senderId === user?.id
                const sender = msg.sender
                const initials = sender
                  ? `${sender.firstName[0]}${sender.lastName[0]}`.toUpperCase()
                  : '??'
                return (
                  <MessageBubble key={msg.id} msg={msg} isMine={isMine} senderInitials={initials} />
                )
              })}
              <div ref={bottomRef} />
            </>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-slate-100 p-3 shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              disabled={!familyId || sendMessage.isPending}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={() => void handleSend()}
              disabled={!text.trim() || !familyId || sendMessage.isPending}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-300 mt-1.5 text-center">
            Messages are immutable and hash-chained · Court-ready export available
          </p>
        </div>
      </div>
    </div>
  )
}

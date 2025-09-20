"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, Search } from "lucide-react"

export type ChannelItem = { id: string; name: string; description?: string; unread?: number; icon?: React.ReactNode }

export default function ChannelsPopover({
  open,
  onClose,
  channels = [],
  onOpenChannel,
  onCreateChannel,
}: {
  open: boolean
  onClose: () => void
  channels: ChannelItem[]
  onOpenChannel?: (id: string) => void
  onCreateChannel?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    if (open) {
      document.addEventListener("keydown", onKey)
      document.addEventListener("mousedown", onClick)
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [open, onClose])

  if (!open) return null

  const list = channels.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="channels-portal">
      <div ref={ref} role="dialog" aria-label="Channels" className="channels-popover">
        <div className="channels-popover-header">
          <span>Channels</span>
          <button className="btn-icon" onClick={onCreateChannel} title="New">
            <Plus size={18} />
          </button>
        </div>
        <div className="channels-popover-search">
          <Search size={16} />
          <input
            placeholder="Search channels"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="channels-chip-wrap">
          {list.map((c) => (
            <button key={c.id} className="channel-chip" onClick={() => onOpenChannel?.(c.id)}>
              <span className="dot" />
              <span className="title">{c.name}</span>
              {c.unread ? <span className="badge">{c.unread}</span> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}



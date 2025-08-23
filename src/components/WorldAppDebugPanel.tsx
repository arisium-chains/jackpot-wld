'use client'

import React, { useState, useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bug, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Copy,
  Settings
} from 'lucide-react'

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: Record<string, unknown>
  timestamp: Date
  sessionId: string
}

interface WorldAppDebugPanelProps {
  isVisible?: boolean
  onToggle?: () => void
  position?: 'bottom' | 'top' | 'floating'
}

export function WorldAppDebugPanel({ 
  isVisible = false, 
  onToggle,
  position = 'bottom'
}: WorldAppDebugPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [componentFilter, setComponentFilter] = useState<string>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update logs from logger buffer
  const updateLogs = () => {
    const logBuffer = logger.getLogBuffer()
    setLogs([...logBuffer])
  }

  useEffect(() => {
    // Initial load
    updateLogs()

    // Set up polling for new logs
    intervalRef.current = setInterval(updateLogs, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = logs

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter)
    }

    // Component filter
    if (componentFilter !== 'all') {
      filtered = filtered.filter(log => 
        log.context?.component === componentFilter
      )
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.context).toLowerCase().includes(searchLower)
      )
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, levelFilter, componentFilter])

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [filteredLogs, autoScroll])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive'
      case 'warn': return 'outline'
      case 'info': return 'default'
      case 'debug': return 'secondary'
      default: return 'default'
    }
  }

  const getUniqueComponents = () => {
    const components = new Set(logs.map(log => log.context?.component).filter(Boolean))
    return Array.from(components) as string[]
  }

  const handleClearLogs = () => {
    logger.clearLogBuffer()
    setLogs([])
    setFilteredLogs([])
  }

  const handleDownloadLogs = () => {
    const logsData = logger.exportLogs()
    const blob = new Blob([logsData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `worldapp-debug-logs-${new Date().toISOString().slice(0, 19)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyLogs = async () => {
    try {
      const logsData = logger.exportLogs()
      await navigator.clipboard.writeText(logsData)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy logs:', err)
    }
  }

  const sessionInfo = logger.getSessionInfo()

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0"
        variant="outline"
      >
        <Bug className="h-5 w-5" />
      </Button>
    )
  }

  const panelClasses = {
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    top: 'fixed top-0 left-0 right-0 z-50',
    floating: 'fixed bottom-4 right-4 z-50 w-96'
  }

  return (
    <div className={panelClasses[position]}>
      <Card className={`${position === 'floating' ? '' : 'rounded-t-lg rounded-b-none'} border-t`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              <CardTitle className="text-sm">World App Debug Panel</CardTitle>
              {sessionInfo.isWorldApp && (
                <Badge variant="outline" className="text-xs">
                  World App {sessionInfo.worldAppVersion}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
              >
                ×
              </Button>
            </div>
          </div>
          
          {isExpanded && (
            <CardDescription className="text-xs">
              Session: {sessionInfo.sessionId.slice(-8)} | 
              MiniKit: {sessionInfo.miniKitVersion} | 
              Logs: {filteredLogs.length}/{logs.length}
            </CardDescription>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <Tabs defaultValue="logs" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="session">Session</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="logs" className="space-y-2">
                {/* Filters */}
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warn</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={componentFilter} onValueChange={setComponentFilter}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Components</SelectItem>
                      {getUniqueComponents().map(component => (
                        <SelectItem key={component} value={component}>
                          {component}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={updateLogs}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleClearLogs}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleCopyLogs}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  
                  <Button 
                    variant={autoScroll ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setAutoScroll(!autoScroll)}
                  >
                    Auto Scroll
                  </Button>
                </div>

                {/* Logs Display */}
                <ScrollArea 
                  ref={scrollAreaRef}
                  className="h-64 w-full border rounded-md p-2"
                >
                  <div className="space-y-1">
                    {filteredLogs.map((log, index) => (
                      <div key={index} className="text-xs border-b pb-1 last:border-b-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getLevelColor(log.level)} className="text-xs px-1 py-0">
                            {log.level.toUpperCase()}
                          </Badge>
                          
                          <span className="text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          
                          {log.context?.component && typeof log.context.component === 'string' ? (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {log.context.component}
                            </Badge>
                          ) : null}
                        </div>
                        
                        <div className="font-mono">{log.message}</div>
                        
                        {log.context && Object.keys(log.context).length > 0 && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              Context
                            </summary>
                            <pre className="mt-1 text-xs bg-muted p-1 rounded overflow-x-auto">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                    
                    {filteredLogs.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No logs found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="session" className="space-y-2">
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Session ID:</strong></div>
                    <div className="font-mono">{sessionInfo.sessionId}</div>
                    
                    <div><strong>Environment:</strong></div>
                    <div>{sessionInfo.isWorldApp ? 'World App' : 'Web Browser'}</div>
                    
                    <div><strong>World App Version:</strong></div>
                    <div>{sessionInfo.worldAppVersion}</div>
                    
                    <div><strong>MiniKit Version:</strong></div>
                    <div>{sessionInfo.miniKitVersion}</div>
                    
                    <div><strong>Total Logs:</strong></div>
                    <div>{logs.length}</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Scroll</span>
                    <Button 
                      variant={autoScroll ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setAutoScroll(!autoScroll)}
                    >
                      {autoScroll ? 'On' : 'Off'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Debug Mode</span>
                    <Badge variant={process.env.NEXT_PUBLIC_DEBUG === 'true' ? 'default' : 'secondary'}>
                      {process.env.NEXT_PUBLIC_DEBUG === 'true' ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownloadLogs}
                      className="w-full"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export All Logs
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default WorldAppDebugPanel
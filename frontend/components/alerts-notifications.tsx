"use client"

import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { Card } from "@/components/ui/card"

interface AlertProps {
  type: "error" | "success" | "warning" | "info"
  title: string
  message: string
  action?: string
}

export function Alert({ type, title, message, action }: AlertProps) {
  const colors = {
    error: "bg-destructive/10 border-destructive/20 text-destructive",
    success: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
    warning:
      "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100",
    info: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
  }

  const icons = {
    error: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  return (
    <Card className={`border ${colors[type]} p-4 flex gap-3`}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm opacity-90">{message}</p>
      </div>
      {action && <button className="text-sm font-medium hover:underline">{action}</button>}
    </Card>
  )
}

'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

type UploadedDoc = { documentId: string; name: string; chunks: number }

interface Props {
  onUploadSuccess: (doc: UploadedDoc) => void
}

export default function FileUpload({ onUploadSuccess }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(`✓ ${data.chunks} chunks indexed`)
      onUploadSuccess(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <p className="text-xs text-slate-400">
          {uploading ? 'Processing…' : isDragActive ? 'Drop to upload' : '+ Upload PDF, TXT or DOCX'}
        </p>
      </div>
      {error && <p className="text-red-400 text-xs mt-1.5 px-1">{error}</p>}
      {success && <p className="text-emerald-400 text-xs mt-1.5 px-1">{success}</p>}
    </div>
  )
}
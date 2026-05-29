'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import ChatInterface from '@/components/ChatInterface'

type UploadedDoc = { documentId: string; name: string; chunks: number }

export default function Home() {
  const [activeDoc, setActiveDoc] = useState<UploadedDoc | null>(null)
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const [searchAll, setSearchAll] = useState(false)

  const handleUpload = (doc: UploadedDoc) => {
    setDocs(prev => [doc, ...prev])
    setActiveDoc(doc)
    setSearchAll(false)
  }

  const isReady = searchAll || activeDoc !== null

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-sm">
              ◈
            </div>
            <span className="font-semibold text-slate-100 tracking-tight">DocChat</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">RAG-powered document chat</p>
        </div>

        {/* Upload area */}
        <div className="px-4 py-4 border-b border-slate-800">
          <FileUpload onUploadSuccess={handleUpload} />
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {docs.length > 0 ? (
            <>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 mb-2">
                Documents
              </p>

              {/* Search all */}
              <button
                onClick={() => { setSearchAll(true); setActiveDoc(null) }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-all
                  ${searchAll
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span>⊕</span>
                <span>All documents</span>
              </button>

              {docs.map(doc => (
                <button
                  key={doc.documentId}
                  onClick={() => { setActiveDoc(doc); setSearchAll(false) }}
                  className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-all text-left
                    ${!searchAll && activeDoc?.documentId === doc.documentId
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <span className="mt-0.5 flex-shrink-0">
                    {doc.name.endsWith('.pdf') ? '📄' : doc.name.endsWith('.docx') ? '📝' : '📃'}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{doc.name}</span>
                    <span className="text-xs text-slate-600">{doc.chunks} chunks</span>
                  </span>
                </button>
              ))}
            </>
          ) : (
            <p className="text-xs text-slate-600 text-center mt-4 px-2">
              Upload a document to get started
            </p>
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {isReady ? (
          <ChatInterface
            key={searchAll ? 'all' : activeDoc!.documentId}
            documentId={searchAll ? undefined : activeDoc!.documentId}
            documentName={searchAll ? 'All Documents' : activeDoc!.name}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">
              ◈
            </div>
            <h2 className="text-lg font-semibold text-slate-300">No document selected</h2>
            <p className="text-sm text-slate-500 max-w-xs">
              Upload a PDF, TXT, or DOCX file from the sidebar, then start asking questions
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
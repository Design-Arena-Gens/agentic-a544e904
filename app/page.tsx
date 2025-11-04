'use client'

import { useState, useRef } from 'react'
import { Upload, Video, Trash2, Search, Tag, Clock, FileVideo, Sparkles, Play, Download } from 'lucide-react'

interface VideoFile {
  id: string
  name: string
  size: number
  duration?: string
  uploadDate: Date
  tags: string[]
  thumbnail?: string
  url: string
  type: string
}

export default function Home() {
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [agentMessage, setAgentMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsUploading(true)
    setAgentMessage('🤖 Agent: Processing your videos...')

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Create object URL for video
      const url = URL.createObjectURL(file)

      // Auto-generate tags based on filename
      const autoTags = generateAutoTags(file.name)

      const newVideo: VideoFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        uploadDate: new Date(),
        tags: autoTags,
        url: url,
        type: file.type,
      }

      // Get video duration
      const duration = await getVideoDuration(url)
      newVideo.duration = duration

      setVideos(prev => [...prev, newVideo])
    }

    setIsUploading(false)
    setAgentMessage(`🤖 Agent: Successfully added ${files.length} video(s). I've auto-tagged them and they're ready to manage!`)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getVideoDuration = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        const duration = video.duration
        const minutes = Math.floor(duration / 60)
        const seconds = Math.floor(duration % 60)
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
      video.onerror = () => resolve('Unknown')
      video.src = url
    })
  }

  const generateAutoTags = (filename: string): string[] => {
    const tags: string[] = []
    const lower = filename.toLowerCase()

    // Content type detection
    if (lower.includes('tutorial') || lower.includes('how-to')) tags.push('tutorial')
    if (lower.includes('meeting') || lower.includes('call')) tags.push('meeting')
    if (lower.includes('presentation') || lower.includes('demo')) tags.push('presentation')
    if (lower.includes('screen') || lower.includes('recording')) tags.push('screen-recording')
    if (lower.includes('webinar')) tags.push('webinar')
    if (lower.includes('interview')) tags.push('interview')

    // Date detection
    const yearMatch = filename.match(/20\d{2}/)
    if (yearMatch) tags.push(yearMatch[0])

    // Quality detection
    if (lower.includes('4k')) tags.push('4K')
    if (lower.includes('1080p') || lower.includes('hd')) tags.push('HD')
    if (lower.includes('final')) tags.push('final')
    if (lower.includes('draft')) tags.push('draft')

    return tags.length > 0 ? tags : ['untagged']
  }

  const deleteVideo = (id: string) => {
    const video = videos.find(v => v.id === id)
    if (video) {
      URL.revokeObjectURL(video.url)
    }
    setVideos(videos.filter(v => v.id !== id))
    if (selectedVideo?.id === id) {
      setSelectedVideo(null)
    }
    setAgentMessage('🤖 Agent: Video removed from your library.')
  }

  const addTag = (videoId: string, tag: string) => {
    setVideos(videos.map(v =>
      v.id === videoId && !v.tags.includes(tag)
        ? { ...v, tags: [...v.tags, tag] }
        : v
    ))
    if (selectedVideo?.id === videoId) {
      setSelectedVideo(prev => prev ? { ...prev, tags: [...prev.tags, tag] } : null)
    }
    setAgentMessage(`🤖 Agent: Added tag "${tag}" to help organize your content.`)
  }

  const removeTag = (videoId: string, tag: string) => {
    setVideos(videos.map(v =>
      v.id === videoId
        ? { ...v, tags: v.tags.filter(t => t !== tag) }
        : v
    ))
    if (selectedVideo?.id === videoId) {
      setSelectedVideo(prev => prev ? { ...prev, tags: prev.tags.filter(t => t !== tag) } : null)
    }
  }

  const filteredVideos = videos.filter(video =>
    video.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const suggestTags = (video: VideoFile) => {
    const allTags = Array.from(new Set(videos.flatMap(v => v.tags)))
    return allTags.filter(tag => !video.tags.includes(tag)).slice(0, 5)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Video className="w-10 h-10 text-indigo-600" />
            Video Manager Agent
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI-powered video organization and management
          </p>
        </div>

        {/* Agent Status */}
        {agentMessage && (
          <div className="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
            <p className="text-indigo-800">{agentMessage}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Upload Videos</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                isUploading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Upload className="w-5 h-5" />
              {isUploading ? 'Processing...' : 'Upload Videos'}
            </label>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search videos by name or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Your Videos ({filteredVideos.length})
            </h2>
            {filteredVideos.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FileVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No videos uploaded yet</p>
                <p className="text-gray-400 text-sm">Upload your first video to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer transition-all hover:shadow-xl ${
                      selectedVideo?.id === video.id ? 'ring-2 ring-indigo-500' : ''
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <video src={video.url} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate mb-1">{video.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {video.duration || 'Loading...'}
                          </span>
                          <span>{formatFileSize(video.size)}</span>
                          <span>{video.uploadDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {video.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center gap-1"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteVideo(video.id)
                        }}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Details Panel */}
          <div className="lg:col-span-1">
            {selectedVideo ? (
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Video Details</h2>

                {/* Video Player */}
                <div className="mb-4 bg-black rounded-lg overflow-hidden">
                  <video
                    src={selectedVideo.url}
                    controls
                    className="w-full"
                  />
                </div>

                <h3 className="font-semibold text-gray-800 mb-2 truncate">{selectedVideo.name}</h3>

                <div className="space-y-3 mb-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{selectedVideo.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{formatFileSize(selectedVideo.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span className="font-medium">{selectedVideo.uploadDate.toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Tags Management */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedVideo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(selectedVideo.id, tag)}
                          className="hover:text-indigo-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Tag */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          addTag(selectedVideo.id, e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </div>
                </div>

                {/* AI Suggestions */}
                {suggestTags(selectedVideo).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Suggested Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestTags(selectedVideo).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => addTag(selectedVideo.id, tag)}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-indigo-100 hover:text-indigo-700"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download */}
                <a
                  href={selectedVideo.url}
                  download={selectedVideo.name}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center sticky top-8">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a video to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

"use client"
import React, { useEffect, useState, useRef } from 'react'
import { chat_service, useAppContext, User } from '@/context/AppContext'
import { redirect, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Image from 'next/image'
import Cookies from 'js-cookie'
import axios from 'axios'

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

// Define the chat structure based on your API response
interface ChatResponse {
  _id: string;
  users: string[]; // Array of user IDs
  latestMessage?: {
    text: string;
    sender: string;
  };
  unseenCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatWithUserData {
  _id: string;
  users: User[]; // Array of user objects
  latestMessage?: {
    text: string;
    sender: string;
  };
  unseenCount: number;
  createdAt: string;
  updatedAt: string;
}

function ChatPage() {
  const { 
    isAuth, 
    loading, 
    logoutUser, 
    chats, 
    fetchChats, 
    user: loggedInUser, 
    setChats, 
    users 
  } = useAppContext()

  
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [showAllUser, setShowAllUser] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleLogout = () => {
    logoutUser()
    router.push('/login')
  }

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push('/login')
    }
  }, [isAuth, loading, router])

  // Fetch chats on component mount
  useEffect(() => {
    if (isAuth) {
      fetchChats()
    }
  }, [isAuth])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Transform the chats data to include user objects
  const transformedChats = chats?.map(chatItem => {
    const chat = chatItem.chat || chatItem // Handle both nested and flat structure
    const otherUserData = chatItem.user || null // Get the user data from the response
    
    // If chat has user IDs, try to find the full user objects
    let userObjects: User[] = []
    
    if (Array.isArray(chat.users) && chat.users.length > 0) {
      if (typeof chat.users[0] === 'string') {
        // users are IDs, find the user objects
        userObjects = chat.users.map((userId: string) => {
          // First check if we have the other user from chatItem.user
          if (otherUserData && otherUserData._id === userId && userId !== loggedInUser?._id) {
            return otherUserData
          }
          
          // Then check in the users array from context
          const foundUser = users?.find(u => u._id === userId)
          if (foundUser) return foundUser
          
          // If not found, create a minimal user object
          return {
            _id: userId,
            name: `User ${userId.slice(0, 4)}`,
            email: '',
            createdAt: '',
            updatedAt: ''
          } as User
        })
      } else {
        // users are already objects
        userObjects = chat.users as User[]
      }
    }
    
    return {
      _id: chat._id,
      users: userObjects,
      latestMessage: chat.latestMessage,
      unseenCount: chat.unseenCount || 0,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    } as ChatWithUserData
  })

  // Get the selected user object
  const selectedUserObj = selectedUser 
    ? users?.find(u => u._id === selectedUser) || null
    : null

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  async function createChat(u:User) {
    try{
      const token = Cookies.get('auth_token')
      const {data}= await axios.post(`${chat_service}/api/v1/chat/new`,{userId:loggedInUser?._id,otherUserId:u._id},{headers:{Authorization:`Bearer ${token}`}})
      setSelectedUser(data.chatId)
      setShowAllUser(false)
      await fetchChats()

    }catch(error){
      console.log(error)
    }

  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUser={showAllUser}
        setShowAllUser={setShowAllUser}
        messages={messages}
        users={users}
        loggedInUser={loggedInUser}
        chats={transformedChats || []} // Pass the transformed chats
        fetchChats={fetchChats}
        handleLogout={handleLogout}
        createChat={createChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 mr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Chat Partner Info */}
            {selectedUserObj ? (
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {selectedUserObj?.avatar?.url ? (
                    <Image
                      src={selectedUserObj.avatar.url}
                      alt={selectedUserObj.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-lg font-semibold text-gray-600 dark:text-gray-300">
                      {selectedUserObj?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedUserObj?.name}
                  </h2>
                  {isTyping && (
                    <p className="text-sm text-blue-500 dark:text-blue-400">
                      typing...
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Select a chat
              </h2>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedUser ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a chat from the sidebar to start messaging
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Messages will be rendered here */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        {selectedUser && (
          <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && message.trim()) {
                    // Send message logic here
                    setMessage('')
                  }
                }}
              />
              <button
                onClick={() => {
                  if (message.trim()) {
                    // Send message logic here
                    setMessage('')
                  }
                }}
                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                disabled={!message.trim()}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage
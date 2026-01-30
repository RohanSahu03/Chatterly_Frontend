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
  const [user,setUser] = useState<User | null>(null)
  const [showAllUsers, setShowAllUsers] = useState(false)
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
      setSelectedUser(data.chat)
      setShowAllUser(false)
      await fetchChats()

    }catch(error){
      console.log(error)
    }

  }

  return (
    <div className="min-h-screen flex ☐ bg-gray-900 text-white relative
overflow-hidden">
  <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} showAllUsers={showAllUsers} setShowAllUsers={setShowAllUsers} users={users} selectedUser={selectedUser} setSelectedUser={setSelectedUser} loggedInUser={loggedInUser} chats={chats} handleLogout={handleLogout} />
</div>
  )
}

export default ChatPage
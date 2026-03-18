"use client"
import React, { useEffect, useState, useRef } from 'react'
import { chat_service, useAppContext, User } from '@/context/AppContext'
import { redirect, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Image from 'next/image'
import Cookies from 'js-cookie'
import axios from 'axios'
import ChatHeader from '@/components/ChatHeader'
import ChatMessage from '@/components/ChatMessage'
import MessageInput from '@/components/MessageInput'
import { SocketData } from '@/context/SocketContext'

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
    user: loggedInUser,
    setChats,
    fetchChats,
    users
  } = useAppContext()

  const { onlineUsers, socket } = SocketData()



  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleLogout = () => {
    logoutUser()
    router.push('/login')
  }
  async function fetchChat() {
    try {
      const token = Cookies.get('auth_token')
      const { data } = await axios.get(`${chat_service}/api/v1/message/${selectedUser}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(data.messages)
      setUser(data.user)
      await fetchChats()
    } catch (error) {
      console.log(error)
      alert('Failed to fetch chats')
    }
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

  useEffect(() => {
    if (selectedUser) {
      fetchChat()
      setIsTyping(false)
      resetUnseenCount(selectedUser)
      socket?.emit("joinChat", selectedUser)
      return () => {
        socket?.emit("leaveChat", selectedUser)
        setMessages(null)
      }
    }
  }, [selectedUser, socket])

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
    }
  }, [typingTimeout])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])


  useEffect(() => {
    if (!socket) return
    socket.on("newMessage", (message) => {
      if (message.chatId === selectedUser) {
        setMessages((prev) => {
          const currentMessage = prev || [];
          const messageExists = currentMessage.some((msg) => msg._id === message._id)
          if (!messageExists) {
            return [...currentMessage, message]
          }
          return currentMessage
        })
        moveToTop(message.chatId, message, false)
      }
      else {
        moveToTop(message.chatId, message, true)
      }
    })

    socket.on("messageSeen", (data) => {
      if (data.chatId === selectedUser) {
        setMessages((prev) => {
          if (!prev) return null;
          return prev.map((msg) => {
            if (msg.sender === loggedInUser?._id && data.messageIds && data.messageIds.includes(msg._id)) {
              return { ...msg, seen: true, seenAt: new Date().toISOString() }
            }
            else if (msg.sender === loggedInUser?._id && !data.messageIds) {
              return { ...msg, seen: true, seenAt: new Date().toISOString() }
            }
            return msg;
          })
        })
        moveToTop(data.chatId, data.message, false)
      }
    })

    socket.on("userTyping", (data) => {
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(true)
      }
    })
    socket.on("userStopTyping", (data) => {
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(false)
      }
    })
    return () => {
      socket?.off("newMessage")
      socket?.off("messageSeen")
      socket?.off("userTyping")
      socket?.off("userStopTyping")
    }
  }, [socket, selectedUser, setChats, loggedInUser?._id])

  const handleMessageSend = async (imageFile?: File | null) => {

    if (!message.trim() && !imageFile) return;
    if (!selectedUser) return;

    //socket work

    if (typingTimeout) {
      clearTimeout(typingTimeout)
      setTypingTimeout(null)

    }

    socket?.emit("stopTyping", {
      chatId: selectedUser,
      userId: loggedInUser?._id,
    })

    const token = Cookies.get('auth_token')
    try {
      const formData = new FormData()
      formData.append('chatId', selectedUser)
      if (message.trim()) {
        formData.append('text', message)
      }
      if (imageFile) {
        formData.append('image', imageFile)
      }
      const { data } = await axios.post(`${chat_service}/api/v1/message`, formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } })
      setMessages((prev) => {
        const currentMessage = prev || [];
        const messageExists = currentMessage.some((msg) => msg._id === data.message._id)
        if (!messageExists) {
          return [...currentMessage, data.message]
        }
        return currentMessage
      })
      setMessage('')
      const displayText = imageFile ? 'image' : message
      moveToTop(selectedUser!, {
        text: displayText,
        sender: data.sender
      },
        false
      )

    }
    catch (error: any) {
      console.log(error)
      alert('Failed to send message')
    }
  }

  const handleTyping = (value: string) => {
    setMessage(value)
    if (!selectedUser || !socket) return
    //socket setup

    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      })
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
      const timeout = setTimeout(() => {
        socket.emit("stopTyping", {
          chatId: selectedUser,
          userId: loggedInUser?._id,
        })
      }, 2000)
      setTypingTimeout(timeout)

    }
  }

  const moveToTop = (chatId: string, newMessage: any, updatedUnseenCount = true) => {
    setChats((prev) => {
      if (!prev) return []

      const updatedChats = [...prev]
      const chatIndex = updatedChats.findIndex((chat) => chat.chat._id === chatId)
      if (chatIndex !== -1) {
        const [moveChat] = updatedChats.splice(chatIndex, 1)
        const updatedChat = {
          ...moveChat,
          chat: {
            ...moveChat.chat,
            latestMessage: {
              text: newMessage?.text,
              sender: newMessage?.sender,
            },
            updatedAt: new Date().toString(),
            unseenCount: updatedUnseenCount && newMessage.sender !== loggedInUser?._id ? (moveChat.chat.unseenCount || 0) + 1 : moveChat.chat.unseenCount || 0,
          }

        }
        updatedChats.unshift(updatedChat)

      }
      return updatedChats
    }
    )
  }

  const resetUnseenCount = (chatId: string) => {
    setChats((prev) => {
      if (!prev) return null;
      return prev.map((chat) => {
        if (chat.chat._id === chatId) {
          return {
            ...chat,
            chat: {
              ...chat.chat,
              unseenCount: 0
            }
          }
        }
        return chat
      })
    })
  }


  async function createChat(u: User) {
    try {
      const token = Cookies.get('auth_token')
      const { data } = await axios.post(`${chat_service}/api/v1/chat/new`, { userId: loggedInUser?._id, otherUserId: u._id }, { headers: { Authorization: `Bearer ${token}` } })
      setSelectedUser(data.chat)
      setShowAllUsers(false)
      await fetchChats()

    } catch (error) {
      console.log(error)
      alert('Failed to create chat')
    }

  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex ☐ bg-gray-900 text-white relative
overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} showAllUsers={showAllUsers} setShowAllUsers={setShowAllUsers} users={users} selectedUser={selectedUser} setSelectedUser={setSelectedUser} loggedInUser={loggedInUser} chats={chats} handleLogout={handleLogout} createChat={createChat} onlineUsers={onlineUsers} />
      <div className='flex-1 flex flex-col justify-between p-4 backderop-blur-xl bg-white/5 border-1 border-white/10'>
        <ChatHeader user={user} setSidebarOpen={setSidebarOpen} isTyping={isTyping} onlineUsers={onlineUsers} />
        <ChatMessage selectedUser={selectedUser} loggedInUser={loggedInUser} messages={messages} />
        <MessageInput selectedUser={selectedUser} message={message} setMesssage={handleTyping} handleMessageSend={handleMessageSend} />
      </div>
    </div>
  )
}

export default ChatPage
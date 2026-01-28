"use client"
import React, { useEffect, useState } from 'react'
import { useAppContext, User } from '@/context/AppContext'
import { redirect, useRouter } from 'next/navigation'

export interface Message{
  _id:string;
  chatId:string;
  sender:string;
  text?:string;
 image?:{
  url:string;
  publicId:string;
 };
 messageType:"text"|"image";
seen:boolean;
seenAt?:string;
createdAt:string;
}


function page() {
  const {isAuth,loading,logoutUser,chats,fetchChats,user:loggedInUser,setChats} = useAppContext()

  const [selectedUser,setSelectedUser] = useState<string | null>(null)
  const [message,setMessage] = useState("")
  const [sidebarOpen,setSidebarOpen] = useState(false)
  const [messages,setMessages] = useState<Message[] | null>(null)
  const [user,serUser] = useState<User | null>(null)
  const [showAllUser,setShowAllUser] = useState(false)
  const [isTyping,setIsTyping] = useState(false)
  const [typingTimeout,setTypingTimeout] = useState<NodeJS.Timeout | null>(null)


 const router = useRouter();


 useEffect(() => {
  if(!isAuth && !loading){
    router.push('/login')
  }
 },[isAuth,loading,router])

if(loading){
  return <div className='flex items-center justify-center h-screen'>
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
}



  return (
    <div>Chat</div>
  )
}

export default page
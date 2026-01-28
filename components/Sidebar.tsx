"use client"
import React, { useState, useEffect } from 'react'
import { useAppContext, User } from '@/context/AppContext'
import Image from 'next/image'
import { format } from 'date-fns'
import { Message } from '@/app/chat/page'

interface SidebarProps {
  selectedUser: string | null
  setSelectedUser: (userId: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  showAllUser: boolean
  setShowAllUser: (show: boolean) => void
  messages: Message[] | null
  users: User[] | null
  loggedInUser: User | null
  chats: any[] | null
  fetchChats: () => void
  handleLogout: () => void
  createChat: (user: User) => void
}

function Sidebar({ 
  selectedUser, 
  setSelectedUser, 
  sidebarOpen, 
  setSidebarOpen,
  showAllUser,
  setShowAllUser,
  messages,
  users,
  loggedInUser,
  chats,
  fetchChats,
  handleLogout,
  createChat
}: SidebarProps) {

  const [searchTerm, setSearchTerm] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')

  // Filter chats based on search
  const filteredChats = chats?.filter(chat => {
    const otherUser = chat?.users?.find((u: User) => u._id !== loggedInUser?._id)
    return otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Filter users for "All Users" modal (excluding logged in user and users already in chats)
  const filteredUsers = users?.filter(user => {
    // Exclude logged in user
    if (user._id === loggedInUser?._id) return false
    
    // Filter by search term
    if (userSearchTerm && !user.name.toLowerCase().includes(userSearchTerm.toLowerCase())) {
      return false
    }
    
    // Check if user already has a chat
    const existingChat = chats?.find(chat => 
      chat.users?.some((u: User) => u._id === user._id)
    )
    
    // Return users without existing chats (or all users if you want to show all)
    return true // Change to !existingChat if you only want to show users without existing chats
  })

  // Get last message for a chat - use latestMessage from API if messages array is null
  const getLastMessage = (chatId: string) => {
    if (messages) {
      // If we have messages array, use it
      const chatMessages = messages.filter(msg => msg.chatId === chatId)
      return chatMessages[chatMessages.length - 1]
    } else {
      // Otherwise, use the latestMessage from the chat object
      const chat = chats?.find(c => c._id === chatId)
      if (chat?.latestMessage) {
        return {
          text: chat.latestMessage.text,
          messageType: 'text' as const,
          createdAt: chat.updatedAt
        }
      }
      return null
    }
  }

  // Format date for message preview
  const formatMessageDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) return 'Yesterday'
      if (diffDays > 1) return format(date, 'MM/dd')
      return format(date, 'HH:mm')
    } catch (error) {
      return ''
    }
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* All Users Modal/Overlay */}
      {showAllUser && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAllUser(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  New Chat
                </h2>
                <button
                  onClick={() => setShowAllUser(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Users List */}
              <div className="overflow-y-auto max-h-[60vh]">
                {filteredUsers?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      {userSearchTerm ? 'No users found' : 'No users available'}
                    </p>
                  </div>
                ) : (
                  filteredUsers?.map((user) => {
                    // Check if user already has a chat
                    const existingChat = chats?.find(chat => 
                      chat.users?.some((u: User) => u._id === user._id)
                    )

                    return (
                      <div
                        key={user._id}
                        onClick={() => {
                          if (existingChat) {
                            // If chat exists, select it
                            const otherUser = existingChat.users?.find((u: User) => u._id === user._id)
                            setSelectedUser(otherUser?._id || null)
                          } else {
                            // Otherwise, create a new chat
                            createChat(user)
                            setSelectedUser(user._id)
                          }
                          setShowAllUser(false)
                          setSidebarOpen(false)
                        }}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        {/* User Avatar */}
                        <div className="relative">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                            {user?.avatar?.url ? (
                              <Image
                                src={user.avatar.url}
                                alt={user.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-lg font-semibold text-gray-600 dark:text-gray-300">
                                {user?.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          {/* Online Status Indicator */}
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 ml-3">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">
                              {user.name}
                            </h3>
                            {existingChat && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Existing chat
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-full lg:w-80 bg-white dark:bg-gray-900 
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
        border-r border-gray-200 dark:border-gray-800
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900">
              {loggedInUser?.avatar?.url ? (
                <Image
                  src={loggedInUser.avatar.url}
                  alt={loggedInUser.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-lg font-semibold text-blue-600 dark:text-blue-300">
                  {loggedInUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">
                {loggedInUser?.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Online
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* New Chat Button */}
            <button
              onClick={() => setShowAllUser(!showAllUser)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="New Chat"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            {/* Logout Button - Fixed to use handleLogout prop */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            
            {/* Close sidebar button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {filteredChats?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No chats found' : 'No chats yet'}
                </p>
                <button
                  onClick={() => setShowAllUser(true)}
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Start a new conversation
                </button>
              </div>
            ) : (
              filteredChats?.map((chat) => {
                const otherUser = chat.users?.find((u: User) => u._id !== loggedInUser?._id)
                const lastMessage = getLastMessage(chat._id)
                
                // Use unseenCount from chat if messages array is not available
                const unreadCount = chat.unseenCount || messages?.filter(
                  msg => msg.chatId === chat._id && 
                  msg.sender !== loggedInUser?._id && 
                  !msg.seen
                ).length || 0

                return (
                  <div
                    key={chat._id}
                    onClick={() => {
                      setSelectedUser(otherUser?._id || null)
                      setSidebarOpen(false)
                    }}
                    className={`
                      flex items-center p-3 rounded-lg cursor-pointer transition-all
                      hover:bg-gray-50 dark:hover:bg-gray-800 mb-1
                      ${selectedUser === otherUser?._id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                        : ''
                      }
                    `}
                  >
                    {/* User Avatar */}
                    <div className="relative">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        {otherUser?.avatar?.url ? (
                          <Image
                            src={otherUser.avatar.url}
                            alt={otherUser.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-lg font-semibold text-gray-600 dark:text-gray-300">
                            {otherUser?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Online Status Indicator */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 ml-3 overflow-hidden">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">
                          {otherUser?.name || 'Unknown User'}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatMessageDate(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {lastMessage?.text || 'Start a conversation'}
                        </p>
                        
                        {/* Unread Message Count */}
                        {unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full min-w-[20px] text-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* User Status */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Active now</span>
            </div>
            <button
              onClick={fetchChats}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Refresh chats"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
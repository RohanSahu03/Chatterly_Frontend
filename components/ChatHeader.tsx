import { User } from '@/context/AppContext';
import { Menu, UserCircle } from 'lucide-react'
import React from 'react'

interface ChatHeaderProps {
    user: User | null;
    setSidebarOpen: (open: boolean) => void;
    isTyping: boolean;
    onlineUsers: string[];
}

function ChatHeader({ user, setSidebarOpen, isTyping, onlineUsers }: ChatHeaderProps) {
    const isOnlineUser = user && onlineUsers.includes(user?.user?._id);
    return (
        <>
            {/* mobile menu toggle */}
            <div className='sm:hidden fixed top-4 right-4 z-30'>
                <button className='p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors'
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu className='w-6 h-6 text-white' />
                </button>
            </div>
            {/* chat header */}
            <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className='flex item-center gap-4'>
                    {
                        user ? (
                            <>
                                <div className='relative'>
                                    <div className='w-12 h-12 rounded-full bg-gray-700 flex items-center  justify-center '>
                                        <UserCircle className='w-8 h-8 text-gray-300' />
                                    </div>
                                    {/* online user setup */}
                                    {
                                        isOnlineUser && (
                                            <span className='absolute -top-0 -right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-800'>
                                                <span className='absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75'></span>
                                            </span>
                                        )
                                    }
                                </div>
                                {/* user info */}
                                <div className='flex-1 min-w-0'>
                                    <div className='flex item-center gap-3 mb-1'>
                                        <h2 className='text-2xl font-bold text-white truncate'>{user?.user?.name}</h2>
                                    </div>
                                    {/* typing */}
                                    {
                                        isTyping ? <div className="flex items-center gap-2 text-sm">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full
animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full
animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full
animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                                <span className='text-blue-500 font-medium'>
                                                    typing...
                                                </span>
                                            </div>
                                        </div> : <div className='flex item-center gap-2'>
                                  
                                            <span
                                                className={`text-sm font-medium ${isOnlineUser ? "text-green-500" : "text-gray-400"
                                                    }`}>
                                                {isOnlineUser ? "Online" : "offline"}
                                            </span>
                                        </div>
                                    }
                                </div>


                            </>
                        ) : (
                            <div className='text-center'>
                                <h2 className='text-xl font-bold'>Select a chat</h2>
                            </div>
                        )
                    }

                </div>
            </div>
        </>
    )
}

export default ChatHeader
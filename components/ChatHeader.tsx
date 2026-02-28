import { User } from '@/context/AppContext';
import { Menu, UserCircle } from 'lucide-react'
import React from 'react'

interface ChatHeaderProps {
    user: User | null;
    setSidebarOpen: (open: boolean) => void;
    isTyping: boolean;
}

function ChatHeader({ user, setSidebarOpen, isTyping }: ChatHeaderProps) {
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
                                    <div className='w-12 h-12 rounded-full bg-gray-700 flex item-center  justify-center '>
                                        <UserCircle className='w-8 h-8 text-gray-300' />
                                    </div>
                                    {/* online user setup */}

                                </div>
                                {/* user info */}
                                <div className='flex-1 min-w-0'>
                                    <div className='flex item-center gap-3 mb-1'>
                                        <h2 className='text-2xl font-bold text-white truncate'>{user?.user?.name}</h2>
                                    </div>

                                </div>
                                {/* to show typing status */}
                                {/* {isTyping && (
                                    <div className='text-sm text-gray-400'>
                                        <span className='animate-pulse'>Typing...</span>
                                    </div>
                                )} */}
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
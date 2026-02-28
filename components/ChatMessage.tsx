import { Message } from '@/app/chat/page';
import { User } from '@/context/AppContext';
import { Check, CheckCheck } from 'lucide-react';
import moment from 'moment';
import React, { useEffect, useMemo, useRef } from 'react'

interface ChatMessageProps {
    messages: Message[] | null;
    selectedUser: string | null;
    loggedInUser: User | null;
}

function ChatMessage({ messages, selectedUser, loggedInUser }: ChatMessageProps) {

    const bottomRef = useRef<HTMLDivElement>(null);

    //see feature
    const uniqueMessages = useMemo(() => {
        if (!messages) return [];
        const seen = new Set();
        return messages.filter(message => {
            const duplicate = seen.has(message._id);
            seen.add(message._id);
            return !duplicate;
        });
    }, [messages]);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [uniqueMessages, selectedUser]);

    return (
        <div className='flex-1 overflow-hidden'>
            <div className='h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2 custom-scroll'>

                {
                    !selectedUser ? <p className='text-gray-400 text-center mt-20'>Select a chat to start messaging</p> : (
                        <>
                            {
                                uniqueMessages.map((e, i) => {
                                    const isSentByMe = e.sender === loggedInUser?._id;
                                    const uniqueKey = `${e._id}-${i}`;
                                    return (
                                        <div className={`flex flex-col gap-1 mt-2 ${isSentByMe ? 'items-end' : 'items-start'}`}
                                            key={uniqueKey}
                                        >
                                            <div className={`max-w-[80%] md:max-w-[60%] p-1 rounded-lg shadow-md ${isSentByMe ? 'bg-gray-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>

                                                {e.messageType === 'text' && (
                                                    <p className='text-sm text-white break-words'>{e.text}</p>
                                                )}
                                                {e.messageType === 'image' && (
                                                    <img src={e.image?.url} alt="image" className='max-w-full h-auto rounded-lg' />
                                                )}

                                            </div>
                                            <div className={`flex items-center gap-1 text-xs text-gray-400 ${isSentByMe ? 'pr-2 flex-row-reverse' : 'pl-2'}`}>
                                            <span>{moment(e.createdAt).format('h:mm A . MMM D')}</span>
                                            {
                                                isSentByMe && <div className="flex item-center ml-1">
                                                    {
                                                        e.seen ? <div className="flex items-center gap-1 text-blue-400">
                                                            <CheckCheck className='w-3 h-3' />
                                                            {
                                                                e.seenAt && <span>{moment(e.seenAt).format('h:mm A')}</span>
                                                            }
                                                        </div> : <Check className='w-3 h-3 text-gray-500' />
                                                        
                                                    }
                                                </div>
                                            }
                                            </div>
                                        </div>
                                    )
                                })
                            }
                            <div ref={bottomRef} />
                        </>
                    )
                }


            </div>
        </div>
    )
}

export default ChatMessage
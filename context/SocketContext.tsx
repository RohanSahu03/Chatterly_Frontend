"use client"
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { chat_service, useAppContext } from "./AppContext";
interface SocketContexType {
    socket: Socket | null;
    onlineUsers:string[];
}

const SocketContext = createContext<SocketContexType>({
    socket: null,
    onlineUsers:[]
})

interface ProviderProps {
    children: ReactNode;
}

export const SocketProvider = ({ children }: ProviderProps) => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const { user } = useAppContext()
    const [onlineUsers,setOnlineUsers]=useState<string[]>([]);


    useEffect(() => {
        if (!user?._id) return;
        const newSocket = io(chat_service,{
            query:{
                userId:user._id
            }
        })
        setSocket(newSocket)

        newSocket.on("getOnlineUser",(users:string[])=>{
            setOnlineUsers(users)
        })

        return () => {
            newSocket.disconnect();
        }
    }, [user?._id])

    return(
        <SocketContext.Provider value={{socket,onlineUsers}}>
        {children}
        </SocketContext.Provider>
    );
  
}

export const SocketData = ()=>useContext(SocketContext)
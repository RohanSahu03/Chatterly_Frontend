"use client"

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";


export const user_service = "http://localhost:5000"
export const chat_service = "http://localhost:5002"


export interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

export interface Chat{
    _id: string;
    users: string[];
    latestMessage:{
        text:string;
        sender:string;
    }
    createdAt:string;
    updatedAt:string;
    unseenCount?:number;
}

export interface Chats{
    _id:string;
    user:User;
    chat:Chat;
}

 interface AppContextType{
 user:User | null;
 loading:boolean;
 isAuth:boolean;
 setUser:React.Dispatch<React.SetStateAction<User | null>>;
 setIsAuth:React.Dispatch<React.SetStateAction<boolean>>;
 logoutUser:()=>Promise<void>;
 fetchUser:()=>Promise<void>;
 fetchChats:()=>Promise<void>;
 fetchUsers:()=>Promise<void>;
 chats:Chats[] | null;
 users:User[] | null;
 setChats:React.Dispatch<React.SetStateAction<Chats[] | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps{
    children:React.ReactNode;
}

export const AppProvider = ({children}:AppProviderProps) => {
    const [user,setUser] = useState<User | null>(null);
    const [loading,setLoading] = useState<boolean>(false);
    const [isAuth,setIsAuth] = useState<boolean>(false);

async function fetchUser(){
    try{

        const token = Cookies.get("auth_token");
        const {data } = await axios.get(`${user_service}/api/v1/profile`,{
            headers:{
                Authorization: `Bearer ${token}`
            }
        })
        setUser(data)
        setIsAuth(true)
        setLoading(false)
    }
    catch(error){
        console.log(error)
    }
}
useEffect(() => {
    fetchUser()
},[])

async function logoutUser(){
        Cookies.remove("auth_token");
        setUser(null);
        setIsAuth(false);
        setLoading(false);
}
const [chats,setChats]=useState<Chats[] | null>(null);
async function fetchChats(){
    try{
        const token = Cookies.get("auth_token");
        const {data } = await axios.get(`${chat_service}/api/v1/chat/all`,{
            headers:{
                Authorization: `Bearer ${token}`
            }
        })
        setChats(data.chats)
    }
    catch(error){
        console.log(error)
    }
}

const [users,setUsers]=useState<User[] | null>(null);
async function fetchUsers(){
    try{
        const token = Cookies.get("auth_token");
        const {data } = await axios.get(`${user_service}/api/v1/users`,{
            headers:{
                Authorization: `Bearer ${token}`
            }
        })
        setUsers(data)
    }
    catch(error){
        console.log(error)
    }
}

useEffect(() => {
    fetchChats()
    fetchUsers()
},[])

    return (
        <AppContext.Provider value={{user,loading,isAuth,setUser,setIsAuth,logoutUser,fetchUser,fetchChats,fetchUsers,chats,setChats,users}}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = ():AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
}


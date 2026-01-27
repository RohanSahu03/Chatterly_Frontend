"use client"
import React, { useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'
import { redirect, useRouter } from 'next/navigation'

function page() {
  const {isAuth,loading} = useAppContext()

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
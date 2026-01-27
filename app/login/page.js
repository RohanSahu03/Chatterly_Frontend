'use client'

import { useState } from 'react'
import { Mail, Lock, ArrowRight, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useAppContext } from '@/context/AppContext'
import { redirect } from 'next/navigation'

export default function LoginPage() {
  const {isAuth,setIsAuth,setUser,loading:userLoading}= useAppContext()
  const [step, setStep] = useState('email') // 'email' or 'otp'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const [otpVerified, setOtpVerified] = useState(false)


  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  // API call to send OTP
  const sendOtpApi = async (email) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/login`, {
        email: email
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // API call to verify OTP
  const verifyOtpApi = async (email, otp) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/verify-otp`, {
        email: email,
        otp: otp
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Handle email submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setEmailError('')
    setIsLoading(true)

    try {
      // Call API to send OTP
      const response = await sendOtpApi(email)
      
      // Assuming API returns success message
      console.log('OTP sent:', response)
      
      setIsLoading(false)
      setStep('otp')
      startResendTimer()
      
      // Show success message if needed
      // alert(response.message || 'OTP sent successfully!')
      
    } catch (error) {
      setIsLoading(false)
      // Handle different error responses
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setEmailError(error.response.data?.message || 'Failed to send OTP. Please try again.')
      } else if (error.request) {
        // The request was made but no response was received
        setEmailError('Network error. Please check your connection.')
      } else {
        // Something happened in setting up the request that triggered an Error
        setEmailError('An error occurred. Please try again.')
      }
    }
  }

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return // Only allow numbers
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setOtpError('')

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return
    
    const newOtp = [...otp]
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char
    })
    setOtp(newOtp)
    
    // Focus last input
    const lastIndex = Math.min(5, pastedData.length - 1)
    document.getElementById(`otp-${lastIndex}`)?.focus()
  }

  // Handle OTP verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    
    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      setOtpError('Please enter a 6-digit OTP')
      return
    }

    setIsLoading(true)
    setOtpError('')

    try {
      // Call API to verify OTP
      const response = await verifyOtpApi(email, otpValue)
      
      console.log('OTP verification response:', response)
      
      // Assuming API returns a token in response
      const token = response.token || response.data?.token
      
      if (token) {
        // Set token in cookie
        Cookies.set('auth_token', token, { 
          expires: 7, // 7 days
          secure:false,
          path:'/'
        })
        
        // Set user data in cookie if available
        // if (response.user) {
        //   Cookies.set('user_data', JSON.stringify(response.user), {
        //     expires: 7,
        //     secure: false,
        //     path:'/'
        //   })
        // }
        
        setOtpVerified(true)
        setIsLoading(false)
        setUser(response.user)
        setIsAuth(true)
        
        // Show success and redirect
        setTimeout(() => {
          alert('Login successful! Redirecting...')
          
          // Reset form
          setStep('email')
          setEmail('')
          setOtp(['', '', '', '', '', ''])
          setOtpVerified(false)
          
          // Redirect to dashboard or home page
          redirect('/chat') // Change to your redirect path
          
        }, 1000)
        
      } else {
        throw new Error('No token received from server')
      }
      
    } catch (error) {
      setIsLoading(false)
      
      if (error.response) {
        // Handle API error responses
        const errorMessage = error.response.data?.message || 'Invalid OTP. Please try again.'
        setOtpError(errorMessage)
        
        // Optional: Clear OTP on error
        // setOtp(['', '', '', '', '', ''])
        // document.getElementById('otp-0')?.focus()
        
      } else if (error.request) {
        setOtpError('Network error. Please check your connection.')
      } else {
        setOtpError('An error occurred. Please try again.')
      }
    }
  }

  // Handle back to email
  const handleBackToEmail = () => {
    setStep('email')
    setOtp(['', '', '', '', '', ''])
    setOtpError('')
    setResendTimer(30)
  }

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    
    setIsLoading(true)
    setOtp(['', '', '', '', '', ''])
    setOtpError('')
    
    try {
      // Call API to resend OTP
      const response = await sendOtpApi(email)
      
      console.log('OTP resent:', response)
      
      setIsLoading(false)
      startResendTimer()
      alert('New OTP sent to your email!')
      
    } catch (error) {
      setIsLoading(false)
      
      if (error.response) {
        setOtpError(error.response.data?.message || 'Failed to resend OTP. Please try again.')
      } else if (error.request) {
        setOtpError('Network error. Please check your connection.')
      } else {
        setOtpError('An error occurred. Please try again.')
      }
    }
  }

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(30)
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  if(userLoading){
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  }

  if(isAuth){
     redirect('/chat')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {step === 'email' ? 'Welcome Back' : 'Verify OTP'}
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 'email' 
                ? 'Enter your email to continue' 
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailError('')
                    }}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      emailError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                {emailError && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  By continuing, you agree to our Terms and Privacy Policy
                </p>
              </div>
            </form>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                  Enter 6-digit verification code
                </label>
                
                <div className="flex justify-center gap-3 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onPaste={handleOtpPaste}
                      onKeyDown={(e) => {
                        // Handle backspace
                        if (e.key === 'Backspace' && !digit && index > 0) {
                          document.getElementById(`otp-${index - 1}`)?.focus()
                        }
                      }}
                      className={`w-12 h-12 text-2xl text-center font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        otpError ? 'border-red-300 shake' : 'border-gray-300'
                      } ${digit ? 'border-blue-500 bg-blue-50' : ''}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="flex items-center justify-center gap-1 mb-4 text-red-600 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>{otpError}</span>
                  </div>
                )}

                {otpVerified && (
                  <div className="flex items-center justify-center gap-1 mb-4 text-green-600 text-sm animate-pulse">
                    <CheckCircle className="w-4 h-4" />
                    <span>OTP Verified Successfully!</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading || otpVerified}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : otpVerified ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verified!
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isLoading}
                  className="w-full text-gray-600 py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : resendTimer > 0 ? (
                    `Resend OTP in ${resendTimer}s`
                  ) : (
                    'Resend OTP'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToEmail}
                  disabled={isLoading}
                  className="w-full text-blue-600 py-3 px-4 rounded-lg font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                >
                  ← Back to email
                </button>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Didn't receive the code? Check your spam folder.</p>
              </div>
            </form>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
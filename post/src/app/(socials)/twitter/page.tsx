'use client'
import MarketingIdeasGenerator from '@/components/Ideas'
import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'

interface PostResult {
    success: boolean;
    message: string;
}

function Page() {
    const { data: session } = useSession()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [tweetText, setTweetText] = useState('')
    const [posting, setPosting] = useState(false)
    const [postResult, setPostResult] = useState<PostResult | null>(null)

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    const postTweet = async (e : any) => {
        e.preventDefault()
        if (!tweetText.trim()) return
        
        try {
            setPosting(true)
            const response = await fetch('/api/post/twitter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: tweetText }),
            })
            
            const data = await response.json()
            
            if (response.ok) {
                setPostResult({ success: true, message: 'Tweet posted successfully!' })
                setTweetText('')
            } else {
                setPostResult({ success: false, message: data.error || 'Failed to post tweet' })
            }
        } catch (error) {
            setPostResult({ success: false, message: 'An error occurred while posting' })
        } finally {
            setPosting(false)
        }
    }

    return (
        <div className="h-[90vh] relative bg-white text-black dark:bg-[#08080a] dark:text-white">
            <div className="absolute top-4 right-4 flex items-center gap-3">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
                
                {session ? (
                    <button
                        onClick={() => signOut()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                        <TwitterIcon />
                        Sign Out
                    </button>
                ) : (
                    <button
                        onClick={() => signIn('twitter')}
                        className="inline-flex items-center gap-2 px-4 py-2 text-white bg-[#1DA1F2] rounded-lg hover:bg-[#1a8cd8] shadow-sm"
                    >
                        <TwitterIcon />
                        Sign in with Twitter
                    </button>
                )}
            </div>


            {/* Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} z-50`}>
                <div className="p-6 h-full overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Twitter Tools</h2>
                        <button 
                            onClick={toggleSidebar}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <MarketingIdeasGenerator />
                    
                    {session ? (
                        <div>
                            <div className="mb-4 flex items-center">
                                {session.user?.image && (
                                    <img 
                                        src={session.user.image} 
                                        // alt={session.user.name} 
                                        className="w-10 h-10 rounded-full mr-3"
                                    />
                                )}
                                <div>
                                    <p className="font-semibold">{session.user?.name}</p>
                                    <p className="text-gray-500 dark:text-gray-400">@{session.user?.email}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <h3 className="text-lg font-medium mb-3">Post a Tweet</h3>
                                <form onSubmit={postTweet}>
                                    <div className="mb-4">
                                        <textarea
                                            value={tweetText}
                                            onChange={(e) => setTweetText(e.target.value)}
                                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="What's happening?"
                                            rows={4}
                                            maxLength={280}
                                        ></textarea>
                                        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                                            {tweetText.length}/280
                                        </div>
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={posting || !tweetText.trim()}
                                        className="w-full py-2 px-4 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {posting ? 'Posting...' : 'Tweet'}
                                    </button>
                                </form>
                                
                                {postResult && (
                                    <div className={`mt-4 p-3 rounded-lg ${postResult.success ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                                        {postResult.message}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64">
                            <p className="text-center mb-4">Sign in with Twitter to post tweets</p>
                            <button
                                onClick={() => signIn('twitter')}
                                className="inline-flex items-center gap-2 px-4 py-2 text-white bg-[#1DA1F2] rounded-lg hover:bg-[#1a8cd8]"
                            >
                                <TwitterIcon />
                                Sign in with Twitter
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function TwitterIcon() {
    return (
        <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
    )
}

function MenuIcon() {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
        >
            <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
            />
        </svg>
    )
}

function CloseIcon() {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
        >
            <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
            />
        </svg>
    )
}

export default Page
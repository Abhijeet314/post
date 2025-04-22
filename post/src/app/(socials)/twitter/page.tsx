'use client'
import React, { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'

interface PostResult {
    success: boolean;
    message: string;
}

interface Idea {
  id: string;
  content: string;
  imageUrl?: string;
}

function Page() {
    const { data: session } = useSession()
    const [_tweetText, setTweetText] = useState('')
    const [posting, setPosting] = useState(false)
    const [postResult, setPostResult] = useState<PostResult | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([])
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        tone: 'professional',
        numberOfIdeas: 5,
        platform: 'twitter',
        productDescription: '',
        contentType: 'text'
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'numberOfIdeas' ? parseInt(value, 10) : value
        }));
    };

    const handleGenerateIdeas = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setGeneratedIdeas([]);

        try {
            const response = await fetch('/api/generate-ideas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to generate ideas');
            }

            const data = await response.json();
            setGeneratedIdeas(data.ideas);
            setFormOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const postTweet = async (text: string) => {
        if (!text.trim()) return
        
        try {
            setPosting(true)
            const response = await fetch('/api/post/twitter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation Bar */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <svg className="w-8 h-8 text-blue-500 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.5 19C13.0899 19 16 16.0899 16 12.5C16 8.91015 13.0899 6 9.5 6C5.91015 6 3 8.91015 3 12.5C3 16.0899 5.91015 19 9.5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 15L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9.5 10V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M7 12.5H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Content Ideas Generator</h1>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {/* Generate Ideas Button */}
                            <button
                                onClick={() => setFormOpen(true)}
                                className="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-sm hover:shadow"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Generate Ideas
                            </button>
                            
                            {/* Sign In/Out Button */}
                            {session ? (
                                <button
                                    onClick={() => signOut()}
                                    className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                >
                                    <TwitterIcon className="w-5 h-5" />
                                    Sign Out
                                </button>
                            ) : (
                                <button
                                    onClick={() => signIn('twitter')}
                                    className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-sm hover:shadow"
                                >
                                    <TwitterIcon className="w-5 h-5" />
                                    Sign in with Twitter
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex">
                            <svg className="w-5 h-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {/* Generated Ideas */}
                {generatedIdeas.length > 0 ? (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Generated Ideas</h2>
                            <div className="flex gap-2 items-center">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                                    {formData.platform}
                                </span>
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-medium">
                                    {formData.tone} tone
                                </span>
                            </div>
                        </div>

                        {/* Ideas Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {generatedIdeas.map(idea => (
                                <div 
                                    key={idea.id} 
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                                >
                                    {idea.imageUrl && (
                                        <div className="mb-4 rounded-lg overflow-hidden">
                                            <Image 
                                                src={idea.imageUrl} 
                                                alt="Generated content" 
                                                width={600} 
                                                height={400} 
                                                className="w-full h-auto"
                                            />
                                        </div>
                                    )}
                                    <p className="text-gray-800 dark:text-gray-200 mb-4">{idea.content}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => {
                                                postTweet(idea.content);
                                            }}
                                            disabled={posting}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors"
                                        >
                                            {posting ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Posting...
                                                </>
                                            ) : (
                                                <>
                                                    <TwitterIcon className="w-4 h-4" />
                                                    Post to Twitter
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(idea.content);
                                                // You could add a state to show a brief "Copied!" message
                                            }}
                                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V17M8 5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V17C16 18.1046 15.1046 19 14 19H10C8.89543 19 8 18.1046 8 17V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Copy
                                        </button>
                                    </div>
                                    
                                    {/* Success/error messages */}
                                    {postResult && (
                                        <div className={`mt-3 p-2 ${postResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'} rounded-md text-sm flex items-center`}>
                                            {postResult.success ? (
                                                <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {postResult.message}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 text-center">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                            <svg 
                                className="w-12 h-12 text-blue-500" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={1.5} 
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Generate Creative Content Ideas</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Click the Generate Ideas button to create engaging content ideas for your product or service tailored to your target platform.
                        </p>
                        <button
                            onClick={() => setFormOpen(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-md flex items-center gap-2 mx-auto transition-all shadow-sm hover:shadow"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Generate Ideas
                        </button>
                    </div>
                )}
            </main>

            {/* Generate Ideas Form Dialog - Fixed z-index and propagation issues */}
            {formOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[1000] overflow-y-auto overflow-x-hidden">
                    {/* Modal backdrop with stopPropagation */}
                    <div 
                        className="fixed inset-0 bg-gray-500/30 dark:bg-gray-900/50 backdrop-blur-sm transition-opacity" 
                        onClick={() => setFormOpen(false)}
                        aria-hidden="true"
                    ></div>
                    
                    {/* Modal content with stopPropagation */}
                    <div 
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md z-[1001] relative overflow-hidden mx-auto my-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Generate Ideas</h2>
                            <button 
                                onClick={() => setFormOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <form onSubmit={handleGenerateIdeas} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Tone
                                    </label>
                                    <select
                                        name="tone"
                                        value={formData.tone}
                                        onChange={handleFormChange}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    >
                                        <option value="professional">Professional</option>
                                        <option value="casual">Casual</option>
                                        <option value="humorous">Humorous</option>
                                        <option value="sarcastic">Sarcastic</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Number of Ideas
                                    </label>
                                    <input
                                        type="number"
                                        name="numberOfIdeas"
                                        value={formData.numberOfIdeas}
                                        onChange={handleFormChange}
                                        min="1"
                                        max="10"
                                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Target Platform
                                    </label>
                                    <select
                                        name="platform"
                                        value={formData.platform}
                                        onChange={handleFormChange}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    >
                                        <option value="twitter">Twitter</option>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="youtube">YouTube</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Content Type
                                    </label>
                                    <select
                                        name="contentType"
                                        value={formData.contentType}
                                        onChange={handleFormChange}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    >
                                        <option value="text">Text Only</option>
                                        <option value="image">Text & Image</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Product Description
                                    </label>
                                    <textarea
                                        name="productDescription"
                                        value={formData.productDescription}
                                        onChange={handleFormChange}
                                        required
                                        rows={4}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Describe your product or service..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-2.5 px-4 rounded-md ${isLoading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'} transition-colors shadow-sm`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating...
                                        </div>
                                    ) : (
                                        'Generate Ideas'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function TwitterIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            className={className}
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
    )
}

export default Page
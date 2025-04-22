"use client";
import React, { useState } from 'react';
import { useSession} from 'next-auth/react';
import { exportToPDF, exportToJSON, exportToText } from '@/lib/exportUtils';
import Image from 'next/image';

function Ideas() {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    tone: 'professional',
    numberOfIdeas: 5,
    platform: 'twitter',
    productDescription: '',
    contentType: 'text' // 'text' or 'image'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [exportSuccess, setExportSuccess] = useState(false);
  
  interface Idea {
    id: string;
    content: string;
    imageUrl?: string;
  }
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState('');
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfIdeas' ? parseInt(value, 10) : value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async (id: string, content: string) => {
    setIsGeneratingImage(id);
    
    try {
      // Call the API endpoint instead of using the service directly
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, platform: formData.platform })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const data = await response.json();
      const imageUrl = data.imageUrl;
      
      if (!imageUrl) {
        throw new Error('Failed to generate image');
      }
      
      // Update the idea with the image URL
      setGeneratedIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === id ? { ...idea, imageUrl } : idea
        )
      );
      
      return imageUrl;
    } catch (err) {
      console.error('Error generating image:', err);
      setPostError(err instanceof Error ? err.message : 'Failed to generate image');
      setTimeout(() => setPostError(null), 3000);
      return null;
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const handlePost = async (id: string, content: string, imageUrl?: string) => {
    if (!session) {
      // Show sign-in modal or message
      setPostError("Please sign in with Twitter to post this content");
      setTimeout(() => setPostError(null), 3000);
      return;
    }

    setIsPosting(id);
    setPostSuccess(null);
    setPostError(null);
    
    try {
      // If the content type is 'image' and no image has been generated yet, generate one
      let finalImageUrl: string | undefined = imageUrl;
      if (formData.contentType === 'image' && !finalImageUrl) {
        const generatedImageUrl = await generateImage(id, content);
        finalImageUrl = generatedImageUrl || undefined;
        if (!finalImageUrl) {
          throw new Error('Failed to generate image for post');
        }
      }
      
      // Prepare the post data based on whether we have an image or not
      const postData = finalImageUrl 
        ? { text: content, image: finalImageUrl } 
        : { text: content };
      
      const response = await fetch('/api/post/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post to Twitter');
      }

      const data = await response.json();
      
      // Show warning if the tweet was posted without the image
      if (data.warning) {
        setPostSuccess(id);
        setPostError(data.warning); // Show warning message about image limitations
        setTimeout(() => {
          setPostSuccess(null);
          setPostError(null);
        }, 5000);
      } else {
        setPostSuccess(id);
        setTimeout(() => setPostSuccess(null), 3000);
      }
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Failed to post to Twitter');
      setTimeout(() => setPostError(null), 3000);
    } finally {
      setIsPosting(null);
    }
  };

  const handleExport = () => {
    setExportLoading(true);
    
    try {
      // Create a better title with platform and date
      const platformLabel = formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1);
      const title = `${platformLabel} Content Ideas - ${formData.tone} tone`;
      
      // Enhance ideas with additional metadata for better formatting
      const exportItems = generatedIdeas.map((idea, index) => ({
        ...idea,
        index: index + 1,
        platform: formData.platform,
        tone: formData.tone,
        type: 'Content Idea',
        // Add a category based on tone
        category: formData.contentType === 'image' ? 'Visual Content' : 'Text Content'
      }));
      
      switch (exportFormat) {
        case 'pdf':
          exportToPDF(exportItems, title);
          break;
        case 'json':
          exportToJSON(exportItems, title);
          break;
        case 'text':
          exportToText(exportItems, title);
          break;
        default:
          exportToPDF(exportItems, title);
      }
      
      // Show success message
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export content');
      setTimeout(() => setError(''), 3000);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Content Ideas Generator</h1>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 flex items-center"
            type="button"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Generate Ideas
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
            {error}
          </div>
        )}
        
        {exportSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Content exported successfully!
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-lg text-gray-700">Generating ideas...</p>
          </div>
        ) : (
          <>
            {generatedIdeas.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Generated Ideas</h2>
                  
                  <div className="flex items-center">
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="mr-2 p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="pdf">PDF Format</option>
                      <option value="json">JSON Format</option>
                      <option value="text">Text Format</option>
                    </select>
                    
                    <button
                      onClick={handleExport}
                      disabled={exportLoading}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                    >
                      {exportLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-1">
                  {generatedIdeas.map(idea => (
                    <div key={idea.id} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-start justify-between">
                          <p className="text-lg font-medium text-gray-900">{idea.content}</p>
                          <div className="flex items-center ml-4">
                            {formData.contentType === 'image' && !idea.imageUrl && (
                              <button
                                onClick={() => generateImage(idea.id, idea.content)}
                                disabled={isGeneratingImage === idea.id}
                                className="mr-2 p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                              >
                                {isGeneratingImage === idea.id ? (
                                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handlePost(idea.id, idea.content, idea.imageUrl)}
                              disabled={isPosting === idea.id}
                              className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50"
                            >
                              {isPosting === idea.id ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {postSuccess === idea.id && (
                          <div className="mt-2 text-sm text-green-600">
                            Content posted successfully!
                          </div>
                        )}
                        
                        {postError && isPosting === idea.id && (
                          <div className="mt-2 text-sm text-red-600">
                            {postError}
                          </div>
                        )}
                        
                        {idea.imageUrl && (
                          <div className="mt-4">
                            <Image 
                              src={idea.imageUrl} 
                              alt="Generated image for content" 
                              width={800}
                              height={600}
                              className="w-full rounded-lg shadow-md max-h-96 object-contain mx-auto" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Generate Ideas</h2>
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-gray-200"
              type="button"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="mb-4">
                <label htmlFor="tone" className="block mb-2 font-medium">Tone</label>
                <select
                  id="tone"
                  name="tone"
                  value={formData.tone}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="humorous">Humorous</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="educational">Educational</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="numberOfIdeas" className="block mb-2 font-medium">Number of Ideas</label>
                <select
                  id="numberOfIdeas"
                  name="numberOfIdeas"
                  value={formData.numberOfIdeas}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="3">3</option>
                  <option value="5">5</option>
                  <option value="7">7</option>
                  <option value="10">10</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="platform" className="block mb-2 font-medium">Platform</label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="contentType" className="block mb-2 font-medium">Content Type</label>
                <select
                  id="contentType"
                  name="contentType"
                  value={formData.contentType}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="text">Text Only</option>
                  <option value="image">Image + Text</option>
                </select>
                {formData.contentType === 'image' && (
                  <p className="mt-2 text-xs text-yellow-600">
                    Note: Due to Twitter API limitations, images may not appear in the actual tweet. Images will still be generated for preview purposes.
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="productDescription" className="block mb-2 font-medium">Product Description</label>
                <textarea
                  id="productDescription"
                  name="productDescription"
                  value={formData.productDescription}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded"
                  rows={6}
                  required
                  placeholder="Describe your product or service here..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {isLoading ? 'Generating...' : 'Generate Ideas'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
          role="presentation"
        />
      )}
    </div>
  );
}

export default Ideas;
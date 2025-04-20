"use client";
import React, { useState } from 'react';

function Ideas() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    tone: 'professional',
    numberOfIdeas: 5,
    platform: 'twitter',
    productDescription: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  interface Idea {
    id: string;
    content: string;
  }
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleFormChange = (e : any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfIdeas' ? parseInt(value, 10) : value
    }));
  };

  const handleFormSubmit = async (e : any) => {
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

  // const handleCopy = (id: string, content: string) => {
  //   navigator.clipboard.writeText(content);
  //   setCopiedId(id );
  //   setTimeout(() => setCopiedId(null), 2000);
  // };


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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="w-full">
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating creative ideas...
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md animate-pulse">
                  <div className="h-10 bg-gray-200 rounded-t-lg" />
                  <div className="p-5 space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div 
                        key={j} 
                        className={`h-3 bg-gray-200 rounded ${j === 1 ? 'w-5/6' : j === 2 ? 'w-4/6' : j === 3 ? 'w-3/4' : 'w-full'}`} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : generatedIdeas.length > 0 ? (
          <div>
            <div className="mb-6 flex items-center">
              <h2 className="text-xl font-semibold text-gray-800 mr-2">Generated Ideas</h2>
              <span className="px-3 py-1 text-sm rounded-full capitalize bg-blue-100 text-blue-800 mr-2">
                {formData.platform}
              </span>
              <span className="px-3 py-1 text-sm rounded-full capitalize bg-purple-100 text-purple-800">
                {formData.tone} tone
              </span>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {generatedIdeas.map((idea) => {
                return (
                  <div key={idea.id} className={`rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200 ${copiedId === idea.id ? 'bg-green-50' : 'bg-white'}`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <button
                          // onClick={() => handleCopy(idea.id, idea.content)}
                          className={`text-sm font-medium flex items-center ${copiedId === idea.id ? 'text-green-600' : 'text-blue-600 hover:text-blue-800'}`}
                          type="button"
                        >
                          {copiedId === idea.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-5 bg-white">
                      <p className="text-gray-700 whitespace-pre-line">{idea.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No ideas generated yet</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Get creative marketing ideas customized for your product and target platform in seconds.
            </p>
            <div className="mt-6">
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                type="button"
              >
                <svg 
                  className="-ml-1 mr-2 h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Generate Ideas
              </button>
            </div>
          </div>
        )}
      </main>

      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 z-50 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Generate Content Ideas</h2>
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-gray-100"
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
          
          <div className="flex-1 overflow-y-auto p-4">
            <form onSubmit={handleFormSubmit}>
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
                  <option value="sarcastic">Sarcastic</option>
                  <option value="humorous">Humorous</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="numberOfIdeas" className="block mb-2 font-medium">Number of Ideas</label>
                <input
                  type="number"
                  id="numberOfIdeas"
                  name="numberOfIdeas"
                  min="1"
                  max="10"
                  value={formData.numberOfIdeas}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="platform" className="block mb-2 font-medium">Target Platform</label>
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
                  <option value="youtube">YouTube</option>
                </select>
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
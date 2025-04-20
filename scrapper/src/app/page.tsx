"use client";
import { useState } from 'react';

interface FormData {
  content: string;
  category: string;
  customCategory?: string;
  contentType: string;
  marketingPatterns: string[];
  format: {
    hasImages: boolean;
    hasVideos: boolean;
    hasLinks: boolean;
    isThread: boolean;
    hasCTA: boolean;
    usesStatistics: boolean;
    hashtags: boolean;
    hashtagCount: number;
  };
  platform: string;
  engagement: {
    views: number;
    likes: number;
    reposts: number;
    comments: number;
  };
}

const INITIAL_FORM_DATA: FormData = {
  content: '',
  category: '',
  contentType: '',
  marketingPatterns: [],
  format: {
    hasImages: false,
    hasVideos: false,
    hasLinks: false,
    isThread: false,
    hasCTA: false,
    usesStatistics: false,
    hashtags: false,
    hashtagCount: 0
  },
  platform: '',
  engagement: {
    views: 0,
    likes: 0,
    reposts: 0,
    comments: 0
  }
};

export default function ContentForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit content');
      }

      setSuccess(true);
      setFormData(INITIAL_FORM_DATA);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Content Submission Form</h1>
      <div className=" p-6 rounded-lg mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">Basic Content Information</h3>
        
        <div className="mb-4">
          <label htmlFor="content" className="block mb-2 font-medium">Content Text</label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            className="w-full p-2 border rounded "
            rows={5}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block mb-2 font-medium">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-2 border rounded "
              required
            >
              <option value="">Select a category</option>
              <option value="SaaS">SaaS</option>
              <option value="Developer Tools">Developer Tools</option>
              <option value="Marketing Tech">Marketing Tech</option>
              <option value="Fintech">Fintech</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Security">Security</option>
              <option value="custom">Custom/Other</option>
            </select>
          </div>

          {formData.category === 'custom' && (
            <div>
              <label htmlFor="customCategory" className="block mb-2 font-medium">Custom Category</label>
              <input
                type="text"
                id="customCategory"
                value={formData.customCategory || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                className="w-full p-2 border rounded "
                required
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="contentType" className="block mb-2 font-medium">Content Type</label>
          <select
            id="contentType"
            value={formData.contentType}
            onChange={(e) => setFormData(prev => ({ ...prev, contentType: e.target.value }))}
            className="w-full p-2 border rounded "
            required
          >
            <option value="">Select content type</option>
            <option value="promotional">Promotional</option>
            <option value="educational">Educational</option>
            <option value="entertaining">Entertaining</option>
            <option value="branding">Branding</option>
            <option value="conversational">Conversational</option>
            <option value="news">News</option>
            <option value="storytelling">Storytelling</option>
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="platform" className="block mb-2 font-medium">Platform</label>
          <select
            id="platform"
            value={formData.platform}
            onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
            className="w-full p-2 border rounded "
            required
          >
            <option value="">Select platform</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
      </div>

      {/* Marketing Patterns */}
      <div className=" p-6 rounded-lg mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">Marketing Patterns</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { value: 'question', label: 'Uses questions' },
            { value: 'list', label: 'Numbered or bulleted list' },
            { value: 'how-to', label: 'How-to guide/tutorial' },
            { value: 'call-to-action', label: 'Call-to-action' },
            { value: 'statistics', label: 'Uses statistics/data' },
            { value: 'social-proof', label: 'Social proof/testimonial' },
            { value: 'problem-solution', label: 'Problem-solution structure' }
          ].map(pattern => (
            <div key={pattern.value} className="flex items-center">
              <input
                type="checkbox"
                id={`pattern-${pattern.value}`}
                checked={formData.marketingPatterns.includes(pattern.value)}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    marketingPatterns: e.target.checked
                      ? [...prev.marketingPatterns, pattern.value]
                      : prev.marketingPatterns.filter(p => p !== pattern.value)
                  }));
                }}
                className="mr-2"
              />
              <label htmlFor={`pattern-${pattern.value}`}>{pattern.label}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Format Details */}
      <div className="p-6 rounded-lg mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">Format Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {[
              { key: 'hasImages', label: 'Has images' },
              { key: 'hasVideos', label: 'Has videos' },
              { key: 'hasLinks', label: 'Has links' },
              { key: 'isThread', label: 'Is thread/multi-post' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={key}
                  checked={formData.format[key as keyof typeof formData.format] as boolean}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      format: { ...prev.format, [key]: e.target.checked }
                    }));
                  }}
                  className="mr-2"
                />
                <label htmlFor={key}>{label}</label>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            {[
              { key: 'hasCTA', label: 'Has call-to-action' },
              { key: 'usesStatistics', label: 'Uses statistics' },
              { key: 'hashtags', label: 'Hashtags' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={key}
                  checked={formData.format[key as keyof typeof formData.format] as boolean}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      format: { ...prev.format, [key]: e.target.checked }
                    }));
                  }}
                  className="mr-2"
                />
                <label htmlFor={key}>{label}</label>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Engagement Metrics */}
      <div className="p-6 rounded-lg mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">Engagement Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="views" className="block mb-2 font-medium">Views/Impressions</label>
            <input
              type="number"
              id="views"
              value={formData.engagement.views}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                engagement: { ...prev.engagement, views: parseInt(e.target.value) || 0 }
              }))}
              min="0"
              className="w-full p-2 border rounded "
            />
          </div>

          <div>
            <label htmlFor="likes" className="block mb-2 font-medium">Likes</label>
            <input
              type="number"
              id="likes"
              value={formData.engagement.likes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                engagement: { ...prev.engagement, likes: parseInt(e.target.value) || 0 }
              }))}
              min="0"
              className="w-full p-2 border rounded "
            />
          </div>

          <div>
            <label htmlFor="reposts" className="block mb-2 font-medium">Reposts/Retweets</label>
            <input
              type="number"
              id="reposts"
              value={formData.engagement.reposts}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                engagement: { ...prev.engagement, reposts: parseInt(e.target.value) || 0 }
              }))}
              min="0"
              className="w-full p-2 border rounded "
            />
          </div>

          <div>
            <label htmlFor="comments" className="block mb-2 font-medium">Comments/Replies</label>
            <input
              type="number"
              id="comments"
              value={formData.engagement.comments}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                engagement: { ...prev.engagement, comments: parseInt(e.target.value) || 0 }
              }))}
              min="0"
              className="w-full p-2 border rounded "
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Content submitted successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-3 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
      >
        {loading ? 'Submitting...' : 'Submit Content'}
      </button>
    </form>
  );
}
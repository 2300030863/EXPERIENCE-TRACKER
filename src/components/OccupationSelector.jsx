import React, { useState, useEffect } from 'react';
import { occupationAPI } from '../services/api';

const OccupationSelector = ({ onSelect, selectedOccupationId }) => {
  const [occupations, setOccupations] = useState([]);
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOccupations();
  }, []);

  const fetchOccupations = async () => {
    try {
      setLoading(true);
      const response = await occupationAPI.getAll();
      setOccupations(response.data);
    } catch (err) {
      setError('Failed to load occupations. Please try again.');
      console.error('Error fetching occupations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOccupationClick = async (occupation) => {
    setSelectedOccupation(occupation);
    setShowCategories(true);
    
    try {
      const response = await occupationAPI.getById(occupation.id);
      setCategories(response.data.categories || []);
      onSelect(occupation.id);
    } catch (err) {
      console.error('Error fetching occupation details:', err);
      setCategories([]);
    }
  };

  const handleBack = () => {
    setShowCategories(false);
    setSelectedOccupation(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!showCategories ? (
        <>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              What's your occupation?
            </h3>
            <p className="text-gray-600">
              We'll create relevant expense categories based on your selection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {occupations.map((occupation) => (
              <button
                key={occupation.id}
                onClick={() => handleOccupationClick(occupation)}
                className={`p-6 rounded-lg border-2 transition-all text-left hover:shadow-lg ${
                  selectedOccupationId === occupation.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 mb-1">
                      {occupation.name}
                    </h4>
                    <p className="text-sm text-gray-600">{occupation.description}</p>
                  </div>
                  <svg
                    className="w-6 h-6 text-blue-600 flex-shrink-0 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div>
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to occupations
            </button>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white mb-6">
              <h3 className="text-2xl font-bold mb-2">{selectedOccupation?.name}</h3>
              <p className="text-blue-100">{selectedOccupation?.description}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-gray-800 mb-4">
              📊 Categories that will be created for you:
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start">
                    <div
                      className="w-4 h-4 rounded-full mt-1 mr-3 flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 mb-1">
                        {category.categoryName}
                      </h5>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Note:</strong> You can edit, add, or remove these categories anytime after registration!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OccupationSelector;

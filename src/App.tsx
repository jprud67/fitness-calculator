import React from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import FitnessCalculator from './FitnessCalculator';
import BMICalculator from './BMICalculator';
import { Globe } from 'lucide-react'; // Import Globe icon

function App() {
  const { i18n } = useTranslation(); // Get i18n instance

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  return (
    <div className="relative min-h-screen flex flex-col items-center p-4 lg:p-8 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Fitness background"
          className="object-cover w-full h-full opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 opacity-70"></div>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-20 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-gray-600" />
          <button
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              currentLanguage === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => changeLanguage('fr')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              currentLanguage === 'fr' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            FR
          </button>
        </div>
      </div>


      {/* Calculators Container */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-center mt-20 lg:mt-16"> {/* Added margin-top */}
        <FitnessCalculator />
        <BMICalculator />
      </div>
    </div>
  );
}

export default App;

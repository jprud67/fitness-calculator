import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Calculator, PersonStanding, Activity, Weight, Ruler, Sparkles, RefreshCw } from 'lucide-react';

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';
type Units = 'metric' | 'imperial';

interface FitnessCalculatorState {
  age: number | '';
  gender: Gender;
  weight: number | '';
  height: number | '';
  activityLevel: ActivityLevel;
  units: Units;
  heightIn: number | '';
  heightFt: number | '';
}

const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extra: 1.9,
};

// No need for activityDescriptions here anymore, will use i18n keys

const LOCAL_STORAGE_KEY = 'tdeeCalculatorState';

const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;
const IN_TO_CM = 2.54;
const CM_TO_IN = 0.393701;
const FT_TO_IN = 12;

const loadState = (): FitnessCalculatorState => {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null) {
      return {
        age: '',
        gender: 'male',
        weight: '',
        height: '',
        activityLevel: 'sedentary',
        units: 'metric',
        heightIn: '',
        heightFt: '',
      };
    }
    const parsedState = JSON.parse(serializedState);
    if (typeof parsedState === 'object' && parsedState !== null) {
      return {
        age: parsedState.age ?? '',
        gender: parsedState.gender ?? 'male',
        weight: parsedState.weight ?? '',
        height: parsedState.height ?? '',
        activityLevel: parsedState.activityLevel ?? 'sedentary',
        units: parsedState.units === 'imperial' ? 'imperial' : 'metric',
        heightIn: parsedState.heightIn ?? '',
        heightFt: parsedState.heightFt ?? '',
      };
    }
    return {
      age: '',
      gender: 'male',
      weight: '',
      height: '',
      activityLevel: 'sedentary',
      units: 'metric',
      heightIn: '',
      heightFt: '',
    };
  } catch (err) {
    console.error("Could not load state from localStorage", err);
    return {
      age: '',
      gender: 'male',
      weight: '',
      height: '',
      activityLevel: 'sedentary',
      units: 'metric',
      heightIn: '',
      heightFt: '',
    };
  }
};

const saveState = (state: FitnessCalculatorState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage", err);
  }
};

function FitnessCalculator() {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const initialState = loadState();
  const [age, setAge] = useState<number | ''>(initialState.age);
  const [gender, setGender] = useState<Gender>(initialState.gender);
  const [weightInput, setWeightInput] = useState<number | ''>(initialState.weight); // kg or lbs
  const [heightCmInput, setHeightCmInput] = useState<number | ''>(initialState.height); // cm
  const [heightFtInput, setHeightFtInput] = useState<number | ''>(initialState.heightFt); // ft
  const [heightInInput, setHeightInInput] = useState<number | ''>(initialState.heightIn); // in
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialState.activityLevel);
  const [units, setUnits] = useState<Units>(initialState.units);

  const [tdee, setTdee] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const weightKg = useMemo(() => {
    if (weightInput === '') return '';
    return units === 'metric' ? weightInput : weightInput * LBS_TO_KG;
  }, [weightInput, units]);

  const heightCm = useMemo(() => {
    if (units === 'metric') {
      return heightCmInput === '' ? '' : heightCmInput;
    } else {
      if (heightFtInput === '' && heightInInput === '') return '';
      const ft = heightFtInput === '' ? 0 : heightFtInput;
      const inches = heightInInput === '' ? 0 : heightInInput;
      return (ft * FT_TO_IN + inches) * IN_TO_CM;
    }
  }, [heightCmInput, heightFtInput, heightInInput, units]);

  useEffect(() => {
    const currentState: FitnessCalculatorState = {
      age,
      gender,
      weight: weightInput,
      height: heightCmInput,
      activityLevel,
      units,
      heightIn: heightInInput,
      heightFt: heightFtInput,
    };
    saveState(currentState);
  }, [age, gender, weightInput, heightCmInput, heightFtInput, heightInInput, activityLevel, units]);

  const calculateTDEE = () => {
    if (age === '' || weightKg === '' || heightCm === '') {
      setTdee(null);
      setShowResult(false);
      return;
    }

    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    const calculatedTdee = bmr * activityFactors[activityLevel];
    setTdee(Math.round(calculatedTdee));
    setShowResult(true);
  };

  useMemo(() => {
    if (age !== '' && weightKg !== '' && heightCm !== '') {
      calculateTDEE();
    } else {
      setTdee(null);
      setShowResult(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [age, gender, weightKg, heightCm, activityLevel]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setter(value === '' ? '' : Number(value));
    }
    setShowResult(false);
  };

  const handleSelectChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setter(e.target.value);
    setShowResult(false);
  };

  const toggleUnits = () => {
    const newUnits = units === 'metric' ? 'imperial' : 'metric';
    setUnits(newUnits);

    if (newUnits === 'imperial') {
      if (weightInput !== '') setWeightInput(Math.round(weightInput * KG_TO_LBS * 10) / 10);
      if (heightCmInput !== '') {
        const totalInches = heightCmInput * CM_TO_IN;
        const feet = Math.floor(totalInches / FT_TO_IN);
        const inches = Math.round((totalInches % FT_TO_IN) * 10) / 10;
        setHeightFtInput(feet);
        setHeightInInput(inches);
        setHeightCmInput('');
      }
    } else {
      if (weightInput !== '') setWeightInput(Math.round(weightInput * LBS_TO_KG * 10) / 10);
      const ft = heightFtInput === '' ? 0 : heightFtInput;
      const inches = heightInInput === '' ? 0 : heightInInput;
      if (ft > 0 || inches > 0) {
        const totalCm = (ft * FT_TO_IN + inches) * IN_TO_CM;
        setHeightCmInput(Math.round(totalCm));
        setHeightFtInput('');
        setHeightInInput('');
      }
    }
    setShowResult(false);
  };

  const isFormComplete = age !== '' && weightKg !== '' && heightCm !== '';

  // Define activity levels using i18n keys
  const activityOptions = [
    { key: 'sedentary', label: t('sedentary') },
    { key: 'light', label: t('light') },
    { key: 'moderate', label: t('moderate') },
    { key: 'active', label: t('active') },
    { key: 'extra', label: t('extra') },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-lg transform transition-all duration-500 hover:scale-[1.01]">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-indigo-600" /> {t('tdeeCalculatorTitle')}
        </h2>
        {/* Unit Toggle Button */}
        <button
          onClick={toggleUnits}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md shadow-sm hover:bg-gray-200 transition-colors text-sm font-medium ring-1 ring-inset ring-gray-300"
          title={t('units') + ': ' + t(units)}
        >
          <RefreshCw className="h-4 w-4" />
          {units === 'metric' ? t('metric') : t('imperial')}
        </button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); calculateTDEE(); }} className="space-y-6">
        {/* Age */}
        <div className="relative pt-2">
          <label htmlFor="age" className="absolute -top-0 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-600 z-10">
            {t('ageLabel')}
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <PersonStanding className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="number"
              id="age"
              value={age}
              onChange={handleInputChange(setAge)}
              min="1"
              max="120"
              required
              className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
              placeholder={t('agePlaceholder')}
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">{t('genderLabel')}</label>
          <div className="flex items-center space-x-4 rounded-md bg-gray-50 p-2 ring-1 ring-inset ring-gray-300">
            <label className={`flex-1 text-center py-2 px-3 rounded-md cursor-pointer transition duration-150 ease-in-out ${gender === 'male' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={handleSelectChange(setGender)}
                className="sr-only"
              />
              {t('male')}
            </label>
            <label className={`flex-1 text-center py-2 px-3 rounded-md cursor-pointer transition duration-150 ease-in-out ${gender === 'female' ? 'bg-pink-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={handleSelectChange(setGender)}
                className="sr-only"
              />
              {t('female')}
            </label>
          </div>
        </div>


        {/* Weight */}
        <div className="relative pt-2">
          <label htmlFor="weight" className="absolute -top-0 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-600 z-10">
            {t('weightLabel')} ({units === 'metric' ? t('unitKg') : t('unitLbs')})
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Weight className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="number"
              id="weight"
              value={weightInput}
              onChange={handleInputChange(setWeightInput)}
              min="1"
              step="0.1"
              required
              className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
              placeholder={units === 'metric' ? t('weightPlaceholderMetric') : t('weightPlaceholderImperial')}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">{units === 'metric' ? t('unitKg') : t('unitLbs')}</span>
            </div>
          </div>
        </div>

        {/* Height */}
        {units === 'metric' ? (
          <div className="relative pt-2">
            <label htmlFor="height" className="absolute -top-0 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-600 z-10">
              {t('heightLabel')} ({t('unitCm')})
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Ruler className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="number"
                id="height"
                value={heightCmInput}
                onChange={handleInputChange(setHeightCmInput)}
                min="1"
                required
                className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
                placeholder={t('heightPlaceholderCm')}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">{t('unitCm')}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative pt-2">
            <label className="absolute -top-0 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-600 z-10">
              {t('heightLabel')} ({t('unitFt')}, {t('unitIn')})
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Feet Input */}
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Ruler className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="number"
                  id="height-ft"
                  value={heightFtInput}
                  onChange={handleInputChange(setHeightFtInput)}
                  min="0"
                  required={heightInInput === ''}
                  className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
                  placeholder={t('heightPlaceholderFt')}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">{t('unitFt')}</span>
                </div>
              </div>
              {/* Inches Input */}
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="height-in"
                  value={heightInInput}
                  onChange={handleInputChange(setHeightInInput)}
                  min="0"
                  max="11.9"
                  step="0.1"
                  required={heightFtInput === ''}
                  className="block w-full rounded-md border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
                  placeholder={t('heightPlaceholderIn')}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">{t('unitIn')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Level */}
        <div className="relative pt-2">
          <label htmlFor="activityLevel" className="absolute -top-0 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-600 z-10">
            {t('activityLevelLabel')}
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Activity className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <select
              id="activityLevel"
              value={activityLevel}
              onChange={handleSelectChange(setActivityLevel)}
              required
              className="block w-full appearance-none rounded-md border-0 py-2.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
            >
              {activityOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {showResult && tdee !== null && (
          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-500 to-purple-600 border border-transparent rounded-lg text-center shadow-lg animate-fade-in">
            <p className="text-sm font-medium text-indigo-100">{t('tdeeResultPrefix')}</p>
            <p className="text-4xl font-bold text-white my-2 flex items-center justify-center gap-2">
              <Sparkles className="h-7 w-7 text-yellow-300" />
              {tdee}
              <Sparkles className="h-7 w-7 text-yellow-300" />
            </p>
            <p className="text-sm text-indigo-200">{t('caloriesPerDay')}</p>
            <p className="text-xs text-indigo-300 mt-3">{t('tdeeDisclaimer')}</p>
          </div>
        )}
        {!isFormComplete && !showResult && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center text-sm font-medium text-yellow-800">
            {t('fillFieldsPromptTDEE')}
          </div>
        )}
      </form>
    </div>
  );
}

export default FitnessCalculator;

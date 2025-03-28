import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Ruler, Sparkles, RefreshCw } from 'lucide-react'; // Added RefreshCw for units toggle

type Units = 'metric' | 'imperial';

interface BMICalculatorState {
  weight: number | '';
  heightCm: number | ''; // Always store height in cm internally
  heightFt: number | ''; // For imperial input
  heightIn: number | ''; // For imperial input
  units: Units;
}

const LOCAL_STORAGE_KEY_BMI = 'bmiCalculatorState_v2'; // Changed key to avoid conflicts with old structure

// Conversion factors
const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;
const IN_TO_CM = 2.54;
const CM_TO_IN = 0.393701;
const FT_TO_IN = 12;

const loadBMIState = (): BMICalculatorState => {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY_BMI);
    if (serializedState === null) {
      return { weight: '', heightCm: '', heightFt: '', heightIn: '', units: 'metric' };
    }
    const parsedState = JSON.parse(serializedState);
    if (typeof parsedState === 'object' && parsedState !== null) {
      // Ensure all fields exist, provide defaults if not
      return {
        weight: parsedState.weight ?? '',
        heightCm: parsedState.heightCm ?? '',
        heightFt: parsedState.heightFt ?? '',
        heightIn: parsedState.heightIn ?? '',
        units: parsedState.units === 'imperial' ? 'imperial' : 'metric', // Default to metric if invalid
      };
    }
    return { weight: '', heightCm: '', heightFt: '', heightIn: '', units: 'metric' };
  } catch (err) {
    console.error("Could not load BMI state from localStorage", err);
    return { weight: '', heightCm: '', heightFt: '', heightIn: '', units: 'metric' };
  }
};

const saveBMIState = (state: BMICalculatorState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(LOCAL_STORAGE_KEY_BMI, serializedState);
  } catch (err) {
    console.error("Could not save BMI state to localStorage", err);
  }
};

function BMICalculator() {
  const { t } = useTranslation();
  const initialBMIState = loadBMIState();

  const [units, setUnits] = useState<Units>(initialBMIState.units);
  const [weightInput, setWeightInput] = useState<number | ''>(initialBMIState.weight); // User input (kg or lbs)
  const [heightCmInput, setHeightCmInput] = useState<number | ''>(initialBMIState.heightCm); // User input (cm)
  const [heightFtInput, setHeightFtInput] = useState<number | ''>(initialBMIState.heightFt); // User input (ft)
  const [heightInInput, setHeightInInput] = useState<number | ''>(initialBMIState.heightIn); // User input (in)

  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategoryKey, setBmiCategoryKey] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Calculate weight in KG regardless of input units
  const weightKg = useMemo(() => {
    if (weightInput === '') return '';
    return units === 'metric' ? weightInput : weightInput * LBS_TO_KG;
  }, [weightInput, units]);

  // Calculate height in CM regardless of input units
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
    const currentState: BMICalculatorState = {
      weight: weightInput,
      heightCm: heightCmInput,
      heightFt: heightFtInput,
      heightIn: heightInInput,
      units: units,
    };
    saveBMIState(currentState);
  }, [weightInput, heightCmInput, heightFtInput, heightInInput, units]);

  const calculateBMI = () => {
    if (weightKg === '' || heightCm === '' || heightCm === 0) {
      setBmi(null);
      setBmiCategoryKey(null);
      setShowResult(false);
      return;
    }

    const heightInMeters = heightCm / 100;
    const calculatedBmi = weightKg / (heightInMeters * heightInMeters);
    const roundedBmi = Math.round(calculatedBmi * 10) / 10;
    setBmi(roundedBmi);

    if (roundedBmi < 18.5) setBmiCategoryKey('underweight');
    else if (roundedBmi < 25) setBmiCategoryKey('normalWeight');
    else if (roundedBmi < 30) setBmiCategoryKey('overweight');
    else setBmiCategoryKey('obesity');

    setShowResult(true);
  };

  // Recalculate whenever metric values change
  useMemo(() => {
    if (weightKg !== '' && heightCm !== '' && heightCm !== 0) {
      calculateBMI();
    } else {
      setBmi(null);
      setBmiCategoryKey(null);
      setShowResult(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightKg, heightCm]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, integers, and decimals
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setter(value === '' ? '' : Number(value));
    }
    setShowResult(false);
  };

  const toggleUnits = () => {
    const newUnits = units === 'metric' ? 'imperial' : 'metric';
    setUnits(newUnits);

    // Convert existing values between units
    if (newUnits === 'imperial') {
      // Metric to Imperial
      if (weightInput !== '') setWeightInput(Math.round(weightInput * KG_TO_LBS * 10) / 10);
      if (heightCmInput !== '') {
        const totalInches = heightCmInput * CM_TO_IN;
        const feet = Math.floor(totalInches / FT_TO_IN);
        const inches = Math.round((totalInches % FT_TO_IN) * 10) / 10;
        setHeightFtInput(feet);
        setHeightInInput(inches);
        setHeightCmInput(''); // Clear metric height input
      }
    } else {
      // Imperial to Metric
      if (weightInput !== '') setWeightInput(Math.round(weightInput * LBS_TO_KG * 10) / 10);
      const ft = heightFtInput === '' ? 0 : heightFtInput;
      const inches = heightInInput === '' ? 0 : heightInInput;
      if (ft > 0 || inches > 0) {
        const totalCm = (ft * FT_TO_IN + inches) * IN_TO_CM;
        setHeightCmInput(Math.round(totalCm));
        setHeightFtInput(''); // Clear imperial height inputs
        setHeightInInput('');
      }
    }
    setShowResult(false); // Hide result on unit change until recalculation
  };

  const isFormComplete = weightKg !== '' && heightCm !== '' && heightCm !== 0;

  const getCategoryColor = (categoryKey: string | null): string => {
    switch (categoryKey) {
      case 'underweight': return 'text-blue-600';
      case 'normalWeight': return 'text-green-600';
      case 'overweight': return 'text-yellow-600';
      case 'obesity': return 'text-red-600';
      default: return 'text-gray-800';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-lg transform transition-all duration-500 hover:scale-[1.01]">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Scale className="h-8 w-8 text-green-600" /> {t('bmiCalculatorTitle')}
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

      <form onSubmit={(e) => { e.preventDefault(); calculateBMI(); }} className="space-y-6">
        {/* Weight Input */}
        <div className="relative pt-2">
          <label htmlFor="bmi-weight" className="absolute -top-0 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-600 z-10">
            {t('weightLabel')} ({units === 'metric' ? t('unitKg') : t('unitLbs')})
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Scale className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="number"
              id="bmi-weight"
              value={weightInput}
              onChange={handleInputChange(setWeightInput)}
              min="1"
              step="0.1"
              required
              className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
              placeholder={units === 'metric' ? t('weightPlaceholderMetric') : t('weightPlaceholderImperial')}
            />
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">{units === 'metric' ? t('unitKg') : t('unitLbs')}</span>
            </div>
          </div>
        </div>

        {/* Height Input */}
        {units === 'metric' ? (
          <div className="relative pt-2">
            <label htmlFor="bmi-height-cm" className="absolute -top-0 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-600 z-10">
              {t('heightLabel')} ({t('unitCm')})
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Ruler className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="number"
                id="bmi-height-cm"
                value={heightCmInput}
                onChange={handleInputChange(setHeightCmInput)}
                min="1"
                required
                className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
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
                  id="bmi-height-ft"
                  value={heightFtInput}
                  onChange={handleInputChange(setHeightFtInput)}
                  min="0"
                  required={heightInInput === ''} // Required if inches is empty
                  className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
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
                  id="bmi-height-in"
                  value={heightInInput}
                  onChange={handleInputChange(setHeightInInput)}
                  min="0"
                  max="11.9" // Allow decimals, but less than 12
                  step="0.1"
                  required={heightFtInput === ''} // Required if feet is empty
                  className="block w-full rounded-md border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
                  placeholder={t('heightPlaceholderIn')}
                />
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{t('unitIn')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {showResult && bmi !== null && bmiCategoryKey !== null && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-500 to-teal-600 border border-transparent rounded-lg text-center shadow-lg animate-fade-in">
            <p className="text-sm font-medium text-green-100">{t('bmiResultPrefix')}</p>
            <p className="text-4xl font-bold text-white my-2 flex items-center justify-center gap-2">
              <Sparkles className="h-7 w-7 text-yellow-300" />
              {bmi}
              <Sparkles className="h-7 w-7 text-yellow-300" />
            </p>
            <p className={`text-lg font-semibold ${getCategoryColor(bmiCategoryKey)} bg-white/80 rounded-full px-4 py-1 inline-block mt-2`}>
              {t(bmiCategoryKey)}
            </p>
            <p className="text-xs text-green-200 mt-3">{t('bmiDisclaimer')}</p>
          </div>
        )}
        {!isFormComplete && !showResult && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center text-sm font-medium text-yellow-800">
            {t('fillFieldsPromptBMI')}
          </div>
        )}
      </form>
    </div>
  );
}

export default BMICalculator;

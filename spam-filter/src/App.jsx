import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [trainText, setTrainText] = useState('')
  const [testText, setTestText] = useState('')
  const [result, setResult] = useState(null)
  const [spamCount, setSpamCount] = useState(0)
  const [hamCount, setHamCount] = useState(0)
  const [uniqueSpam, setUniqueSpam] = useState(0)
  const [uniqueHam, setUniqueHam] = useState(0)
  
  // Модель классификатора
  const [spamWords, setSpamWords] = useState({})
  const [hamWords, setHamWords] = useState({})

  // Загрузка модели из localStorage при старте
  useEffect(() => {
    const saved = localStorage.getItem('bayesianModel')
    if (saved) {
      const model = JSON.parse(saved)
      setSpamWords(model.spamWords)
      setHamWords(model.hamWords)
      setSpamCount(model.spamCount)
      setHamCount(model.hamCount)
      setUniqueSpam(Object.keys(model.spamWords).length)
      setUniqueHam(Object.keys(model.hamWords).length)
    } else {
      // Начальные примеры
      initExamples()
    }
  }, [])

  // Сохранение модели в localStorage
  useEffect(() => {
    if (Object.keys(spamWords).length > 0 || Object.keys(hamWords).length > 0) {
      localStorage.setItem('bayesianModel', JSON.stringify({
        spamWords, hamWords, spamCount, hamCount
      }))
    }
  }, [spamWords, hamWords, spamCount, hamCount])

  // Токенизация текста
  const tokenize = (text) => {
    return text.toLowerCase()
      .replace(/[^\w\sа-яё]/gi, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
  }

  // Обучение модели
  const train = (isSpam) => {
    if (!trainText.trim()) {
      alert('Введите текст для обучения!')
      return
    }

    const words = tokenize(trainText)
    
    if (isSpam) {
      const newSpamCount = spamCount + 1
      const newSpamWords = { ...spamWords }
      words.forEach(word => {
        newSpamWords[word] = (newSpamWords[word] || 0) + 1
      })
      setSpamWords(newSpamWords)
      setSpamCount(newSpamCount)
      setUniqueSpam(Object.keys(newSpamWords).length)
      alert(`✅ Обучил как СПАМ (${words.length} слов)`)
    } else {
      const newHamCount = hamCount + 1
      const newHamWords = { ...hamWords }
      words.forEach(word => {
        newHamWords[word] = (newHamWords[word] || 0) + 1
      })
      setHamWords(newHamWords)
      setHamCount(newHamCount)
      setUniqueHam(Object.keys(newHamWords).length)
      alert(`✅ Обучил как НЕ СПАМ (${words.length} слов)`)
    }
    
    setTrainText('')
  }

  // Проверка письма
  const check = () => {
    if (!testText.trim()) {
      alert('Введите текст для проверки!')
      return
    }

    if (spamCount === 0 && hamCount === 0) {
      alert('Сначала обучите модель на примерах!')
      return
    }

    const words = tokenize(testText)
    
    // Логарифмические вероятности
    let logProbSpam = Math.log(spamCount / (spamCount + hamCount))
    let logProbHam = Math.log(hamCount / (spamCount + hamCount))
    
    // Сглаживание Лапласа
    const uniqueWords = new Set([...Object.keys(spamWords), ...Object.keys(hamWords)])
    const vocabularySize = uniqueWords.size || 1
    
    words.forEach(word => {
      const spamWordProb = (spamWords[word] || 0.5) / (spamCount + 0.5 * vocabularySize)
      const hamWordProb = (hamWords[word] || 0.5) / (hamCount + 0.5 * vocabularySize)
      
      logProbSpam += Math.log(spamWordProb)
      logProbHam += Math.log(hamWordProb)
    })
    
    const probSpam = 1 / (1 + Math.exp(logProbHam - logProbSpam))
    
    setResult({
      isSpam: probSpam > 0.5,
      probability: Math.min(0.9999, Math.max(0.0001, probSpam)),
      wordCount: words.length
    })
  }

  // Инициализация примерами
  const initExamples = () => {
    const spamExamples = [
      "выиграл приз бесплатно",
      "акция скидка уникальный", 
      "деньги заработок быстро",
      "СРОЧНО! Ваш аккаунт будет заблокирован",
      "ВЫ ВЫИГРАЛИ ПРИЗ!"
    ]
    
    const hamExamples = [
      "привет как дела проект",
      "спасибо за встречу",
      "отчет по работе договор",
      "встреча завтра в офисе",
      "пожалуйста проверьте документы"
    ]
    
    const newSpamWords = {}
    let newSpamCount = 0
    const newHamWords = {}
    let newHamCount = 0
    
    spamExamples.forEach(text => {
      const words = tokenize(text)
      newSpamCount++
      words.forEach(word => {
        newSpamWords[word] = (newSpamWords[word] || 0) + 1
      })
    })
    
    hamExamples.forEach(text => {
      const words = tokenize(text)
      newHamCount++
      words.forEach(word => {
        newHamWords[word] = (newHamWords[word] || 0) + 1
      })
    })
    
    setSpamWords(newSpamWords)
    setHamWords(newHamWords)
    setSpamCount(newSpamCount)
    setHamCount(newHamCount)
    setUniqueSpam(Object.keys(newSpamWords).length)
    setUniqueHam(Object.keys(newHamWords).length)
  }

  const clearModel = () => {
    if (confirm('Очистить всю модель?')) {
      setSpamWords({})
      setHamWords({})
      setSpamCount(0)
      setHamCount(0)
      setUniqueSpam(0)
      setUniqueHam(0)
      setResult(null)
      localStorage.removeItem('bayesianModel')
      alert('Модель очищена')
    }
  }

  const addExample = (type) => {
    const spamExamples = [
      "ВЫ ВЫИГРАЛИ iPhone БЕСПЛАТНО!",
      "СРОЧНО подтвердите данные карты",
      "УНИКАЛЬНАЯ СКИДКА 90% только сегодня"
    ]
    
    const hamExamples = [
      "Привет, давай встретимся обсудить работу",
      "Спасибо за сотрудничество, отличный проект",
      "Напоминаю о встрече завтра в 15:00"
    ]
    
    if (type === 'spam') {
      const random = spamExamples[Math.floor(Math.random() * spamExamples.length)]
      setTrainText(random)
    } else {
      const random = hamExamples[Math.floor(Math.random() * hamExamples.length)]
      setTrainText(random)
    }
  }

  return (
    <div className="app">
      <div className="hero">
        <img src="/vite.svg" alt="logo" className="logo" />
        <h1>🧠 Байесовский спам-фильтр</h1>
        <p>Наивный байесовский классификатор для обнаружения спама</p>
      </div>

      <div className="container">
        {/* Левая колонка - обучение */}
        <div className="card">
          <h2>📚 Обучение модели</h2>
          
          <textarea
            value={trainText}
            onChange={(e) => setTrainText(e.target.value)}
            placeholder="Введите текст письма для обучения..."
            rows={5}
          />
          
          <div className="button-group">
            <button className="btn-spam" onClick={() => train(true)}>
              🚨 Обучить как СПАМ
            </button>
            <button className="btn-ham" onClick={() => train(false)}>
              ✅ Обучить как НЕ СПАМ
            </button>
          </div>
          
          <div className="examples">
            <strong>📝 Быстрые примеры:</strong>
            <div>
              <button className="example-btn" onClick={() => addExample('spam')}>
                Добавить пример спама
              </button>
              <button className="example-btn" onClick={() => addExample('ham')}>
                Добавить пример норм. письма
              </button>
              <button className="example-btn" onClick={clearModel}>
                🗑️ Очистить модель
              </button>
            </div>
          </div>
          
          <div className="stats">
            <div className="stat-item">
              <span>📧 Писем СПАМ:</span>
              <span>{spamCount}</span>
            </div>
            <div className="stat-item">
              <span>✉️ Писем НЕ СПАМ:</span>
              <span>{hamCount}</span>
            </div>
            <div className="stat-item">
              <span>📊 Уникальных слов (спам):</span>
              <span>{uniqueSpam}</span>
            </div>
            <div className="stat-item">
              <span>📊 Уникальных слов (норм):</span>
              <span>{uniqueHam}</span>
            </div>
          </div>
        </div>

        {/* Правая колонка - проверка */}
        <div className="card">
          <h2>🔍 Проверка письма</h2>
          
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Введите текст письма для проверки..."
            rows={8}
          />
          
          <div className="button-group">
            <button onClick={check}>🎯 Проверить на спам</button>
            <button onClick={() => setTestText('')}>🗑️ Очистить</button>
          </div>
          
          {result && (
            <div className={`result ${result.isSpam ? 'result-spam' : 'result-ham'}`}>
              <div className="result-icon">{result.isSpam ? '🚨' : '✅'}</div>
              <div className="result-text">{result.isSpam ? 'СПАМ' : 'НЕ СПАМ'}</div>
              <div className="result-probability">
                Вероятность спама: {(result.probability * 100).toFixed(2)}%
              </div>
              <div className="result-details">
                Найдено слов: {result.wordCount} | 
                Уверенность: {Math.abs(result.probability - 0.5) * 200}%
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
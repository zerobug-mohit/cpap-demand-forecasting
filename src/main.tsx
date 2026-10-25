import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/variables.css'
import './styles/globals.css'
import './styles/theme.css'
import './styles/guide.css'
import './styles/io.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Keyboard users get focus rings on the section bars; a mouse click (which some browsers also treat as
// focus-visible on a <summary>) does not.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') document.documentElement.classList.add('kbd')
})
window.addEventListener('mousedown', () => document.documentElement.classList.remove('kbd'))

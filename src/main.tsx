import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/variables.css'
import './styles/globals.css'
import './styles/designs.css'
import { applyDesign, initialDesign } from './design/designs'

applyDesign(initialDesign()) // before the first render, so the page never flashes the wrong design

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

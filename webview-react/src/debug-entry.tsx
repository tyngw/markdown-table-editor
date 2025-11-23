import React from 'react'
import ReactDOM from 'react-dom/client'
import CellHeightDebug from './components/CellHeightDebug'
import './index.css'

ReactDOM.createRoot(document.getElementById('debug-root')!).render(
  <React.StrictMode>
    <CellHeightDebug />
  </React.StrictMode>
)

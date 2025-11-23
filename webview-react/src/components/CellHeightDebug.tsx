import React, { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Debug component to measure and compare cell heights in different states
 */
const CellHeightDebug: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [cellValue, setCellValue] = useState('Test')
  const [measurements, setMeasurements] = useState<{
    before: { offsetHeight: number, clientHeight: number, computedHeight: string },
    after: { offsetHeight: number, clientHeight: number, computedHeight: string }
  }>({
    before: { offsetHeight: 0, clientHeight: 0, computedHeight: '' },
    after: { offsetHeight: 0, clientHeight: 0, computedHeight: '' }
  })

  const cellRef = useRef<HTMLTableCellElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const measureCell = useCallback(() => {
    if (cellRef.current) {
      const computed = window.getComputedStyle(cellRef.current)
      return {
        offsetHeight: cellRef.current.offsetHeight,
        clientHeight: cellRef.current.clientHeight,
        computedHeight: computed.height
      }
    }
    return { offsetHeight: 0, clientHeight: 0, computedHeight: '' }
  }, [])

  // Measure before editing
  useEffect(() => {
    if (!isEditing) {
      // Wait for render to complete
      requestAnimationFrame(() => {
        setMeasurements(prev => ({
          ...prev,
          before: measureCell()
        }))
      })
    }
  }, [isEditing, measureCell, cellValue])

  // Measure during/after editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()

      requestAnimationFrame(() => {
        setMeasurements(prev => ({
          ...prev,
          after: measureCell()
        }))
      })
    }
  }, [isEditing, measureCell])

  const handleEditComplete = () => {
    setIsEditing(false)
    // Measure after edit completes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMeasurements(prev => ({
          ...prev,
          after: measureCell()
        }))
      })
    })
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Cell Height Debug</h2>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Measurements</h3>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Property</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Before Edit</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>After Edit</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>offsetHeight</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{measurements.before.offsetHeight}px</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{measurements.after.offsetHeight}px</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', color: measurements.after.offsetHeight !== measurements.before.offsetHeight ? 'red' : 'green' }}>
                {measurements.after.offsetHeight - measurements.before.offsetHeight}px
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>clientHeight</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{measurements.before.clientHeight}px</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{measurements.after.clientHeight}px</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', color: measurements.after.clientHeight !== measurements.before.clientHeight ? 'red' : 'green' }}>
                {measurements.after.clientHeight - measurements.before.clientHeight}px
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>computed height</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{measurements.before.computedHeight}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{measurements.after.computedHeight}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setIsEditing(true)}
          disabled={isEditing}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Start Editing
        </button>
        <button
          onClick={() => {
            if (cellRef.current) {
              console.log('Cell classes:', cellRef.current.className)
              console.log('Cell computed style:', window.getComputedStyle(cellRef.current))
            }
          }}
          style={{ padding: '8px 16px' }}
        >
          Log Cell Info
        </button>
      </div>

      <h3>Test Table</h3>
      <table className="table-editor" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td
              ref={cellRef}
              className={`data-cell selected anchor single-selection ${isEditing ? 'editing' : ''}`}
              style={{
                width: '150px',
                minWidth: '150px',
                maxWidth: '150px'
              }}
              onDoubleClick={() => setIsEditing(true)}
            >
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  className="cell-input"
                  value={cellValue}
                  onChange={(e) => setCellValue(e.target.value)}
                  onBlur={handleEditComplete}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleEditComplete()
                    }
                    if (e.key === 'Escape') {
                      handleEditComplete()
                    }
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    overflow: 'hidden',
                    lineHeight: '1.2',
                    verticalAlign: 'top',
                    textAlign: 'left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    zIndex: 5,
                    padding: '4px 6px'
                  }}
                />
              ) : (
                <div
                  className="cell-content"
                  style={{
                    wordWrap: 'break-word',
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden',
                    lineHeight: '1.2',
                    display: 'block',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    height: 'auto',
                    minHeight: '1.2em',
                    margin: 0,
                    padding: '4px 6px'
                  }}
                >
                  {cellValue}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ marginTop: '30px' }}>Current CSS Classes:</h3>
      <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
        {cellRef.current?.className || 'Loading...'}
      </pre>

      <h3>Note:</h3>
      <p style={{ fontSize: '12px', color: '#666' }}>
        Double-click the cell or click "Start Editing" to enter edit mode.
        Press Enter or click outside to exit edit mode.
        The measurements table will update after each state change.
      </p>
    </div>
  )
}

export default CellHeightDebug

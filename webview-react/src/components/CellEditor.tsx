import React, { useRef, useState, useCallback, useLayoutEffect } from 'react'

export interface CellEditorProps {
  value: string
  onCommit: (value: string, move?: 'right' | 'left' | 'down' | 'up') => void
  onCancel: () => void
  rowIndex?: number
  colIndex?: number
  // 親からレイアウト情報を受け取る
  originalHeight?: number
  // 行内の最大セル高さ（仕様上これに厳密に合わせる）
  rowMaxHeight?: number
}

const CellEditor: React.FC<CellEditorProps> = ({ 
  value, 
  onCommit, 
  onCancel, 
  // 位置情報は親が保持（ここでは使用しない）
  rowIndex: _rowIndex, 
  colIndex: _colIndex, 
  originalHeight, 
  rowMaxHeight 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [currentValue, setCurrentValue] = useState(value)
  const [isComposing, setIsComposing] = useState(false)
  // TableBody からの heightUpdate で受け取った実測値を保持
  const measuredRef = useRef<{ original?: number; rowMax?: number }>({})

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.focus()
    const textLength = textarea.value.length
    textarea.setSelectionRange(textLength, textLength)

    const adjustHeight = () => {
      textarea.style.height = 'auto'
      const contentHeight = textarea.scrollHeight
      const minHeight = 32

      // dataset もフォールバックとして参照（親 <td> の data-*）
      const parentCell = textarea.closest('td[data-row][data-col]') as HTMLElement | null
      const dsOriginal = parentCell?.dataset?.originalHeight ? parseInt(parentCell.dataset.originalHeight, 10) : undefined
      const dsRowMax = parentCell?.dataset?.rowMaxHeight ? parseInt(parentCell.dataset.rowMaxHeight, 10) : undefined

      // 高さの決定ロジック：
      // 仕様に加え、「編集中セルが最大になる場合」にも追随させるため
      // finalHeight = max(minHeight, 既存の行最大高さ, 現在のコンテンツ高さ)
      // 0 や NaN を排除した安全な値を選択
      const safe = (v: number | undefined, fallback: number) => (
        typeof v === 'number' && !Number.isNaN(v) && v > 0 ? v : fallback
      )
      const baseRowMax = safe(measuredRef.current.rowMax, safe(rowMaxHeight, safe(dsRowMax, minHeight)))
      const baseOriginal = safe(measuredRef.current.original, safe(originalHeight, safe(dsOriginal, minHeight)))
      const finalHeight = Math.max(minHeight, baseRowMax, contentHeight)

      // data-multiline の付与は、finalHeight < contentHeight の場合のみ（通常は起きないが保険）
      if (contentHeight > finalHeight) {
        textarea.setAttribute('data-multiline', 'true')
      } else {
        textarea.removeAttribute('data-multiline')
      }
      
      // デバッグログを追加
      console.log('CellEditor height calculation:', {
        rowIndex: _rowIndex,
        colIndex: _colIndex,
        contentHeight,
        originalHeight: baseOriginal,
        rowMaxHeight: baseRowMax,
        finalHeight,
        textValue: textarea.value,
        calculation: `max(min=${minHeight}, rowMax=${baseRowMax}, content=${contentHeight}) = ${finalHeight}`
      })
      
  // いったん計算上の finalHeight を適用
  textarea.style.height = `${finalHeight}px`

      // 行内の他セルとも高さを同期（行の視覚的な一貫性を維持）
      try {
        const row = parentCell?.parentElement
        if (row) {
          const cells = row.querySelectorAll('td[data-col]')
          cells.forEach((cell) => {
            if (cell instanceof HTMLElement) {
              // min-height は環境によって table-cell に効かない場合があるため、
              // 不可視のスペーサー DOM を挿入して高さを確実に確保する
              cell.style.minHeight = `${finalHeight}px`
              cell.dataset.rowMaxHeight = String(finalHeight)

              let spacer = cell.querySelector('.height-spacer') as HTMLDivElement | null
              if (!spacer) {
                spacer = document.createElement('div')
                spacer.className = 'height-spacer'
                spacer.setAttribute('aria-hidden', 'true')
                spacer.style.display = 'block'
                spacer.style.pointerEvents = 'none'
                spacer.style.opacity = '0'
                spacer.style.margin = '0'
                spacer.style.padding = '0'
                spacer.style.border = '0'
                spacer.style.width = '100%'
                // テキストエリアは絶対配置(z-index:5)のため、編集中セルは先頭に、
                // 非編集中セルは末尾に入れてコンテンツの上揃えを維持する
                if (cell === parentCell) {
                  cell.insertBefore(spacer, cell.firstChild)
                } else {
                  cell.appendChild(spacer)
                }
              }
              // 既存スペーサーの位置が期待と異なる場合は差し替え
              else {
                const shouldBeFirst = cell === parentCell
                const isFirst = spacer.previousSibling === null
                if (shouldBeFirst && !isFirst) {
                  cell.removeChild(spacer)
                  cell.insertBefore(spacer, cell.firstChild)
                } else if (!shouldBeFirst && spacer.nextSibling === null) {
                  // 既に末尾なら何もしない
                } else if (!shouldBeFirst) {
                  // 末尾でなければ付け替え
                  cell.removeChild(spacer)
                  cell.appendChild(spacer)
                }
              }
              // セル内の実コンテンツ高さを測定し、不足分のみスペーサーで埋める
              let contentHeight = 0
              try {
                const contentEl = cell.querySelector('.cell-content') as HTMLElement | null
                if (contentEl) {
                  contentHeight = contentEl.offsetHeight
                  if (!contentHeight || contentHeight <= 0) {
                    const r = contentEl.getBoundingClientRect()
                    contentHeight = (r && r.height) ? Math.ceil(r.height) : (contentEl.clientHeight || 0)
                  }
                } else {
                  // 編集中セルは .cell-content が存在しないため 0 とする
                  contentHeight = 0
                }
              } catch (_) { /* noop */ }
              const needed = Math.max(0, finalHeight - contentHeight)
              spacer.style.height = `${needed}px`
            }
          })
          // スペーサー/スタイル反映直後の実高さを測定し、テキストエリア高さを厳密に一致させる
          try {
            // 強制リフロー（読み取りのみで十分）
            void parentCell?.offsetHeight
            let measured = parentCell?.offsetHeight || 0
            if (!measured || measured <= 0) {
              const r = parentCell?.getBoundingClientRect()
              measured = r && r.height ? Math.ceil(r.height) : 0
            }
            const effective = measured > 0 ? measured : finalHeight
            if (effective !== finalHeight) {
              console.log('CellEditor height post-layout adjust:', {
                rowIndex: _rowIndex,
                colIndex: _colIndex,
                plannedFinal: finalHeight,
                measuredCell: measured,
                applied: effective
              })
            }
            textarea.style.height = `${effective}px`
          } catch (_) { /* noop */ }
        }
      } catch (_) { /* noop */ }
    }

    // カスタムイベントリスナーを追加（高さ情報の更新時）
    const handleHeightUpdate = (event: CustomEvent) => {
      try {
        const detail = event.detail as { originalHeight?: number; rowMaxHeight?: number } | undefined
        if (detail) {
          if (typeof detail.originalHeight === 'number') measuredRef.current.original = detail.originalHeight
          if (typeof detail.rowMaxHeight === 'number') measuredRef.current.rowMax = detail.rowMaxHeight
        }
      } catch (_) { /* noop */ }
      // 更新された高さ情報で再計算
      adjustHeight()
    }

    adjustHeight()
    const handleInput = () => { if (!isComposing) adjustHeight() }
    
    textarea.addEventListener('input', handleInput)
  textarea.addEventListener('heightUpdate', handleHeightUpdate as EventListener)
    
    return () => {
      textarea.removeEventListener('input', handleInput)
      textarea.removeEventListener('heightUpdate', handleHeightUpdate as EventListener)
    }
  }, [originalHeight, rowMaxHeight, isComposing, _rowIndex, _colIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      return;
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onCommit(currentValue)
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.stopPropagation()
    } else if (e.key === 'Enter' && !isComposing) {
      e.preventDefault()
      onCommit(currentValue, 'down')
    } else if (e.key === 'Enter' && isComposing) {
      e.stopPropagation()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      onCommit(currentValue, e.shiftKey ? 'left' : 'right')
    }
    e.stopPropagation()
  }, [currentValue, onCommit, onCancel, isComposing])

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false)
  }, [])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (document.activeElement !== textareaRef.current) {
        onCommit(currentValue)
      }
    }, 10)
  }, [currentValue, onCommit])

  return (
  <textarea
      ref={textareaRef}
      className="cell-input"
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onBlur={handleBlur}
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
  )
}

export default CellEditor

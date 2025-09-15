import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import VirtualizedTableBody from '../components/VirtualizedTableBody'
import { EditorState } from '../types'

// react-windowをモック
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => {
    // 簡単なモックとして最初の5行だけをレンダリング
    const items = []
    for (let i = 0; i < Math.min(5, itemCount); i++) {
      items.push(
        children({
          index: i,
          style: { height: 32 },
          data: itemData
        })
      )
    }
    return <div data-testid="virtualized-list">{items}</div>
  }
}))

describe('VirtualizedTableBody', () => {
  const mockHeaders = ['Name', 'Age', 'City']
  const mockRows = [
    ['Alice', '25', 'Tokyo'],
    ['Bob', '30', 'Osaka'], 
    ['Charlie', '35', 'Kyoto'],
    ['David', '28', 'Hiroshima'],
    ['Eve', '32', 'Sapporo'],
    ['Frank', '29', 'Sendai']
  ]

  const mockEditorState: EditorState = {
    selectedCells: new Set<string>(),
    selectionRange: null,
    currentEditingCell: null,
    columnWidths: {},
    sortState: { column: -1, direction: 'none' }
  }

  const defaultProps = {
    headers: mockHeaders,
    rows: mockRows,
    editorState: mockEditorState,
    onCellUpdate: vi.fn(),
    onCellSelect: vi.fn(),
    onCellEdit: vi.fn(),
    onAddRow: vi.fn(),
    onDeleteRow: vi.fn(),
    onRowSelect: vi.fn(),
    onShowRowContextMenu: vi.fn(),
    getDragProps: vi.fn(),
    getDropProps: vi.fn(),
    selectedRows: new Set<number>()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render virtualized table with rows', () => {
    render(<VirtualizedTableBody {...defaultProps} />)
    
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
  })

  it('should render row numbers', () => {
    render(<VirtualizedTableBody {...defaultProps} />)
    
    // モックでは最初の5行だけがレンダリングされるので1-5が表示されるはず
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should render cell content', () => {
    render(<VirtualizedTableBody {...defaultProps} />)
    
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
  })

  it('should handle cell selection', () => {
    render(<VirtualizedTableBody {...defaultProps} />)
    
    const cellElement = screen.getByText('Alice').closest('[data-row="0"][data-col="0"]')
    expect(cellElement).toBeInTheDocument()
    
    if (cellElement) {
      fireEvent.mouseDown(cellElement)
      expect(defaultProps.onCellSelect).toHaveBeenCalledWith(0, 0, false, false)
    }
  })

  it('should handle double click for cell editing', () => {
    render(<VirtualizedTableBody {...defaultProps} />)
    
    const cellElement = screen.getByText('Alice').closest('[data-row="0"][data-col="0"]')
    expect(cellElement).toBeInTheDocument()
    
    if (cellElement) {
      fireEvent.doubleClick(cellElement)
      expect(defaultProps.onCellEdit).toHaveBeenCalledWith({ row: 0, col: 0 })
    }
  })

  it('should handle row selection', () => {
    render(<VirtualizedTableBody {...defaultProps} />)
    
    const rowNumberElement = screen.getByText('1')
    fireEvent.click(rowNumberElement)
    
    expect(defaultProps.onRowSelect).toHaveBeenCalled()
  })

  it('should highlight selected rows', () => {
    const selectedRows = new Set([0, 2])
    render(<VirtualizedTableBody {...defaultProps} selectedRows={selectedRows} />)
    
    const firstRowNumber = screen.getByText('1')
    const thirdRowNumber = screen.getByText('3')
    
    expect(firstRowNumber).toHaveClass('highlighted')
    expect(thirdRowNumber).toHaveClass('highlighted')
  })
})
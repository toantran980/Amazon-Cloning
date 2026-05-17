import { memo } from 'react';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { Grid, type CellComponentProps } from 'react-window';
import type { Product } from '../../types';
import ProductCard from '../ProductCard/ProductCard';

interface VirtualizedProductGridProps {
  products: Product[];
}

interface GridData {
  products: Product[];
  columnCount: number;
}

const CARD_MIN_WIDTH = 260;
const CARD_HEIGHT = 420;

function getColumnCount(width: number): number {
  return Math.max(1, Math.floor(width / CARD_MIN_WIDTH));
}

type ProductCellProps = CellComponentProps<GridData>;

function Cell({ columnIndex, rowIndex, style, products, columnCount }: ProductCellProps) {
  const index = rowIndex * columnCount + columnIndex;
  if (index >= products.length) return null;

  return (
    <div style={style} className="p-0">
      <ProductCard product={products[index]} />
    </div>
  );
}

function VirtualizedProductGrid({ products }: VirtualizedProductGridProps) {
  return (
    <AutoSizer
      renderProp={({ height, width }: { height: number | undefined; width: number | undefined }) => {
        const safeWidth = width ?? 0;
        const safeHeight = height ?? 0;
        const columnCount = getColumnCount(safeWidth);
        const rowCount = Math.ceil(products.length / columnCount);
        const columnWidth = Math.floor(safeWidth / columnCount);
        const itemData = { products, columnCount };

        return (
          <Grid
            style={{ height: safeHeight, width: safeWidth }}
            columnCount={columnCount}
            rowCount={rowCount}
            columnWidth={columnWidth}
            rowHeight={CARD_HEIGHT}
            cellComponent={Cell}
            cellProps={itemData}
            overscanCount={2}
          />
        );
      }}
    />
  );
}

export default memo(VirtualizedProductGrid);